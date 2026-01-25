-- Group Chat System Tables
-- Run this in Supabase SQL Editor

-- Chat rooms table (one per class)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat room members (for tracking who can access which room)
CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'class_teacher', 'student', 'parent')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON public.chat_room_members(room_id);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they are members of"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members
      WHERE chat_room_members.room_id = chat_rooms.id
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
      AND chat_room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their rooms"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view their own memberships"
  ON public.chat_room_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership"
  ON public.chat_room_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow system to manage memberships
CREATE POLICY "Allow insert for room members"
  ON public.chat_room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_room_members TO authenticated;

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Function to create a chat room for a class
CREATE OR REPLACE FUNCTION create_class_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (class_id, school_id, name, description)
  VALUES (
    NEW.id,
    NEW.school_id,
    NEW.name || COALESCE(' - ' || NEW.section, '') || ' Group',
    'Class group chat for ' || NEW.name || COALESCE(' ' || NEW.section, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create chat room when class is created
DROP TRIGGER IF EXISTS create_chat_room_on_class_create ON public.classes;
CREATE TRIGGER create_chat_room_on_class_create
  AFTER INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION create_class_chat_room();

-- Function to add class teacher to chat room
CREATE OR REPLACE FUNCTION add_class_teacher_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_teacher_id IS NOT NULL THEN
    INSERT INTO public.chat_room_members (room_id, user_id, role)
    SELECT cr.id, NEW.class_teacher_id, 'class_teacher'
    FROM public.chat_rooms cr
    WHERE cr.class_id = NEW.id
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'class_teacher';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for class teacher assignment
DROP TRIGGER IF EXISTS add_class_teacher_to_chat_on_update ON public.classes;
CREATE TRIGGER add_class_teacher_to_chat_on_update
  AFTER INSERT OR UPDATE OF class_teacher_id ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION add_class_teacher_to_chat();

-- Function to add student to chat room when enrolled
CREATE OR REPLACE FUNCTION add_student_to_class_chat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.class_id IS NOT NULL THEN
    INSERT INTO public.chat_room_members (room_id, user_id, role)
    SELECT cr.id, NEW.user_id, 'student'
    FROM public.chat_rooms cr
    WHERE cr.class_id = NEW.class_id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add student to chat when added to class
DROP TRIGGER IF EXISTS add_student_to_chat_on_enroll ON public.students;
CREATE TRIGGER add_student_to_chat_on_enroll
  AFTER INSERT OR UPDATE OF class_id, user_id ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION add_student_to_class_chat();

-- Function to add parent to chat room when linked to student
CREATE OR REPLACE FUNCTION add_parent_to_class_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_class_id UUID;
BEGIN
  -- Get the class_id from the student
  SELECT class_id INTO v_class_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF v_class_id IS NOT NULL THEN
    INSERT INTO public.chat_room_members (room_id, user_id, role)
    SELECT cr.id, NEW.parent_id, 'parent'
    FROM public.chat_rooms cr
    WHERE cr.class_id = v_class_id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add parent to chat when linked to student
DROP TRIGGER IF EXISTS add_parent_to_chat_on_link ON public.parent_students;
CREATE TRIGGER add_parent_to_chat_on_link
  AFTER INSERT ON public.parent_students
  FOR EACH ROW
  EXECUTE FUNCTION add_parent_to_class_chat();

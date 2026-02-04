-- Chat and Notifications Tables Migration
-- This migration creates the tables needed for the chat and in-app notification features

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('homework_assigned', 'attendance_alert', 'grades_published', 'notice', 'welcome', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions for notifications
GRANT ALL ON public.notifications TO authenticated;

-- =============================================
-- CHAT ROOMS TABLE
-- =============================================

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

-- =============================================
-- CHAT MESSAGES TABLE
-- =============================================

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

-- =============================================
-- CHAT ROOM MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'class_teacher', 'student', 'parent')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_rooms_class_id ON public.chat_rooms(class_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_school_id ON public.chat_rooms(school_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON public.chat_room_members(room_id);

-- Enable RLS on chat tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can view room memberships" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_room_members;
DROP POLICY IF EXISTS "Allow insert for room members" ON public.chat_room_members;

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
CREATE POLICY "Users can view room memberships"
  ON public.chat_room_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members AS crm
      WHERE crm.room_id = chat_room_members.room_id
      AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.chat_room_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow insert for room members"
  ON public.chat_room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions for chat tables
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_room_members TO authenticated;

-- Enable realtime for chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- =============================================
-- TRIGGER FUNCTIONS FOR AUTO-MANAGING CHAT
-- =============================================

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
  )
  ON CONFLICT (class_id) DO NOTHING;
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

-- Function to add teacher to chat room when assigned to class
CREATE OR REPLACE FUNCTION add_teacher_to_class_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_room_members (room_id, user_id, role)
  SELECT cr.id, NEW.teacher_id, 'teacher'
  FROM public.chat_rooms cr
  WHERE cr.class_id = NEW.class_id
  ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add teacher to chat when assigned to class
DROP TRIGGER IF EXISTS add_teacher_to_chat_on_assign ON public.teacher_classes;
CREATE TRIGGER add_teacher_to_chat_on_assign
  AFTER INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION add_teacher_to_class_chat();

-- =============================================
-- CREATE CHAT ROOMS FOR EXISTING CLASSES
-- =============================================

-- Insert chat rooms for any existing classes that don't have one
INSERT INTO public.chat_rooms (class_id, school_id, name, description)
SELECT
  c.id,
  c.school_id,
  c.name || COALESCE(' - ' || c.section, '') || ' Group',
  'Class group chat for ' || c.name || COALESCE(' ' || c.section, '')
FROM public.classes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_rooms cr WHERE cr.class_id = c.id
)
ON CONFLICT (class_id) DO NOTHING;

-- Add existing class teachers to their chat rooms
INSERT INTO public.chat_room_members (room_id, user_id, role)
SELECT cr.id, c.class_teacher_id, 'class_teacher'
FROM public.classes c
JOIN public.chat_rooms cr ON cr.class_id = c.id
WHERE c.class_teacher_id IS NOT NULL
ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'class_teacher';

-- Add existing students to their chat rooms
INSERT INTO public.chat_room_members (room_id, user_id, role)
SELECT cr.id, s.user_id, 'student'
FROM public.students s
JOIN public.chat_rooms cr ON cr.class_id = s.class_id
WHERE s.user_id IS NOT NULL
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Add existing teachers to their assigned class chat rooms
INSERT INTO public.chat_room_members (room_id, user_id, role)
SELECT DISTINCT cr.id, tc.teacher_id, 'teacher'
FROM public.teacher_classes tc
JOIN public.chat_rooms cr ON cr.class_id = tc.class_id
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Add existing parents to their children's class chat rooms
INSERT INTO public.chat_room_members (room_id, user_id, role)
SELECT DISTINCT cr.id, ps.parent_id, 'parent'
FROM public.parent_students ps
JOIN public.students s ON s.id = ps.student_id
JOIN public.chat_rooms cr ON cr.class_id = s.class_id
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Email Notifications System
-- Run this in Supabase SQL Editor

-- Email queue table to store pending emails
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0
);

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON public.email_queue(created_at DESC);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only allow system (service role) to manage email queue
CREATE POLICY "Service role can manage email queue"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Email preferences table for users to opt-out
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_notifications BOOLEAN DEFAULT TRUE,
  attendance_notifications BOOLEAN DEFAULT TRUE,
  grades_notifications BOOLEAN DEFAULT TRUE,
  notice_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for email preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to queue homework notification emails
CREATE OR REPLACE FUNCTION queue_homework_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_class_name TEXT;
  v_teacher_name TEXT;
  v_student RECORD;
  v_parent RECORD;
BEGIN
  -- Get class name
  SELECT name || COALESCE(' - ' || section, '') INTO v_class_name
  FROM public.classes
  WHERE id = NEW.class_id;

  -- Get teacher name
  SELECT full_name INTO v_teacher_name
  FROM public.profiles
  WHERE id = NEW.teacher_id;

  -- Get all students in the class and their parents
  FOR v_student IN
    SELECT s.id, s.full_name, s.user_id
    FROM public.students s
    WHERE s.class_id = NEW.class_id
  LOOP
    -- Queue email for each parent of this student
    FOR v_parent IN
      SELECT p.parent_id, pr.email, pr.full_name
      FROM public.parent_students p
      JOIN public.profiles pr ON pr.id = p.parent_id
      WHERE p.student_id = v_student.id
      AND pr.email IS NOT NULL
    LOOP
      -- Check if parent has homework notifications enabled
      IF NOT EXISTS (
        SELECT 1 FROM public.email_preferences
        WHERE user_id = v_parent.parent_id
        AND homework_notifications = FALSE
      ) THEN
        INSERT INTO public.email_queue (to_email, to_name, subject, template_type, template_data)
        VALUES (
          v_parent.email,
          v_parent.full_name,
          'New Homework Assigned: ' || NEW.title,
          'homework_assigned',
          jsonb_build_object(
            'parent_name', v_parent.full_name,
            'student_name', v_student.full_name,
            'homework_title', NEW.title,
            'subject', NEW.subject,
            'due_date', to_char(NEW.due_date, 'Month DD, YYYY'),
            'teacher_name', v_teacher_name,
            'class_name', v_class_name
          )
        );
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for homework notifications
DROP TRIGGER IF EXISTS trigger_homework_notification ON public.homework;
CREATE TRIGGER trigger_homework_notification
  AFTER INSERT ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION queue_homework_notification();

-- Function to queue attendance alert emails (for absences)
CREATE OR REPLACE FUNCTION queue_attendance_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
  v_parent RECORD;
  v_class_name TEXT;
BEGIN
  -- Only send alert for absences
  IF NEW.is_present = TRUE THEN
    RETURN NEW;
  END IF;

  -- Get student info
  SELECT s.id, s.full_name, s.class_id, c.name || COALESCE(' - ' || c.section, '') as class_name
  INTO v_student
  FROM public.students s
  JOIN public.classes c ON c.id = s.class_id
  WHERE s.id = NEW.student_id;

  -- Queue email for each parent
  FOR v_parent IN
    SELECT p.parent_id, pr.email, pr.full_name
    FROM public.parent_students p
    JOIN public.profiles pr ON pr.id = p.parent_id
    WHERE p.student_id = NEW.student_id
    AND pr.email IS NOT NULL
  LOOP
    -- Check if parent has attendance notifications enabled
    IF NOT EXISTS (
      SELECT 1 FROM public.email_preferences
      WHERE user_id = v_parent.parent_id
      AND attendance_notifications = FALSE
    ) THEN
      INSERT INTO public.email_queue (to_email, to_name, subject, template_type, template_data)
      VALUES (
        v_parent.email,
        v_parent.full_name,
        'Attendance Alert: ' || v_student.full_name || ' was absent',
        'attendance_alert',
        jsonb_build_object(
          'parent_name', v_parent.full_name,
          'student_name', v_student.full_name,
          'date', to_char(NEW.date, 'Month DD, YYYY'),
          'class_name', v_student.class_name
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for attendance alerts
DROP TRIGGER IF EXISTS trigger_attendance_alert ON public.attendance;
CREATE TRIGGER trigger_attendance_alert
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION queue_attendance_alert();

-- Function to queue grades published emails
CREATE OR REPLACE FUNCTION queue_grades_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_homework RECORD;
  v_student RECORD;
  v_parent RECORD;
BEGIN
  -- Only send when marks are added/updated
  IF NEW.marks IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get homework info
  SELECT h.title, h.subject
  INTO v_homework
  FROM public.homework h
  WHERE h.id = NEW.homework_id;

  -- Get student info
  SELECT s.id, s.full_name
  INTO v_student
  FROM public.students s
  WHERE s.id = NEW.student_id;

  -- Queue email for each parent
  FOR v_parent IN
    SELECT p.parent_id, pr.email, pr.full_name
    FROM public.parent_students p
    JOIN public.profiles pr ON pr.id = p.parent_id
    WHERE p.student_id = NEW.student_id
    AND pr.email IS NOT NULL
  LOOP
    -- Check if parent has grades notifications enabled
    IF NOT EXISTS (
      SELECT 1 FROM public.email_preferences
      WHERE user_id = v_parent.parent_id
      AND grades_notifications = FALSE
    ) THEN
      INSERT INTO public.email_queue (to_email, to_name, subject, template_type, template_data)
      VALUES (
        v_parent.email,
        v_parent.full_name,
        'Grades Published: ' || v_homework.title,
        'grades_published',
        jsonb_build_object(
          'parent_name', v_parent.full_name,
          'student_name', v_student.full_name,
          'homework_title', v_homework.title,
          'subject', v_homework.subject,
          'marks', NEW.marks,
          'max_marks', 10,
          'remarks', NEW.remarks
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for grades notifications
DROP TRIGGER IF EXISTS trigger_grades_notification ON public.homework_submissions;
CREATE TRIGGER trigger_grades_notification
  AFTER UPDATE OF marks ON public.homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION queue_grades_notification();

-- Grant permissions
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.email_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_preferences TO authenticated;

-- =============================================
-- SCHOOL SMART PAKISTAN - COMPLETE DATABASE MIGRATION
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- =============================================
-- PART 1: TABLES AND CORE FUNCTIONS
-- =============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('host', 'principal', 'coordinator', 'class_teacher', 'teacher', 'student', 'parent');

-- 2. Schools table (root entity for multi-tenancy)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table (user metadata, linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  first_login_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table (RBAC - separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section TEXT,
  class_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 6. Teacher-Class assignments
CREATE TABLE public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject)
);

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 7. Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, student_id)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 8. Parent-Student linking
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- 9. Homework table
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- 10. Homework submissions
CREATE TABLE public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,
  marks INTEGER CHECK (marks >= 0 AND marks <= 10),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- 11. Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 12. Notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role public.app_role,
  target_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 13. Activity logs (audit trail)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 14. OTP codes for verification
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 2: SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.is_active = true
  );
END;
$$;

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_school_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT ur.school_id INTO result_school_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.is_active = true
    AND ur.school_id IS NOT NULL
  LIMIT 1;
  RETURN result_school_id;
END;
$$;

-- Function to check if school has active principal
CREATE OR REPLACE FUNCTION public.school_has_active_principal(_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.school_id = _school_id
      AND ur.role = 'principal'
      AND ur.is_active = true
  );
END;
$$;

-- Function to check if parent can access student data
CREATE OR REPLACE FUNCTION public.parent_can_access_student(_user_id UUID, _student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.parent_students ps
    WHERE ps.parent_id = _user_id
      AND ps.student_id = _student_id
  );
END;
$$;

-- Function to check if school has active users
CREATE OR REPLACE FUNCTION public.school_has_active_users(_school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.school_id = _school_id
      AND ur.is_active = true
  );
END;
$$;

-- Function to get count of active users in a school
CREATE OR REPLACE FUNCTION public.get_school_active_user_count(_school_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.user_roles ur
  WHERE ur.school_id = _school_id
    AND ur.is_active = true;
  RETURN user_count;
END;
$$;

-- =============================================
-- PART 3: TRIGGERS FOR SECURITY ENFORCEMENT
-- =============================================

-- 1. Enforce host users have NO school_id
CREATE OR REPLACE FUNCTION public.enforce_host_no_school_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'host' AND NEW.school_id IS NOT NULL THEN
    RAISE EXCEPTION 'Host users must not have a school_id';
  END IF;

  IF NEW.role != 'host' AND NEW.school_id IS NULL THEN
    RAISE EXCEPTION 'Non-host users must have a school_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_enforce_host_no_school_id
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_host_no_school_id();

-- 2. Enforce only ONE active principal per school
CREATE OR REPLACE FUNCTION public.enforce_single_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  IF NEW.role = 'principal' AND NEW.is_active = true THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.user_roles ur
    WHERE ur.school_id = NEW.school_id
      AND ur.role = 'principal'
      AND ur.is_active = true
      AND ur.id IS DISTINCT FROM NEW.id;

    IF existing_count > 0 THEN
      RAISE EXCEPTION 'School already has an active principal. Deactivate the existing principal first.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_enforce_single_principal
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_principal();

-- 3. Enforce attendance record integrity (no past modifications)
CREATE OR REPLACE FUNCTION public.enforce_attendance_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_locked = true THEN
      RAISE EXCEPTION 'Cannot modify locked attendance records';
    END IF;

    IF OLD.date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Cannot modify attendance records from previous days';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_enforce_attendance_lock
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_attendance_lock();

-- 4. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_homework_updated_at BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_homework_submissions_updated_at BEFORE UPDATE ON public.homework_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Prevent non-host from assigning host role
CREATE OR REPLACE FUNCTION public.enforce_host_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'host' THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'host') THEN
      RAISE EXCEPTION 'Only existing hosts can assign or modify host roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_host_role_assignment_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_host_role_assignment();

CREATE TRIGGER check_host_role_assignment_update
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'host')
  EXECUTE FUNCTION public.enforce_host_role_assignment();

-- =============================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- =============================================

-- Schools policies
CREATE POLICY "Host can manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Authenticated school users can view their own school"
  ON public.schools FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    id = get_user_school_id(auth.uid())
  );

-- Profiles policies
CREATE POLICY "Host can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Authenticated users can view profiles in their school"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = get_user_school_id(auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- User roles policies
CREATE POLICY "Host can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Principals can manage roles in their school"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
    AND role NOT IN ('host', 'principal')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
    AND role NOT IN ('host', 'principal')
  );

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Classes policies
CREATE POLICY "School users can view their school classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Principals can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Teacher classes policies
CREATE POLICY "Teachers can view their assignments"
  ON public.teacher_classes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Principals can manage teacher assignments"
  ON public.teacher_classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Students policies
CREATE POLICY "School staff can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Parents can view their children"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent')
    AND public.parent_can_access_student(auth.uid(), id)
  );

CREATE POLICY "Class teachers can manage students in their class"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'class_teacher')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = students.class_id AND c.class_teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'class_teacher')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = students.class_id AND c.class_teacher_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Parent-student linking policies
CREATE POLICY "Parents can view their links"
  ON public.parent_students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Principals can manage parent-student links"
  ON public.parent_students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = parent_students.student_id AND s.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = parent_students.student_id AND s.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Homework policies
CREATE POLICY "School users can view homework"
  ON public.homework FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Parents can view their children homework"
  ON public.homework FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent')
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.class_id = homework.class_id
        AND public.parent_can_access_student(auth.uid(), s.id)
    )
  );

CREATE POLICY "Teachers can manage homework for their classes"
  ON public.homework FOR ALL
  TO authenticated
  USING (
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'class_teacher'))
    AND teacher_id = auth.uid()
  )
  WITH CHECK (
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'class_teacher'))
    AND teacher_id = auth.uid()
  );

-- Homework submissions policies
CREATE POLICY "Teachers can view submissions for their homework"
  ON public.homework_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their submissions"
  ON public.homework_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can submit homework"
  ON public.homework_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own submissions"
  ON public.homework_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_submissions.homework_id AND h.due_date >= CURRENT_DATE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid()
    )
  );

-- Attendance policies
CREATE POLICY "School staff can view attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Parents can view their children attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent')
    AND public.parent_can_access_student(auth.uid(), student_id)
  );

CREATE POLICY "Class teachers can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'class_teacher')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'class_teacher')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = attendance.class_id AND c.class_teacher_id = auth.uid()
    )
  );

-- Notices policies
CREATE POLICY "School users can view notices"
  ON public.notices FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Parents can view notices for their children"
  ON public.notices FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent')
    AND (
      target_class_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.class_id = notices.target_class_id
          AND public.parent_can_access_student(auth.uid(), s.id)
      )
    )
  );

CREATE POLICY "Principals can manage notices"
  ON public.notices FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Teachers can create notices"
  ON public.notices FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'class_teacher'))
    AND school_id = public.get_user_school_id(auth.uid())
    AND created_by = auth.uid()
  );

-- Activity logs policies (SERVER-SIDE INSERT ONLY)
CREATE POLICY "Host can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Principals can view their school logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- CRITICAL: Deny INSERT to authenticated role (server-side only via service role)
CREATE POLICY "Deny client side log inserts"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- OTP codes policies
CREATE POLICY "Users can view their own OTP codes"
  ON public.otp_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own OTP codes"
  ON public.otp_codes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================

-- Drop and recreate functions with UUID parameters
DROP FUNCTION IF EXISTS public.has_role(TEXT, public.app_role);
DROP FUNCTION IF EXISTS public.get_user_school_id(TEXT);
DROP FUNCTION IF EXISTS public.parent_can_access_student(TEXT, UUID);

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
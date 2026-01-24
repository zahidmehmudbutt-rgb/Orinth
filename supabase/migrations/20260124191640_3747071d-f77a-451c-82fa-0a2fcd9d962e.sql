-- SECURITY: Prevent non-host from assigning host role
-- This trigger ensures only existing hosts can create new host roles
-- Enforced at database level for maximum security

CREATE OR REPLACE FUNCTION public.enforce_host_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If someone is trying to insert or update a role to 'host'
  IF NEW.role = 'host' THEN
    -- Check if the current user is a host (using service role or has host privileges)
    -- Service role operations bypass this (auth.uid() returns null for service role)
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'host') THEN
      RAISE EXCEPTION 'Only existing hosts can assign or modify host roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS check_host_role_assignment_insert ON public.user_roles;
CREATE TRIGGER check_host_role_assignment_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_host_role_assignment();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS check_host_role_assignment_update ON public.user_roles;
CREATE TRIGGER check_host_role_assignment_update
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'host')
  EXECUTE FUNCTION public.enforce_host_role_assignment();


-- SECURITY: Create function to check if school can be safely deactivated
-- Returns false if the school has active users

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

-- SECURITY: Create function to get count of active users in a school
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
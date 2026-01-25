-- Fix profiles table: Require authentication for all SELECT operations
-- Drop existing permissive SELECT policies and recreate with auth requirement

-- Drop the policy that allows viewing profiles in same school (doesn't require auth)
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;

-- Recreate with explicit auth requirement
CREATE POLICY "Authenticated users can view profiles in their school"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  school_id = get_user_school_id(auth.uid())
);

-- Fix schools table: Require authentication for viewing schools
-- Drop existing policy that may allow unauthenticated access
DROP POLICY IF EXISTS "School users can view their own school" ON public.schools;

-- Recreate with explicit auth requirement
CREATE POLICY "Authenticated school users can view their own school"
ON public.schools
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  id = get_user_school_id(auth.uid())
);
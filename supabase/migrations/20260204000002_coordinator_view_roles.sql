-- Allow coordinators to view teacher and class_teacher roles in their school
-- This is needed so coordinators can see the staff they manage

CREATE POLICY "Coordinators can view teacher roles in their school"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
    AND role IN ('teacher', 'class_teacher')
  );

-- Also allow coordinators to deactivate teacher/class_teacher roles (remove staff)
CREATE POLICY "Coordinators can manage teacher roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
    AND role IN ('teacher', 'class_teacher')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
    AND role IN ('teacher', 'class_teacher')
  );

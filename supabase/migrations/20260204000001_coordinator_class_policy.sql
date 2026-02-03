-- Allow coordinators to update class_teacher_id in classes
-- This is needed so coordinators can assign class teachers to classes

CREATE POLICY "Coordinators can assign class teachers"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  );

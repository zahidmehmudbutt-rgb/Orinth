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

-- Fix the function search_path warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
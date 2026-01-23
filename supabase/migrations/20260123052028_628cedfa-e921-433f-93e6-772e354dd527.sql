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
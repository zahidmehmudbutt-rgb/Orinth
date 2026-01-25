-- PART 3B: Homework submission policies only
-- Run this to test submission policies

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.homework_submissions;
CREATE POLICY "Students can insert own submissions"
ON public.homework_submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = homework_submissions.student_id
    AND s.user_id = auth.uid()
  )
);

SELECT 'Student insert policy created!' as status;

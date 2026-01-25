-- PART 3: Create storage and submission policies
-- Run this third (with explicit type casting)

-- Simple storage policies for homework-files bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id::text = 'homework-files');

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id::text = 'homework-files');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id::text = 'homework-files');

-- Homework submission policies
DROP POLICY IF EXISTS "Students can insert own submissions" ON public.homework_submissions;
CREATE POLICY "Students can insert own submissions"
ON public.homework_submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can update own pending submissions" ON public.homework_submissions;
CREATE POLICY "Students can update own pending submissions"
ON public.homework_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND s.user_id = auth.uid()
  )
  AND marks IS NULL
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can update submissions for grading" ON public.homework_submissions;
CREATE POLICY "Teachers can update submissions for grading"
ON public.homework_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_id
    AND h.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can insert submissions for grading" ON public.homework_submissions;
CREATE POLICY "Teachers can insert submissions for grading"
ON public.homework_submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_id
    AND h.teacher_id = auth.uid()
  )
);

SELECT 'Policies created successfully!' as status;

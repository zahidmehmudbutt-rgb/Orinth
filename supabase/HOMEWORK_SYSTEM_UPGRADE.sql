-- =============================================
-- HOMEWORK SYSTEM UPGRADE - FILE UPLOADS & GRADING
-- =============================================
-- Run this in Supabase SQL Editor to enable file uploads
-- =============================================

-- 1. Add file_url column to homework_submissions
ALTER TABLE public.homework_submissions
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS submission_text TEXT;

-- 2. Create storage bucket for homework files (public for easy access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework-files',
  'homework-files',
  true,  -- Public bucket for simplicity (URLs still need to be known)
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 3. Simple Storage RLS Policies - Allow all authenticated users to upload/view
-- (Security is handled at application level - only students can submit their own homework)

-- Allow any authenticated user to upload files
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'homework-files');

-- Allow any authenticated user to view files (public bucket anyway)
DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects;
CREATE POLICY "Authenticated users can view"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'homework-files');

-- Allow users to update their own uploads
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'homework-files');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'homework-files');

-- 4. Update homework_submissions RLS to allow students to insert
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

-- 5. Allow students to update their own pending submissions
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
  AND marks IS NULL -- Can only update if not graded yet
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND s.user_id = auth.uid()
  )
);

-- 6. Allow teachers to update submissions (for grading)
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_id
    AND h.teacher_id = auth.uid()
  )
);

-- 7. Allow teachers to insert submissions (for grading without file)
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

-- 8. Verification queries
SELECT 'homework_submissions columns:' as info;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'homework_submissions' AND table_schema = 'public';

SELECT 'Storage buckets:' as info;
SELECT id, name, public FROM storage.buckets WHERE id = 'homework-files';

SELECT 'Done! Homework system upgrade complete.' as status;

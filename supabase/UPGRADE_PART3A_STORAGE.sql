-- PART 3A: Storage policies only
-- Run this first to test storage policies

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id::text = 'homework-files');

SELECT 'Storage upload policy created!' as status;

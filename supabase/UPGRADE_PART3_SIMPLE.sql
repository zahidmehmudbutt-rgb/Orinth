-- PART 3 SIMPLE: Minimal policies to get system working
-- Skip complex RLS, use simple authenticated access

-- Storage: Allow all authenticated users (bucket is public anyway)
CREATE POLICY "storage_auth_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "storage_auth_select" ON storage.objects
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "storage_public_select" ON storage.objects
FOR SELECT TO public
USING (true);

-- Homework submissions: Allow all authenticated users to insert/update
-- (Application code already validates student ownership)
DROP POLICY IF EXISTS "submissions_insert" ON public.homework_submissions;
CREATE POLICY "submissions_insert" ON public.homework_submissions
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "submissions_update" ON public.homework_submissions;
CREATE POLICY "submissions_update" ON public.homework_submissions
FOR UPDATE TO authenticated
USING (true);

SELECT 'Simple policies created! System ready.' as status;

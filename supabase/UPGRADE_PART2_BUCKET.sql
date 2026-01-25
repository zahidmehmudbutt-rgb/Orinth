-- PART 2: Create storage bucket
-- Run this second

-- First, try to delete any existing problematic policies on storage.objects
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-files', 'homework-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verify bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'homework-files';

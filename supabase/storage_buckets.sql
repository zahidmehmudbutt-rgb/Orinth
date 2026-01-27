-- ==========================================
-- ⚠️ SECURITY WARNING - DO NOT APPLY AS-IS ⚠️
-- ==========================================
-- This script creates PUBLIC storage buckets for sensitive files.
-- The backend schema is FROZEN - do not apply this migration.
--
-- ISSUES:
-- 1. homework-files bucket with public=true exposes student submissions
-- 2. chat-files bucket with public=true exposes chat attachments
-- 3. Anonymous SELECT policies allow anyone to download files
--
-- SAFE ALTERNATIVE:
-- 1. Set homework-files and chat-files buckets to public=false
-- 2. Use signed URLs in client code instead of getPublicUrl()
-- 3. Add RLS policies that verify user ownership
--
-- Example safe bucket creation:
--   INSERT INTO storage.buckets (id, name, public) VALUES ('homework-files', 'homework-files', false);
--
-- Example signed URL usage in client:
--   const { data } = await supabase.storage.from('homework-files').createSignedUrl(path, 3600);
--
-- ==========================================

-- This file is preserved for documentation only.
-- All code below is COMMENTED OUT for security.

/*
-- UNSAFE: Storage Buckets Setup
-- Run this in Supabase SQL Editor

-- ⚠️ INSECURE: public=true exposes student homework to everyone
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework-files',
  'homework-files',
  true,  -- ⚠️ SHOULD BE false
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- This bucket is acceptable as public (logos/branding only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-assets',
  'school-assets',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- ⚠️ INSECURE: public=true exposes chat files to everyone
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,  -- ⚠️ SHOULD BE false
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- ⚠️ DANGEROUS: Allows anonymous access to student homework
CREATE POLICY "Anyone can view homework files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'homework-files');

-- ⚠️ DANGEROUS: Allows anonymous access to chat files
CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-files');

-- Other policies omitted for brevity...
*/

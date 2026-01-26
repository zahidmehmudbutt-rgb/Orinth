-- Storage Buckets Setup
-- Run this in Supabase SQL Editor

-- Create homework-files bucket for student submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework-files',
  'homework-files',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create school-assets bucket for logos and branding
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-assets',
  'school-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create chat-files bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for homework-files bucket
CREATE POLICY "Authenticated users can upload homework files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'homework-files');

CREATE POLICY "Anyone can view homework files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'homework-files');

CREATE POLICY "Users can update their own homework files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'homework-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own homework files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'homework-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policies for school-assets bucket
CREATE POLICY "Authenticated users can upload school assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-assets');

CREATE POLICY "Anyone can view school assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

CREATE POLICY "Authenticated users can update school assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'school-assets');

CREATE POLICY "Authenticated users can delete school assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-assets');

-- RLS Policies for chat-files bucket
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

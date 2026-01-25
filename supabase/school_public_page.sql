-- School Public Page Enhancement
-- Run this in Supabase SQL Editor

-- Add new columns to schools table for public page customization
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS motto TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb';

-- Add is_public column to notices table
ALTER TABLE public.notices
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create index for faster public notice queries
CREATE INDEX IF NOT EXISTS idx_notices_is_public ON public.notices(is_public) WHERE is_public = TRUE;

-- Allow public (unauthenticated) access to view active schools
CREATE POLICY "Anyone can view active schools"
  ON public.schools
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Allow public access to view public notices
CREATE POLICY "Anyone can view public notices"
  ON public.notices
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Allow public access to count students (for stats)
CREATE POLICY "Anyone can count students for public stats"
  ON public.students
  FOR SELECT
  TO anon
  USING (true);

-- Allow public access to count classes (for stats)
CREATE POLICY "Anyone can count classes for public stats"
  ON public.classes
  FOR SELECT
  TO anon
  USING (true);

-- Allow public access to count user_roles (for teacher count)
CREATE POLICY "Anyone can count teachers for public stats"
  ON public.user_roles
  FOR SELECT
  TO anon
  USING (role IN ('teacher', 'class_teacher'));

-- Grant select permissions to anonymous users
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.notices TO anon;
GRANT SELECT ON public.students TO anon;
GRANT SELECT ON public.classes TO anon;
GRANT SELECT ON public.user_roles TO anon;

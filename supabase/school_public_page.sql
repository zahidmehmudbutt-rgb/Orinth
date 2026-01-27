-- ==========================================
-- ⚠️ SECURITY WARNING - DO NOT APPLY AS-IS ⚠️
-- ==========================================
-- This script contains INSECURE policies that would expose sensitive data.
-- The backend schema is FROZEN - do not apply this migration.
-- 
-- ISSUES:
-- 1. Anonymous SELECT on students table exposes all student records
-- 2. Anonymous SELECT on classes table exposes all class data
-- 3. Anonymous SELECT on user_roles table exposes staff information
-- 4. Direct GRANT SELECT on base tables is dangerous
--
-- SAFE ALTERNATIVE (if public stats are needed):
-- Create aggregate-only views and grant access only to those views.
-- Example:
--   CREATE VIEW public.school_public_stats AS
--   SELECT school_id, COUNT(*) as student_count
--   FROM students GROUP BY school_id;
--   GRANT SELECT ON public.school_public_stats TO anon;
--
-- ==========================================

-- This file is preserved for documentation only.
-- All code below is COMMENTED OUT for security.

/*
-- UNSAFE: School Public Page Enhancement
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

-- ⚠️ DANGEROUS - Exposes all student records
CREATE POLICY "Anyone can count students for public stats"
  ON public.students
  FOR SELECT
  TO anon
  USING (true);

-- ⚠️ DANGEROUS - Exposes all class data
CREATE POLICY "Anyone can count classes for public stats"
  ON public.classes
  FOR SELECT
  TO anon
  USING (true);

-- ⚠️ DANGEROUS - Exposes staff information
CREATE POLICY "Anyone can count teachers for public stats"
  ON public.user_roles
  FOR SELECT
  TO anon
  USING (role IN ('teacher', 'class_teacher'));

-- ⚠️ DANGEROUS - Direct grants on sensitive tables
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.notices TO anon;
GRANT SELECT ON public.students TO anon;
GRANT SELECT ON public.classes TO anon;
GRANT SELECT ON public.user_roles TO anon;
*/

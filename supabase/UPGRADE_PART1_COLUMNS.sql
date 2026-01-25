-- PART 1: Add columns to homework_submissions
-- Run this first

ALTER TABLE public.homework_submissions
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS submission_text TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'homework_submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

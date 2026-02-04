-- Custom Sections Table Migration
-- Allows coordinators to define their own section names per school

CREATE TABLE IF NOT EXISTS public.custom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_sections_school_id ON public.custom_sections(school_id);

-- Enable RLS
ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sections for their school"
  ON public.custom_sections
  FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Coordinators and principals can insert sections"
  ON public.custom_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT p.school_id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid() AND ur.role IN ('coordinator', 'principal')
    )
  );

CREATE POLICY "Coordinators and principals can delete sections"
  ON public.custom_sections
  FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT p.school_id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid() AND ur.role IN ('coordinator', 'principal')
    )
  );

-- Grant permissions
GRANT ALL ON public.custom_sections TO authenticated;

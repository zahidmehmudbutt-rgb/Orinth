-- =============================================
-- COORDINATOR CLASS MANAGEMENT MIGRATION
-- Allows coordinators to manage classes, sections, subjects, and teacher assignments
-- =============================================

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 2. Create class_subjects table (links subjects to classes)
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  periods_per_week INTEGER DEFAULT 5,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- 3. Add trigger for updated_at on subjects
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES FOR SUBJECTS
-- =============================================

-- Hosts can manage all subjects
CREATE POLICY "Host can manage all subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

-- Principals can manage subjects in their school
CREATE POLICY "Principals can manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Coordinators can manage subjects in their school
CREATE POLICY "Coordinators can manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- School users can view subjects
CREATE POLICY "School users can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

-- =============================================
-- RLS POLICIES FOR CLASS_SUBJECTS
-- =============================================

-- Hosts can manage all class_subjects
CREATE POLICY "Host can manage all class_subjects"
  ON public.class_subjects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

-- Principals can manage class_subjects in their school
CREATE POLICY "Principals can manage class_subjects"
  ON public.class_subjects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Coordinators can manage class_subjects in their school
CREATE POLICY "Coordinators can manage class_subjects"
  ON public.class_subjects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- School users can view class_subjects
CREATE POLICY "School users can view class_subjects"
  ON public.class_subjects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- =============================================
-- UPDATE CLASSES RLS - ADD COORDINATOR PERMISSIONS
-- =============================================

-- Drop existing principal-only policy and create a new combined one
DROP POLICY IF EXISTS "Principals can manage classes" ON public.classes;

-- Principals can manage classes in their school
CREATE POLICY "Principals can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Coordinators can manage classes in their school
CREATE POLICY "Coordinators can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- =============================================
-- UPDATE TEACHER_CLASSES RLS - ADD COORDINATOR PERMISSIONS
-- =============================================

-- Drop existing principal-only policy
DROP POLICY IF EXISTS "Principals can manage teacher assignments" ON public.teacher_classes;

-- Principals can manage teacher assignments
CREATE POLICY "Principals can manage teacher assignments"
  ON public.teacher_classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Coordinators can manage teacher assignments
CREATE POLICY "Coordinators can manage teacher assignments"
  ON public.teacher_classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordinator')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- School users can view teacher assignments
CREATE POLICY "School users can view teacher assignments"
  ON public.teacher_classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

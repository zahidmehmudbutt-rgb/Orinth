-- Schools policies
CREATE POLICY "Host can manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "School users can view their own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (id = public.get_user_school_id(auth.uid()));

-- Profiles policies
CREATE POLICY "Host can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- User roles policies
CREATE POLICY "Host can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Principals can manage roles in their school"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal') 
    AND school_id = public.get_user_school_id(auth.uid())
    AND role NOT IN ('host', 'principal')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal') 
    AND school_id = public.get_user_school_id(auth.uid())
    AND role NOT IN ('host', 'principal')
  );

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Classes policies
CREATE POLICY "School users can view their school classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()));

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

-- Teacher classes policies
CREATE POLICY "Teachers can view their assignments"
  ON public.teacher_classes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Principals can manage teacher assignments"
  ON public.teacher_classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = teacher_classes.class_id AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );
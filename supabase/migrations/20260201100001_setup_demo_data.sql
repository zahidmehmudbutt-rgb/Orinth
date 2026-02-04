-- Setup demo data for all demo users
-- This migration assigns roles and creates necessary data

DO $$
DECLARE
    v_school_id UUID;
    v_principal_id UUID;
    v_coordinator_id UUID;
    v_classteacher_id UUID;
    v_teacher_id UUID;
    v_student_user_id UUID;
    v_parent_id UUID;
    v_class_10a_id UUID;
    v_student1_id UUID;
BEGIN
    -- Get or create school
    SELECT id INTO v_school_id FROM public.schools LIMIT 1;

    IF v_school_id IS NULL THEN
        INSERT INTO public.schools (name, address, phone, email)
        VALUES ('Demo School', '123 Education Street, Lahore', '+92-300-1234567', 'info@demoschool.edu.pk')
        RETURNING id INTO v_school_id;
        RAISE NOTICE 'Created demo school: %', v_school_id;
    END IF;

    -- Get user IDs from auth.users
    SELECT id INTO v_principal_id FROM auth.users WHERE email = 'principal@demo.com';
    SELECT id INTO v_coordinator_id FROM auth.users WHERE email = 'coordinator@demo.com';
    SELECT id INTO v_classteacher_id FROM auth.users WHERE email = 'classteacher@demo.com';
    SELECT id INTO v_teacher_id FROM auth.users WHERE email = 'teacher@demo.com';
    SELECT id INTO v_student_user_id FROM auth.users WHERE email = 'student@demo.com';
    SELECT id INTO v_parent_id FROM auth.users WHERE email = 'parent@demo.com';

    -- Skip if users don't exist
    IF v_principal_id IS NULL THEN
        RAISE NOTICE 'Demo users not found. Skipping demo data setup.';
        RETURN;
    END IF;

    RAISE NOTICE 'Setting up demo data for school: %', v_school_id;

    -- ============ ASSIGN ROLES ============
    -- Check if school already has a principal
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE school_id = v_school_id AND role = 'principal' AND is_active = true) THEN
        INSERT INTO public.user_roles (user_id, school_id, role, is_active)
        VALUES (v_principal_id, v_school_id, 'principal', true)
        ON CONFLICT (user_id, school_id, role) DO NOTHING;
    ELSE
        RAISE NOTICE 'School already has an active principal. Skipping principal role assignment.';
    END IF;

    -- Assign other roles
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES
        (v_coordinator_id, v_school_id, 'coordinator', true),
        (v_classteacher_id, v_school_id, 'class_teacher', true),
        (v_teacher_id, v_school_id, 'teacher', true),
        (v_student_user_id, v_school_id, 'student', true),
        (v_parent_id, v_school_id, 'parent', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Update profiles with school_id and names
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Dr. Ahmad Khan (Principal)' WHERE id = v_principal_id;
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Ms. Fatima Malik (Coordinator)' WHERE id = v_coordinator_id;
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Mr. Hassan Ali (Class Teacher)' WHERE id = v_classteacher_id;
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Mr. Usman Ahmed (Teacher)' WHERE id = v_teacher_id;
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Ahmed Hassan (Student)' WHERE id = v_student_user_id;
    UPDATE public.profiles SET school_id = v_school_id, full_name = 'Mr. Hassan Senior (Parent)' WHERE id = v_parent_id;

    RAISE NOTICE 'Roles assigned successfully';

    -- ============ CREATE CLASS ============
    INSERT INTO public.classes (id, school_id, name, section, class_teacher_id)
    VALUES (gen_random_uuid(), v_school_id, 'Class 10', 'A', v_classteacher_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_class_10a_id;

    -- Get class ID if it already exists
    IF v_class_10a_id IS NULL THEN
        SELECT id INTO v_class_10a_id FROM public.classes
        WHERE school_id = v_school_id AND name = 'Class 10' AND section = 'A' LIMIT 1;
    END IF;

    RAISE NOTICE 'Class 10-A ID: %', v_class_10a_id;

    -- ============ ASSIGN TEACHER TO CLASS ============
    INSERT INTO public.teacher_classes (teacher_id, class_id, subject)
    VALUES
        (v_teacher_id, v_class_10a_id, 'Mathematics'),
        (v_teacher_id, v_class_10a_id, 'Physics'),
        (v_classteacher_id, v_class_10a_id, 'English')
    ON CONFLICT DO NOTHING;

    -- ============ CREATE STUDENT ============
    INSERT INTO public.students (id, user_id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_student_user_id, v_school_id, v_class_10a_id, 'DEMO001', 'Ahmed Hassan')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_student1_id;

    -- Get student ID if already exists
    IF v_student1_id IS NULL THEN
        SELECT id INTO v_student1_id FROM public.students WHERE user_id = v_student_user_id LIMIT 1;
    END IF;

    -- ============ LINK PARENT TO STUDENT ============
    IF v_student1_id IS NOT NULL THEN
        INSERT INTO public.parent_students (parent_id, student_id)
        VALUES (v_parent_id, v_student1_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Demo data setup complete!';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE '  Principal: principal@demo.com / Demo123$';
    RAISE NOTICE '  Teacher: teacher@demo.com / Demo123$';
    RAISE NOTICE '  Student: student@demo.com / Demo123$';
    RAISE NOTICE '  Parent: parent@demo.com / Demo123$';

END $$;

-- =============================================
-- SCHOOL SMART PAKISTAN - DEMO DATA SETUP
-- =============================================
--
-- INSTRUCTIONS:
-- 1. First create these users in Supabase Auth Dashboard:
--    - principal@demo.com (Password: Demo123$)
--    - coordinator@demo.com (Password: Demo123$)
--    - classteacher@demo.com (Password: Demo123$)
--    - teacher@demo.com (Password: Demo123$)
--    - student@demo.com (Password: Demo123$)
--    - parent@demo.com (Password: Demo123$)
--    (Check "Auto Confirm User" for each)
--
-- 2. Copy each user's UID and replace below
-- 3. Run this entire script in Supabase SQL Editor
-- =============================================

-- ============ REPLACE THESE UIDs ============
-- After creating users in Auth, paste their UIDs here:

-- DELETE OLD TEST DATA (if re-running)
DELETE FROM public.homework_submissions;
DELETE FROM public.attendance;
DELETE FROM public.homework;
DELETE FROM public.notices;
DELETE FROM public.parent_students WHERE parent_id IN (SELECT id FROM auth.users WHERE email LIKE '%@demo.com' OR email = 'parent@test.com');
DELETE FROM public.students WHERE student_id LIKE 'DEMO%' OR student_id = 'STU001';
DELETE FROM public.teacher_classes;
DELETE FROM public.classes WHERE name LIKE 'Class%';
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@demo.com' OR email = 'parent@test.com');

-- ============ GET SCHOOL ID ============
-- Using the existing school created by Host

-- ============ SETUP DEMO DATA ============

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
    v_class_10b_id UUID;
    v_class_9a_id UUID;
    v_student1_id UUID;
    v_student2_id UUID;
    v_student3_id UUID;
    v_student4_id UUID;
    v_student5_id UUID;
    v_hw1_id UUID;
    v_hw2_id UUID;
    v_hw3_id UUID;
    v_hw4_id UUID;
BEGIN
    -- Get school ID
    SELECT id INTO v_school_id FROM public.schools LIMIT 1;

    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No school found. Please create a school first via Host dashboard.';
    END IF;

    -- Get user IDs from auth.users
    SELECT id INTO v_principal_id FROM auth.users WHERE email = 'principal@demo.com';
    SELECT id INTO v_coordinator_id FROM auth.users WHERE email = 'coordinator@demo.com';
    SELECT id INTO v_classteacher_id FROM auth.users WHERE email = 'classteacher@demo.com';
    SELECT id INTO v_teacher_id FROM auth.users WHERE email = 'teacher@demo.com';
    SELECT id INTO v_student_user_id FROM auth.users WHERE email = 'student@demo.com';
    SELECT id INTO v_parent_id FROM auth.users WHERE email = 'parent@demo.com';

    -- Validate all users exist
    IF v_principal_id IS NULL THEN RAISE EXCEPTION 'principal@demo.com not found in auth.users'; END IF;
    IF v_coordinator_id IS NULL THEN RAISE EXCEPTION 'coordinator@demo.com not found in auth.users'; END IF;
    IF v_classteacher_id IS NULL THEN RAISE EXCEPTION 'classteacher@demo.com not found in auth.users'; END IF;
    IF v_teacher_id IS NULL THEN RAISE EXCEPTION 'teacher@demo.com not found in auth.users'; END IF;
    IF v_student_user_id IS NULL THEN RAISE EXCEPTION 'student@demo.com not found in auth.users'; END IF;
    IF v_parent_id IS NULL THEN RAISE EXCEPTION 'parent@demo.com not found in auth.users'; END IF;

    RAISE NOTICE 'All users found. Setting up demo data...';
    RAISE NOTICE 'School ID: %', v_school_id;

    -- ============ ASSIGN ROLES ============

    -- Principal
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_principal_id, v_school_id, 'principal', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Coordinator
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_coordinator_id, v_school_id, 'coordinator', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Class Teacher
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_classteacher_id, v_school_id, 'class_teacher', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Teacher
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_teacher_id, v_school_id, 'teacher', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Student
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_student_user_id, v_school_id, 'student', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Parent
    INSERT INTO public.user_roles (user_id, school_id, role, is_active)
    VALUES (v_parent_id, v_school_id, 'parent', true)
    ON CONFLICT (user_id, school_id, role) DO NOTHING;

    -- Update profiles with school_id
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_principal_id;
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_coordinator_id;
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_classteacher_id;
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_teacher_id;
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_student_user_id;
    UPDATE public.profiles SET school_id = v_school_id WHERE id = v_parent_id;

    -- Update profile names
    UPDATE public.profiles SET full_name = 'Dr. Ahmad Khan (Principal)' WHERE id = v_principal_id;
    UPDATE public.profiles SET full_name = 'Ms. Fatima Malik (Coordinator)' WHERE id = v_coordinator_id;
    UPDATE public.profiles SET full_name = 'Mr. Hassan Ali (Class Teacher)' WHERE id = v_classteacher_id;
    UPDATE public.profiles SET full_name = 'Mr. Usman Ahmed (Teacher)' WHERE id = v_teacher_id;
    UPDATE public.profiles SET full_name = 'Ahmed Hassan (Student)' WHERE id = v_student_user_id;
    UPDATE public.profiles SET full_name = 'Mr. Hassan Senior (Parent)' WHERE id = v_parent_id;

    RAISE NOTICE 'Roles assigned successfully';

    -- ============ CREATE CLASSES ============

    INSERT INTO public.classes (id, school_id, name, section, class_teacher_id)
    VALUES (gen_random_uuid(), v_school_id, 'Class 10', 'A', v_classteacher_id)
    RETURNING id INTO v_class_10a_id;

    INSERT INTO public.classes (id, school_id, name, section, class_teacher_id)
    VALUES (gen_random_uuid(), v_school_id, 'Class 10', 'B', NULL)
    RETURNING id INTO v_class_10b_id;

    INSERT INTO public.classes (id, school_id, name, section, class_teacher_id)
    VALUES (gen_random_uuid(), v_school_id, 'Class 9', 'A', NULL)
    RETURNING id INTO v_class_9a_id;

    RAISE NOTICE 'Classes created: 10-A, 10-B, 9-A';

    -- ============ ASSIGN TEACHER TO CLASSES ============

    INSERT INTO public.teacher_classes (teacher_id, class_id, subject)
    VALUES
        (v_teacher_id, v_class_10a_id, 'Mathematics'),
        (v_teacher_id, v_class_10a_id, 'Physics'),
        (v_teacher_id, v_class_10b_id, 'Mathematics'),
        (v_classteacher_id, v_class_10a_id, 'English'),
        (v_classteacher_id, v_class_10a_id, 'Urdu');

    RAISE NOTICE 'Teachers assigned to classes';

    -- ============ CREATE STUDENTS ============

    -- Main demo student (linked to student@demo.com)
    INSERT INTO public.students (id, user_id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_student_user_id, v_school_id, v_class_10a_id, 'DEMO001', 'Ahmed Hassan')
    RETURNING id INTO v_student1_id;

    -- Additional students for realistic data
    INSERT INTO public.students (id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, 'DEMO002', 'Sara Khan')
    RETURNING id INTO v_student2_id;

    INSERT INTO public.students (id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, 'DEMO003', 'Ali Raza')
    RETURNING id INTO v_student3_id;

    INSERT INTO public.students (id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, 'DEMO004', 'Ayesha Tariq')
    RETURNING id INTO v_student4_id;

    INSERT INTO public.students (id, school_id, class_id, student_id, full_name)
    VALUES (gen_random_uuid(), v_school_id, v_class_10b_id, 'DEMO005', 'Zain Abbas')
    RETURNING id INTO v_student5_id;

    RAISE NOTICE 'Students created';

    -- ============ LINK PARENT TO STUDENT ============

    INSERT INTO public.parent_students (parent_id, student_id)
    VALUES (v_parent_id, v_student1_id);

    RAISE NOTICE 'Parent linked to student';

    -- ============ CREATE HOMEWORK ============

    -- Mathematics Homework
    INSERT INTO public.homework (id, school_id, class_id, teacher_id, title, description, subject, due_date)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, v_teacher_id,
            'Chapter 5: Quadratic Equations',
            'Solve exercises 5.1 to 5.3 from the textbook. Show all working steps.',
            'Mathematics', CURRENT_DATE + 3)
    RETURNING id INTO v_hw1_id;

    -- Physics Homework
    INSERT INTO public.homework (id, school_id, class_id, teacher_id, title, description, subject, due_date)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, v_teacher_id,
            'Newton''s Laws of Motion',
            'Write a 500-word essay on practical applications of Newton''s three laws of motion.',
            'Physics', CURRENT_DATE + 5)
    RETURNING id INTO v_hw2_id;

    -- English Homework
    INSERT INTO public.homework (id, school_id, class_id, teacher_id, title, description, subject, due_date)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, v_classteacher_id,
            'Essay: My Favourite Book',
            'Write a descriptive essay about your favourite book. Minimum 400 words.',
            'English', CURRENT_DATE + 7)
    RETURNING id INTO v_hw3_id;

    -- Past homework (already graded)
    INSERT INTO public.homework (id, school_id, class_id, teacher_id, title, description, subject, due_date)
    VALUES (gen_random_uuid(), v_school_id, v_class_10a_id, v_teacher_id,
            'Chapter 4: Linear Equations',
            'Complete all exercises from Chapter 4.',
            'Mathematics', CURRENT_DATE - 5)
    RETURNING id INTO v_hw4_id;

    RAISE NOTICE 'Homework created';

    -- ============ CREATE HOMEWORK SUBMISSIONS ============

    -- Submissions for past homework (graded)
    INSERT INTO public.homework_submissions (homework_id, student_id, submitted_at, marks, remarks)
    VALUES
        (v_hw4_id, v_student1_id, CURRENT_TIMESTAMP - INTERVAL '6 days', 8, 'Good work! Clear steps shown.'),
        (v_hw4_id, v_student2_id, CURRENT_TIMESTAMP - INTERVAL '6 days', 9, 'Excellent!'),
        (v_hw4_id, v_student3_id, CURRENT_TIMESTAMP - INTERVAL '5 days', 7, 'Good effort, review question 5.'),
        (v_hw4_id, v_student4_id, CURRENT_TIMESTAMP - INTERVAL '6 days', 6, 'Needs improvement in working.');

    -- Submission for current homework (pending grade)
    INSERT INTO public.homework_submissions (homework_id, student_id, submitted_at, marks, remarks)
    VALUES
        (v_hw1_id, v_student1_id, CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, NULL),
        (v_hw1_id, v_student2_id, CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL);

    RAISE NOTICE 'Homework submissions created';

    -- ============ CREATE ATTENDANCE RECORDS ============

    -- Last 14 days of attendance for all students
    FOR i IN 0..13 LOOP
        -- Student 1 (Ahmed) - Present most days
        INSERT INTO public.attendance (school_id, class_id, student_id, date, is_present, marked_by)
        VALUES (v_school_id, v_class_10a_id, v_student1_id, CURRENT_DATE - i,
                CASE WHEN i IN (3, 10) THEN false ELSE true END, v_classteacher_id);

        -- Student 2 (Sara) - Always present
        INSERT INTO public.attendance (school_id, class_id, student_id, date, is_present, marked_by)
        VALUES (v_school_id, v_class_10a_id, v_student2_id, CURRENT_DATE - i, true, v_classteacher_id);

        -- Student 3 (Ali) - Some absences
        INSERT INTO public.attendance (school_id, class_id, student_id, date, is_present, marked_by)
        VALUES (v_school_id, v_class_10a_id, v_student3_id, CURRENT_DATE - i,
                CASE WHEN i IN (1, 5, 8, 12) THEN false ELSE true END, v_classteacher_id);

        -- Student 4 (Ayesha) - Mostly present
        INSERT INTO public.attendance (school_id, class_id, student_id, date, is_present, marked_by)
        VALUES (v_school_id, v_class_10a_id, v_student4_id, CURRENT_DATE - i,
                CASE WHEN i = 7 THEN false ELSE true END, v_classteacher_id);
    END LOOP;

    RAISE NOTICE 'Attendance records created (14 days)';

    -- ============ CREATE NOTICES ============

    INSERT INTO public.notices (school_id, title, content, target_role, target_class_id, created_by)
    VALUES
        (v_school_id, 'Mid-Term Examination Schedule',
         'Mid-term examinations will commence from next Monday. Please check the detailed schedule on the notice board. All students must bring their admit cards.',
         NULL, NULL, v_principal_id),

        (v_school_id, 'Parent-Teacher Meeting',
         'A parent-teacher meeting is scheduled for this Saturday from 10 AM to 1 PM. All parents are requested to attend.',
         'parent', NULL, v_principal_id),

        (v_school_id, 'Sports Day Announcement',
         'Annual Sports Day will be held on the last Friday of this month. Students interested in participating should register with their class teachers.',
         'student', NULL, v_coordinator_id),

        (v_school_id, 'Class 10-A: Extra Math Classes',
         'Extra mathematics classes will be held every Thursday after school for Class 10-A students preparing for board exams.',
         NULL, v_class_10a_id, v_classteacher_id),

        (v_school_id, 'Holiday Notice: Eid-ul-Fitr',
         'School will remain closed from Monday to Wednesday on account of Eid-ul-Fitr. Classes will resume on Thursday.',
         NULL, NULL, v_principal_id);

    RAISE NOTICE 'Notices created';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEMO DATA SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'School: %', v_school_id;
    RAISE NOTICE 'Classes: 10-A, 10-B, 9-A';
    RAISE NOTICE 'Students: 5 (1 with login)';
    RAISE NOTICE 'Homework: 4 assignments';
    RAISE NOTICE 'Attendance: 14 days';
    RAISE NOTICE 'Notices: 5';
    RAISE NOTICE '========================================';

END $$;

-- ============ VERIFICATION QUERIES ============

-- Check all roles
SELECT
    p.full_name,
    p.email,
    ur.role,
    s.name as school_name
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.schools s ON ur.school_id = s.id
WHERE p.email LIKE '%@demo.com' OR p.email = 'ikrma434@gmail.com'
ORDER BY
    CASE ur.role
        WHEN 'host' THEN 1
        WHEN 'principal' THEN 2
        WHEN 'coordinator' THEN 3
        WHEN 'class_teacher' THEN 4
        WHEN 'teacher' THEN 5
        WHEN 'student' THEN 6
        WHEN 'parent' THEN 7
    END;

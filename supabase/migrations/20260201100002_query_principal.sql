-- Query to find principal email (this is just for display, no changes)
DO $$
DECLARE
    v_principal_email TEXT;
    v_principal_name TEXT;
BEGIN
    SELECT p.email, p.full_name
    INTO v_principal_email, v_principal_name
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'principal' AND ur.is_active = true
    LIMIT 1;

    IF v_principal_email IS NOT NULL THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'PRINCIPAL FOUND:';
        RAISE NOTICE 'Email: %', v_principal_email;
        RAISE NOTICE 'Name: %', v_principal_name;
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE 'No active principal found.';
    END IF;
END $$;

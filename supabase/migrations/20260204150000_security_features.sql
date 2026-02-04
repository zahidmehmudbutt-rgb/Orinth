-- Security Features Migration
-- Adds: Announcements, Login History, 2FA Settings, Session Management

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(50)[] DEFAULT ARRAY['all']::VARCHAR(50)[],
    -- Target can include: 'all', 'students', 'teachers', 'parents', 'class_teachers', 'coordinators'
    target_classes UUID[] DEFAULT NULL,
    -- Optional: specific class IDs to target
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_school ON public.announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON public.announcements(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- LOGIN HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    login_status VARCHAR(20) DEFAULT 'success' CHECK (login_status IN ('success', 'failed', 'blocked')),
    failure_reason VARCHAR(100),
    session_id TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON public.login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON public.login_history(login_status);

-- ============================================
-- TWO FACTOR AUTHENTICATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    secret_key TEXT,
    backup_codes TEXT[],
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES TABLE (for theme, session settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    session_timeout_minutes INTEGER DEFAULT 30,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Announcements RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view announcements for their school
CREATE POLICY "Users can view announcements for their school"
ON public.announcements FOR SELECT
TO authenticated
USING (
    school_id IN (
        SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    )
);

-- Only class_teacher, coordinator, principal can create announcements
CREATE POLICY "Staff can create announcements"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('class_teacher', 'coordinator', 'principal')
    )
    AND school_id IN (
        SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    )
);

-- Creators can update their own announcements
CREATE POLICY "Creators can update their announcements"
ON public.announcements FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Creators and principals can delete announcements
CREATE POLICY "Creators and principals can delete announcements"
ON public.announcements FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'principal'
    )
);

-- Login History RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "Users can view own login history"
ON public.login_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert login history (via service role or trigger)
CREATE POLICY "Service can insert login history"
ON public.login_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Two Factor Auth RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can manage their own 2FA
CREATE POLICY "Users can view own 2FA settings"
ON public.two_factor_auth FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own 2FA settings"
ON public.two_factor_auth FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own 2FA settings"
ON public.two_factor_auth FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- User Preferences RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'success',
    p_failure_reason VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_device_type VARCHAR(50);
    v_browser VARCHAR(100);
    v_os VARCHAR(100);
BEGIN
    -- Parse user agent for device info
    IF p_user_agent IS NOT NULL THEN
        -- Simple device detection
        IF p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN
            v_device_type := 'Mobile';
        ELSIF p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN
            v_device_type := 'Tablet';
        ELSE
            v_device_type := 'Desktop';
        END IF;

        -- Browser detection
        IF p_user_agent ILIKE '%chrome%' AND p_user_agent NOT ILIKE '%edge%' THEN
            v_browser := 'Chrome';
        ELSIF p_user_agent ILIKE '%firefox%' THEN
            v_browser := 'Firefox';
        ELSIF p_user_agent ILIKE '%safari%' AND p_user_agent NOT ILIKE '%chrome%' THEN
            v_browser := 'Safari';
        ELSIF p_user_agent ILIKE '%edge%' THEN
            v_browser := 'Edge';
        ELSE
            v_browser := 'Other';
        END IF;

        -- OS detection
        IF p_user_agent ILIKE '%windows%' THEN
            v_os := 'Windows';
        ELSIF p_user_agent ILIKE '%mac%' THEN
            v_os := 'macOS';
        ELSIF p_user_agent ILIKE '%linux%' THEN
            v_os := 'Linux';
        ELSIF p_user_agent ILIKE '%android%' THEN
            v_os := 'Android';
        ELSIF p_user_agent ILIKE '%iphone%' OR p_user_agent ILIKE '%ipad%' THEN
            v_os := 'iOS';
        ELSE
            v_os := 'Other';
        END IF;
    END IF;

    INSERT INTO public.login_history (
        user_id,
        ip_address,
        user_agent,
        device_type,
        browser,
        os,
        login_status,
        failure_reason
    ) VALUES (
        p_user_id,
        p_ip_address,
        p_user_agent,
        v_device_type,
        v_browser,
        v_os,
        p_status,
        p_failure_reason
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Function to get user's active announcements
CREATE OR REPLACE FUNCTION public.get_active_announcements(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    content TEXT,
    priority VARCHAR(20),
    is_pinned BOOLEAN,
    created_by UUID,
    creator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_school_id UUID;
    v_user_role TEXT;
    v_class_id UUID;
BEGIN
    -- Get user's school and role
    SELECT p.school_id INTO v_school_id
    FROM public.profiles p
    WHERE p.id = p_user_id;

    SELECT ur.role INTO v_user_role
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
    LIMIT 1;

    -- Get student's class if applicable
    IF v_user_role = 'student' THEN
        SELECT s.class_id INTO v_class_id
        FROM public.students s
        WHERE s.user_id = p_user_id;
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.content,
        a.priority,
        a.is_pinned,
        a.created_by,
        COALESCE(p.full_name, 'System') as creator_name,
        a.created_at,
        a.expires_at
    FROM public.announcements a
    LEFT JOIN public.profiles p ON a.created_by = p.id
    WHERE a.school_id = v_school_id
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND (
        'all' = ANY(a.target_audience)
        OR (v_user_role = 'student' AND 'students' = ANY(a.target_audience))
        OR (v_user_role = 'teacher' AND 'teachers' = ANY(a.target_audience))
        OR (v_user_role = 'class_teacher' AND ('class_teachers' = ANY(a.target_audience) OR 'teachers' = ANY(a.target_audience)))
        OR (v_user_role = 'coordinator' AND 'coordinators' = ANY(a.target_audience))
        OR (v_user_role = 'parent' AND 'parents' = ANY(a.target_audience))
        OR (v_user_role = 'principal')
    )
    AND (
        a.target_classes IS NULL
        OR array_length(a.target_classes, 1) IS NULL
        OR v_class_id = ANY(a.target_classes)
        OR v_user_role IN ('principal', 'coordinator', 'class_teacher', 'teacher')
    )
    ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC;
END;
$$;

-- Function to initialize user preferences
CREATE OR REPLACE FUNCTION public.init_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger to create preferences on profile creation
DROP TRIGGER IF EXISTS trigger_init_user_preferences ON public.profiles;
CREATE TRIGGER trigger_init_user_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.init_user_preferences();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT ON public.login_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.two_factor_auth TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_announcements TO authenticated;

-- =============================================
-- PARENT NOTIFICATIONS SYSTEM
-- Automated SMS/WhatsApp alerts for absence and test failures
-- =============================================

-- 1. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  absence_alerts BOOLEAN NOT NULL DEFAULT true,
  low_marks_alerts BOOLEAN NOT NULL DEFAULT true,
  homework_alerts BOOLEAN NOT NULL DEFAULT false,
  notice_alerts BOOLEAN NOT NULL DEFAULT true,
  low_marks_threshold INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL, -- 'absence', 'low_marks', 'homework', 'notice'
  channel TEXT NOT NULL, -- 'sms', 'whatsapp'
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  external_id TEXT, -- Twilio message SID
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create school_notification_settings for school-level SMS configuration
CREATE TABLE IF NOT EXISTS public.school_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  sms_provider TEXT DEFAULT 'twilio', -- 'twilio', 'jazz', 'telenor'
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  twilio_whatsapp_number TEXT,
  daily_sms_limit INTEGER DEFAULT 1000,
  sms_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  absence_message_template TEXT DEFAULT 'Dear Parent, your child {student_name} of {class_name} was marked absent on {date}. Please contact the school if this is incorrect. - {school_name}',
  low_marks_message_template TEXT DEFAULT 'Dear Parent, your child {student_name} scored {marks}/{max_marks} ({percentage}%) in {subject} - {exam_title}. Please review with your child. - {school_name}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_notification_settings ENABLE ROW LEVEL SECURITY;

-- 4. Add trigger for updated_at
CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_school_notification_settings_updated_at
  BEFORE UPDATE ON public.school_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- notification_preferences policies
CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Principals can view school notification preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- notification_logs policies
CREATE POLICY "Host can view all notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Principals can view school notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Parents can view their own notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- school_notification_settings policies
CREATE POLICY "Host can manage all school notification settings"
  ON public.school_notification_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'host'))
  WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Principals can manage their school notification settings"
  ON public.school_notification_settings FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'principal')
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- =============================================
-- FUNCTION: Reset daily SMS counter
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_daily_sms_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.school_notification_settings
  SET sms_sent_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

-- =============================================
-- FUNCTION: Get parent contact for student
-- =============================================
CREATE OR REPLACE FUNCTION public.get_student_parent_contacts(p_student_id UUID)
RETURNS TABLE (
  parent_id UUID,
  parent_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  sms_enabled BOOLEAN,
  whatsapp_enabled BOOLEAN,
  absence_alerts BOOLEAN,
  low_marks_alerts BOOLEAN,
  low_marks_threshold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as parent_id,
    p.full_name as parent_name,
    p.phone,
    COALESCE(p.whatsapp, p.phone) as whatsapp,
    COALESCE(np.sms_enabled, true) as sms_enabled,
    COALESCE(np.whatsapp_enabled, true) as whatsapp_enabled,
    COALESCE(np.absence_alerts, true) as absence_alerts,
    COALESCE(np.low_marks_alerts, true) as low_marks_alerts,
    COALESCE(np.low_marks_threshold, 40) as low_marks_threshold
  FROM public.parent_students ps
  JOIN public.profiles p ON p.id = ps.parent_id
  LEFT JOIN public.notification_preferences np ON np.user_id = ps.parent_id
  WHERE ps.student_id = p_student_id
  AND (p.phone IS NOT NULL OR p.whatsapp IS NOT NULL);
END;
$$;

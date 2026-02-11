-- ============================================================
-- Migration: Notification Center foundation
-- Adds dismissed_at to staff_notifications, creates
-- notification_preferences table, enables Realtime.
-- ============================================================

-- 1. Add dismissed_at column to staff_notifications
ALTER TABLE public.staff_notifications
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Indexes on staff_notifications
CREATE INDEX IF NOT EXISTS idx_staff_notifications_dismissed
  ON public.staff_notifications(user_id, dismissed_at)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_notifications_created
  ON public.staff_notifications(user_id, created_at DESC);

-- 3. RLS DELETE policy on staff_notifications
CREATE POLICY "Users can delete own notifications"
  ON public.staff_notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  type_enabled JSONB DEFAULT '{
    "qa_answered": true, "qa_new_question": true, "announcement": true,
    "message": true, "bug_report_update": true, "member_alert": true,
    "class_turnover": true, "mat_cleaning": true
  }'::jsonb,
  delivery_method JSONB DEFAULT '{
    "qa_answered": "push", "qa_new_question": "push", "announcement": "push",
    "message": "push", "bug_report_update": "banner", "member_alert": "push",
    "class_turnover": "banner", "mat_cleaning": "banner"
  }'::jsonb,
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_sling_linked BOOLEAN DEFAULT false,
  dnd_manual_start TIME DEFAULT NULL,
  dnd_manual_end TIME DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Enable RLS + policies on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can read all notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- 6. Trigger: auto-update updated_at on notification_preferences
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable Realtime on staff_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE staff_notifications;

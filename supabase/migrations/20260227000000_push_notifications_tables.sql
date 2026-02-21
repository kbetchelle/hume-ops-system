-- =============================================
-- Push Notifications Tables
-- =============================================
-- Creates staff_push_subscriptions and notification_history
-- for Web Push subscription storage and delivery history.

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Staff Web Push subscriptions (one row per device/browser per staff)
CREATE TABLE IF NOT EXISTS public.staff_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  device_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, endpoint)
);

-- Notification delivery history (for dedup and debugging)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  type text,
  success boolean DEFAULT true,
  error_message text,
  trigger_source text,
  user_marked_failed boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_staff_push_subscriptions_staff_id
  ON public.staff_push_subscriptions(staff_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_staff_sent
  ON public.notification_history(staff_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_trigger_sent
  ON public.notification_history(trigger_source, sent_at);

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES (idempotent: DROP IF EXISTS then CREATE)
-- =============================================

-- staff_push_subscriptions: users manage their own rows only (service_role bypasses RLS)
DROP POLICY IF EXISTS "Users can select own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can select own push subscriptions"
  ON public.staff_push_subscriptions FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions"
  ON public.staff_push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
  ON public.staff_push_subscriptions FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
  ON public.staff_push_subscriptions FOR DELETE
  TO authenticated
  USING (staff_id = auth.uid());

-- notification_history: management can select all; staff can select own
DROP POLICY IF EXISTS "Management can select all notification history" ON public.notification_history;
CREATE POLICY "Management can select all notification history"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff can select own notification history" ON public.notification_history;
CREATE POLICY "Staff can select own notification history"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS set_staff_push_subscriptions_updated_at ON public.staff_push_subscriptions;
CREATE TRIGGER set_staff_push_subscriptions_updated_at
  BEFORE UPDATE ON public.staff_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'staff_push_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_push_subscriptions;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notification_history'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;
    END IF;
  END IF;
END $$;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.staff_push_subscriptions TO service_role;
GRANT ALL ON public.notification_history TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_push_subscriptions TO authenticated;
GRANT SELECT ON public.notification_history TO authenticated;

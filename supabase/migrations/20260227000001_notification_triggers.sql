-- =============================================
-- Notification Triggers and Class Type Mappings
-- =============================================
-- Creates notification_triggers (when to send push notifications)
-- and class_type_mappings (arketa class name -> category for triggers).

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Configurable triggers: event type + target dept + message + timing
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'class_end_heated_room', 'class_end_high_roof', 'room_turnover', 'tour_alert'
  )),
  target_department text NOT NULL CHECK (target_department IN (
    'concierge', 'floater', 'cafe', 'all_foh', 'all_boh'
  )),
  message text NOT NULL,
  timing_description text,
  timing_window_minutes integer DEFAULT 5,
  filter_by_working boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maps arketa class name patterns to categories used by triggers
CREATE TABLE IF NOT EXISTS public.class_type_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name_pattern text NOT NULL,
  class_category text NOT NULL CHECK (class_category IN (
    'heated_room', 'high_roof', 'standard'
  )),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_name_pattern)
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notification_triggers_event_active
  ON public.notification_triggers(event_type, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_class_type_mappings_category
  ON public.class_type_mappings(class_category);

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_type_mappings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

DO $$
BEGIN
  -- notification_triggers: management full CRUD; others SELECT where is_active = true
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Management can do all on notification_triggers') THEN
    CREATE POLICY "Management can do all on notification_triggers"
      ON public.notification_triggers FOR ALL
      TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Others can select active notification_triggers') THEN
    CREATE POLICY "Others can select active notification_triggers"
      ON public.notification_triggers FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
  -- class_type_mappings: management full CRUD; others SELECT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Management can do all on class_type_mappings') THEN
    CREATE POLICY "Management can do all on class_type_mappings"
      ON public.class_type_mappings FOR ALL
      TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Others can select class_type_mappings') THEN
    CREATE POLICY "Others can select class_type_mappings"
      ON public.class_type_mappings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- 5. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS set_notification_triggers_updated_at ON public.notification_triggers;
CREATE TRIGGER set_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
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
        AND tablename = 'notification_triggers'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_triggers;
    END IF;
  END IF;
END $$;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.notification_triggers TO service_role;
GRANT ALL ON public.class_type_mappings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_triggers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_type_mappings TO authenticated;

-- =============================================
-- 8. SEED DEFAULT CLASS TYPE MAPPINGS
-- =============================================

INSERT INTO public.class_type_mappings (class_name_pattern, class_category, notes)
VALUES
  ('Heated%', 'heated_room', 'Heated yoga/pilates classes'),
  ('Infra%', 'heated_room', 'Infrared classes'),
  ('High Roof%', 'high_roof', 'High Roof studio classes')
ON CONFLICT (class_name_pattern) DO NOTHING;

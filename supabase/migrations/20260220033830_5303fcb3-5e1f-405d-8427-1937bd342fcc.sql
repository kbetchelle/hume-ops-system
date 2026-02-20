
-- ========== 1. profiles.must_change_password (20260220000005) ==========
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- ========== 2. policy_sections_redesign (20260223000000) ==========
ALTER TABLE public.club_policies 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_club_policies_tags 
  ON public.club_policies USING GIN (tags);

ALTER TABLE public.club_policies 
  DROP COLUMN IF EXISTS title;

ALTER TABLE public.club_policies 
  DROP COLUMN IF EXISTS sort_order;

ALTER TABLE public.policy_categories 
  DROP COLUMN IF EXISTS sort_order;

COMMENT ON COLUMN public.club_policies.tags IS 'Free-form tags for policy search (not displayed in UI)';
COMMENT ON TABLE public.club_policies IS 'Policy sections organized by category. Policies have no title - content only.';

-- ========== 3. push_notifications_tables (20260227000000) ==========
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

CREATE INDEX IF NOT EXISTS idx_staff_push_subscriptions_staff_id
  ON public.staff_push_subscriptions(staff_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_staff_sent
  ON public.notification_history(staff_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_trigger_sent
  ON public.notification_history(trigger_source, sent_at);

ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own push subscriptions"
  ON public.staff_push_subscriptions FOR SELECT TO authenticated
  USING (staff_id = auth.uid());
CREATE POLICY "Users can insert own push subscriptions"
  ON public.staff_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (staff_id = auth.uid());
CREATE POLICY "Users can update own push subscriptions"
  ON public.staff_push_subscriptions FOR UPDATE TO authenticated
  USING (staff_id = auth.uid());
CREATE POLICY "Users can delete own push subscriptions"
  ON public.staff_push_subscriptions FOR DELETE TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Management can select all notification history"
  ON public.notification_history FOR SELECT TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));
CREATE POLICY "Staff can select own notification history"
  ON public.notification_history FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

DROP TRIGGER IF EXISTS set_staff_push_subscriptions_updated_at ON public.staff_push_subscriptions;
CREATE TRIGGER set_staff_push_subscriptions_updated_at
  BEFORE UPDATE ON public.staff_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_push_subscriptions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_push_subscriptions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notification_history') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;
    END IF;
  END IF;
END $$;

GRANT ALL ON public.staff_push_subscriptions TO service_role;
GRANT ALL ON public.notification_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_push_subscriptions TO authenticated;
GRANT SELECT ON public.notification_history TO authenticated;

-- ========== 4. notification_triggers (20260227000001) ==========
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

CREATE TABLE IF NOT EXISTS public.class_type_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name_pattern text NOT NULL,
  class_category text NOT NULL CHECK (class_category IN ('heated_room', 'high_roof', 'standard')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_name_pattern)
);

CREATE INDEX IF NOT EXISTS idx_notification_triggers_event_active
  ON public.notification_triggers(event_type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_class_type_mappings_category
  ON public.class_type_mappings(class_category);

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_type_mappings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Management can do all on notification_triggers') THEN
    CREATE POLICY "Management can do all on notification_triggers"
      ON public.notification_triggers FOR ALL TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Others can select active notification_triggers') THEN
    CREATE POLICY "Others can select active notification_triggers"
      ON public.notification_triggers FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Management can do all on class_type_mappings') THEN
    CREATE POLICY "Management can do all on class_type_mappings"
      ON public.class_type_mappings FOR ALL TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Others can select class_type_mappings') THEN
    CREATE POLICY "Others can select class_type_mappings"
      ON public.class_type_mappings FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_notification_triggers_updated_at ON public.notification_triggers;
CREATE TRIGGER set_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notification_triggers') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_triggers;
    END IF;
  END IF;
END $$;

GRANT ALL ON public.notification_triggers TO service_role;
GRANT ALL ON public.class_type_mappings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_triggers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_type_mappings TO authenticated;

INSERT INTO public.class_type_mappings (class_name_pattern, class_category, notes)
VALUES
  ('Heated%', 'heated_room', 'Heated yoga/pilates classes'),
  ('Infra%', 'heated_room', 'Infrared classes'),
  ('High Roof%', 'high_roof', 'High Roof studio classes')
ON CONFLICT (class_name_pattern) DO NOTHING;

-- ========== 5. notification_types_expansion (20260227000002) ==========
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;

COMMENT ON TABLE public.notification_preferences IS 'User notification preferences. Valid notification types: qa_answered, qa_new_question, announcement, message, bug_report_update, member_alert, class_turnover, mat_cleaning, account_approval_pending, account_approved, account_rejected, resource_outdated, package_arrived, room_turnover, tour_alert';

-- ========== 6. check_mat_cleaning_cron (20260227120000) ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      PERFORM cron.schedule(
        'check-mat-cleaning',
        '*/2 * * * *',
        $cron$
        SELECT net.http_post(
          url := current_setting('app.supabase_url', true) || '/functions/v1/check-mat-cleaning',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
          ),
          body := '{}'
        );
        $cron$
      );
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ========== 7. add_primary_role (20260228120000) ==========
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_role app_role NULL;

DROP FUNCTION IF EXISTS public.admin_get_all_users();
CREATE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  onboarding_completed boolean,
  deactivated boolean,
  created_at timestamptz,
  roles app_role[],
  primary_role app_role
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    p.primary_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at, p.primary_role
  ORDER BY p.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.admin_set_primary_role(_target_user_id uuid, _primary_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Access denied. Admin or Manager role required.';
  END IF;
  IF _primary_role IS NULL THEN
    UPDATE public.profiles SET primary_role = NULL WHERE user_id = _target_user_id;
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = _primary_role) THEN
    RAISE EXCEPTION 'Primary role must be one of the user''s assigned roles.';
  END IF;
  UPDATE public.profiles SET primary_role = _primary_role WHERE user_id = _target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_roles(_target_user_id uuid, _roles app_role[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role) SELECT _target_user_id, unnest(_roles);
  UPDATE public.profiles SET primary_role = NULL
  WHERE user_id = _target_user_id AND primary_role IS NOT NULL AND NOT (primary_role = ANY(_roles));
END;
$$;

-- ========== 8. user_walkthrough_state (20260301120000) ==========
CREATE TABLE IF NOT EXISTS public.user_walkthrough_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_at TIMESTAMPTZ NULL,
  skipped_at TIMESTAMPTZ NULL,
  viewed_page_hints TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_walkthrough_state_user_id
  ON public.user_walkthrough_state(user_id);

ALTER TABLE public.user_walkthrough_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own walkthrough state"
  ON public.user_walkthrough_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own walkthrough state"
  ON public.user_walkthrough_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own walkthrough state"
  ON public.user_walkthrough_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_walkthrough_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_walkthrough_state_updated_at ON public.user_walkthrough_state;
CREATE TRIGGER user_walkthrough_state_updated_at
  BEFORE UPDATE ON public.user_walkthrough_state
  FOR EACH ROW EXECUTE FUNCTION public.update_user_walkthrough_state_updated_at();

CREATE OR REPLACE FUNCTION public.walkthrough_mark_hint_viewed(_hint_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.user_walkthrough_state
  SET viewed_page_hints = array_append(viewed_page_hints, _hint_id), updated_at = now()
  WHERE user_id = auth.uid() AND NOT (_hint_id = ANY(viewed_page_hints));

  IF NOT FOUND THEN
    INSERT INTO public.user_walkthrough_state (user_id, viewed_page_hints)
    VALUES (auth.uid(), ARRAY[_hint_id])
    ON CONFLICT (user_id) DO UPDATE
    SET viewed_page_hints = CASE
        WHEN NOT (_hint_id = ANY(public.user_walkthrough_state.viewed_page_hints))
        THEN array_append(public.user_walkthrough_state.viewed_page_hints, _hint_id)
        ELSE public.user_walkthrough_state.viewed_page_hints
      END,
      updated_at = now();
  END IF;
END;
$$;

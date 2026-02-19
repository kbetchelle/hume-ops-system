-- Idempotent: safe when notification_triggers was created by a later migration (e.g. 20260227000001) or repair.
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  target_department TEXT NOT NULL,
  message TEXT NOT NULL,
  timing_description TEXT,
  timing_window_minutes INTEGER NOT NULL DEFAULT 5,
  filter_by_working BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Authenticated users can view triggers') THEN
    CREATE POLICY "Authenticated users can view triggers"
      ON public.notification_triggers FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Managers and admins can insert triggers') THEN
    CREATE POLICY "Managers and admins can insert triggers"
      ON public.notification_triggers FOR INSERT
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Managers and admins can update triggers') THEN
    CREATE POLICY "Managers and admins can update triggers"
      ON public.notification_triggers FOR UPDATE
      USING (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Managers and admins can delete triggers') THEN
    CREATE POLICY "Managers and admins can delete triggers"
      ON public.notification_triggers FOR DELETE
      USING (public.is_manager_or_admin(auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_notification_triggers_updated_at ON public.notification_triggers;
CREATE TRIGGER update_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

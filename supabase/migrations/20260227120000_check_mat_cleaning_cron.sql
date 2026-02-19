-- =============================================
-- Schedule check-mat-cleaning edge function every 2 minutes
-- (Class end / room turnover / tour alert notifications)
-- =============================================
-- Requires: pg_cron and pg_net, and app.supabase_url / app.supabase_service_role_key
-- to be set (e.g. in Supabase Dashboard > Database > Settings).

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
    -- If settings or extensions are missing, skip; can be configured in Dashboard
    NULL;
END $$;

-- Nuclear option: Drop and recreate the PostgREST notification channel
-- This forces PostgREST to completely reload everything

-- First, notify multiple times with different payloads
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.5);
    PERFORM pg_notify('pgrst', 'reload config');
    PERFORM pg_sleep(0.5);
  END LOOP;
END $$;

-- Force a schema change that PostgREST MUST detect
-- Add a dummy comment to trigger cache invalidation
COMMENT ON TABLE public.arketa_reservations IS 'Arketa class reservations - CACHE RELOAD ' || NOW()::text;

-- One final reload signal
SELECT pg_notify('pgrst', 'reload schema');

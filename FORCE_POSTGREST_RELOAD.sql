-- Force PostgREST to reload schema cache NOW
-- Run this immediately after schema changes

DO $$
BEGIN
  -- Send multiple notifications to ensure PostgREST picks it up
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_notify('pgrst', 'reload schema');
  
  RAISE NOTICE 'PostgREST reload notifications sent (3x)';
END $$;

-- Also call our helper function
SELECT public.reload_postgrest_cache();

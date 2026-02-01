-- Force PostgREST schema reload after adding columns
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Schema reload triggered 3x';
END $$;

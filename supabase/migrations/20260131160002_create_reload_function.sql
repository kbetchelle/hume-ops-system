-- Create a helper function to reload PostgREST schema cache
-- This can be called from the Supabase Dashboard or via RPC

CREATE OR REPLACE FUNCTION public.reload_postgrest_cache()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification to PostgREST to reload schema
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  -- Return confirmation
  RETURN 'PostgREST schema cache reload triggered';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reload_postgrest_cache() TO authenticated, anon, service_role;

-- Add comment
COMMENT ON FUNCTION public.reload_postgrest_cache() IS 'Triggers PostgREST to reload its schema cache. Use after DDL changes.';

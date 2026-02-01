-- Create exec_sql function to execute raw SQL from Edge Functions
-- This bypasses PostgREST's schema cache and executes directly against PostgreSQL

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Execute the SQL and return results as JSONB
  EXECUTE sql INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes raw SQL queries. Used to bypass PostgREST schema cache. SECURITY DEFINER - use with caution.';

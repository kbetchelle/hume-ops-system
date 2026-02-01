-- Fix exec_sql function - simpler version that returns void
-- Previous version had unterminated dollar-quote issue

DROP FUNCTION IF EXISTS public.exec_sql(text);

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE sql;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;

COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes raw SQL queries. Used to bypass PostgREST schema cache. SECURITY DEFINER - use with caution.';

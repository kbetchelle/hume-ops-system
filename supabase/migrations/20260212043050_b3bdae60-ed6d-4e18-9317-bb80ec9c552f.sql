
-- Drop the redundant arketa_payments_history table
DROP TABLE IF EXISTS public.arketa_payments_history CASCADE;

-- Update the calendar function to use arketa_payments directly
CREATE OR REPLACE FUNCTION public.get_backfill_payments_calendar()
 RETURNS TABLE(d date, record_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (created_at_api AT TIME ZONE 'UTC')::date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_payments
  WHERE created_at_api >= '2024-08-01' AND created_at_api IS NOT NULL
  GROUP BY (created_at_api AT TIME ZONE 'UTC')::date
  ORDER BY d;
$function$;

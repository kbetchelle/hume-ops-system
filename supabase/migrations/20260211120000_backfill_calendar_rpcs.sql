-- RPCs for backfill calendar heatmap: per-date sync status from Aug 1, 2024.
-- Used by BackfillCalendarHeatmap to show synced / partial / not pulled by day.

CREATE OR REPLACE FUNCTION public.get_backfill_reservations_calendar()
RETURNS TABLE(d date, record_count bigint, checked_in_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    class_date AS d,
    COUNT(*)::bigint AS record_count,
    COUNT(*) FILTER (WHERE checked_in = true)::bigint AS checked_in_count
  FROM arketa_reservations_history
  WHERE class_date >= '2024-08-01' AND class_date IS NOT NULL
  GROUP BY class_date
  ORDER BY class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_payments_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    start_date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_payments_history
  WHERE start_date >= '2024-08-01' AND start_date IS NOT NULL
  GROUP BY start_date
  ORDER BY start_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_classes_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    class_date::date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_classes
  WHERE class_date >= '2024-08-01' AND class_date IS NOT NULL
  GROUP BY class_date
  ORDER BY class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_toast_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    business_date AS d,
    COUNT(*)::bigint AS record_count
  FROM toast_sales
  WHERE business_date >= '2024-08-01'
  GROUP BY business_date
  ORDER BY business_date;
$$;

COMMENT ON FUNCTION public.get_backfill_reservations_calendar() IS 'Per-date reservation counts and check-in counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_payments_calendar() IS 'Per-date payment counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_classes_calendar() IS 'Per-date class counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_toast_calendar() IS 'Per-date toast_sales presence for backfill calendar (Aug 1 2024+).';

-- Grant execute to authenticated (RLS on tables still applies; SECURITY DEFINER uses definer rights)
GRANT EXECUTE ON FUNCTION public.get_backfill_reservations_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_payments_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_classes_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_toast_calendar() TO authenticated;

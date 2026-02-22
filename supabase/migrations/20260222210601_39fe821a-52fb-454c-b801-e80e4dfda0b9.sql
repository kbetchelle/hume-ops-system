-- 1. Add missing columns from staging to arketa_payments
ALTER TABLE public.arketa_payments
  ADD COLUMN IF NOT EXISTS sync_batch_id text,
  ADD COLUMN IF NOT EXISTS cursor_position text,
  ADD COLUMN IF NOT EXISTS source_endpoint text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS offering_id text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS remaining_uses integer,
  ADD COLUMN IF NOT EXISTS total_refunded numeric,
  ADD COLUMN IF NOT EXISTS stripe_fees numeric;

-- 2. Update backfill calendar function to use arketa_payments instead of history table
CREATE OR REPLACE FUNCTION public.get_backfill_payments_calendar()
  RETURNS TABLE(d date, record_count bigint)
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT
    created_at_api::date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_payments
  WHERE created_at_api >= '2024-08-01' AND created_at_api IS NOT NULL
  GROUP BY created_at_api::date
  ORDER BY created_at_api::date;
$$;

-- 3. Drop unused arketa_payments_history table
DROP POLICY IF EXISTS "Managers can manage arketa_payments_history" ON public.arketa_payments_history;
DROP TABLE IF EXISTS public.arketa_payments_history;
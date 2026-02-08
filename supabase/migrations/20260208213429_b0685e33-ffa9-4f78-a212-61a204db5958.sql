
-- 1. Fix existing arketa_classes records: convert start_time to PST for class_date
UPDATE arketa_classes
SET class_date = (start_time AT TIME ZONE 'America/Los_Angeles')::date
WHERE start_time IS NOT NULL;

-- 2. Restructure toast_staging
TRUNCATE TABLE toast_staging;

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'toast_staging'
      AND constraint_type = 'UNIQUE'
  LOOP
    EXECUTE format('ALTER TABLE public.toast_staging DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.toast_staging ADD COLUMN IF NOT EXISTS order_guid TEXT;
ALTER TABLE public.toast_staging ADD CONSTRAINT toast_staging_order_guid_key UNIQUE (order_guid);

-- 3. Restructure toast_sales
TRUNCATE TABLE toast_sales;

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'toast_sales'
      AND constraint_type = 'UNIQUE'
  LOOP
    EXECUTE format('ALTER TABLE public.toast_sales DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.toast_sales ADD COLUMN IF NOT EXISTS order_guid TEXT;
ALTER TABLE public.toast_sales ADD CONSTRAINT toast_sales_order_guid_key UNIQUE (order_guid);
ALTER TABLE public.toast_sales ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 1;

-- 4. Update RPC
CREATE OR REPLACE FUNCTION public.get_backfill_toast_calendar()
 RETURNS TABLE(d date, record_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    business_date AS d,
    COUNT(*)::bigint AS record_count
  FROM toast_sales
  WHERE business_date >= '2024-08-01'
  GROUP BY business_date
  ORDER BY business_date;
$function$;

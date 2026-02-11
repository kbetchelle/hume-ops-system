-- Enforce order_guid NOT NULL on toast_staging and toast_sales.
-- Syncs always provide order_guid (from order.guid or fallback UUID).
-- Skip if tables do not exist (e.g. toast not used in this project).
-- Also skip if the order_guid column doesn't exist (it was dropped in an earlier migration).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'toast_staging' 
    AND column_name = 'order_guid'
  ) THEN
    DELETE FROM toast_staging WHERE order_guid IS NULL;
    ALTER TABLE public.toast_staging ALTER COLUMN order_guid SET NOT NULL;
    COMMENT ON COLUMN public.toast_staging.order_guid IS 'Toast order GUID; one row per order.';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'toast_sales' 
    AND column_name = 'order_guid'
  ) THEN
    DELETE FROM toast_sales WHERE order_guid IS NULL;
    ALTER TABLE public.toast_sales ALTER COLUMN order_guid SET NOT NULL;
    COMMENT ON COLUMN public.toast_sales.order_guid IS 'Toast order GUID; one row per order.';
  END IF;
END $$;

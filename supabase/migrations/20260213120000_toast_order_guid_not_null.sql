-- Enforce order_guid NOT NULL on toast_staging and toast_sales.
-- Syncs always provide order_guid (from order.guid or fallback UUID).

-- Remove any rows with null order_guid (should not exist after individual-order syncs)
DELETE FROM toast_staging WHERE order_guid IS NULL;
DELETE FROM toast_sales WHERE order_guid IS NULL;

ALTER TABLE public.toast_staging
  ALTER COLUMN order_guid SET NOT NULL;

ALTER TABLE public.toast_sales
  ALTER COLUMN order_guid SET NOT NULL;

COMMENT ON COLUMN public.toast_staging.order_guid IS 'Toast order GUID; one row per order.';
COMMENT ON COLUMN public.toast_sales.order_guid IS 'Toast order GUID; one row per order.';

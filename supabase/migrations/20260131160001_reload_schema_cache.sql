-- Reload PostgREST schema cache after adding columns to arketa_payments
-- This notifies PostgREST to refresh its internal schema cache

SELECT pg_notify('pgrst', 'reload schema');

-- Also verify the new columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_payments' 
    AND column_name = 'amount_refunded'
  ) THEN
    RAISE EXCEPTION 'Column amount_refunded does not exist in arketa_payments table';
  END IF;
  
  RAISE NOTICE 'Schema cache reload triggered. New columns are available.';
END $$;

-- MANUAL FIX: Add columns to arketa_payments
-- Run this directly in Supabase SQL Editor

-- Add all missing columns
ALTER TABLE public.arketa_payments
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS amount_refunded decimal(10,2),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS offering_name text,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS net_sales decimal(10,2),
  ADD COLUMN IF NOT EXISTS transaction_fees decimal(10,2),
  ADD COLUMN IF NOT EXISTS tax decimal(10,2),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_arketa_payments_source ON public.arketa_payments(source);
CREATE INDEX IF NOT EXISTS idx_arketa_payments_status ON public.arketa_payments(status);
CREATE INDEX IF NOT EXISTS idx_arketa_payments_location ON public.arketa_payments(location_name);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_payments'
  AND column_name IN ('amount_refunded', 'currency', 'description', 'source', 'location_name')
ORDER BY column_name;

-- Expected output: Should show all 5 columns

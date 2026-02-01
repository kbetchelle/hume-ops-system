-- Expand arketa_payments table to match CSV export schema
-- This migration adds missing columns from the Arketa payments export

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

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_arketa_payments_source ON public.arketa_payments(source);
CREATE INDEX IF NOT EXISTS idx_arketa_payments_status ON public.arketa_payments(status);
CREATE INDEX IF NOT EXISTS idx_arketa_payments_location ON public.arketa_payments(location_name);

-- Add comment explaining schema
COMMENT ON TABLE public.arketa_payments IS 'Arketa payment records with full export schema including refunds, fees, and location data';

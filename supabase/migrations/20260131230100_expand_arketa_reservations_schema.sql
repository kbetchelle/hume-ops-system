-- Expand arketa_reservations table to match CSV export schema
-- Adds all missing columns from Arketa reservations export

ALTER TABLE public.arketa_reservations
  ADD COLUMN IF NOT EXISTS booking_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email_marketing_opt_in boolean,
  ADD COLUMN IF NOT EXISTS date_purchased timestamptz,
  ADD COLUMN IF NOT EXISTS purchase_id text,
  ADD COLUMN IF NOT EXISTS reservation_type text,
  ADD COLUMN IF NOT EXISTS class_name text,
  ADD COLUMN IF NOT EXISTS class_time timestamptz,
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS purchase_type text,
  ADD COLUMN IF NOT EXISTS gross_amount_paid decimal(10,2),
  ADD COLUMN IF NOT EXISTS net_amount_paid decimal(10,2),
  ADD COLUMN IF NOT EXISTS estimated_gross_revenue decimal(10,2),
  ADD COLUMN IF NOT EXISTS estimated_net_revenue decimal(10,2),
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS package_name text,
  ADD COLUMN IF NOT EXISTS package_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS package_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS offering_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS service_id text,
  ADD COLUMN IF NOT EXISTS tags jsonb,
  ADD COLUMN IF NOT EXISTS experience_type text,
  ADD COLUMN IF NOT EXISTS late_cancel boolean,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_by text,
  ADD COLUMN IF NOT EXISTS milestone integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_booking_id ON public.arketa_reservations(booking_id);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_class_time ON public.arketa_reservations(class_time);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_status ON public.arketa_reservations(status);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_location ON public.arketa_reservations(location_name);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_purchase_id ON public.arketa_reservations(purchase_id);

-- Update table comment
COMMENT ON TABLE public.arketa_reservations IS 'Arketa class reservations with full export schema including booking details, payments, and attendance';

-- Send reload notification
SELECT pg_notify('pgrst', 'reload schema');

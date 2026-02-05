
-- Add all missing columns to arketa_reservations
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS reservation_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS email_marketing_opt_in BOOLEAN;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS date_purchased TIMESTAMPTZ;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS purchase_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS reservation_type TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS class_time TIMESTAMPTZ;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS purchase_type TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS gross_amount_paid NUMERIC;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS net_amount_paid NUMERIC;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS estimated_gross_revenue NUMERIC;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS estimated_net_revenue NUMERIC;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS package_period_start TIMESTAMPTZ;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS package_period_end TIMESTAMPTZ;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS offering_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS service_id TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS experience_type TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS late_cancel BOOLEAN;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS canceled_by TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS milestone TEXT;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Drop the old misnamed constraint (it was on booking_id, not external_id)
ALTER TABLE public.arketa_reservations DROP CONSTRAINT IF EXISTS arketa_reservations_external_id_key;

-- Drop old index
DROP INDEX IF EXISTS idx_arketa_reservations_external_id;

-- Add proper unique constraint on external_id
ALTER TABLE public.arketa_reservations ADD CONSTRAINT arketa_reservations_external_id_unique UNIQUE (external_id);

-- Add index on reservation_id
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_reservation_id ON public.arketa_reservations (reservation_id);

-- Re-add booking_id unique constraint
ALTER TABLE public.arketa_reservations ADD CONSTRAINT arketa_reservations_booking_id_unique UNIQUE (booking_id);

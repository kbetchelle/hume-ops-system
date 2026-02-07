-- Slim arketa_reservations, arketa_reservations_history, and arketa_reservations_staging
-- to only: id (PK) + reservation_id, class_id, client_id, purchase_id, reservation_type,
-- class_name, class_date, status, checked_in, checked_in_at, experience_type, late_cancel,
-- gross_amount_paid, net_amount_paid, raw_data, sync_batch_id.

-- 1) Clear all records (optional - run when ready to wipe)
TRUNCATE TABLE public.arketa_reservations CASCADE;
TRUNCATE TABLE public.arketa_reservations_history CASCADE;
TRUNCATE TABLE public.arketa_reservations_staging CASCADE;

-- 2) arketa_reservations: add missing columns then drop all others
ALTER TABLE public.arketa_reservations
  ADD COLUMN IF NOT EXISTS reservation_id text,
  ADD COLUMN IF NOT EXISTS class_date date,
  ADD COLUMN IF NOT EXISTS sync_batch_id uuid;

-- Drop unique constraint on external_id before dropping column
ALTER TABLE public.arketa_reservations DROP CONSTRAINT IF EXISTS arketa_reservations_external_id_unique;
ALTER TABLE public.arketa_reservations DROP CONSTRAINT IF EXISTS arketa_reservations_external_id_key;

ALTER TABLE public.arketa_reservations
  DROP COLUMN IF EXISTS booking_id,
  DROP COLUMN IF EXISTS external_id,
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS client_email,
  DROP COLUMN IF EXISTS class_time,
  DROP COLUMN IF EXISTS synced_at,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS canceled_at,
  DROP COLUMN IF EXISTS canceled_by,
  DROP COLUMN IF EXISTS date_purchased,
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS coupon_code,
  DROP COLUMN IF EXISTS email_marketing_opt_in,
  DROP COLUMN IF EXISTS estimated_gross_revenue,
  DROP COLUMN IF EXISTS estimated_net_revenue,
  DROP COLUMN IF EXISTS instructor_name,
  DROP COLUMN IF EXISTS location_address,
  DROP COLUMN IF EXISTS location_name,
  DROP COLUMN IF EXISTS milestone,
  DROP COLUMN IF EXISTS offering_id,
  DROP COLUMN IF EXISTS package_name,
  DROP COLUMN IF EXISTS package_period_end,
  DROP COLUMN IF EXISTS package_period_start,
  DROP COLUMN IF EXISTS payment_id,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS purchase_type,
  DROP COLUMN IF EXISTS service_id,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS updated_at;

-- Unique constraint for upserts (replaces external_id)
ALTER TABLE public.arketa_reservations
  ADD CONSTRAINT arketa_reservations_reservation_class_unique UNIQUE (reservation_id, class_id);

-- 3) arketa_reservations_history: drop synced_at and created_at only
ALTER TABLE public.arketa_reservations_history
  DROP COLUMN IF EXISTS synced_at,
  DROP COLUMN IF EXISTS created_at;

-- 4) arketa_reservations_staging: drop created_at and synced_at
ALTER TABLE public.arketa_reservations_staging
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS synced_at;

COMMENT ON TABLE public.arketa_reservations IS 'Arketa reservations: id + 16 fields only. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_reservations_history IS 'Reservations history: id + 16 fields. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_reservations_staging IS 'Staging for reservations: id + 16 fields. staging -> history via sync-from-staging.';

-- Restrict arketa_reservations_staging and arketa_reservations_history to CSV header fields only.
-- CSV fields: id, client_id, reservation_id, purchase_id, reservation_type, class_id, class_name,
-- status, checked_in, checked_in_at, experience_type, late_cancel, synced_at, created_at,
-- gross_amount_paid, net_amount_paid, class_date, sync_batch_id, raw_data

-- 1) arketa_reservations_staging: add created_at if missing; drop columns not in CSV list
ALTER TABLE public.arketa_reservations_staging
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Drop extra columns (staging: no synced_at - added on transfer to history)
ALTER TABLE public.arketa_reservations_staging
  DROP COLUMN IF EXISTS arketa_class_id,
  DROP COLUMN IF EXISTS arketa_reservation_id,
  DROP COLUMN IF EXISTS cancelled_at,
  DROP COLUMN IF EXISTS cursor_position,
  DROP COLUMN IF EXISTS client_email,
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS staged_at;

-- 2) arketa_reservations_history: add created_at if missing; drop columns not in CSV list
ALTER TABLE public.arketa_reservations_history
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- History keeps synced_at (added on transfer). No extra columns to drop - history already matches CSV.
COMMENT ON TABLE public.arketa_reservations_staging IS 'Staging for reservations backfill; CSV fields only. staging -> history via sync-from-staging.';
COMMENT ON TABLE public.arketa_reservations_history IS 'Target for reservations backfill; CSV fields only. Unique (reservation_id, class_id).';


-- =============================================
-- Add missing API fields to reservation tables
-- =============================================

-- arketa_reservations (legacy)
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS created_at_api timestamptz;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS updated_at_api timestamptz;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS spot_id text;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS spot_name text;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS client_first_name text;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS client_last_name text;
ALTER TABLE public.arketa_reservations ADD COLUMN IF NOT EXISTS client_phone text;

-- arketa_reservations_staging
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS created_at_api timestamptz;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS updated_at_api timestamptz;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS spot_id text;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS spot_name text;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS client_first_name text;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS client_last_name text;
ALTER TABLE public.arketa_reservations_staging ADD COLUMN IF NOT EXISTS client_phone text;

-- arketa_reservations_history
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS created_at_api timestamptz;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS updated_at_api timestamptz;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS spot_id text;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS spot_name text;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS client_first_name text;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS client_last_name text;
ALTER TABLE public.arketa_reservations_history ADD COLUMN IF NOT EXISTS client_phone text;

-- =============================================
-- Add missing API fields to class tables
-- =============================================

-- arketa_classes
ALTER TABLE public.arketa_classes ADD COLUMN IF NOT EXISTS location_id text;
ALTER TABLE public.arketa_classes ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.arketa_classes ADD COLUMN IF NOT EXISTS updated_at_api timestamptz;

-- arketa_classes_staging
ALTER TABLE public.arketa_classes_staging ADD COLUMN IF NOT EXISTS location_id text;
ALTER TABLE public.arketa_classes_staging ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.arketa_classes_staging ADD COLUMN IF NOT EXISTS updated_at_api timestamptz;

-- =============================================
-- Update upsert_arketa_classes_from_staging RPC to include new columns
-- =============================================
CREATE OR REPLACE FUNCTION public.upsert_arketa_classes_from_staging(p_sync_batch_id text)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  upserted_count integer;
BEGIN
  WITH upserted AS (
    INSERT INTO arketa_classes (
      external_id, class_date, start_time, duration_minutes, name, capacity,
      instructor_name, is_cancelled, description, booked_count, waitlist_count,
      status, room_name, raw_data, synced_at, location_id, is_deleted, updated_at_api
    )
    SELECT
      s.external_id, s.class_date, s.start_time, s.duration_minutes, s.name, s.capacity,
      s.instructor_name, s.is_cancelled, s.description, s.booked_count, s.waitlist_count,
      s.status, s.room_name, s.raw_data, s.synced_at, s.location_id, s.is_deleted, s.updated_at_api
    FROM arketa_classes_staging s
    WHERE s.sync_batch_id = p_sync_batch_id
    ON CONFLICT (external_id, class_date) DO UPDATE SET
      start_time = EXCLUDED.start_time,
      duration_minutes = EXCLUDED.duration_minutes,
      name = EXCLUDED.name,
      capacity = EXCLUDED.capacity,
      instructor_name = EXCLUDED.instructor_name,
      is_cancelled = EXCLUDED.is_cancelled,
      description = EXCLUDED.description,
      booked_count = EXCLUDED.booked_count,
      waitlist_count = EXCLUDED.waitlist_count,
      status = EXCLUDED.status,
      room_name = EXCLUDED.room_name,
      raw_data = EXCLUDED.raw_data,
      synced_at = EXCLUDED.synced_at,
      location_id = EXCLUDED.location_id,
      is_deleted = EXCLUDED.is_deleted,
      updated_at_api = EXCLUDED.updated_at_api,
      updated_at = now()
    RETURNING id
  )
  SELECT count(*) INTO upserted_count FROM upserted;

  -- Clean up staging rows for this batch
  DELETE FROM arketa_classes_staging WHERE sync_batch_id = p_sync_batch_id;

  RETURN upserted_count;
END;
$$;

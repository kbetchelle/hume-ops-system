
-- Add location_name to arketa_classes
ALTER TABLE public.arketa_classes ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Add location_name to arketa_classes_staging
ALTER TABLE public.arketa_classes_staging ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Update the upsert RPC to include location_name
CREATE OR REPLACE FUNCTION public.upsert_arketa_classes_from_staging(p_sync_batch_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected_count integer;
BEGIN
  INSERT INTO public.arketa_classes (
    external_id, class_date, start_time, duration_minutes, name, capacity,
    instructor_name, is_cancelled, description, booked_count, waitlist_count,
    status, room_name, raw_data, synced_at, location_id, location_name, is_deleted, updated_at_api, updated_at
  )
  SELECT
    s.external_id, s.class_date, s.start_time, s.duration_minutes, s.name, s.capacity,
    s.instructor_name, s.is_cancelled, s.description, s.booked_count, s.waitlist_count,
    s.status, s.room_name, s.raw_data, s.synced_at, s.location_id, s.location_name, s.is_deleted, s.updated_at_api, now()
  FROM public.arketa_classes_staging s
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
    location_name = EXCLUDED.location_name,
    is_deleted = EXCLUDED.is_deleted,
    updated_at_api = EXCLUDED.updated_at_api,
    updated_at = now();

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  DELETE FROM public.arketa_classes_staging
  WHERE sync_batch_id = p_sync_batch_id;

  RETURN affected_count;
END;
$function$;

-- Backfill existing rows with known location ID-to-name mapping
UPDATE public.arketa_classes SET location_name = CASE location_id
  WHEN 'ZpbZcKknSQeHKmmtYtes' THEN 'HUME'
  WHEN 'exQWcsxbNQKOn17d0Nif' THEN 'HUME'
  WHEN 'zQUVWkrRHeqhThff6gh0' THEN 'High Roof'
  WHEN 'H2mCPKfGZBrnpxgnxrPm' THEN 'Ground Floor Studio'
  WHEN 'A7d5KXnbKYTMW7NWPV7d' THEN 'Reformer Studio'
  WHEN 'fUTW1Ezl7j8Y6u046LK1' THEN 'Reformer Studio'
END
WHERE location_id IS NOT NULL AND location_name IS NULL;

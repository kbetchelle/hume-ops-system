
-- 1. Add reservation_type column to arketa_classes and daily_schedule
ALTER TABLE public.arketa_classes ADD COLUMN IF NOT EXISTS reservation_type TEXT;
ALTER TABLE public.daily_schedule ADD COLUMN IF NOT EXISTS reservation_type TEXT;

-- 2. Create the classification function
CREATE OR REPLACE FUNCTION public.classify_reservation_type(class_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  n TEXT;
BEGIN
  IF class_name IS NULL OR trim(class_name) = '' THEN
    RETURN NULL;
  END IF;
  n := lower(trim(class_name));

  -- === Personal Training ===
  IF n ~ 'personal training'
     OR n ~ 'personal program'
     OR n ~ 'duo training'
     OR n ~ 'find your duo'
     OR n ~ 'private boxing'
     OR n ~ 'private breathwork'
     OR n ~ 'private pilates'
     OR n ~ 'private yoga'
     OR n ~ 'private alignment'
  THEN RETURN 'Personal Training';
  END IF;

  -- === Private Treatment ===
  IF n ~ 'massage'
     OR n ~ 'acupuncture'
     OR n ~ 'reiki'
     OR n ~ 'bodywork'
     OR n ~ 'lymphatic treatment'
     OR n ~ 'physical therapy'
     OR (n ~ 'fascia release' AND n !~ 'yin yoga')
     OR n ~ 'stretch \+ percussive therapy'
     OR n ~ 'iv drip'
     OR n ~ 'vitamin shot'
     OR n ~ 'nad'
     OR n ~ 'ballancer'
     OR n ~ 'hyperbaric'
     OR n ~ 'express stretch'
     OR n ~ 'nutrition coaching'
     OR n ~ 'macro nutrition'
     OR n ~ 'endurance testing'
     OR n ~ 'metabolic testing'
     OR n ~ 'active alignment'
  THEN RETURN 'Private Treatment';
  END IF;

  -- === Staff Class ===
  IF n ~ '^staff ' OR n ~ 'staff class' OR n ~ '^teacher' OR n ~ 'teachers class'
  THEN RETURN 'Staff Class';
  END IF;

  -- === Gym Check Ins ===
  IF n ~ 'gym check in'
  THEN RETURN 'Gym Check Ins';
  END IF;

  -- === Workshops ===
  IF n ~ '^workshop'
     OR n ~ 'masterclass'
     OR n ~ 'human design'
     OR n ~ 'pelvic floor'
     OR n ~ 'inversion'
     OR n ~ 'handstand'
     OR n ~ 'prenatal'
     OR n ~ 'beginner''s guide'
     OR n ~ 'train smart'
     OR n ~ 'connect: the intersection'
     OR n ~ 'exploring the human'
     OR n ~ 'teacher workshop'
  THEN RETURN 'Workshops';
  END IF;

  -- === Events ===
  IF n ~ 'an evening with'
     OR n ~ 'book launch'
     OR n ~ 'movie night'
     OR n ~ 'tacos'
     OR n ~ 'sunset serve'
     OR n ~ 'saturday social'
     OR n ~ 'spring equinox'
     OR n ~ 'summer solstice'
     OR n ~ 'friday night lights'
     OR n ~ 'turkey trot'
     OR n ~ 'cacao tasting'
     OR n ~ 'sunchasers'
     OR n ~ 'pulse & presence'
     OR n ~ 'pulse \+ presence'
     OR n ~ 'upcycle'
     OR n ~ 'osea'
     OR n ~ 'new year''s'
  THEN RETURN 'Events';
  END IF;

  -- === Classes (broadest – checked last) ===
  IF n ~ '\(heated\)'
     OR n ~ '\(non-heated'
     OR n ~ 'reformer pilates'
     OR n ~ 'sound bath'
     OR n ~ '\(rooftop\)'
     OR n ~ '\(roof\)'
     OR n ~ '\(high roof\)'
     OR n ~ '\(ground floor'
     OR n ~ '\(impact'
     OR n ~ '\(gym floor'
     OR n ~ 'vinyasa'
     OR n ~ 'hatha'
     OR n ~ 'yin yoga'
     OR n ~ 'yin & sound'
     OR n ~ 'kundalini'
     OR n ~ 'mat pilates'
     OR n ~ 'warm mat pilates'
     OR n ~ 'hiit'
     OR n ~ 'circuit strength'
     OR n ~ 'boxing'
     OR n ~ 'shadowboxing'
     OR n ~ 'breathwork'
     OR n ~ 'meditation'
     OR n ~ 'dance'
     OR n ~ 'conditioning'
     OR n ~ 'qigong'
     OR n ~ 'signature sculpt'
     OR n ~ 'signature flow'
     OR n ~ 'signature yoga'
     OR n ~ 'morning practice'
     OR n ~ 'morning energy'
     OR n ~ 'flow into yin'
     OR n ~ 'core flow'
     OR n ~ 'core sculpt'
     OR n ~ 'core strength'
     OR n ~ 'power core'
     OR n ~ 'primal flow'
     OR n ~ 'animal flow'
     OR n ~ 'move & mobilize'
     OR n ~ 'mobility'
     OR n ~ 'dynamic stretch'
     OR n ~ 'static stretch'
     OR n ~ 'roll & release'
     OR n ~ 'functional movement'
     OR n ~ 'speed & agility'
     OR n ~ 'kettlebell'
     OR n ~ 'yoga nidra'
     OR n ~ 'yoga sculpt'
     OR n ~ 'yoga play'
     OR n ~ 'yoga for'
     OR n ~ 'rooted strength'
     OR n ~ 'focused strength'
     OR n ~ 'strength, mobility'
     OR n ~ 'run by hume'
     OR n ~ 'intro to'
     OR n ~ 'foundations of'
     OR n ~ 'fundamentals of'
     OR n ~ 'gentle movement'
     OR n ~ 'acupressure'
     OR n ~ 'beach bootcamp'
     OR n ~ 'full moon'
     OR n ~ 'sunrise rooftop'
     OR n ~ 'community'
     OR n ~ 'ecstatic dance'
     OR n ~ 'infrared'
     OR n ~ 'somatic'
     OR n ~ 'divine feminine'
     OR n ~ 'breath & sound'
     OR n ~ 'movement, meditation'
     OR n ~ 'spinal health'
     OR n ~ 'sunset practice'
     OR n ~ 'power & strength'
     OR n ~ 'heart-opening'
  THEN RETURN 'Classes';
  END IF;

  -- No match
  RETURN NULL;
END;
$$;

-- 3. Backfill existing arketa_classes
UPDATE public.arketa_classes SET reservation_type = classify_reservation_type(name);

-- 4. Update refresh_daily_schedule RPC to include reservation_type
CREATE OR REPLACE FUNCTION public.refresh_daily_schedule(p_schedule_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  inserted_count integer;
BEGIN
  DELETE FROM public.daily_schedule WHERE schedule_date = p_schedule_date;

  IF p_schedule_date < CURRENT_DATE OR p_schedule_date > CURRENT_DATE + 7 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.daily_schedule (
    class_id, schedule_date, start_time, end_time, class_name,
    max_capacity, total_booked, instructor, description, updated_at, canceled, reservation_type
  )
  SELECT
    c.external_id,
    c.class_date,
    c.start_time,
    c.start_time + COALESCE((c.duration_minutes || ' minutes')::interval, interval '0'),
    c.name,
    c.capacity,
    COALESCE(r.total_booked, 0)::integer,
    c.instructor_name,
    NULL,
    now(),
    COALESCE(c.is_cancelled, false),
    COALESCE(c.reservation_type, classify_reservation_type(c.name))
  FROM public.arketa_classes c
  LEFT JOIN (
    SELECT class_id, class_date,
           COUNT(*) FILTER (WHERE status IS DISTINCT FROM 'cancelled') AS total_booked
    FROM public.arketa_reservations_history
    GROUP BY class_id, class_date
  ) r ON c.external_id = r.class_id AND c.class_date = r.class_date
  WHERE c.class_date = p_schedule_date;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- 5. Update upsert_arketa_classes_from_staging to include reservation_type
CREATE OR REPLACE FUNCTION public.upsert_arketa_classes_from_staging(p_sync_batch_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  affected_count integer;
BEGIN
  INSERT INTO public.arketa_classes (
    external_id, class_date, start_time, duration_minutes, name, capacity,
    instructor_name, is_cancelled, description, booked_count, waitlist_count,
    status, room_name, raw_data, synced_at, location_id, location_name, is_deleted, updated_at_api, updated_at, reservation_type
  )
  SELECT
    s.external_id, s.class_date, s.start_time, s.duration_minutes, s.name, s.capacity,
    s.instructor_name, s.is_cancelled, s.description, s.booked_count, s.waitlist_count,
    s.status, s.room_name, s.raw_data, s.synced_at, s.location_id, s.location_name, s.is_deleted, s.updated_at_api, now(),
    classify_reservation_type(s.name)
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
    updated_at = now(),
    reservation_type = EXCLUDED.reservation_type;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  DELETE FROM public.arketa_classes_staging
  WHERE sync_batch_id = p_sync_batch_id;

  RETURN affected_count;
END;
$$;

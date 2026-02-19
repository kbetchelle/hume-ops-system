
-- Update refresh_daily_schedule to skip dates outside the 7-day window
CREATE OR REPLACE FUNCTION public.refresh_daily_schedule(p_schedule_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer;
BEGIN
  -- Always delete existing records for this date
  DELETE FROM public.daily_schedule WHERE schedule_date = p_schedule_date;

  -- Only insert if the date is within today..today+7
  IF p_schedule_date < CURRENT_DATE OR p_schedule_date > CURRENT_DATE + 7 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.daily_schedule (
    class_id,
    schedule_date,
    start_time,
    end_time,
    class_name,
    max_capacity,
    total_booked,
    instructor,
    description,
    updated_at,
    canceled
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
    COALESCE(c.is_cancelled, false)
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
$function$;

-- Clean up existing daily_schedule records outside the 7-day window (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedule') THEN
    DELETE FROM public.daily_schedule
    WHERE schedule_date < CURRENT_DATE OR schedule_date > CURRENT_DATE + 7;
  END IF;
END;
$$;

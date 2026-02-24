
-- Function to get the most common (mode) duration for a class name from historical data
CREATE OR REPLACE FUNCTION public.predict_class_duration(p_class_name text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT duration_minutes
  FROM arketa_classes
  WHERE name = p_class_name
    AND duration_minutes IS NOT NULL
  GROUP BY duration_minutes
  ORDER BY COUNT(*) DESC
  LIMIT 1;
$$;

-- Update refresh_daily_schedule to use predicted duration when actual is missing
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
    max_capacity, total_booked, instructor, description, updated_at, canceled, reservation_type, duration_minutes
  )
  SELECT
    c.external_id,
    c.class_date,
    c.start_time,
    c.start_time + (COALESCE(c.duration_minutes, predict_class_duration(c.name), 50) || ' minutes')::interval,
    c.name,
    c.capacity,
    COALESCE(r.total_booked, 0)::integer,
    c.instructor_name,
    NULL,
    now(),
    COALESCE(c.is_cancelled, false),
    COALESCE(c.reservation_type, classify_reservation_type(c.name)),
    COALESCE(c.duration_minutes, predict_class_duration(c.name))
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

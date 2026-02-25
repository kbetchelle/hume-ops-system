
-- Server-side aggregation of reservation counts, bypassing the 1000-row Supabase limit.
-- Uses classify_reservation_type() directly on class_name so it works even when
-- the class is missing from arketa_classes.
CREATE OR REPLACE FUNCTION public.aggregate_reservation_counts(p_date date)
RETURNS TABLE (
  total_gym_checkins bigint,
  total_class_checkins bigint,
  private_appointments bigint,
  total_reservations bigint,
  total_cancellations bigint,
  total_no_shows bigint,
  total_waitlisted bigint,
  checked_in_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*) FILTER (
      WHERE r.checked_in = true
        AND lower(trim(r.class_name)) = 'gym check in'
    ) AS total_gym_checkins,

    COUNT(*) FILTER (
      WHERE r.checked_in = true
        AND lower(trim(r.class_name)) != 'gym check in'
        AND COALESCE(
              c.reservation_type,
              classify_reservation_type(r.class_name)
            ) NOT IN ('Personal Training', 'Private Treatment')
    ) AS total_class_checkins,

    COUNT(*) FILTER (
      WHERE r.checked_in = true
        AND COALESCE(
              c.reservation_type,
              classify_reservation_type(r.class_name)
            ) IN ('Personal Training', 'Private Treatment')
    ) AS private_appointments,

    COUNT(*) AS total_reservations,

    COUNT(*) FILTER (WHERE r.status = 'cancelled') AS total_cancellations,

    COUNT(*) FILTER (WHERE r.status = 'no_show') AS total_no_shows,

    COUNT(*) FILTER (WHERE r.status = 'waitlisted') AS total_waitlisted,

    COUNT(*) FILTER (WHERE r.checked_in = true) AS checked_in_count

  FROM arketa_reservations_history r
  LEFT JOIN arketa_classes c
    ON c.external_id = r.class_id
   AND c.class_date = r.class_date
  WHERE r.class_date = p_date;
$$;

-- Fix existing stub classes: update their start_time from reservation history data
UPDATE arketa_classes c
SET start_time = sub.real_time,
    reservation_type = classify_reservation_type(c.name),
    updated_at = now()
FROM (
  SELECT rh.class_id, rh.class_date, MIN(rh.created_at_api) as real_time
  FROM arketa_reservations_history rh
  WHERE rh.created_at_api IS NOT NULL
    AND rh.class_date IS NOT NULL
  GROUP BY rh.class_id, rh.class_date
) sub
WHERE c.external_id = sub.class_id
  AND c.class_date = sub.class_date
  AND c.status = 'stub_from_res_sync'
  AND c.start_time = (c.class_date::text || 'T00:00:00+00')::timestamptz;

-- Refresh the daily schedule for today and next 7 days 
-- using individual date calls to avoid timeout
SELECT refresh_daily_schedule(CURRENT_DATE + i) FROM generate_series(0, 7) AS i;
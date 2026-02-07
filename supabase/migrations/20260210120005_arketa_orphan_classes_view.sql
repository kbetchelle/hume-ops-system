-- Orphan recovery: classes in arketa_classes with zero reservations in arketa_reservations_history.
-- See docs/ARKETA_ARCHITECTURE.md — used to find gaps and optionally trigger Tier 2 or Tier 3 fetch.

CREATE OR REPLACE VIEW public.arketa_orphan_classes AS
SELECT
  c.id,
  c.external_id AS class_id,
  c.name AS class_name,
  c.class_date,
  c.start_time,
  c.booked_count,
  c.is_cancelled
FROM public.arketa_classes c
LEFT JOIN (
  SELECT class_id, COUNT(*) AS reservation_count
  FROM public.arketa_reservations_history
  GROUP BY class_id
) r ON c.external_id = r.class_id
WHERE r.reservation_count IS NULL OR r.reservation_count = 0;

COMMENT ON VIEW public.arketa_orphan_classes IS 'Classes in catalog with no reservation records; use for orphan recovery (Tier 2/3 backfill).';

-- Add class_date to arketa_classes for Tier 2 lookups and orphan detection (see docs/ARKETA_ARCHITECTURE.md).
-- class_date is the calendar date of the class in Pacific (America/Los_Angeles), derived from start_time.

ALTER TABLE public.arketa_classes
  ADD COLUMN IF NOT EXISTS class_date date;

-- Backfill existing rows: class_date = calendar date in PST/PDT (convert from stored timestamptz)
UPDATE public.arketa_classes
SET class_date = (start_time AT TIME ZONE 'America/Los_Angeles')::date
WHERE class_date IS NULL AND start_time IS NOT NULL;

-- Index for date-range queries (Tier 2: distinct class_id where class_date between X and Y)
CREATE INDEX IF NOT EXISTS idx_arketa_classes_class_date ON public.arketa_classes(class_date);

COMMENT ON COLUMN public.arketa_classes.class_date IS 'Calendar date of the class in Pacific (PST/PDT); used for Tier 2 reservation fetch and orphan detection.';

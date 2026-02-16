-- Enhance daily_reports table for Manager Report Tool
-- Adds weather, feedback JSONB arrays, facility notes, class details, reservation metrics, sync tracking

-- Rename cafe_net_sales to cafe_sales for consistency
ALTER TABLE public.daily_reports
  RENAME COLUMN cafe_net_sales TO cafe_sales;

-- Add new columns (single ALTER with multiple ADD COLUMN for compatibility)
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS weather text,
  ADD COLUMN IF NOT EXISTS private_appointments int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_sales_membership numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_sales_other numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS positive_feedback_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS positive_feedback_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS negative_feedback_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS negative_feedback_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facility_notes_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facility_notes_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS crowd_comments_am text,
  ADD COLUMN IF NOT EXISTS crowd_comments_pm text,
  ADD COLUMN IF NOT EXISTS tour_notes text,
  ADD COLUMN IF NOT EXISTS tour_followup_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_notes text,
  ADD COLUMN IF NOT EXISTS cafe_notes text,
  ADD COLUMN IF NOT EXISTS other_notes text,
  ADD COLUMN IF NOT EXISTS class_details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_cancellations int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_no_shows int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_waitlisted int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS class_popularity jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructor_metrics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS member_metrics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'auto';

-- Add check constraint for sync_source (avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_reports_sync_source_check'
  ) THEN
    ALTER TABLE public.daily_reports
      ADD CONSTRAINT daily_reports_sync_source_check
      CHECK (sync_source IS NULL OR sync_source IN ('auto', 'manual'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.daily_reports.weather IS 'Weather condition from Open-Meteo API';
COMMENT ON COLUMN public.daily_reports.positive_feedback_am IS 'Positive member feedback from AM shift (JSONB array)';
COMMENT ON COLUMN public.daily_reports.positive_feedback_pm IS 'Positive member feedback from PM shift (JSONB array)';
COMMENT ON COLUMN public.daily_reports.class_details IS 'Class schedule with time, name, instructor, signups, waitlist';
COMMENT ON COLUMN public.daily_reports.sync_source IS 'How aggregation was triggered: auto or manual';

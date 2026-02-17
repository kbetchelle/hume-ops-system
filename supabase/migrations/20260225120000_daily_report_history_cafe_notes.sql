-- Add optional cafe_notes to daily_report_history for Concierge shift reports.
-- Aggregator will merge AM/PM cafe_notes into daily_reports.cafe_notes.

ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS cafe_notes text;

COMMENT ON COLUMN public.daily_report_history.cafe_notes IS 'Optional café notes from Concierge shift; merged into daily_reports.cafe_notes by aggregator';

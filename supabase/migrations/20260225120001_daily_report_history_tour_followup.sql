-- Add tour_followup_completed to daily_report_history for CSV import and Concierge form parity.
ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS tour_followup_completed boolean DEFAULT false;

COMMENT ON COLUMN public.daily_report_history.tour_followup_completed IS 'Whether tour follow-up was completed for this shift; from Concierge CSV or form';

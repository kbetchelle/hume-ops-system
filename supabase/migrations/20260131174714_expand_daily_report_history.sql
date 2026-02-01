-- Expand daily_report_history table with additional fields for concierge shift reports

ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS celebratory_events_na BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS system_issues_na BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS future_shift_notes_na BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS screenshot TEXT; -- base64 for deprecated Arketa screenshot

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_report_history_status 
  ON public.daily_report_history(status);

-- Update table comment
COMMENT ON TABLE public.daily_report_history IS 'Concierge shift reports with auto-save drafts, real-time collaboration, and API-aggregated data';

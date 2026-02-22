ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS meaningful_conversations text,
  ADD COLUMN IF NOT EXISTS tour_name text,
  ADD COLUMN IF NOT EXISTS notes_target_date date,
  ADD COLUMN IF NOT EXISTS notes_target_shift text;
-- Create concierge_drafts table for auto-save working copies
CREATE TABLE IF NOT EXISTS public.concierge_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  shift_time TEXT NOT NULL CHECK (shift_time IN ('AM', 'PM')),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated_by TEXT,
  last_updated_by_session TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(report_date, shift_time)
);

CREATE INDEX IF NOT EXISTS idx_concierge_drafts_date_shift 
  ON public.concierge_drafts(report_date, shift_time);
CREATE INDEX IF NOT EXISTS idx_concierge_drafts_updated 
  ON public.concierge_drafts(updated_at DESC);

-- Enable RLS
ALTER TABLE public.concierge_drafts ENABLE ROW LEVEL SECURITY;

-- Managers can manage all drafts
DROP POLICY IF EXISTS "Managers can manage all drafts" ON public.concierge_drafts;
CREATE POLICY "Managers can manage all drafts"
  ON public.concierge_drafts
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Concierges can read all drafts (for collaboration)
DROP POLICY IF EXISTS "Concierges can read drafts" ON public.concierge_drafts;
CREATE POLICY "Concierges can read drafts"
  ON public.concierge_drafts
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- Concierges can write drafts
DROP POLICY IF EXISTS "Concierges can insert drafts" ON public.concierge_drafts;
CREATE POLICY "Concierges can insert drafts"
  ON public.concierge_drafts
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge'));

DROP POLICY IF EXISTS "Concierges can update drafts" ON public.concierge_drafts;
CREATE POLICY "Concierges can update drafts"
  ON public.concierge_drafts
  FOR UPDATE
  USING (user_has_role(auth.uid(), 'concierge'));

DROP POLICY IF EXISTS "Concierges can delete drafts" ON public.concierge_drafts;
CREATE POLICY "Concierges can delete drafts"
  ON public.concierge_drafts
  FOR DELETE
  USING (user_has_role(auth.uid(), 'concierge'));

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_draft_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating version on changes
DROP TRIGGER IF EXISTS increment_draft_version_trigger ON public.concierge_drafts;
CREATE TRIGGER increment_draft_version_trigger
  BEFORE UPDATE ON public.concierge_drafts
  FOR EACH ROW
  EXECUTE FUNCTION increment_draft_version();

-- Add comment
COMMENT ON TABLE public.concierge_drafts IS 'Auto-save working copies of concierge shift reports with real-time collaboration support';

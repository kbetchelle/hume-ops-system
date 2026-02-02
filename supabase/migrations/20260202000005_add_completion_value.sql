-- Add completion_value column to store task-specific data
-- Migration created: 2026-02-02

-- Add completion_value column to checklist_template_completions
ALTER TABLE public.checklist_template_completions 
  ADD COLUMN IF NOT EXISTS completion_value TEXT;

-- Add comment explaining completion_value
COMMENT ON COLUMN public.checklist_template_completions.completion_value IS 
  'Stores task-specific completion data: text entries, photo URLs, signatures, etc.';

-- Add index for searching completion values
CREATE INDEX IF NOT EXISTS idx_checklist_completions_value 
  ON public.checklist_template_completions(completion_value) 
  WHERE completion_value IS NOT NULL;

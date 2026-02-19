
-- Add metadata JSONB column to all checklist item tables for task-type-specific configuration
-- (e.g., multiple choice options, select mode, etc.)
ALTER TABLE public.concierge_checklist_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.boh_checklist_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.cafe_checklist_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

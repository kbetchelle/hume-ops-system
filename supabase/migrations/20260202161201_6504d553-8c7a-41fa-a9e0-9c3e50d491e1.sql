-- Drop policies that depend on checklist_id
DROP POLICY IF EXISTS "Staff can view checklist items for their roles" ON public.checklist_items;
DROP POLICY IF EXISTS "Users can create their own completions" ON public.checklist_completions;

-- Remove columns that contain only null values
ALTER TABLE public.checklist_items 
  DROP COLUMN IF EXISTS checklist_id,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS class_trigger_minutes_after,
  DROP COLUMN IF EXISTS due_time;
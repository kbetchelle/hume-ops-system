-- Add metadata columns to checklist_template_items for mobile UI and task organization
-- Migration created: 2026-02-02

-- Add new columns to checklist_template_items
ALTER TABLE public.checklist_template_items 
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'checkbox',
  ADD COLUMN IF NOT EXISTS time_hint TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS is_high_priority BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS due_time TIME,
  ADD COLUMN IF NOT EXISTS label_spanish TEXT,
  ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS task_description TEXT,
  ADD COLUMN IF NOT EXISTS is_class_triggered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS class_trigger_minutes_after INTEGER;

-- Add comment explaining task_type values
COMMENT ON COLUMN public.checklist_template_items.task_type IS 
  'Type of task UI component: checkbox, photo, signature, free_response, short_entry, multiple_choice, yes_no, header, employee';

-- Add comment explaining time_hint format
COMMENT ON COLUMN public.checklist_template_items.time_hint IS 
  'Time range when task should be completed (e.g., "6:00 AM - 7:00 AM")';

-- Add comment explaining category
COMMENT ON COLUMN public.checklist_template_items.category IS 
  'Task category: Opening, Closing, Mid-Shift, or custom';

-- Add comment explaining color
COMMENT ON COLUMN public.checklist_template_items.color IS 
  'Visual indicator color: blue, green, red, orange, yellow, gray, etc.';

-- Create index on task_type for filtering
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_task_type 
  ON public.checklist_template_items(task_type);

-- Create index on time_hint for grouping
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_time_hint 
  ON public.checklist_template_items(time_hint);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_category 
  ON public.checklist_template_items(category);

-- Create index on is_high_priority for filtering
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_priority 
  ON public.checklist_template_items(is_high_priority) 
  WHERE is_high_priority = true;

-- Migrate existing item_text to task_description if not already set
UPDATE public.checklist_template_items 
SET task_description = item_text 
WHERE task_description IS NULL OR task_description = '';

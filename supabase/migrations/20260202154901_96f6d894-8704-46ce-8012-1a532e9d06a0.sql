-- Add missing columns to checklist_items table based on CSV structure
-- Note: The CSV uses template_id (referencing checklist_templates) not checklist_id (referencing checklists)
-- We'll add new columns and keep the existing structure flexible

-- Add new columns that are missing
ALTER TABLE public.checklist_items 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS task_description text,
ADD COLUMN IF NOT EXISTS is_class_triggered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS class_trigger_minutes_after integer,
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'checkbox',
ADD COLUMN IF NOT EXISTS label_spanish text,
ADD COLUMN IF NOT EXISTS required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS time_hint text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS color text DEFAULT 'gray',
ADD COLUMN IF NOT EXISTS is_high_priority boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS due_time text;

-- Make checklist_id nullable since CSV uses template_id
ALTER TABLE public.checklist_items ALTER COLUMN checklist_id DROP NOT NULL;

-- Make title nullable since CSV uses task_description
ALTER TABLE public.checklist_items ALTER COLUMN title DROP NOT NULL;

-- Create index on template_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_checklist_items_template_id ON public.checklist_items(template_id);
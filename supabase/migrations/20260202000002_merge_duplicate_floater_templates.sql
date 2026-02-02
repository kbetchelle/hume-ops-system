-- Merge duplicate FLOATER templates
-- Migration created: 2026-02-02
-- 
-- Merges:
-- - a3333333 (Weekend AM Opening) into a1111111 (Weekday AM Opening) → Combined AM Opening
-- - a4444444 (Early PM Closing) into a2222222 (Full PM Closing) → Combined PM Closing

-- STEP 1: Update the primary templates to be more generic
UPDATE public.checklist_templates 
SET name = 'Floater Opening - AM'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.checklist_templates 
SET name = 'Floater Closing - PM'
WHERE id = 'a2222222-2222-2222-2222-222222222222';

-- STEP 2: Merge checklist items from duplicate opening template
-- Update template_id for items from a3333333 to a1111111
UPDATE public.checklist_template_items
SET template_id = 'a1111111-1111-1111-1111-111111111111'
WHERE template_id = 'a3333333-3333-3333-3333-333333333333';

-- STEP 3: Merge checklist items from duplicate closing template
-- Update template_id for items from a4444444 to a2222222
UPDATE public.checklist_template_items
SET template_id = 'a2222222-2222-2222-2222-222222222222'
WHERE template_id = 'a4444444-4444-4444-4444-444444444444';

-- STEP 4: Update completions to reference the merged templates
UPDATE public.checklist_template_completions
SET template_id = 'a1111111-1111-1111-1111-111111111111'
WHERE template_id = 'a3333333-3333-3333-3333-333333333333';

UPDATE public.checklist_template_completions
SET template_id = 'a2222222-2222-2222-2222-222222222222'
WHERE template_id = 'a4444444-4444-4444-4444-444444444444';

-- STEP 5: Mark duplicate templates as inactive (soft delete)
UPDATE public.checklist_templates 
SET is_active = false,
    name = name || ' (MERGED - Do Not Use)'
WHERE id IN (
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444'
);

-- STEP 6: Add notes about merged items
-- For opening checklist, note that items may have different start times
-- For closing checklist, note that items may have different end times
COMMENT ON TABLE public.checklist_template_items IS 
  'Checklist template items. Note: Templates a1111111 and a2222222 contain merged items from duplicate templates (a3333333 and a4444444 respectively). Time-based tasks may have variations in due_time field.';

-- STEP 7: Log the merge operation
-- Create a simple audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.checklist_migrations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

INSERT INTO public.checklist_migrations_log (migration_name, notes)
VALUES (
  '20260202000002_merge_duplicate_floater_templates',
  'Merged duplicate FLOATER templates: a3333333→a1111111 (Opening AM) and a4444444→a2222222 (Closing PM). Original duplicate templates marked inactive.'
);

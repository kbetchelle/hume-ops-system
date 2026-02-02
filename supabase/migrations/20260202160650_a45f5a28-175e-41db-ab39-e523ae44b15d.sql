-- Drop checklist_template_completions first (it has FK to checklist_template_items)
DROP TABLE IF EXISTS public.checklist_template_completions;

-- Drop checklist_template_items
DROP TABLE IF EXISTS public.checklist_template_items;
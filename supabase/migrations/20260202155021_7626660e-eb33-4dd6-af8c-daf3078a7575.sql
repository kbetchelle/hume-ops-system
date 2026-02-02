-- Remove the FK constraint on template_id so we can import data with template_ids that may not exist yet
ALTER TABLE public.checklist_items DROP CONSTRAINT IF EXISTS checklist_items_template_id_fkey;
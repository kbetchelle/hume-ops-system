
-- Create missing checklist records for orphaned template_ids
INSERT INTO checklists (id, title, description, role, is_active, created_by)
SELECT 
  ci.template_id,
  COALESCE(
    (SELECT DISTINCT category FROM checklist_items WHERE template_id = ci.template_id AND category IS NOT NULL LIMIT 1),
    'Imported Checklist'
  ) as title,
  'Auto-created from orphaned checklist items' as description,
  'concierge'::app_role as role,
  true as is_active,
  (SELECT created_by FROM checklists LIMIT 1) as created_by
FROM (
  SELECT DISTINCT template_id 
  FROM checklist_items ci2
  WHERE NOT EXISTS (SELECT 1 FROM checklists c WHERE c.id = ci2.template_id)
  AND template_id IS NOT NULL
) ci;

-- Add foreign key constraint from checklist_items.template_id to checklists.id
ALTER TABLE public.checklist_items
ADD CONSTRAINT checklist_items_template_id_fkey
FOREIGN KEY (template_id) REFERENCES public.checklists(id) ON DELETE CASCADE;

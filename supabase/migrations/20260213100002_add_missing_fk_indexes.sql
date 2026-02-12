-- Add missing indexes on foreign key columns for better join/lookup performance.

CREATE INDEX IF NOT EXISTS idx_quick_link_groups_created_by
  ON public.quick_link_groups(created_by);

CREATE INDEX IF NOT EXISTS idx_resource_pages_created_by
  ON public.resource_pages(created_by);

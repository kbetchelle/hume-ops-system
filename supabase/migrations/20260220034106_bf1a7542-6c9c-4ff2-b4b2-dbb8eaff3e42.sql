-- 1. Allow cross-role resource search (20260220100000)
CREATE POLICY "authenticated_users_read_all_quick_link_groups"
  ON public.quick_link_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_read_all_quick_link_items"
  ON public.quick_link_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_read_published_resource_pages"
  ON public.resource_pages
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- 2. Disable toast backfill (20260226120000)
UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'toast_backfill';
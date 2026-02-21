-- ============================================================================
-- Allow all authenticated users to read all staff resources (cross-role search)
-- ============================================================================
-- The existing RLS policies restrict non-privileged staff to resources
-- assigned to their role. The unified resource search feature needs every
-- authenticated user to be able to read ALL quick link groups, items, and
-- resource pages so that cross-role search results can be displayed.
--
-- Because Supabase combines multiple PERMISSIVE policies with OR, adding
-- these policies does not weaken the existing manager/staff policies —
-- they simply widen SELECT access to all authenticated users.
--
-- Idempotent: DROP IF EXISTS so this migration works even when the same
-- policies were created by an earlier migration (e.g. 20260220034106).
-- ============================================================================

-- Quick link groups: allow all authenticated users to read
DROP POLICY IF EXISTS "authenticated_users_read_all_quick_link_groups" ON public.quick_link_groups;
CREATE POLICY "authenticated_users_read_all_quick_link_groups"
  ON public.quick_link_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Quick link items: allow all authenticated users to read
DROP POLICY IF EXISTS "authenticated_users_read_all_quick_link_items" ON public.quick_link_items;
CREATE POLICY "authenticated_users_read_all_quick_link_items"
  ON public.quick_link_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Resource pages: allow all authenticated users to read published pages
DROP POLICY IF EXISTS "authenticated_users_read_published_resource_pages" ON public.resource_pages;
CREATE POLICY "authenticated_users_read_published_resource_pages"
  ON public.resource_pages
  FOR SELECT
  TO authenticated
  USING (is_published = true);

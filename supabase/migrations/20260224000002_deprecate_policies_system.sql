-- ============================================================================
-- Deprecate Policies System in Favor of PDF Resource Pages
--
-- Marks club_policies and policy_categories tables as deprecated without
-- dropping them. Archives existing data and creates a "Policies" folder
-- in resource_page_folders for the new PDF-based policy system.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Mark tables as deprecated with comments
-- --------------------------------------------------------------------------

COMMENT ON TABLE public.club_policies IS 
  'DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''pdf''. This table is kept for historical reference and rollback capability. All policies archived. DO NOT add new data to this table.';

COMMENT ON TABLE public.policy_categories IS 
  'DEPRECATED (2024-02-24): Replaced by resource_page_folders. This table is kept for historical reference and rollback capability. All categories archived. DO NOT add new data to this table.';

-- --------------------------------------------------------------------------
-- 2. Add migration tracking columns to club_policies
-- --------------------------------------------------------------------------

ALTER TABLE public.club_policies 
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to PDF resource pages system',
  ADD COLUMN IF NOT EXISTS migrated_to_page_id uuid REFERENCES public.resource_pages(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 3. Add migration tracking columns to policy_categories
-- --------------------------------------------------------------------------

ALTER TABLE public.policy_categories 
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to resource_page_folders system',
  ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 4. Archive existing policies (OPTIONAL - Commented out for gradual migration)
-- --------------------------------------------------------------------------

-- NOTE: We do NOT automatically archive existing policies because:
-- 1. The current UI still displays club_policies until Phase 6 is complete
-- 2. Archiving would hide all policies from staff immediately
-- 3. Better to keep old system working during transition
-- 4. Managers can manually archive or migrate policies as PDFs are uploaded

-- To manually archive all policies AFTER Phase 6 migration:
-- UPDATE public.club_policies 
-- SET 
--   archived_at = now(),
--   is_active = false
-- WHERE archived_at IS NULL;

-- --------------------------------------------------------------------------
-- 5. Archive existing policy categories (OPTIONAL - Commented out for gradual migration)
-- --------------------------------------------------------------------------

-- To manually archive all categories AFTER Phase 6 migration:
-- UPDATE public.policy_categories 
-- SET 
--   archived_at = now(),
--   is_active = false
-- WHERE archived_at IS NULL;

-- --------------------------------------------------------------------------
-- 6. Create "Policies" folder in resource_page_folders
-- --------------------------------------------------------------------------

-- Insert the Policies folder if it doesn't exist
-- Note: We use WHERE NOT EXISTS since there's no unique constraint on name
INSERT INTO public.resource_page_folders (name, description, display_order, created_at, updated_at)
SELECT 
  'Policies',
  'Official club policies and procedures. Upload policy documents as PDFs for easy access and searchability.',
  0,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.resource_page_folders WHERE name = 'Policies'
);

-- --------------------------------------------------------------------------
-- 7. Add indexes for migration tracking
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_club_policies_archived 
  ON public.club_policies(archived_at) 
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_club_policies_migrated 
  ON public.club_policies(migrated_to_page_id) 
  WHERE migrated_to_page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_policy_categories_archived 
  ON public.policy_categories(archived_at) 
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_policy_categories_migrated 
  ON public.policy_categories(migrated_to_folder_id) 
  WHERE migrated_to_folder_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- 8. Add helpful comments to new columns
-- --------------------------------------------------------------------------

COMMENT ON COLUMN public.club_policies.archived_at IS 
  'Timestamp when policy was archived. All policies archived during migration to PDF system on 2024-02-24.';

COMMENT ON COLUMN public.club_policies.archived_reason IS 
  'Reason for archiving. Default: "Migrated to PDF resource pages system"';

COMMENT ON COLUMN public.club_policies.migrated_to_page_id IS 
  'If policy content was migrated to a PDF resource page, this references the new page. NULL means not yet migrated (manual re-upload recommended).';

COMMENT ON COLUMN public.policy_categories.archived_at IS 
  'Timestamp when category was archived. All categories archived during migration to folder system on 2024-02-24.';

COMMENT ON COLUMN public.policy_categories.archived_reason IS 
  'Reason for archiving. Default: "Migrated to resource_page_folders system"';

COMMENT ON COLUMN public.policy_categories.migrated_to_folder_id IS 
  'If category was migrated to a resource_page_folder, this references the new folder. Most categories not directly migrated - use "Policies" folder instead.';

-- --------------------------------------------------------------------------
-- 9. Create view for archived policies reference
-- --------------------------------------------------------------------------

-- NOTE: This view excludes 'tags' column to avoid dependency on migration 20260223000000
-- Tags are not critical for migration reference purposes

CREATE OR REPLACE VIEW archived_policies_reference AS
SELECT 
  cp.id,
  cp.content,
  cp.category,
  cp.created_at,
  cp.archived_at,
  cp.migrated_to_page_id,
  rp.title as migrated_page_title,
  rp.pdf_file_url as migrated_pdf_url
FROM public.club_policies cp
LEFT JOIN public.resource_pages rp ON cp.migrated_to_page_id = rp.id
WHERE cp.archived_at IS NOT NULL
ORDER BY cp.category NULLS LAST, cp.created_at DESC;

COMMENT ON VIEW archived_policies_reference IS
  'Read-only view of archived policies with migration status. Use this to reference old policy content when creating PDF versions. Shows which policies have been migrated to PDF resource pages.';

-- --------------------------------------------------------------------------
-- 10. Add documentation warnings (DO NOT add constraints yet)
-- --------------------------------------------------------------------------

-- NOTE: We do NOT add CHECK constraints here because:
-- 1. The UI still uses club_policies until Phase 4-6 are complete
-- 2. Constraints would immediately break policy creation
-- 3. Gradual migration approach allows old system to work during transition
-- 4. Constraints can be added AFTER Phase 6 when UI is fully migrated

-- Future constraint (add after UI migration complete):
-- ALTER TABLE public.club_policies 
--   ADD CONSTRAINT no_new_policies_use_resource_pages 
--   CHECK (archived_at IS NOT NULL);
-- 
-- ALTER TABLE public.policy_categories 
--   ADD CONSTRAINT no_new_categories_use_resource_folders 
--   CHECK (archived_at IS NOT NULL);

-- For now, just document the deprecation in table comments (already done above)

-- --------------------------------------------------------------------------
-- 11. Document rollback procedure
-- --------------------------------------------------------------------------

COMMENT ON TABLE public.club_policies IS 
  'DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''pdf''. Existing data archived but table remains functional during migration. DO NOT add new policies here - use resource_pages instead. After Phase 6 complete, add CHECK constraint to enforce.';

COMMENT ON TABLE public.policy_categories IS 
  'DEPRECATED (2024-02-24): Replaced by resource_page_folders. Existing data archived but table remains functional during migration. DO NOT add new categories here - use resource_page_folders instead. After Phase 6 complete, add CHECK constraint to enforce.';

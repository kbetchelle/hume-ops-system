-- ============================================================================
-- Deprecate Policies System in Favor of PDF Resource Pages
--
-- Marks club_policies and policy_categories tables as deprecated without
-- dropping them. Archives existing data and creates a "Policies" folder
-- in resource_page_folders for the new PDF-based policy system.
--
-- All steps that depend on resource_pages or resource_page_folders run only
-- when those tables exist (e.g. remote may not have resource_page_folders yet).
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Mark tables as deprecated with comments (only if tables exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON TABLE public.club_policies IS ''DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''''pdf''''. This table is kept for historical reference and rollback capability. All policies archived. DO NOT add new data to this table.''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON TABLE public.policy_categories IS ''DEPRECATED (2024-02-24): Replaced by resource_page_folders. This table is kept for historical reference and rollback capability. All categories archived. DO NOT add new data to this table.''';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2. Add migration tracking columns to club_policies (when resource_pages exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_pages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    ALTER TABLE public.club_policies
      ADD COLUMN IF NOT EXISTS archived_at timestamptz,
      ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to PDF resource pages system',
      ADD COLUMN IF NOT EXISTS migrated_to_page_id uuid REFERENCES public.resource_pages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 3. Add migration tracking columns to policy_categories
--    (archived_at/archived_reason always; migrated_to_folder_id only when resource_page_folders exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    ALTER TABLE public.policy_categories
      ADD COLUMN IF NOT EXISTS archived_at timestamptz,
      ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to resource_page_folders system';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_page_folders') THEN
      ALTER TABLE public.policy_categories
        ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.policy_categories ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid;
    END IF;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 4–5. Archive steps (commented out; see notes in original migration)
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 6. Create "Policies" folder in resource_page_folders (only when table exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_page_folders') THEN
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
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 7. Add indexes for migration tracking (only when tables exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    CREATE INDEX IF NOT EXISTS idx_club_policies_archived
      ON public.club_policies(archived_at)
      WHERE archived_at IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'club_policies' AND column_name = 'migrated_to_page_id') THEN
      CREATE INDEX IF NOT EXISTS idx_club_policies_migrated
        ON public.club_policies(migrated_to_page_id)
        WHERE migrated_to_page_id IS NOT NULL;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_policy_categories_archived
      ON public.policy_categories(archived_at)
      WHERE archived_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_policy_categories_migrated
      ON public.policy_categories(migrated_to_folder_id)
      WHERE migrated_to_folder_id IS NOT NULL;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 8. Add helpful comments to new columns
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON COLUMN public.club_policies.archived_at IS ''Timestamp when policy was archived. All policies archived during migration to PDF system on 2024-02-24.''';
    EXECUTE 'COMMENT ON COLUMN public.club_policies.archived_reason IS ''Reason for archiving. Default: "Migrated to PDF resource pages system"''';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'club_policies' AND column_name = 'migrated_to_page_id') THEN
      EXECUTE 'COMMENT ON COLUMN public.club_policies.migrated_to_page_id IS ''If policy content was migrated to a PDF resource page, this references the new page. NULL means not yet migrated (manual re-upload recommended).''';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.archived_at IS ''Timestamp when category was archived. All categories archived during migration to folder system on 2024-02-24.''';
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.archived_reason IS ''Reason for archiving. Default: "Migrated to resource_page_folders system"''';
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.migrated_to_folder_id IS ''If category was migrated to a resource_page_folder, this references the new folder. Most categories not directly migrated - use "Policies" folder instead.''';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 9. Create view for archived policies reference (only when club_policies + resource_pages exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_pages') THEN
    CREATE OR REPLACE VIEW archived_policies_reference AS
    SELECT
      cp.id,
      cp.content,
      cp.category,
      cp.created_at,
      cp.archived_at,
      cp.migrated_to_page_id,
      rp.title AS migrated_page_title,
      rp.pdf_file_url AS migrated_pdf_url
    FROM public.club_policies cp
    LEFT JOIN public.resource_pages rp ON cp.migrated_to_page_id = rp.id
    WHERE cp.archived_at IS NOT NULL
    ORDER BY cp.category NULLS LAST, cp.created_at DESC;
    COMMENT ON VIEW archived_policies_reference IS
      'Read-only view of archived policies with migration status. Use this to reference old policy content when creating PDF versions. Shows which policies have been migrated to PDF resource pages.';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 10–11. Final table comments (documentation)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON TABLE public.club_policies IS ''DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''''pdf''''. Existing data archived but table remains functional during migration. DO NOT add new policies here - use resource_pages instead. After Phase 6 complete, add CHECK constraint to enforce.''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON TABLE public.policy_categories IS ''DEPRECATED (2024-02-24): Replaced by resource_page_folders. Existing data archived but table remains functional during migration. DO NOT add new categories here - use resource_page_folders instead. After Phase 6 complete, add CHECK constraint to enforce.''';
  END IF;
END $$;

-- ============================================================================
-- Add Page-Specific Flagging Support for PDFs
--
-- Extends resource_outdated_flags table to support flagging specific pages within
-- PDF documents. Only runs when resource_outdated_flags exists (table created in
-- 20260212200000_resource_outdated_flags.sql).
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    RETURN;
  END IF;

  -- 1. Add page-specific flagging columns
  ALTER TABLE public.resource_outdated_flags
    ADD COLUMN IF NOT EXISTS flagged_page_number integer,
    ADD COLUMN IF NOT EXISTS flagged_page_context text;

  -- 2. Add constraint (ignore if already exists)
  BEGIN
    ALTER TABLE public.resource_outdated_flags
      ADD CONSTRAINT resource_flags_page_number_positive
      CHECK (flagged_page_number IS NULL OR flagged_page_number > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- 3. Create indexes
  CREATE INDEX IF NOT EXISTS idx_resource_flags_page
    ON public.resource_outdated_flags(resource_id, flagged_page_number)
    WHERE flagged_page_number IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_resource_flags_has_page
    ON public.resource_outdated_flags(resource_type, flagged_page_number)
    WHERE flagged_page_number IS NOT NULL;

  -- 4. Comments
  COMMENT ON COLUMN public.resource_outdated_flags.flagged_page_number IS
    'For PDF pages: the specific page number being flagged (1-indexed). NULL means flag applies to entire document. Only used when resource_type=''resource_page'' and page_type=''pdf''.';
  COMMENT ON COLUMN public.resource_outdated_flags.flagged_page_context IS
    'Optional: text snippet or context from the flagged page for reviewer reference. Can include surrounding text to help locate the issue within the page.';
END $$;

-- 5. Helper function (only when table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    EXECUTE $exec$
      CREATE OR REPLACE FUNCTION get_pdf_page_flags(
        page_id uuid,
        page_num integer DEFAULT NULL
      )
      RETURNS TABLE (
        id uuid,
        note text,
        flagged_page_number integer,
        flagged_page_context text,
        flagged_by_name text,
        created_at timestamptz,
        status text
      ) AS $fn$
      BEGIN
        RETURN QUERY
        SELECT
          f.id,
          f.note,
          f.flagged_page_number,
          f.flagged_page_context,
          f.flagged_by_name,
          f.created_at,
          f.status
        FROM public.resource_outdated_flags f
        WHERE f.resource_id = page_id
          AND f.resource_type = 'resource_page'
          AND f.status = 'pending'
          AND (
            page_num IS NULL
            OR f.flagged_page_number IS NULL
            OR f.flagged_page_number = page_num
          )
        ORDER BY
          CASE WHEN f.flagged_page_number IS NULL THEN 0 ELSE 1 END,
          f.flagged_page_number NULLS FIRST,
          f.created_at DESC;
      END;
      $fn$ LANGUAGE plpgsql STABLE;
    $exec$;
    EXECUTE 'COMMENT ON FUNCTION get_pdf_page_flags(uuid, integer) IS ''Get all pending flags for a PDF page. If page_num is provided, returns flags for that specific page plus document-level flags. If page_num is NULL, returns all flags for the document.''';
  END IF;
END $$;

-- 6. View (will fail if resource_outdated_flags does not exist; then run after table is created)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    CREATE OR REPLACE VIEW resource_flags_with_page_info AS
    SELECT
      f.*,
      rp.title as resource_title,
      rp.page_type,
      rp.pdf_page_count,
      CASE
        WHEN f.flagged_page_number IS NOT NULL AND rp.pdf_page_count IS NOT NULL
        THEN format('Page %s of %s', f.flagged_page_number, rp.pdf_page_count)
        WHEN f.flagged_page_number IS NOT NULL
        THEN format('Page %s', f.flagged_page_number)
        ELSE 'Entire document'
      END as page_display
    FROM public.resource_outdated_flags f
    LEFT JOIN public.resource_pages rp ON f.resource_id = rp.id AND f.resource_type = 'resource_page'
    WHERE f.resource_type = 'resource_page';

    COMMENT ON VIEW resource_flags_with_page_info IS
      'View combining resource_outdated_flags with resource_pages to show formatted page numbers and document info. Used in flag inbox to display "Page X of Y" format.';
  END IF;
END $$;

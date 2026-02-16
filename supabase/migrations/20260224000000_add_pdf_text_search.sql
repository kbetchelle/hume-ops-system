-- ============================================================================
-- Add PDF Full-Text Search Support
--
-- Enhances resource_pages table with better text extraction and search
-- capabilities for PDF documents. Adds trigger to normalize search text
-- and ensures proper indexing for full-text search.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Verify search_text column exists (should be from builder migration)
-- --------------------------------------------------------------------------

-- This column should already exist from 20260221000000_upgrade_resource_pages_for_builder.sql
-- But we'll add it conditionally just in case
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_pages' 
    AND column_name = 'search_text'
  ) THEN
    ALTER TABLE public.resource_pages ADD COLUMN search_text text;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2. Create function to normalize and clean PDF search text
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION extract_pdf_search_text()
RETURNS trigger AS $$
BEGIN
  -- For PDF pages, search_text is populated by application during upload
  -- This trigger ensures it's normalized and cleaned for better search results
  IF NEW.page_type = 'pdf' AND NEW.search_text IS NOT NULL THEN
    -- Normalize whitespace: replace multiple spaces/newlines with single space
    NEW.search_text := regexp_replace(NEW.search_text, '\s+', ' ', 'g');
    
    -- Trim leading and trailing whitespace
    NEW.search_text := trim(NEW.search_text);
    
    -- Remove any control characters
    NEW.search_text := regexp_replace(NEW.search_text, '[\x00-\x1F\x7F]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- 3. Create trigger to clean search text on insert/update
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_pdf_search_text ON public.resource_pages;

CREATE TRIGGER update_pdf_search_text
  BEFORE INSERT OR UPDATE OF search_text, page_type ON public.resource_pages
  FOR EACH ROW
  EXECUTE FUNCTION extract_pdf_search_text();

-- --------------------------------------------------------------------------
-- 4. Ensure full-text search index exists
-- --------------------------------------------------------------------------

-- Check if index exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'resource_pages' 
    AND indexname = 'idx_resource_pages_search'
  ) THEN
    CREATE INDEX idx_resource_pages_search 
      ON public.resource_pages 
      USING GIN(to_tsvector('english', COALESCE(search_text, '')));
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 5. Add helpful comments
-- --------------------------------------------------------------------------

COMMENT ON COLUMN public.resource_pages.search_text IS 
  'Plain text extracted from PDF content (via pdfjs-dist) or TipTap JSON. Used for full-text search. Normalized and cleaned by trigger.';

COMMENT ON FUNCTION extract_pdf_search_text() IS
  'Normalizes and cleans search_text for PDF pages: removes extra whitespace, control characters, and trims text for better search quality.';

COMMENT ON TRIGGER update_pdf_search_text ON public.resource_pages IS
  'Automatically normalizes search_text before insert/update to ensure consistent and clean full-text search data.';

-- --------------------------------------------------------------------------
-- 6. Update any existing PDFs to have normalized search text
-- --------------------------------------------------------------------------

UPDATE public.resource_pages
SET search_text = trim(regexp_replace(regexp_replace(COALESCE(search_text, ''), '\s+', ' ', 'g'), '[\x00-\x1F\x7F]', '', 'g'))
WHERE page_type = 'pdf' AND search_text IS NOT NULL;

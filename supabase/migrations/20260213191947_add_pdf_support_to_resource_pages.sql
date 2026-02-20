-- ============================================================================
-- Add PDF Support to Resource Pages
--
-- Extends resource_pages table to support PDF page types alongside builder pages
-- PDFs share the same metadata model (title, roles, folder, tags, published)
-- but store file references instead of TipTap JSON content
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Add PDF-specific columns to resource_pages
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'builder'
    CHECK (page_type IN ('builder', 'pdf')),
  ADD COLUMN IF NOT EXISTS pdf_file_url text,
  ADD COLUMN IF NOT EXISTS pdf_file_path text,
  ADD COLUMN IF NOT EXISTS pdf_file_size integer,
  ADD COLUMN IF NOT EXISTS pdf_original_filename text,
  ADD COLUMN IF NOT EXISTS pdf_page_count integer;

-- --------------------------------------------------------------------------
-- 2. Create index for filtering by type
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resource_pages_type ON public.resource_pages(page_type);

-- --------------------------------------------------------------------------
-- 3. Add column comments explaining the design
-- --------------------------------------------------------------------------

COMMENT ON COLUMN public.resource_pages.page_type IS 
  'Type of page: builder (TipTap JSON content) or pdf (uploaded PDF file). Defaults to builder for existing pages.';

COMMENT ON COLUMN public.resource_pages.pdf_file_url IS 
  'Public URL for PDF files, stored in resource-page-assets bucket under pdfs/ prefix. Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_file_path IS 
  'Storage path for PDF file deletion/replacement (e.g., pdfs/abc123.pdf). Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_file_size IS 
  'File size in bytes for display (e.g., "2.3 MB"). Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_original_filename IS 
  'Original filename from upload for download links. Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_page_count IS 
  'Number of pages in PDF (extracted on upload). Only used when page_type=pdf.';

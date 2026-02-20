-- ============================================================================
-- Upgrade resource_pages for Page Builder (Phase 1)
--
-- Creates: resource_page_folders, resource_page_editors, resource_page_reads
-- Alters:  resource_pages (new columns, FK, indexes, data migration)
-- Storage: resource-page-assets bucket
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Create resource_page_folders table (must exist before FK from resource_pages)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  parent_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_resource_page_folders_updated_at ON public.resource_page_folders;
CREATE TRIGGER update_resource_page_folders_updated_at
  BEFORE UPDATE ON public.resource_page_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.resource_page_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS folders_manager_all ON public.resource_page_folders;
CREATE POLICY folders_manager_all ON public.resource_page_folders
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS folders_staff_select ON public.resource_page_folders;
CREATE POLICY folders_staff_select ON public.resource_page_folders
  FOR SELECT USING (auth.role() = 'authenticated');

-- --------------------------------------------------------------------------
-- 2. Alter resource_pages — add new columns
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD COLUMN content_json jsonb,
  ADD COLUMN folder_id uuid,
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN search_text text,
  ADD COLUMN cover_image_url text,
  ADD COLUMN display_order integer DEFAULT 0,
  ADD COLUMN last_edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 3. Add FK from resource_pages.folder_id -> resource_page_folders
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD CONSTRAINT fk_resource_pages_folder
  FOREIGN KEY (folder_id) REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 4. Backfill content_json and search_text from existing HTML content
-- --------------------------------------------------------------------------

UPDATE public.resource_pages
SET content_json = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', COALESCE(content, ''))
      )
    )
  )
),
search_text = regexp_replace(COALESCE(content, ''), '<[^>]*>', '', 'g');

-- --------------------------------------------------------------------------
-- 5. Create indexes on resource_pages new columns
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resource_pages_folder ON public.resource_pages(folder_id);
CREATE INDEX IF NOT EXISTS idx_resource_pages_tags ON public.resource_pages USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resource_pages_search ON public.resource_pages USING GIN(to_tsvector('english', COALESCE(search_text, '')));
CREATE INDEX IF NOT EXISTS idx_resource_pages_display_order ON public.resource_pages(folder_id, display_order);

-- --------------------------------------------------------------------------
-- 6. Create resource_page_editors table (delegated editing)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_editors ENABLE ROW LEVEL SECURITY;

-- Managers can manage editors
DROP POLICY IF EXISTS editors_manager_all ON public.resource_page_editors;
CREATE POLICY editors_manager_all ON public.resource_page_editors
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

-- Delegated editors can see their own grants
DROP POLICY IF EXISTS editors_own_select ON public.resource_page_editors;
CREATE POLICY editors_own_select ON public.resource_page_editors
  FOR SELECT USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 7. New RLS policy on resource_pages: delegated editors can UPDATE
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS resource_pages_editor_update ON public.resource_pages;
CREATE POLICY resource_pages_editor_update ON public.resource_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.resource_page_editors
      WHERE page_id = resource_pages.id AND user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 8. Create resource_page_reads table (read receipts)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_reads ENABLE ROW LEVEL SECURITY;

-- Staff can insert their own read receipts
DROP POLICY IF EXISTS reads_own_insert ON public.resource_page_reads;
CREATE POLICY reads_own_insert ON public.resource_page_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can see their own reads
DROP POLICY IF EXISTS reads_own_select ON public.resource_page_reads;
CREATE POLICY reads_own_select ON public.resource_page_reads
  FOR SELECT USING (user_id = auth.uid());

-- Managers can see all reads (for the read receipt dashboard)
DROP POLICY IF EXISTS reads_manager_select ON public.resource_page_reads;
CREATE POLICY reads_manager_select ON public.resource_page_reads
  FOR SELECT USING (public.is_manager_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_page_reads_page ON public.resource_page_reads(page_id);
CREATE INDEX IF NOT EXISTS idx_page_reads_user ON public.resource_page_reads(user_id);

-- --------------------------------------------------------------------------
-- 9. Create storage bucket for page assets (images, etc.)
-- --------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-page-assets', 'resource-page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects in this bucket
DROP POLICY IF EXISTS resource_assets_insert ON storage.objects;
CREATE POLICY resource_assets_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS resource_assets_select ON storage.objects;
CREATE POLICY resource_assets_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS resource_assets_delete ON storage.objects;
CREATE POLICY resource_assets_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resource-page-assets' AND public.is_manager_or_admin(auth.uid())
  );

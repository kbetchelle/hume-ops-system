# Pages Builder — Implementation Plan

## Project Summary

Replace the existing simple Resource Pages feature with a full block-based page builder (Notion-style) using TipTap editor. Pages support text blocks, images, link cards, optional 2-column layouts, drag-and-drop reordering, folders + tags organization, role assignment with FoH/BoH/All quick toggles, delegated editing, read receipts, PDF export, and full-text search.

## Architecture Decisions

- **Editor**: TipTap (ProseMirror-based) — replaces the custom `contentEditable` / `document.execCommand` RichTextEditor
- **Content storage**: TipTap JSON (stored as `jsonb` in Postgres) — replaces raw HTML `text` column
- **Image storage**: New Supabase Storage bucket `resource-page-assets` — reuses the `compressPhoto` utility (1024px / 250KB)
- **Block types**: Paragraph, Heading (H1/H2/H3), Image, Link Card, Horizontal Divider, Bullet List, Ordered List, Two-Column Layout
- **Existing table**: `resource_pages` will be altered in place (add columns, migrate content)

## Tech Stack Context

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 + TypeScript 5.8 + Vite 5 |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| State | TanStack React Query v5 |
| UI | shadcn/ui + Radix + Tailwind CSS 3 |
| Icons | lucide-react |
| Drag & Drop | @dnd-kit (already installed) |
| Forms | react-hook-form + Zod |
| Sanitization | DOMPurify |
| Toasts | Sonner |

## Existing Files That Will Be Modified

| File | Change |
|------|--------|
| `src/hooks/useResourcePages.ts` | Rewrite — new schema, new queries, add folder/tag support |
| `src/hooks/useResourceSearch.ts` | Update — index TipTap JSON content for full-text search |
| `src/hooks/useStaffResources.ts` | Update — re-export new hooks |
| `src/hooks/useResourceFlags.ts` | Update — add `"resource_page"` type support (already exists, verify) |
| `src/components/manager/staff-resources/ResourcePagesManagement.tsx` | Rewrite — new page list with folders, new editor dialog/route |
| `src/components/manager/staff-resources/RoleAssignmentCheckboxes.tsx` | Update — add FoH/BoH/All quick toggles |
| `src/components/staff-resources/ResourcePagesTab.tsx` | Rewrite — folder browsing, full-screen reading view |
| `src/components/staff-resources/StaffResourcesView.tsx` | Update — integrate new pages view |
| `src/components/manager/StaffResourcesManager.tsx` | Update — integrate new pages management tab |
| `src/components/layout/DashboardLayout.tsx` | Update — add page reading route to nav |
| `src/components/shared/RichTextEditor.tsx` | Keep for backward compat (announcements, quick links) — new TipTap editor is a separate component |
| `src/App.tsx` | Add new routes for page editor, page reading view |
| `src/lib/compressPhoto.ts` | No changes — reuse as-is |

---

## Phase 1: Database Schema & Storage Infrastructure

**Goal**: Set up all database tables, storage buckets, RLS policies, and indexes needed by every subsequent phase. Nothing renders yet — this is pure backend foundation.

### 1A. Supabase Migration — Alter `resource_pages` Table

Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_upgrade_resource_pages_for_builder.sql`

**Alter the existing `resource_pages` table:**

```sql
-- Add new columns
ALTER TABLE public.resource_pages
  ADD COLUMN content_json jsonb,              -- TipTap JSON document (replaces HTML content)
  ADD COLUMN folder_id uuid,                  -- FK to resource_page_folders
  ADD COLUMN tags text[] DEFAULT '{}',        -- Array of tag strings
  ADD COLUMN search_text text,                -- Plaintext extracted from content_json for full-text search
  ADD COLUMN cover_image_url text,            -- Optional cover/thumbnail for list view
  ADD COLUMN display_order integer DEFAULT 0, -- Ordering within folder
  ADD COLUMN last_edited_by uuid REFERENCES auth.users(id);

-- Migrate existing HTML content: store original HTML in content_json as a fallback wrapper
-- (Phase 1 stores it as a migration marker; Phase 3 editor will save proper TipTap JSON)
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

-- Create indexes
CREATE INDEX idx_resource_pages_folder ON public.resource_pages(folder_id);
CREATE INDEX idx_resource_pages_tags ON public.resource_pages USING GIN(tags);
CREATE INDEX idx_resource_pages_search ON public.resource_pages USING GIN(to_tsvector('english', COALESCE(search_text, '')));
CREATE INDEX idx_resource_pages_display_order ON public.resource_pages(folder_id, display_order);
```

### 1B. Create `resource_page_folders` Table

```sql
CREATE TABLE public.resource_page_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  parent_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from resource_pages
ALTER TABLE public.resource_pages
  ADD CONSTRAINT fk_resource_pages_folder
  FOREIGN KEY (folder_id) REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_resource_page_folders_updated_at
  BEFORE UPDATE ON public.resource_page_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.resource_page_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY folders_manager_all ON public.resource_page_folders
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY folders_staff_select ON public.resource_page_folders
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 1C. Create `resource_page_editors` Table (Delegated Editing)

```sql
CREATE TABLE public.resource_page_editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_editors ENABLE ROW LEVEL SECURITY;

-- Managers can manage editors
CREATE POLICY editors_manager_all ON public.resource_page_editors
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

-- Delegated editors can see their own grants
CREATE POLICY editors_own_select ON public.resource_page_editors
  FOR SELECT USING (user_id = auth.uid());
```

**Update RLS on `resource_pages`** — allow delegated editors to UPDATE:

```sql
-- New policy: delegated editors can update pages they're assigned to
CREATE POLICY resource_pages_editor_update ON public.resource_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.resource_page_editors
      WHERE page_id = resource_pages.id AND user_id = auth.uid()
    )
  );
```

### 1D. Create `resource_page_reads` Table (Read Receipts)

```sql
CREATE TABLE public.resource_page_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_reads ENABLE ROW LEVEL SECURITY;

-- Staff can insert their own read receipts
CREATE POLICY reads_own_insert ON public.resource_page_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can see their own reads
CREATE POLICY reads_own_select ON public.resource_page_reads
  FOR SELECT USING (user_id = auth.uid());

-- Managers can see all reads (for the read receipt dashboard)
CREATE POLICY reads_manager_select ON public.resource_page_reads
  FOR SELECT USING (public.is_manager_or_admin(auth.uid()));

CREATE INDEX idx_page_reads_page ON public.resource_page_reads(page_id);
CREATE INDEX idx_page_reads_user ON public.resource_page_reads(user_id);
```

### 1E. Create Supabase Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-page-assets', 'resource-page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects in this bucket
CREATE POLICY resource_assets_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

CREATE POLICY resource_assets_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

CREATE POLICY resource_assets_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resource-page-assets' AND public.is_manager_or_admin(auth.uid())
  );
```

### 1F. Update Supabase Generated Types

After applying the migration, regenerate `src/integrations/supabase/types.ts` so that all queries can drop the `as any` casts. The new tables (`resource_page_folders`, `resource_page_editors`, `resource_page_reads`) and altered `resource_pages` columns must be reflected.

**Deliverables:**
- 1 migration SQL file covering all schema changes
- Updated Supabase types file
- All tables have RLS enabled with correct policies
- Storage bucket created with auth-gated access

---

## Phase 2: TipTap Editor Component

**Goal**: Build the core page editor component with all block types, formatting toolbar, image upload, link cards, 2-column layouts, and drag-and-drop block reordering. This phase produces a reusable `<PageEditor>` component that Phase 3 will wire into the page CRUD flow.

### 2A. Install TipTap Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm \
  @tiptap/extension-image @tiptap/extension-link \
  @tiptap/extension-placeholder @tiptap/extension-text-align \
  @tiptap/extension-horizontal-rule @tiptap/extension-heading \
  @tiptap/extension-color @tiptap/extension-text-style \
  @tiptap/extension-underline
```

### 2B. Create Custom TipTap Extensions

**File**: `src/components/page-builder/extensions/LinkCardNode.ts`

Custom TipTap Node extension for link preview cards:
- Node name: `linkCard`
- Attributes: `url`, `title`, `description`, `image` (thumbnail URL)
- Rendered as a styled card block in the editor
- On insert: accept a URL from the user, attempt to fetch Open Graph metadata via a Supabase Edge Function (or client-side fetch with CORS fallback), populate title/description/image
- Fallback: if OG fetch fails, show the URL as the title with a generic link icon

**File**: `src/components/page-builder/extensions/TwoColumnNode.ts`

Custom TipTap Node extension for 2-column layout:
- Node name: `twoColumns`
- Contains exactly 2 child nodes: `columnLeft` and `columnRight`
- Each column is an editable block container (can hold paragraphs, images, etc.)
- Rendered as a CSS grid or flexbox with `grid-template-columns: 1fr 1fr` and a gap
- Selection: clicking the column border selects the whole 2-column block for drag/delete

**File**: `src/components/page-builder/extensions/ImageBlock.ts`

Extend TipTap's `@tiptap/extension-image` with:
- Custom node view (React component) with:
  - Drag handles on hover (top-left corner)
  - Resize handles (bottom-right corner, aspect-ratio locked)
  - Alignment buttons (left/center/right) shown on selection
  - Upload integration: on insert, opens file picker → runs `compressPhoto()` → uploads to `resource-page-assets` bucket → sets `src` attribute to Supabase public URL
- Attributes: `src`, `alt`, `width`, `alignment` (left/center/right)

### 2C. Build the Editor Toolbar

**File**: `src/components/page-builder/EditorToolbar.tsx`

A sticky toolbar above the editor area. Buttons grouped by function:

| Group | Buttons |
|-------|---------|
| Text | Bold, Italic, Underline, Strikethrough (from starter-kit) |
| Headings | H1, H2, H3 (dropdown or toggle group) |
| Color | Text color picker (same 7 colors as existing RichTextEditor) |
| Alignment | Left, Center, Right (per-block) |
| Lists | Bullet list, Ordered list |
| Insert | Image (file picker), Link (URL input popover), Link Card (URL input), Horizontal Divider, Two-Column Layout |

**Behavior:**
- Toolbar reflects the current selection state (active buttons highlighted)
- On mobile/small screens: toolbar wraps or becomes a scrollable single row
- Insert actions: Image opens file picker dialog, Link shows URL popover (same pattern as existing RichTextEditor), Link Card shows URL input + fetches OG data, Divider inserts `<hr>`, Two-Column inserts the 2-column block

### 2D. Build the PageEditor Component

**File**: `src/components/page-builder/PageEditor.tsx`

**Props:**
```typescript
interface PageEditorProps {
  initialContent: JSONContent | null;   // TipTap JSON from DB
  onChange: (content: JSONContent) => void;
  onImageUpload: (file: File) => Promise<string>; // Returns public URL
  editable?: boolean;                   // false for read-only rendering
  placeholder?: string;
}
```

**Implementation:**
- Instantiates TipTap `useEditor` with all extensions: StarterKit (minus heading — use separate Heading extension with levels [1,2,3]), Image (custom), Link, LinkCard (custom), TwoColumns (custom), TextAlign, HorizontalRule, Color, TextStyle, Underline, Placeholder
- `EditorContent` component renders the editable area
- `EditorToolbar` wired to editor commands
- Block drag-and-drop: use TipTap's built-in `DragHandle` extension or integrate @dnd-kit for block reordering
- Keyboard shortcuts: standard (Cmd+B, Cmd+I, Cmd+U, Cmd+K for link)
- `onUpdate` callback extracts `editor.getJSON()` and calls `onChange`
- Content area styled with Tailwind `prose` classes for consistent typography

### 2E. Build the PageRenderer Component (Read-Only)

**File**: `src/components/page-builder/PageRenderer.tsx`

**Props:**
```typescript
interface PageRendererProps {
  content: JSONContent;
  className?: string;
}
```

- Uses TipTap `useEditor` with `editable: false` and same extensions
- OR: build a custom JSON-to-React renderer that maps TipTap node types to React components (avoids loading full editor bundle for read-only views)
- Renders link cards as clickable cards opening in new tab
- Renders images with their saved alignment and width
- Renders 2-column layouts as responsive grid (collapses to single column on mobile)
- Content wrapped in `prose` classes for consistent typography
- Sanitize any raw HTML if present (DOMPurify)

### 2F. Image Upload Handler Utility

**File**: `src/lib/pageImageUpload.ts`

```typescript
export async function uploadPageImage(file: File): Promise<string> {
  // 1. Compress using existing compressPhoto (1024px, 250KB)
  // 2. Generate filename: `pages/${Date.now()}-${random}.${ext}`
  // 3. Upload to 'resource-page-assets' bucket
  // 4. Return public URL
}
```

Reuses `compressPhoto` from `src/lib/compressPhoto.ts` and the Supabase client from `src/integrations/supabase/client.ts`.

### 2G. Link Card OG Metadata Fetcher

**File**: `src/lib/fetchLinkMetadata.ts`

```typescript
export async function fetchLinkMetadata(url: string): Promise<{
  title: string;
  description: string;
  image: string | null;
}>
```

- Option A: Supabase Edge Function that fetches the URL server-side, parses `<meta property="og:*">` tags, returns JSON. More reliable (no CORS issues).
- Option B: Client-side fetch with a CORS proxy fallback. Simpler but less reliable.
- Recommendation: Start with a Supabase Edge Function (`supabase/functions/fetch-link-metadata/index.ts`).
- Fallback: if fetch fails, return `{ title: url, description: '', image: null }`.

**Deliverables:**
- TipTap installed and configured with all extensions
- 3 custom extensions: LinkCardNode, TwoColumnNode, ImageBlock
- `EditorToolbar` component
- `PageEditor` component (edit mode)
- `PageRenderer` component (read-only mode)
- `uploadPageImage` utility
- `fetchLinkMetadata` utility (+ optional Edge Function)
- All components styled with Tailwind, consistent with shadcn/ui design system

---

## Phase 3: Page CRUD & Management UI

**Goal**: Build the complete manager-side interface for creating, editing, listing, organizing (folders + tags), and deleting pages. Wire the PageEditor from Phase 2 into a full page management flow.

### 3A. React Query Hooks — Page CRUD

**File**: `src/hooks/useResourcePages.ts` (rewrite)

**Exported hooks:**

| Hook | Purpose |
|------|---------|
| `useResourcePages(filters?)` | Fetch pages with optional folder/tag/search/published filters |
| `useResourcePage(pageId)` | Fetch single page by ID (for editor and reading view) |
| `useCreateResourcePage()` | Insert new page |
| `useUpdateResourcePage()` | Update page (content_json, title, tags, folder, roles, published) |
| `useDeleteResourcePage()` | Soft delete or hard delete |
| `useResourcePagesByRole(role)` | Fetch published pages visible to a specific role |

**Key changes from current implementation:**
- `content_json` (jsonb) replaces `content` (text HTML) as the primary content field
- On save: extract plaintext from TipTap JSON → write to `search_text` column for full-text search
- All queries use proper Supabase types (no more `as any`)
- Pagination support: `.range(from, to)` for large page collections
- Folder filtering: `.eq('folder_id', folderId)` or `.is('folder_id', null)` for unfiled

**Plaintext extraction utility** (`src/lib/extractSearchText.ts`):
```typescript
// Recursively walks TipTap JSON, extracts all text node content
export function extractSearchText(content: JSONContent): string
```

### 3B. React Query Hooks — Folders

**File**: `src/hooks/useResourcePageFolders.ts`

| Hook | Purpose |
|------|---------|
| `useResourcePageFolders()` | Fetch all folders ordered by display_order |
| `useCreateFolder()` | Create folder with name, description, display_order |
| `useUpdateFolder()` | Rename, reorder, or change description |
| `useDeleteFolder()` | Delete folder (pages inside get folder_id set to NULL via ON DELETE SET NULL) |
| `useReorderFolders()` | Batch update display_order values |

### 3C. React Query Hooks — Delegated Editors

**File**: `src/hooks/useResourcePageEditors.ts`

| Hook | Purpose |
|------|---------|
| `usePageEditors(pageId)` | Fetch delegated editors for a page (joined with profiles for name) |
| `useAddPageEditor()` | Grant edit access to a user for a page |
| `useRemovePageEditor()` | Revoke edit access |
| `useMyEditablePages()` | For non-manager users: fetch pages where they have edit access |

### 3D. Page List View (Manager)

**File**: `src/components/manager/staff-resources/ResourcePagesManagement.tsx` (rewrite)

**Layout:**
- **Top bar**: "New Page" button, search input, folder filter dropdown, tag filter chips
- **Left sidebar** (collapsible): Folder tree
  - "All Pages" (default, shows everything)
  - "Unfiled" (pages with no folder)
  - Each folder name with page count badge
  - Drag-and-drop folder reordering (using @dnd-kit)
  - "New Folder" button at bottom
  - Right-click folder for rename/delete context menu
- **Main area**: Card grid or list of pages
  - Each card shows: title, cover image thumbnail (if any), folder name, tag chips, published/draft badge, assigned role badges, last edited date
  - Click card → navigate to editor route
  - Hover shows quick actions: edit, duplicate, delete, toggle published
  - Drag-and-drop page reordering within a folder

### 3E. Page Editor Route & View (Manager)

**New route**: `/dashboard/staff-resources/pages/:pageId/edit` (create: `/dashboard/staff-resources/pages/new`)

**File**: `src/pages/ResourcePageEditorPage.tsx`

**Layout:**
- **Header bar** (sticky):
  - Back button (to page list)
  - Page title (editable inline input)
  - Status: "Draft" or "Published" toggle
  - "Save" button (primary) — saves `content_json`, `search_text`, `title`, `last_edited_by`
  - "..." menu: Delete, Duplicate, View as Staff
- **Settings sidebar** (right, collapsible or sheet):
  - **Folder**: dropdown to assign folder
  - **Tags**: multi-select tag input (type to create new tags, select from existing)
  - **Assigned Roles**: `RoleAssignmentCheckboxes` (updated with FoH/BoH/All toggles)
  - **Delegated Editors**: user search + list of current editors with remove buttons
  - **Cover Image**: file picker to set optional cover/thumbnail
  - **Read Receipts**: link to view who has read this page (Phase 5)
- **Main area**: `<PageEditor>` component (full width, min-height fills viewport)

### 3F. Update RoleAssignmentCheckboxes

**File**: `src/components/manager/staff-resources/RoleAssignmentCheckboxes.tsx` (update)

Add quick-toggle buttons above the individual checkboxes:

```
[ All Roles ] [ FoH ] [ BoH ] [ Cafe ] [ Trainers ]
─────────────────────────────────────────────────────
☐ Concierge   ☐ Female Spa   ☐ Male Spa
☐ Floater     ☐ Cafe         ☐ Trainer
```

**Group definitions:**
- **FoH**: `['concierge']`
- **BoH**: `['female_spa_attendant', 'male_spa_attendant', 'floater']`
- **Cafe**: `['cafe']`
- **Trainers**: `['trainer']`
- **All Roles**: all 6 roles

Toggle behavior: clicking a group button selects/deselects all roles in that group. If all roles in a group are selected, the group button appears active.

### 3G. Tags System

Tags are stored as a `text[]` array on `resource_pages`. No separate tags table — tags are derived from what's in use across all pages.

**Hook**: `useAvailableTags()` — `SELECT DISTINCT unnest(tags) FROM resource_pages ORDER BY 1`

**Tag input component** (`src/components/page-builder/TagInput.tsx`):
- Combobox with autocomplete from existing tags
- Type to create new tags (press Enter)
- Chips showing selected tags with X to remove
- Uses shadcn `Command` (cmdk) for the autocomplete dropdown

### 3H. Routing Updates

**File**: `src/App.tsx` — add routes:

```typescript
// Manager page editor
<Route path="/dashboard/staff-resources/pages/new" element={
  <ProtectedRoute requiredRoles={['admin', 'manager']}>
    <ResourcePageEditorPage />
  </ProtectedRoute>
} />
<Route path="/dashboard/staff-resources/pages/:pageId/edit" element={
  <ProtectedRoute requiredRoles={['admin', 'manager']}>
    <ResourcePageEditorPage />
  </ProtectedRoute>
} />

// Staff full-screen reading view
<Route path="/dashboard/resources/pages/:pageId" element={
  <ProtectedRoute requiredRoles={['admin', 'manager', 'concierge', 'female_spa_attendant', 'male_spa_attendant', 'floater', 'cafe', 'trainer']}>
    <ResourcePageReadingPage />
  </ProtectedRoute>
} />
```

**Note on delegated editors**: The editor route is restricted to admin/manager, but delegated editors (any role) also need access. Either:
- Option A: Add all roles to the `requiredRoles` array and check edit permission in the component (redirect unauthorized users)
- Option B: Create a separate route `/dashboard/resources/pages/:pageId/edit` accessible to all roles with a component-level permission check

Recommendation: **Option B** — keep the manager area clean, give delegated editors an edit route under their own resources namespace.

**Deliverables:**
- Rewritten `useResourcePages` hooks with folder/tag/search support
- New `useResourcePageFolders` hooks
- New `useResourcePageEditors` hooks
- New tag input component and `useAvailableTags` hook
- Rewritten page list view with folder sidebar, search, filters
- New page editor page with settings sidebar
- Updated `RoleAssignmentCheckboxes` with group toggles
- New routes in App.tsx
- `extractSearchText` utility

---

## Phase 4: Staff Reading Experience

**Goal**: Build the staff-facing UI for browsing, searching, and reading pages in a full-screen view. Integrate read receipts, resource flagging, and folder/tag navigation.

### 4A. Staff Page List View

**File**: `src/components/staff-resources/ResourcePagesTab.tsx` (rewrite)

**Layout:**
- **Top**: Search input (searches titles + content via `search_text`)
- **Filter bar**: Folder tabs/chips (from `resource_page_folders`), tag filter chips
- **Page list**: Card grid (responsive: 1-col mobile, 2-col tablet, 3-col desktop)
  - Each card: title, cover image (if any), folder badge, tag chips, "Under Review" badge (if flagged)
  - Click card → navigate to `/dashboard/resources/pages/:pageId` (full-screen reading view)
  - Right-click → `ResourceFlagContextMenu` (flag as outdated)
- **Empty states**: "No pages found" when search/filter yields nothing, "No pages available" when no pages assigned to user's role

### 4B. Full-Screen Reading View

**New file**: `src/pages/ResourcePageReadingPage.tsx`

**Layout:**
- **Header** (sticky, compact):
  - Back button → returns to `/dashboard/resources/pages`
  - Page title (large)
  - Folder breadcrumb: `Resources > Pages > [Folder Name] > [Page Title]`
  - Tag chips (read-only)
  - "Download PDF" button (Phase 6)
  - "Flag as Outdated" button (opens flagging dialog, same as context menu)
- **Content area**: `<PageRenderer>` component rendering TipTap JSON
  - Max-width container (e.g., `max-w-4xl mx-auto`) for readable line length
  - Responsive: 2-column blocks collapse to single column on mobile
  - Images display at their saved size/alignment
  - Link cards are clickable, open in new tab
- **Footer**: Last updated date, "Was this helpful?" (optional, for future)

### 4C. Read Receipt Recording

When a staff member opens the full-screen reading view:

1. On mount, check if a read receipt exists for this user + page
2. If not, insert into `resource_page_reads` (after a 3-5 second delay to ensure they actually viewed it, not just clicked and backed out)
3. This happens automatically — no UI for the staff member

**Hook**: `useRecordPageRead(pageId)` — handles the delayed insert logic

### 4D. Update Search Integration

**File**: `src/hooks/useResourceSearch.ts` (update)

- Current search fetches `resource_pages` and filters client-side on `title` and `content` (HTML string)
- Update to also search `search_text` column (plaintext from TipTap JSON)
- For Postgres full-text search: `to_tsvector('english', search_text) @@ plainto_tsquery('english', :query)`
- Alternative: keep client-side search over `search_text` for simplicity (current pattern)
- Add folder name and tags to the search result display

### 4E. Update Staff Resources Landing

**File**: `src/components/staff-resources/StaffResourcesView.tsx` (update)

- Update the "Resource Pages" link in the landing navigation
- Update search results to show the new page card format with folder/tags
- Search results for pages link to the full-screen reading view instead of expanding inline

### 4F. Navigation Updates

**File**: `src/components/layout/DashboardLayout.tsx`

- The existing `RESOURCE_SUB_ITEMS` include `{ title: "Resource Pages", url: "/dashboard/resources/pages" }` — this still works
- No nav changes needed unless we want to show folders in the nav (not recommended — keep it simple)

**Deliverables:**
- Rewritten staff page list with folder/tag navigation
- New full-screen reading page with `PageRenderer`
- Read receipt auto-recording hook
- Updated search integration
- Updated staff resources landing
- Mobile-responsive reading experience

---

## Phase 5: Read Receipts Dashboard & Delegated Editing

**Goal**: Build the manager-side UI for viewing read receipts, and the delegated editor flow for non-manager staff.

### 5A. Read Receipts Dashboard

**File**: `src/components/page-builder/ReadReceiptsDashboard.tsx`

Accessible from the page editor settings sidebar ("View Read Receipts" link):

**Layout:**
- Page title at top
- Stats row: "X of Y staff have read this page" (Y = total staff with matching roles)
- Two lists:
  - **Read** (green): Staff name, role badge, read date — sorted by most recent
  - **Not Yet Read** (gray): Staff name, role badge — sorted alphabetically
- Filter by role dropdown
- "Export to CSV" button (optional)

**Data source:**
- Fetch all `resource_page_reads` for the page (joined with `profiles` for names)
- Fetch all users with roles matching the page's `assigned_roles` (from `user_roles` + `profiles`)
- Diff to find who hasn't read

**Hook**: `usePageReadReceipts(pageId)` — returns `{ readers: [], nonReaders: [], totalStaff: number, readCount: number }`

### 5B. Delegated Editor Flow

**For managers** (in page editor settings sidebar):
- "Editors" section with user search (shadcn `Command` combobox searching `profiles` table)
- Shows list of current delegated editors with role badges and remove (X) button
- On add: inserts into `resource_page_editors`
- On remove: deletes from `resource_page_editors`

**For delegated editors** (non-manager staff):
- New section in their Resources landing or a dedicated "My Editable Pages" area
- Shows pages they have edit access to (from `useMyEditablePages()`)
- Click → navigates to `/dashboard/resources/pages/:pageId/edit`
- The editor page checks: is user a manager/admin OR in `resource_page_editors` for this page?
  - If yes: render `<PageEditor editable={true}>`
  - If no: redirect to reading view
- Delegated editors can edit content, but NOT change roles, folder, published status, or other editors (those fields are disabled/hidden for non-managers)

### 5C. Permission Check Hook

**File**: `src/hooks/useCanEditPage.ts`

```typescript
export function useCanEditPage(pageId: string): {
  canEdit: boolean;
  isManager: boolean;
  isDelegatedEditor: boolean;
  isLoading: boolean;
}
```

Checks user roles (admin/manager) and `resource_page_editors` table.

**Deliverables:**
- Read receipts dashboard component
- `usePageReadReceipts` hook
- Delegated editor management UI in settings sidebar
- "My Editable Pages" section for non-manager editors
- `useCanEditPage` permission hook
- Editor page respects delegated permissions (limited controls for non-managers)

---

## Phase 6: PDF Export

**Goal**: Generate downloadable PDFs from page content.

### 6A. Choose PDF Generation Approach

**Options:**
1. **Browser print-to-PDF** (`window.print()` with `@media print` styles): Simplest. Opens the browser's print dialog. User saves as PDF. No library needed.
2. **Client-side library** (e.g., `html2pdf.js`, `jspdf` + `html2canvas`): Generates a PDF blob in the browser. No server needed. Quality depends on the library.
3. **Server-side** (Supabase Edge Function with Puppeteer/Playwright): Best quality, most complex. Runs headless Chrome to render the page and export PDF.

**Recommendation**: Start with **Option 1** (browser print) with a clean print stylesheet. It's zero-dependency, works on all devices, and produces good results. If the quality is insufficient, upgrade to Option 2 later.

### 6B. Print Stylesheet

**File**: `src/components/page-builder/PagePrintStyles.css` (imported in PageRenderer)

```css
@media print {
  /* Hide all app chrome: sidebar, header, navigation, buttons */
  .sidebar, .dashboard-header, nav, button, .no-print { display: none !important; }

  /* Full-width content */
  .page-renderer { max-width: 100%; margin: 0; padding: 20px; }

  /* Ensure images don't break across pages */
  img { page-break-inside: avoid; max-width: 100%; }

  /* 2-column layout: keep or collapse based on page width */
  .two-columns { grid-template-columns: 1fr 1fr; }

  /* Link cards: show URL text */
  .link-card::after { content: " (" attr(data-url) ")"; font-size: 0.8em; color: #666; }

  /* Typography */
  body { font-size: 12pt; line-height: 1.5; color: #000; }
  h1 { font-size: 20pt; }
  h2 { font-size: 16pt; }
  h3 { font-size: 14pt; }
}
```

### 6C. PDF Download Button

**In `ResourcePageReadingPage.tsx`** (and optionally in the editor preview):

```typescript
const handleDownloadPDF = () => {
  window.print();
};
```

Button in the header: `<Button variant="outline" onClick={handleDownloadPDF}><Download /> PDF</Button>`

**Deliverables:**
- Print stylesheet for clean PDF output
- "Download PDF" button on reading view
- Print-friendly rendering of all block types (images, 2-column, link cards)

---

## Phase 7: Migration, Testing & Polish

**Goal**: Migrate existing resource pages to the new format, comprehensive testing, performance optimization, and UI polish.

### 7A. Data Migration

Existing `resource_pages` rows have `content` (HTML text) but no `content_json`. The Phase 1 migration already set a basic wrapper, but for proper rendering:

**Migration script** (can be a Supabase Edge Function or a one-time script):
1. Fetch all existing resource pages with non-null `content`
2. For each: parse the HTML into TipTap JSON structure
   - `<b>` → bold mark, `<i>` → italic mark, `<u>` → underline mark
   - `<ul>/<ol>/<li>` → bulletList/orderedList nodes
   - `<a href>` → link mark
   - `<span style="color:">` → textStyle mark with color
   - Plain text → paragraph nodes
3. Save the TipTap JSON to `content_json`
4. Extract plaintext to `search_text`
5. Verify rendering matches the original

**File**: `src/lib/htmlToTiptapJson.ts`

```typescript
export function htmlToTiptapJson(html: string): JSONContent
```

This is a one-time utility for migration. Can be approximate — the few existing pages can be manually verified and touched up.

### 7B. Remove Legacy Code

After migration is verified:
- Remove the `content` column from `resource_pages` (or keep as deprecated backup)
- The existing `RichTextEditor.tsx` stays — it's used by announcements and quick link descriptions (NOT being replaced in this project)
- Remove old inline expand/collapse rendering from `ResourcePagesTab.tsx`
- Clean up old search logic that references HTML content

### 7C. Testing Checklist

| Area | Test |
|------|------|
| Editor | Create page with all block types, save, reload, verify content preserved |
| Editor | Image upload: file picker → compress → upload → displays in editor |
| Editor | Link card: paste URL → OG metadata fetched → card renders |
| Editor | Two-column: insert, add content to both columns, reorder |
| Editor | Drag-and-drop block reordering |
| Editor | Undo/redo (Cmd+Z / Cmd+Shift+Z) |
| CRUD | Create, edit, delete pages |
| CRUD | Duplicate page |
| Folders | Create, rename, reorder, delete folder |
| Folders | Move page between folders |
| Tags | Add, remove, create new tags |
| Roles | Assign roles with quick toggles, verify staff visibility |
| Roles | FoH/BoH/All toggles select correct roles |
| Publishing | Draft pages not visible to staff, published pages visible |
| Search | Full-text search finds content within pages |
| Search | Cross-role search shows "from other roles" results |
| Reading | Full-screen view renders all block types correctly |
| Reading | Mobile responsive: 2-column collapses, images resize |
| Reading | Right-click flagging works |
| Read receipts | Auto-recorded after 3-5 second view |
| Read receipts | Manager dashboard shows read/unread staff |
| Delegated editors | Manager grants edit access, editor can edit content |
| Delegated editors | Editor cannot change roles/folder/published status |
| PDF | Print produces clean output with all content |
| PDF | Images included, 2-column maintained |
| Migration | Existing pages render correctly in new format |
| RLS | Staff can only see pages assigned to their roles |
| RLS | Delegated editors can update their assigned pages |
| RLS | Non-editors cannot update pages |

### 7D. Performance Optimization

- **Lazy load TipTap**: The editor bundle is large. Use `React.lazy()` + `Suspense` for the editor page so it's not included in the main bundle
- **Image optimization**: Ensure compressed images use Supabase CDN URLs with cache headers
- **Page list virtualization**: If page count grows large, consider virtualizing the card grid (unlikely needed initially)
- **Search debounce**: Use existing `use-debounce` library for search input (300ms)

### 7E. UI Polish

- Loading skeletons for page list, editor, and reading view
- Empty states with illustrations/icons
- Toast notifications for all CRUD operations (consistent with existing Sonner usage)
- Keyboard shortcuts listed in editor tooltip
- Smooth transitions between list and editor views
- Consistent spacing, colors, and typography with existing shadcn/ui design system
- Dark mode support (app uses `next-themes` — ensure TipTap content respects theme)

**Deliverables:**
- HTML-to-TipTap migration utility and data migration
- Legacy code cleanup
- Comprehensive test coverage
- Performance optimizations (lazy loading, debounce)
- UI polish (skeletons, empty states, transitions, dark mode)

---

## File Structure Summary

```
src/
  components/
    page-builder/
      extensions/
        LinkCardNode.ts          -- Custom TipTap node for link cards
        TwoColumnNode.ts         -- Custom TipTap node for 2-column layout
        ImageBlock.ts            -- Extended TipTap image with resize/alignment
      EditorToolbar.tsx          -- Formatting toolbar
      PageEditor.tsx             -- Main editor component (edit mode)
      PageRenderer.tsx           -- Read-only renderer
      TagInput.tsx               -- Tag autocomplete input
      ReadReceiptsDashboard.tsx  -- Manager view of who has read a page
      PagePrintStyles.css        -- Print/PDF stylesheet
    manager/
      staff-resources/
        ResourcePagesManagement.tsx  -- Rewritten page list with folders
        RoleAssignmentCheckboxes.tsx -- Updated with group toggles
    staff-resources/
      ResourcePagesTab.tsx       -- Rewritten staff page list
  hooks/
    useResourcePages.ts          -- Rewritten page CRUD hooks
    useResourcePageFolders.ts    -- Folder CRUD hooks
    useResourcePageEditors.ts    -- Delegated editor hooks
    useCanEditPage.ts            -- Permission check hook
    usePageReadReceipts.ts       -- Read receipt hooks
    useAvailableTags.ts          -- Tag autocomplete data
    useResourceSearch.ts         -- Updated search with new content format
    useStaffResources.ts         -- Updated barrel export
  lib/
    pageImageUpload.ts           -- Image compression + Supabase upload
    fetchLinkMetadata.ts         -- OG metadata fetcher for link cards
    extractSearchText.ts         -- TipTap JSON → plaintext
    htmlToTiptapJson.ts          -- Migration: HTML → TipTap JSON
  pages/
    ResourcePageEditorPage.tsx   -- Manager/editor page editor route
    ResourcePageReadingPage.tsx  -- Staff full-screen reading route
supabase/
  migrations/
    YYYYMMDDHHMMSS_upgrade_resource_pages_for_builder.sql
  functions/
    fetch-link-metadata/
      index.ts                   -- Edge function for OG metadata
```

## Phase Execution Order

| Phase | Name | Depends On | Estimated Scope |
|-------|------|-----------|-----------------|
| 1 | Database Schema & Storage | Nothing | 1 migration file, types regen |
| 2 | TipTap Editor Component | Phase 1 (for storage bucket) | ~10 new files, npm packages |
| 3 | Page CRUD & Management UI | Phase 1 + 2 | ~8 new/rewritten files, routes |
| 4 | Staff Reading Experience | Phase 1 + 2 + 3 | ~4 new/rewritten files |
| 5 | Read Receipts & Delegated Editing | Phase 1 + 3 + 4 | ~5 new files |
| 6 | PDF Export | Phase 2 + 4 | ~2 files (stylesheet + button) |
| 7 | Migration, Testing & Polish | All phases | Migration script, cleanup, testing |

Each phase is independently deployable after its dependencies are complete. Phase 1 can be deployed immediately with no user-facing changes. Phases 2-3 can be developed in parallel with Phase 4 following. Phases 5-6 are independent of each other.

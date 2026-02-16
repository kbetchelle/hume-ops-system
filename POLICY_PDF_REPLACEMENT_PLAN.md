# Policy PDF Replacement — Implementation Plan

## Project Summary

Replace the existing `club_policies` system (HTML content with categories) with PDF-based policy documents using the existing `resource_pages` infrastructure. Policy PDFs will support inline viewing, full-text search, page-specific flagging, folder organization, role assignment, and bulk uploads.

## Executive Summary

**What we're replacing:**
- `club_policies` table (HTML content, categories, tags)
- `policy_categories` table
- Policy Management UI (PolicyManagement.tsx)
- Staff Policies view (PoliciesTab.tsx)

**What we're using instead:**
- `resource_pages` table (already supports PDFs, folders, tags, roles)
- Enhanced PDF viewer with page-specific flagging
- Full-text search inside PDF content
- Folder-based organization instead of categories
- Bulk upload capabilities

**Key Benefits:**
- Unified document management (policies + other resources)
- Real PDF files instead of HTML approximations
- Better formatting, signatures, official letterhead preserved
- Single source of truth for all staff documents
- Existing infrastructure (folders, tags, roles) already built

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | Existing `resource_pages` table | Already has PDFs, folders, tags, roles, flagging |
| **PDF Viewer** | Inline with react-pdf or pdf.js | Better UX than new tabs |
| **Search** | Full-text via `pdf-parse` npm package | Extract text on upload, store in `search_text` |
| **Organization** | Folders (dedicated "Policies" folder) | Resource pages already has folders |
| **Flagging** | Enhanced: flag specific PDF pages | Build on existing `resource_flags` |
| **Upload** | Single + Bulk via PdfUploadDialog | Reuse existing component, add bulk mode |
| **Migration** | Soft deprecation, keep old data | Archive policies, don't delete |
| **Version Control** | None (simple replace) | Complexity not needed |

---

## Tech Stack Context

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 + TypeScript 5.8 + Vite 5 |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| State | TanStack React Query v5 |
| UI | shadcn/ui + Radix + Tailwind CSS 3 |
| PDF Rendering | react-pdf (npm: `react-pdf`) |
| PDF Text Extraction | pdf-parse (npm: `pdf-parse`) |
| Icons | lucide-react |
| Toasts | Sonner |

---

## Database Schema Changes

### Phase 1: Enhance `resource_pages` for PDF Full-Text Search

**New Migration:** `20260224000000_add_pdf_text_search.sql`

```sql
-- Add extracted text column if not exists (it already exists from builder migration)
-- ALTER TABLE public.resource_pages ADD COLUMN IF NOT EXISTS search_text text;

-- Update PDF text extraction trigger
CREATE OR REPLACE FUNCTION extract_pdf_search_text()
RETURNS trigger AS $$
BEGIN
  -- For PDF pages, search_text should be populated by application during upload
  -- This trigger just ensures the search index is updated
  IF NEW.page_type = 'pdf' THEN
    -- Normalize and clean search text
    NEW.search_text := regexp_replace(
      regexp_replace(NEW.search_text, '\s+', ' ', 'g'),
      '[^\w\s]', '', 'g'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdf_search_text
  BEFORE INSERT OR UPDATE OF search_text ON public.resource_pages
  FOR EACH ROW
  EXECUTE FUNCTION extract_pdf_search_text();

-- Ensure GIN index exists for full-text search
CREATE INDEX IF NOT EXISTS idx_resource_pages_search 
  ON public.resource_pages 
  USING GIN(to_tsvector('english', COALESCE(search_text, '')));

-- Add comment
COMMENT ON COLUMN public.resource_pages.search_text IS 
  'Plain text extracted from PDF content (via pdf-parse) or TipTap JSON. Used for full-text search.';
```

### Phase 2: Enhance `resource_flags` for Page-Specific Flagging

**New Migration:** `20260224000001_add_page_specific_flags.sql`

```sql
-- Add column for flagging specific pages within a PDF
ALTER TABLE public.resource_flags
  ADD COLUMN IF NOT EXISTS flagged_page_number integer,
  ADD COLUMN IF NOT EXISTS flagged_page_context text;

-- Create index for page-specific flags
CREATE INDEX IF NOT EXISTS idx_resource_flags_page 
  ON public.resource_flags(resource_id, flagged_page_number)
  WHERE flagged_page_number IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.resource_flags.flagged_page_number IS 
  'For PDF pages: the specific page number being flagged (1-indexed). NULL means flag applies to entire document.';

COMMENT ON COLUMN public.resource_flags.flagged_page_context IS 
  'Optional: text snippet or context from the flagged page for reviewer reference.';
```

### Phase 3: Soft Deprecate Policies System

**New Migration:** `20260224000002_deprecate_policies_system.sql`

```sql
-- Mark tables as deprecated (don't drop yet for rollback safety)
COMMENT ON TABLE public.club_policies IS 
  'DEPRECATED: Replaced by resource_pages with page_type=pdf. Kept for historical reference and rollback capability.';

COMMENT ON TABLE public.policy_categories IS 
  'DEPRECATED: Replaced by resource_page_folders. Kept for historical reference and rollback capability.';

-- Add archived flag instead of deleting data
ALTER TABLE public.club_policies 
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS migrated_to_page_id uuid REFERENCES public.resource_pages(id);

ALTER TABLE public.policy_categories 
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid REFERENCES public.resource_page_folders(id);

-- Archive all existing policies
UPDATE public.club_policies 
SET archived_at = now() 
WHERE archived_at IS NULL;

UPDATE public.policy_categories 
SET archived_at = now() 
WHERE archived_at IS NULL;

-- Create "Policies" folder in resource_page_folders
INSERT INTO public.resource_page_folders (name, description, display_order)
VALUES (
  'Policies',
  'Official club policies and procedures',
  0
)
ON CONFLICT DO NOTHING;

-- Add comments about migration path
COMMENT ON COLUMN public.club_policies.migrated_to_page_id IS 
  'If policy was migrated to a PDF resource page, this references the new page.';
```

---

## Frontend Components

### New/Modified Components

| Component | Type | Purpose |
|-----------|------|---------|
| `PolicyDocumentsManager.tsx` | NEW | Replace PolicyManagement.tsx - manage policy PDFs |
| `PdfViewerWithFlags.tsx` | NEW | Enhanced PDF viewer with page-specific flagging |
| `BulkPdfUploadDialog.tsx` | NEW | Upload multiple PDFs at once |
| `PdfUploadDialog.tsx` | MODIFY | Add full-text extraction on upload |
| `ResourcePagesManagement.tsx` | MODIFY | Add "Policies" folder quick access |
| `ResourcePagesTab.tsx` | MODIFY | Better PDF display in list |
| `FlagInboxItem.tsx` | MODIFY | Show page number for PDF flags |
| `ResourcePageReadingPage.tsx` | MODIFY | Use enhanced PDF viewer |

---

## Implementation Phases

### Phase 1: Database & Text Extraction (Backend)

**Goal:** Set up schema changes and PDF text extraction capability

**Tasks:**
1. ✅ Create migration for PDF text search triggers
2. ✅ Create migration for page-specific flagging columns
3. ✅ Create migration to deprecate policies tables
4. ✅ Install PDF parsing library: `npm install pdf-parse`
5. ✅ Install PDF viewer library: `npm install react-pdf pdfjs-dist`
6. ✅ Create utility function `extractPdfText(file: File): Promise<string>`
7. ✅ Create utility function `getPdfPageCount(file: File): Promise<number>`

**Deliverables:**
- 3 new migration files
- `src/lib/pdfUtils.ts` with extraction functions
- npm dependencies installed

**Time Estimate:** 2-3 hours

---

### Phase 2: Enhanced PDF Viewer with Page Flagging

**Goal:** Build inline PDF viewer that supports flagging specific pages

**Tasks:**
1. Create `PdfViewerWithFlags.tsx` component
   - Render PDF inline using react-pdf
   - Show page numbers and navigation
   - Add "Flag this page" button on each page
   - Highlight pages that have existing flags
   - Support zoom controls
   
2. Create `PdfPageFlagDialog.tsx` component
   - Dialog to flag a specific page
   - Shows page number and thumbnail
   - Pre-fills with selected text or context
   - Links to existing flag system

3. Update `ResourcePageReadingPage.tsx`
   - Detect if page is PDF (`page_type === 'pdf'`)
   - Render `PdfViewerWithFlags` instead of TipTap viewer
   - Pass page ID and flag handling functions

4. Update `FlagInboxItem.tsx`
   - Display page number if `flagged_page_number` exists
   - Show "Page 3 of Employee_Handbook.pdf" format
   - Add direct link to specific page

**Deliverables:**
- Enhanced PDF viewer component
- Page-specific flagging UI
- Updated flag inbox to show page numbers

**Time Estimate:** 4-6 hours

---

### Phase 3: Full-Text Search Implementation

**Goal:** Extract text from PDFs on upload and enable search

**Tasks:**
1. Update `PdfUploadDialog.tsx`
   - Add progress indicator for text extraction
   - Extract text using `pdf-parse` during upload
   - Store extracted text in `search_text` column
   - Handle extraction errors gracefully (store empty string)

2. Create `usePdfTextExtraction.ts` hook
   - Encapsulate pdf-parse logic
   - Show progress feedback
   - Cache results during multi-step upload

3. Update search functions in `useResourceSearch.ts`
   - Already searches `search_text` column
   - Verify it works with PDF text
   - Add PDF-specific result highlighting

**Deliverables:**
- PDF text extraction during upload
- Full-text search working for PDFs
- Progress feedback in upload dialog

**Time Estimate:** 3-4 hours

---

### Phase 4: Policy Documents Manager UI

**Goal:** Replace Policy Management page with PDF-focused interface

**Tasks:**
1. Create `PolicyDocumentsManager.tsx`
   - List all PDFs in "Policies" folder
   - Filter by role assignment
   - Search by title, filename, content
   - Show file size, page count, upload date
   - Edit metadata (title, roles, tags)
   - Delete/archive PDFs
   - Quick actions: view, download, edit, flag

2. Create `PolicyDocumentCard.tsx`
   - Display PDF thumbnail (first page)
   - Show title, file info, roles, tags
   - Action buttons (view, edit, delete)
   - Flag indicator if has active flags
   - Last updated timestamp

3. Update `src/App.tsx` route
   - Change `/dashboard/manager/policies` route
   - Point to new `PolicyDocumentsManager` component
   - Keep URL same for backward compatibility

4. Update navigation in `DashboardLayout.tsx`
   - Update sidebar link text (still "Policies")
   - Maybe update icon to file-text or file-pdf

**Deliverables:**
- New Policy Documents Manager page
- PDF card component
- Updated routing

**Time Estimate:** 5-7 hours

---

### Phase 5: Bulk Upload Interface

**Goal:** Allow uploading multiple PDFs at once with batch metadata

**Tasks:**
1. Create `BulkPdfUploadDialog.tsx`
   - File picker that accepts multiple PDFs
   - Show list of selected files with previews
   - Set metadata that applies to all files:
     - Folder (default: Policies)
     - Role assignment (FoH, BoH, All)
     - Tags (optional)
   - Individual file controls:
     - Custom title per file (default to filename)
     - Remove from batch
   - Progress tracking per file
   - Text extraction for each file
   - Upload queue with concurrent limit (3 at a time)

2. Update `PolicyDocumentsManager.tsx`
   - Add "Bulk Upload" button next to "Upload PDF"
   - Open `BulkPdfUploadDialog` instead of single upload
   - Refresh list after bulk upload completes

3. Create `useBulkPdfUpload.ts` hook
   - Handle concurrent uploads
   - Track progress per file
   - Handle errors gracefully (continue with others)
   - Return summary (X successful, Y failed)

**Deliverables:**
- Bulk upload dialog component
- Bulk upload hook
- Integration with Policy Documents Manager

**Time Estimate:** 4-5 hours

---

### Phase 6: Update Staff Views

**Goal:** Update staff-facing views to show policies from resource pages

**Tasks:**
1. Update `ResourcePagesTab.tsx`
   - Add "Policies" quick filter button
   - Better PDF card display (show page count, file size)
   - Click to open in reading view (inline viewer)

2. Update `StaffResourcesView.tsx`
   - Include PDFs from Policies folder in search results
   - Show PDF icon and page count in results
   - Link to inline viewer

3. Update `ResourcesPoliciesPage.tsx`
   - Point to resource_pages filtered by Policies folder
   - Remove old policies tab
   - Show only PDFs (filter by page_type='pdf')

4. Remove/deprecate old policy components:
   - Archive `PoliciesTab.tsx` (keep file for reference)
   - Remove imports/references to old policies system
   - Update concierge dashboard if it shows policies

**Deliverables:**
- Updated staff views showing PDF policies
- Removed old policy components
- Clean integration with resource pages

**Time Estimate:** 3-4 hours

---

### Phase 7: Testing & Migration Support

**Goal:** Ensure everything works and provide migration path

**Tasks:**
1. Manual testing checklist:
   - ✅ Upload single PDF
   - ✅ Upload bulk PDFs
   - ✅ View PDF inline
   - ✅ Flag specific page in PDF
   - ✅ Search finds text inside PDF
   - ✅ Role assignment works
   - ✅ Edit PDF metadata
   - ✅ Delete PDF
   - ✅ Staff can view PDFs
   - ✅ Flags appear in inbox with page numbers

2. Create migration guide:
   - Document how to export existing policies
   - Provide script/process to convert HTML to PDF if needed
   - List all old policy URLs that need redirects

3. Update documentation:
   - Update README if policies mentioned
   - Add notes about PDF requirements (file size limits, page limits)
   - Document search limitations (OCR not supported for scanned PDFs)

**Deliverables:**
- Tested and verified system
- Migration guide document
- Updated documentation

**Time Estimate:** 2-3 hours

---

## API/Hook Changes

### New Hooks

```typescript
// src/hooks/usePdfTextExtraction.ts
export function usePdfTextExtraction() {
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await extractPdfText(file);
      return text;
    },
  });
}

// src/hooks/useBulkPdfUpload.ts
export function useBulkPdfUpload(folderId: string) {
  return useMutation({
    mutationFn: async (files: File[], metadata: BulkMetadata) => {
      const results = await Promise.allSettled(
        files.map(file => uploadPdfWithText(file, metadata))
      );
      return results;
    },
  });
}

// src/hooks/usePdfPageFlags.ts
export function usePdfPageFlags(pageId: string) {
  return useQuery({
    queryKey: ['pdf-page-flags', pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('resource_flags')
        .select('*')
        .eq('resource_id', pageId)
        .eq('resource_type', 'resource_page');
      return data;
    },
  });
}
```

### Modified Hooks

```typescript
// src/hooks/useResourcePages.ts
// Already exists, no major changes needed

// src/hooks/useResourceSearch.ts
// Already searches search_text column, just verify

// src/hooks/useResourceFlags.ts
// Add support for flagged_page_number parameter
```

---

## Utility Functions

### New Utilities

```typescript
// src/lib/pdfUtils.ts

import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract plain text from PDF file for full-text search
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return ''; // Return empty string on error, don't block upload
  }
}

/**
 * Get page count from PDF
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 0;
  }
}

/**
 * Generate thumbnail from first page
 */
export async function generatePdfThumbnail(
  file: File,
  scale: number = 0.5
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return '';
  }
}
```

---

## Migration Strategy

### For Existing Policies

**Option 1: Archive Only (Recommended)**
- Mark all existing policies as archived
- Don't migrate content
- Staff manually re-upload official PDFs
- Benefit: Clean start with proper PDF documents

**Option 2: HTML to PDF Conversion (Optional)**
- Use a service/library to convert HTML policies to PDF
- Upload converted PDFs to resource_pages
- Link old policy ID to new page ID
- Benefit: No content loss, but PDFs may look unprofessional

**Recommended Approach:**
1. Run deprecation migration (Phase 1)
2. Export list of all policies (titles, categories, content)
3. Managers review list and identify which need PDF versions
4. Bulk upload official PDF versions
5. Archive old system (keep tables for 90 days, then drop)

---

## File Structure

```
src/
├── components/
│   ├── manager/
│   │   ├── policies/                          # NEW FOLDER
│   │   │   ├── PolicyDocumentsManager.tsx     # Main manager component
│   │   │   ├── PolicyDocumentCard.tsx         # PDF card display
│   │   │   └── BulkPdfUploadDialog.tsx        # Bulk upload interface
│   │   └── staff-resources/
│   │       └── ResourcePagesManagement.tsx    # MODIFY (add policies quick link)
│   ├── page-builder/
│   │   └── PdfUploadDialog.tsx                # MODIFY (add text extraction)
│   ├── pdf/                                    # NEW FOLDER
│   │   ├── PdfViewerWithFlags.tsx             # Enhanced PDF viewer
│   │   ├── PdfPageFlagDialog.tsx              # Page-specific flagging
│   │   └── PdfPageNavigator.tsx               # Page navigation controls
│   └── staff-resources/
│       ├── ResourcePagesTab.tsx               # MODIFY (better PDF display)
│       └── PoliciesTab.tsx                    # DEPRECATE (archive file)
├── hooks/
│   ├── usePdfTextExtraction.ts                # NEW
│   ├── useBulkPdfUpload.ts                    # NEW
│   ├── usePdfPageFlags.ts                     # NEW
│   ├── useResourcePages.ts                    # No changes needed
│   └── useResourceFlags.ts                    # MODIFY (add page number support)
├── lib/
│   └── pdfUtils.ts                            # NEW (text extraction, page count)
└── pages/
    ├── manager/
    │   └── PolicyDocumentsPage.tsx            # NEW (or modify route in App.tsx)
    └── ResourcePageReadingPage.tsx            # MODIFY (use enhanced viewer)

supabase/migrations/
├── 20260224000000_add_pdf_text_search.sql
├── 20260224000001_add_page_specific_flags.sql
└── 20260224000002_deprecate_policies_system.sql
```

---

## Testing Checklist

### Upload & Display
- [ ] Upload single PDF with metadata
- [ ] Upload bulk PDFs (5+ files)
- [ ] View PDF inline (all pages render)
- [ ] PDF zoom in/out works
- [ ] PDF page navigation works
- [ ] Download PDF button works
- [ ] Edit PDF metadata (title, roles, tags)
- [ ] Delete PDF removes file from storage

### Search
- [ ] Search finds text in PDF content
- [ ] Search highlights matches
- [ ] Search works across multiple PDFs
- [ ] Search respects role filtering
- [ ] Empty search shows all policies

### Flagging
- [ ] Flag specific page in PDF
- [ ] Flag appears in inbox with page number
- [ ] Click flag opens PDF to correct page
- [ ] Multiple flags on different pages
- [ ] Resolve flag removes from inbox
- [ ] PDF shows indicator if has flags

### Role Assignment
- [ ] Assign to FoH only
- [ ] Assign to BoH only
- [ ] Assign to All roles
- [ ] Staff can only see assigned PDFs
- [ ] Managers see all PDFs

### Organization
- [ ] PDFs in Policies folder show correctly
- [ ] Folder filtering works
- [ ] Tag filtering works
- [ ] Sort by title, date, file size

---

## Success Criteria

1. ✅ All policies accessible as PDFs in resource_pages
2. ✅ Full-text search finds content inside PDFs
3. ✅ Staff can view PDFs inline without downloading
4. ✅ Page-specific flagging functional
5. ✅ Bulk upload handles 10+ PDFs without issues
6. ✅ Role assignment controls PDF visibility
7. ✅ Old policies system deprecated but recoverable
8. ✅ No broken links or missing documents
9. ✅ Performance acceptable (PDFs load < 3 seconds)
10. ✅ Mobile view works (responsive PDF viewer)

---

## Rollback Plan

If issues arise:

1. **Immediate**: Revert App.tsx routing to old policies page
2. **Short-term**: Keep old policies active alongside new system
3. **Long-term**: Don't drop old tables for 90 days after launch

**Rollback Steps:**
```sql
-- Restore old policies system
UPDATE public.club_policies SET archived_at = NULL;
UPDATE public.policy_categories SET archived_at = NULL;

-- In App.tsx, restore old route:
// <Route path="/dashboard/manager/policies" element={<PolicyManagementPage />} />
```

---

## Timeline Estimate

| Phase | Tasks | Hours |
|-------|-------|-------|
| Phase 1 | Database & Text Extraction | 2-3 |
| Phase 2 | Enhanced PDF Viewer | 4-6 |
| Phase 3 | Full-Text Search | 3-4 |
| Phase 4 | Policy Documents Manager | 5-7 |
| Phase 5 | Bulk Upload Interface | 4-5 |
| Phase 6 | Update Staff Views | 3-4 |
| Phase 7 | Testing & Migration | 2-3 |
| **Total** | | **23-32 hours** |

**Recommendation:** Break into 3-4 coding sessions of 6-8 hours each.

---

## Dependencies

### NPM Packages to Install

```bash
npm install react-pdf pdfjs-dist
npm install --save-dev @types/pdfjs-dist
```

**Note:** `pdf-parse` is a Node.js library and won't work in browser. We'll use `pdfjs-dist` for both text extraction and rendering.

### Supabase Storage

Already configured:
- ✅ `resource-page-assets` bucket exists
- ✅ `pdfs/` prefix for PDF files
- ✅ RLS policies for public read, manager write

---

## Known Limitations

1. **Scanned PDFs**: Text extraction won't work on image-based PDFs without OCR
2. **Large Files**: Set max file size limit (recommend 50MB per PDF)
3. **Page Count**: Very large PDFs (500+ pages) may be slow to render
4. **Mobile**: Inline PDF viewer may have limited functionality on mobile
5. **Search Accuracy**: PDF text extraction not perfect for complex layouts

---

## Future Enhancements (Not in Scope)

- ❌ OCR for scanned PDFs (requires cloud service)
- ❌ PDF annotation/markup tools
- ❌ Version history for PDFs
- ❌ Digital signatures on PDFs
- ❌ PDF form field filling
- ❌ Merge/split PDFs
- ❌ Convert other formats to PDF

---

## Questions & Answers

**Q: What happens to existing policies?**
A: They're archived but not deleted. Managers can reference old content when creating PDF versions.

**Q: Can we still create HTML policies?**
A: No, the new system is PDF-only. Use resource pages with TipTap builder for HTML content.

**Q: What's the max PDF file size?**
A: Recommend 50MB limit. Can be configured in upload dialog.

**Q: Do PDFs work on mobile?**
A: Yes, but may offer "Download to view" option on small screens for better UX.

**Q: Can staff download PDFs?**
A: Yes, download button included in viewer.

**Q: How accurate is the text search?**
A: Very good for text-based PDFs. Won't work on scanned/image PDFs without OCR.

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Implement Phase 1 (Database schema)
3. ⏳ Implement Phase 2 (PDF viewer)
4. ⏳ Implement Phase 3 (Search)
5. ⏳ Implement Phase 4 (Manager UI)
6. ⏳ Implement Phase 5 (Bulk upload)
7. ⏳ Implement Phase 6 (Staff views)
8. ⏳ Implement Phase 7 (Testing)
9. ⏳ Deploy and announce to staff
10. ⏳ Drop old tables after 90 days

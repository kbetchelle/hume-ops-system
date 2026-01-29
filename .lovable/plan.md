
# Phase 3: Concierge Dashboard Components Implementation Plan

## Overview

This plan implements 4 new feature areas from the Phase 3 reference file, adding Response Templates with AI Suggester, Quick Links, Lost & Found tracking, and a Staff Documents library to the Concierge Dashboard. Each feature includes both staff-facing views and management CRUD components.

---

## Phase 1: Database Schema

### New Tables Required

**1. response_templates** - Email/response templates with categorization and tags
```text
- id: uuid (PK)
- category: text (e.g., 'Membership Inquiries', 'Guest Passes')
- title: text
- content: text
- tags: text[]
- is_active: boolean (default true)
- created_at: timestamptz
```

**2. quick_links** - Configurable external link grid
```text
- id: uuid (PK)
- category: text (e.g., 'Booking Systems', 'Emergency')
- title: text
- url: text
- icon: text
- sort_order: int (default 0)
- is_active: boolean (default true)
- created_at: timestamptz
```

**3. lost_and_found** - Lost item tracking with status workflow
```text
- id: uuid (PK)
- description: text
- location_found: text
- date_found: date
- found_by_id: uuid (FK auth.users)
- found_by_name: text
- status: text ('unclaimed' | 'claimed' | 'disposed')
- claimed_by: text
- claimed_date: date
- notes: text
- created_at: timestamptz
```

**4. staff_documents** - Document library with role-based visibility
```text
- id: uuid (PK)
- title: text
- description: text
- category: text
- file_url: text
- file_type: text
- file_size: int (default 0)
- target_roles: text[]
- is_active: boolean (default true)
- uploaded_by: text
- created_at: timestamptz
- updated_at: timestamptz
```

### RLS Policies
- **response_templates**: Read for all authenticated, write for management
- **quick_links**: Read for all authenticated, write for management
- **lost_and_found**: Read for all authenticated, insert/update for concierge and management
- **staff_documents**: Read filtered by target_roles, write for management

---

## Phase 2: Data API Permissions

Update `supabase/functions/data-api/index.ts` TABLE_PERMISSIONS:

```text
'response_templates': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] }
'quick_links': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] }
'lost_and_found': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert', 'update'] }
'staff_documents': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] }
```

---

## Phase 3: Component File Structure

### Staff-Facing Components (Concierge Dashboard)
```text
src/components/concierge/
├── ResponseTemplatesWithAI.tsx   # Searchable templates + AI suggester
├── QuickLinks.tsx                # Categorized link grid
├── LostAndFoundTab.tsx           # Item tracking with claim workflow
└── StaffDocumentsView.tsx        # Document library with preview
```

### Management Components (Manager Dashboard)
```text
src/components/concierge/
├── ResponseTemplatesManager.tsx  # CRUD for templates
└── QuickLinksManager.tsx         # CRUD for quick links
```

---

## Phase 4: Component Implementation Details

### 1. ResponseTemplatesWithAI (`ResponseTemplatesWithAI.tsx`)

**Purpose**: Searchable response template library with AI-powered suggestion

**Features**:
- Two tabs: "Browse Templates" and "AI Suggester"
- Search by title, content, or tags
- Filter by category dropdown
- Templates grouped by category in accordion
- Copy-to-clipboard functionality with toast confirmation
- AI Suggester: Paste member inquiry, find best matching template using keyword scoring

**Key UI Elements**:
- Card with tabbed interface
- Search input with category filter
- Accordion of template categories
- Each template expands to show content + "Copy to Clipboard" button
- AI tab with textarea and "Find Best Template" button
- Suggested template highlighted with "Suggested" badge

**Data Flow**:
```text
selectFrom('response_templates', { filters: [{ type: 'eq', column: 'is_active', value: true }] })
```

---

### 2. QuickLinks (`QuickLinks.tsx`)

**Purpose**: Categorized grid of external links for quick access

**Features**:
- Links grouped by category (Booking Systems, Member Lookup, etc.)
- Each link opens in new tab
- Simple 2-column grid per category
- Skeleton loading state

**Key UI Elements**:
- Card with category sections
- 2-column grid of link buttons
- External link icon on each button
- Category headers in uppercase

**Data Flow**:
```text
selectFrom('quick_links', { 
  filters: [{ type: 'eq', column: 'is_active', value: true }],
  order: { column: 'sort_order', ascending: true }
})
```

---

### 3. LostAndFoundTab (`LostAndFoundTab.tsx`)

**Purpose**: Track lost items with status workflow (unclaimed -> claimed/disposed)

**Features**:
- Search by description or location
- Filter by status: All, Unclaimed, Claimed, Disposed
- "Log Item" dialog to add new found items
- "Claim" workflow with claimant name
- "Dispose" action for old items
- Status badges with color coding (amber: unclaimed, green: claimed, gray: disposed)
- Item details: location, date found, found by, claimed by

**Key UI Elements**:
- Card with search + status filter
- Item list with status badges
- "Log Item" button in header
- Each unclaimed item has "Claim" and "Dispose" buttons
- Claim dialog captures claimant name and notes
- Add dialog captures description, location, notes

**Status Colors**:
- Unclaimed: `bg-amber-500`
- Claimed: `bg-green-500`
- Disposed: `bg-gray-500`

**Data Flow**:
```text
// Fetch items
selectFrom('lost_and_found', { order: { column: 'created_at', ascending: false } })

// Log new item
insertInto('lost_and_found', { description, location_found, date_found, found_by_id, found_by_name, status: 'unclaimed' })

// Claim item
updateTable('lost_and_found', { status: 'claimed', claimed_by, claimed_date }, [{ type: 'eq', column: 'id', value: itemId }])

// Dispose item
updateTable('lost_and_found', { status: 'disposed' }, [{ type: 'eq', column: 'id', value: itemId }])
```

---

### 4. StaffDocumentsView (`StaffDocumentsView.tsx`)

**Purpose**: Document library with search, categories, and preview

**Features**:
- Search by title or description
- Filter by category: Training Materials, Procedures, Forms, Policies, Reference
- Documents grouped by category
- File type icons (PDF, image, video, spreadsheet, document)
- File size display (formatted: KB, MB)
- Last updated date
- Preview dialog for PDFs and images
- Download button for all files

**Key UI Elements**:
- Card with search + category filter
- Category-grouped document list
- Each document shows icon, title, description, size, date
- "Preview" and "Download" buttons per document
- Preview dialog with iframe for PDFs, img for images, fallback for others

**Data Flow**:
```text
selectFrom('staff_documents', { 
  filters: [{ type: 'eq', column: 'is_active', value: true }],
  order: { column: 'title', ascending: true }
})
```

---

### 5. ResponseTemplatesManager (`ResponseTemplatesManager.tsx`)

**Purpose**: Management CRUD for response templates

**Features**:
- List all templates (active and inactive)
- Add/Edit dialog with category, title, content, tags
- Toggle active/inactive status
- Delete templates
- Tag input (comma-separated or multi-input)

**Key UI Elements**:
- Card with "Add Template" button
- List of templates with edit/toggle/delete actions
- Dialog form with textarea for content
- Category dropdown selector

---

### 6. QuickLinksManager (`QuickLinksManager.tsx`)

**Purpose**: Management CRUD for quick links

**Features**:
- List all links with drag handle for reordering (future)
- Add/Edit dialog with title, URL, category
- Delete links
- Category badge display

**Key UI Elements**:
- Card with "Add Link" button
- List of links showing title, URL, category
- Edit/Delete buttons per link
- Dialog form for add/edit

---

## Phase 5: Dashboard Integration

### Update ConciergeDashboard.tsx

Map new views to components:
```text
case "templates":   -> <ResponseTemplatesWithAI />
case "quick-links": -> <QuickLinks />
case "lost-found":  -> <LostAndFoundTab />
case "documents":   -> <StaffDocumentsView />
```

### Update ManagerDashboard.tsx (optional)

Add navigation cards for:
- "Response Templates" -> `/dashboard/templates` or embedded component
- "Quick Links" -> `/dashboard/quick-links` or embedded component

---

## Phase 6: Seed Data

Insert sample data for immediate usability:

**Response Templates (5 samples)**:
- Membership Options Overview (category: Membership Inquiries)
- Guest Pass Policy (category: Guest Passes)
- Hours of Operation (category: Facility Questions)
- Complaint Acknowledgment (category: Complaints)
- Thank You Response (category: General)

**Quick Links (5 samples)**:
- Arketa Dashboard (Booking Systems)
- Class Schedule (Booking Systems)
- Member Database (Member Lookup)
- Staff Portal (Internal Tools)
- Emergency Procedures (Emergency)

---

## Technical Considerations

### Design System Compliance
All components follow the "Fear of God" aesthetic:
- `rounded-none` for all borders
- `text-xs uppercase tracking-wider` for headers
- `hover:bg-muted/50` for interactive elements
- `bg-primary/5` for active/selected states
- Icon sizes: h-4 w-4 (headers), h-3 w-3 (inline)

### Type Definitions

```typescript
interface ResponseTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface QuickLink {
  id: string;
  category: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface LostFoundItem {
  id: string;
  description: string;
  location_found: string;
  date_found: string;
  found_by_id: string;
  found_by_name: string;
  status: 'unclaimed' | 'claimed' | 'disposed';
  claimed_by: string | null;
  claimed_date: string | null;
  notes: string | null;
  created_at: string;
}

interface StaffDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: number;
  target_roles: string[];
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}
```

---

## Implementation Order

1. **Database Migration**: Create all 4 tables with RLS policies and seed data
2. **Data API Update**: Add table permissions to edge function
3. **Staff Components** (in order):
   - ResponseTemplatesWithAI (templates view)
   - QuickLinks (quick-links view)
   - LostAndFoundTab (lost-found view)
   - StaffDocumentsView (documents view)
4. **Management Components**:
   - ResponseTemplatesManager
   - QuickLinksManager
5. **Dashboard Integration**: Update ConciergeDashboard switch statements

---

## Summary

| Component | Table | Staff View | Manager View |
|-----------|-------|------------|--------------|
| Response Templates | response_templates | ResponseTemplatesWithAI | ResponseTemplatesManager |
| Quick Links | quick_links | QuickLinks | QuickLinksManager |
| Lost & Found | lost_and_found | LostAndFoundTab | (inline CRUD) |
| Documents | staff_documents | StaffDocumentsView | (future upload UI) |

Total new files: 6 components + 1 migration

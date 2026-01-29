
# Phase 2: Concierge Dashboard Components Implementation Plan

## Overview

This plan implements 8 components from the Phase 2 reference file, splitting them into individual files and integrating them into the existing Concierge Dashboard. The database tables needed (`shift_reports`, `staff_announcements`, `staff_announcement_reads`, `staff_messages`, `staff_message_reads`) already exist. We need to add 2 new tables (`club_policies`, `staff_qa`, `staff_notifications`).

---

## Phase 1: Database Schema Updates

### New Tables Required

1. **club_policies** - For policy documents
   - `id`, `title`, `content`, `category`, `sort_order`, `is_active`, `last_updated_by`, `created_at`, `updated_at`

2. **staff_qa** - For Q&A with policy linking
   - `id`, `question`, `context`, `answer`, `answer_type`, `linked_policy_id`, `asked_by_id`, `asked_by_name`, `answered_by_id`, `answered_by_name`, `is_resolved`, `is_public`, `parent_id`, `created_at`, `updated_at`

3. **staff_notifications** - For notification bell
   - `id`, `user_id`, `type`, `title`, `body`, `data`, `is_read`, `created_at`

### Schema Modifications

Update `shift_reports` table to add:
- `is_draft` (boolean) - Track draft vs submitted status

---

## Phase 2: Component File Structure

Create the following files in `src/components/concierge/`:

```text
src/components/concierge/
├── ConciergeShiftReport.tsx      # Shift report form with auto-save
├── AnnouncementsBoard.tsx        # Staff view of announcements  
├── AnnouncementsManager.tsx      # Management CRUD for announcements
├── StaffMessagesInbox.tsx        # Internal staff messaging
├── PoliciesAndQA.tsx             # Combined policies & Q&A view
├── QAManager.tsx                 # Management Q&A answering
└── NotificationBell.tsx          # Header notification dropdown
```

Create hook file:
```text
src/hooks/useShiftReports.ts      # Hook for report data fetching
```

---

## Phase 3: Component Implementation Details

### 1. ConciergeShiftReport (`ConciergeShiftReport.tsx`)
**Purpose**: Shift report form with auto-save and draft/submit workflow

**Features**:
- Fetches existing report for today's date and current shift
- 9 form fields: weather, summary, tour notes, member feedback, facility issues, incidents, cafe notes, handoff notes, other notes
- Auto-save draft every 30 seconds when dirty
- Manual "Save Draft" and "Submit Report" buttons
- Shows "Submitted" badge and disables form after submission
- Uses `upsertInto` with conflict on `report_date,shift_type`

**Key UI Elements**:
- Card with header showing shift type and date badge
- Status indicators: "Unsaved changes", "Saved [time]", "Submitted"
- Progress skeleton during loading

### 2. useShiftReports Hook (`useShiftReports.ts`)
**Purpose**: Data fetching hook for shift reports

**Exports**:
- `useShiftReports(options)` - Fetch list with date range and limit
- `useShiftReport(date, shiftType)` - Fetch single report

### 3. AnnouncementsBoard (`AnnouncementsBoard.tsx`)
**Purpose**: Staff view of announcements with tabs and read tracking

**Features**:
- Two tabs: "Alerts" and "Weekly Update"
- IntersectionObserver auto-marks announcements as read after 1.5s
- Priority styling: urgent (red border), high (amber), normal (default)
- Weekly update navigation with previous/next week buttons
- Unread badges with animation
- Fetches from `staff_announcements` and `staff_announcement_reads`

**Key UI Elements**:
- Tabbed card with badge counts
- Alert items with priority badges
- Weekly update viewer with week navigation

### 4. AnnouncementsManager (`AnnouncementsManager.tsx`)
**Purpose**: Management CRUD for announcements

**Features**:
- Create/Edit dialog for alerts and weekly updates
- Toggle active/inactive status
- Delete announcements
- Filter by type: All, Alerts, Weekly Updates
- Target departments multi-select (Concierge, Trainers, Spa, Cafe, Management)
- Priority selection (normal, high, urgent)
- Expiration options (1 day to never)

**Key UI Elements**:
- List view with edit/delete/toggle actions
- Modal dialog for create/edit form
- Department checkboxes

### 5. StaffMessagesInbox (`StaffMessagesInbox.tsx`)
**Purpose**: Internal staff messaging system

**Features**:
- Inbox and Sent tabs
- Message detail dialog with reply option
- Compose dialog with recipient selector
- Read tracking with `staff_message_reads`
- Unread count badge
- Staff list fetched from `profiles` table (adapting from reference)

**Key UI Elements**:
- Two-tab inbox/sent layout
- Message list with avatars
- Compose and reply dialogs

### 6. PoliciesAndQA (`PoliciesAndQA.tsx`)
**Purpose**: Staff view of policies and Q&A system

**Features**:
- Policies tab: Accordion by category with search
- Q&A tab: Submit questions, view pending/resolved
- Policy-linked answers show policy link
- Direct answers shown inline
- Filter Q&A by status: all, resolved, pending
- "My pending questions" section

**Key UI Elements**:
- Search input
- Category-grouped accordion for policies
- Question submission form
- Q&A list with status badges

### 7. QAManager (`QAManager.tsx`)
**Purpose**: Management view for answering staff Q&A

**Features**:
- List of pending and resolved questions
- Answer dialog with two modes:
  - Direct answer (text)
  - Link to existing policy
  - Create new policy and link
- Notifications sent to question asker on answer
- Search and status filter

**Key UI Elements**:
- Pending count badge
- Answer mode radio buttons
- Policy selector or policy creation form
- Notification preview

### 8. NotificationBell (`NotificationBell.tsx`)
**Purpose**: Header notification dropdown

**Features**:
- Bell icon with unread count badge
- Dropdown with notification list (max 10 shown)
- "Mark all read" button
- Click to mark individual as read
- Auto-refetch every 30 seconds
- Different icons by notification type

**Key UI Elements**:
- Dropdown menu from header
- Notification items with type icons
- Unread indicator dot

---

## Phase 4: Dashboard Integration

### Update ConciergeDashboard.tsx

Map views to components:
- `report` → `<ConciergeShiftReport />`
- `announcements` → `<AnnouncementsBoard />`
- `messages` → `<StaffMessagesInbox />`
- `policies-qa` → `<PoliciesAndQA />`

### Update ConciergeHeader.tsx

Add `<NotificationBell />` to header actions, between RoleSwitcher and shift badge.

### Management Views

Create routes/integration for management-only components:
- `AnnouncementsManager` - Accessible from Manager dashboard
- `QAManager` - Accessible from Manager dashboard

---

## Phase 5: Type Definitions

Add TypeScript interfaces in each component or create shared types file:

```typescript
interface ShiftReportFormData {
  weather: string;
  summary: string;
  tour_notes: string;
  member_feedback: string;
  facility_issues: string;
  incidents: string;
  handoff_notes: string;
  cafe_notes: string;
  other_notes: string;
}

interface Announcement { /* ... */ }
interface Message { /* ... */ }
interface Policy { /* ... */ }
interface QAEntry { /* ... */ }
interface Notification { /* ... */ }
```

---

## Technical Details

### Database Migration SQL

```sql
-- Club policies table
CREATE TABLE IF NOT EXISTS club_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  last_updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Q&A with policy linking
CREATE TABLE IF NOT EXISTS staff_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  context text,
  answer text,
  answer_type text CHECK (answer_type IN ('policy_link', 'direct_answer')),
  linked_policy_id uuid REFERENCES club_policies(id),
  asked_by_id uuid REFERENCES auth.users(id),
  asked_by_name text NOT NULL,
  answered_by_id uuid REFERENCES auth.users(id),
  answered_by_name text,
  is_resolved boolean DEFAULT false,
  is_public boolean DEFAULT true,
  parent_id uuid REFERENCES staff_qa(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff notifications
CREATE TABLE IF NOT EXISTS staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast notification lookup
CREATE INDEX IF NOT EXISTS idx_staff_notifications_user_unread
  ON staff_notifications(user_id, is_read)
  WHERE is_read = false;

-- Add is_draft to shift_reports if not exists
ALTER TABLE shift_reports 
  ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT true;
```

### RLS Policies

All new tables will need RLS policies:
- `club_policies`: Read for all authenticated, write for managers/admins
- `staff_qa`: Read own questions + public, submit for all, answer for managers
- `staff_notifications`: Users can only see their own

### Data API Permissions

Add to edge function TABLE_PERMISSIONS:
```typescript
'club_policies': { management: ['select', 'insert', 'update', 'delete'], staff: ['select'] },
'staff_qa': { management: ['select', 'insert', 'update', 'delete'], staff: ['select', 'insert'] },
'staff_notifications': { management: ['select', 'insert', 'update'], staff: ['select', 'update'] },
```

---

## Implementation Order

1. **Database**: Create migration for new tables and RLS policies
2. **Types & Hooks**: Create `useShiftReports.ts` hook
3. **Core Components** (in order):
   - NotificationBell (standalone, header integration)
   - ConciergeShiftReport (shift report view)
   - AnnouncementsBoard (announcements view)
   - StaffMessagesInbox (messages view)
   - PoliciesAndQA (policies-qa view)
4. **Management Components**:
   - AnnouncementsManager
   - QAManager
5. **Integration**: Update ConciergeDashboard and ConciergeHeader

---

## Design System Compliance

All components will follow the existing "Fear of God" inspired design:
- `rounded-none` for all borders
- `text-xs uppercase tracking-wider` for headers
- `hover:bg-muted/50` for interactive elements
- `bg-primary/5` for active/selected states
- Icon sizes: h-4 w-4 (headers), h-3 w-3 (inline)
- Sharp, minimal aesthetic with subtle borders

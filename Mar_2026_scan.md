# HUME Ops System — Code Scan Report (Mar 2026)

**Date:** March 3, 2026

---

## Priority Legend

| Level | Meaning |
|-------|---------|
| **P1 — High** | Real bugs or data integrity risks; fix this sprint |
| **P2 — Medium** | Fragile patterns or missing error handling; fix next sprint |
| **P3 — Low** | Quality improvements, backlog |

---

## P1 — High Priority

---

### ISSUE-01 · Saved drafts loaded without validation
**File:** `src/components/concierge/ConciergeForm.tsx:196`

**Plain-language explanation:**
The concierge form auto-saves work-in-progress to the database and reloads it the next time the
same shift is opened. When it loads a saved draft, it assumes the data has the exact same shape
as the current form — no checking is done. If a developer adds a new required field to the form,
old drafts won't have it. The form will silently load incomplete data, which can cause invisible
fields, wrong values, or a crash when the form is submitted. Think of it like opening a document
in a newer version of an app where the format changed — except the app shows nothing is wrong.

**Current code:**
```typescript
// ConciergeForm.tsx:196
const loadedFormData = draft.form_data as unknown as FormDataType;
setFormData({
  ...loadedFormData,
  cafeNotes: (loadedFormData as { cafeNotes?: string }).cafeNotes ?? '',
  shiftTime: normalizeShiftType(shift),
  _sessionId: sessionId
});
```
`as unknown as FormDataType` tells TypeScript "trust me, this is fine" with no runtime validation.

**Proposed fix:**
Validate the draft data against a schema before using it. Merge valid fields on top of defaults so
the user gets as much of their saved work as possible, without crashing if a field is missing.

```typescript
import { z } from 'zod';

const DraftSchema = z.object({
  shiftTime: z.enum(['AM', 'PM']).optional(),
  reportDate: z.string().optional(),
  // mirror remaining FormDataType fields as .optional()
}).passthrough();

const result = DraftSchema.safeParse(draft.form_data);
if (result.success) {
  setFormData({ ...defaultFormData, ...result.data, _sessionId: sessionId });
} else {
  console.warn('Draft data did not match expected schema — starting fresh:', result.error);
  // Optionally toast the user that their draft could not be restored
}
```

---

### ISSUE-02 · Dashboard fires 5+ separate network requests on every page navigation
**File:** `src/components/layout/DashboardLayout.tsx:9–22, 357–359, 670, 786–798`

**Plain-language explanation:**
Every time a staff member navigates between pages in the dashboard, the app asks the server
several independent questions simultaneously: "How many unread bug reports? How many unread
messages? How many inbox items? What notification badges should show? Does this user need a
walkthrough?" On a slow or mobile connection, sidebar badges take a moment to appear after every
navigation. Since these counts only change when someone actually sends a message or files a report,
asking the server every single time a page loads is unnecessary work.

Additionally, `useUnreadMessageCount` is called **three separate times** within the same component
(lines 357, 795, and within a sub-component at line 551), so the same data is fetched and cached
three times independently.

**Current hooks with no staleTime (all fire on every render):**
```typescript
useUnreadBugReportCount()      // DB query — no staleTime
useUnreadMessageCount()         // DB query — no staleTime, called 3× in the same file
useUnreadNotificationCount()    // DB query — no staleTime
useUnreadInboxCount()           // DB query — no staleTime
useNeedsWalkthrough()           // DB query — no staleTime
```

**Proposed fix — two steps:**

**Step 1:** Fix the triple `useUnreadMessageCount` call. The sub-component inside DashboardLayout
that makes the third call should be extracted to its own file so React Query's cache is shared
instead of creating a redundant request.

**Step 2:** Add `staleTime` to each unread-count query so they don't re-fetch on every navigation.
These counts are also updated in real-time via subscriptions, so polling on every nav is redundant.

```typescript
// In useUnreadMessageCount.ts, useUnreadNotificationCount.ts, useUnreadInboxCount.ts:
const query = useQuery({
  queryKey: ['unread-message-count', user?.id],
  queryFn: async () => { /* existing fetch */ },
  staleTime: 60_000,   // treat as fresh for 60 seconds
  gcTime: 5 * 60_000,  // keep in cache for 5 minutes
});
```

---

## P2 — Medium Priority

---

### ISSUE-03 · Editor permission changes have no error feedback on failure
**File:** `src/components/page-builder/DelegatedEditorsManager.tsx:126–136`

**Plain-language explanation:**
Admins and managers can grant other staff members edit access to resource pages. When you add
or remove someone as an editor, the app sends a request to the server. If that request fails
(server error, network drop), nothing catches the error — the UI may silently stay in its
current state or leave the button in a loading spinner with no message to the user. The admin
has no way to know whether the change went through.

**Current code:**
```typescript
const handleAddEditor = async (userId: string) => {
  if (!pageId) return;
  await addEditorMutation.mutateAsync({ pageId, userId }); // no try-catch
  setSearchOpen(false);
  setSearchTerm("");
};

const handleRemoveEditor = async (userId: string) => {
  if (!pageId) return;
  await removeEditorMutation.mutateAsync({ pageId, userId }); // no try-catch
};
```

**Proposed fix:**
```typescript
const handleAddEditor = async (userId: string) => {
  if (!pageId) return;
  try {
    await addEditorMutation.mutateAsync({ pageId, userId });
    setSearchOpen(false);
    setSearchTerm("");
  } catch (error) {
    toast({ title: 'Failed to add editor', description: 'Please try again.', variant: 'destructive' });
    console.error('Add editor error:', error);
  }
};

const handleRemoveEditor = async (userId: string) => {
  if (!pageId) return;
  try {
    await removeEditorMutation.mutateAsync({ pageId, userId });
  } catch (error) {
    toast({ title: 'Failed to remove editor', description: 'Please try again.', variant: 'destructive' });
    console.error('Remove editor error:', error);
  }
};
```

---

### ISSUE-04 · Realtime subscription filter uses unvalidated string interpolation
**File:** `src/components/concierge/ConciergeForm.tsx:373–381`

**Plain-language explanation:**
The concierge form watches the database for live changes (so two concierges on the same shift
see each other's edits in real-time). The filter that tells the database which records to watch
is built by pasting the date and shift type directly into a string with no validation first. The
current values come from a date picker and a two-option dropdown, so there is no immediate risk.
But it is a fragile pattern — if either value were ever sourced from free text, or if the Supabase
filter parser changes, unexpected characters could produce a malformed filter or be silently ignored,
causing the realtime subscription to stop working without any error shown to the user.

**Current code:**
```typescript
filter: `report_date=eq.${reportDate},shift_time=eq.${shiftType}`
```

**Proposed fix:**
Validate both values before they reach the filter string:

```typescript
const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(reportDate) ? reportDate : null;
const safeShift = (['AM', 'PM'] as const).includes(shiftType as 'AM' | 'PM') ? shiftType : null;

if (!safeDate || !safeShift) {
  console.error('Invalid reportDate or shiftType — skipping realtime subscription');
  return;
}

filter: `report_date=eq.${safeDate},shift_time=eq.${safeShift}`
```

---

### ISSUE-05 · Dashboard sidebar re-renders on every badge update
**File:** `src/components/layout/DashboardLayout.tsx` (953 lines)

**Plain-language explanation:**
The DashboardLayout wraps every page. It contains the sidebar, top nav, badge counts, and user
menu — all in one 953-line component. Any state change anywhere (a badge count ticking up, the
sidebar opening or closing) causes the entire component tree inside it to re-render, including
the navigation link list which never changes. On slower devices this can cause a visible flicker
or lag whenever a notification badge updates. The sidebar nav tree and user menu are stable
sections that only need to re-render when their own data changes.

**Proposed fix:**
Extract the sidebar nav and user menu into named sub-components and wrap them with `React.memo`:

```typescript
const SidebarNavLinks = React.memo(({ navItems, currentPath }: NavLinksProps) => {
  return (
    <SidebarMenu>
      {navItems.map(item => <NavItem key={item.path} {...item} />)}
    </SidebarMenu>
  );
});
SidebarNavLinks.displayName = 'SidebarNavLinks';
```

This means the nav list only re-renders when `navItems` or `currentPath` actually change, not
when an unrelated badge count updates.

---

## P3 — Low Priority / Backlog

---

### ISSUE-06 · No limit on message length
**File:** `src/components/foh/messages/` (compose views)

**Plain-language explanation:**
Staff can type messages of any length with no counter or limit shown. Very long messages get
truncated in push notification previews and can cause layout issues in the message list. A
character counter with a soft limit would set clear expectations and prevent edge cases in the
notification system.

**Current code (no maxLength):**
```typescript
<Textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Type your message..."
  rows={10}
  className="rounded-none"
  disabled={isPending}
/>
```

**Proposed fix:**
```typescript
const MAX_MESSAGE_LENGTH = 5000;

<Textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  maxLength={MAX_MESSAGE_LENGTH}
  placeholder="Type your message..."
  rows={10}
  className="rounded-none"
  disabled={isPending}
/>
<p className={`text-xs text-right mt-1 ${
  content.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-500' : 'text-muted-foreground'
}`}>
  {content.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
</p>
```

Also add a guard in `useMessageMutations.ts` as a server-side safeguard:
```typescript
if (content.length > 5000) throw new Error('Message exceeds maximum length of 5,000 characters');
```

---

### ISSUE-07 · CSV import accepts files with missing required columns
**File:** `src/components/backfill/CSVImportMapper.tsx`

**Plain-language explanation:**
When importing historical data from a CSV file (reservations, payments, shifts), the importer
lets you upload any file and then map its columns manually. There is no upfront check that the
file contains the columns the import actually needs. If someone uploads the wrong file or a
file exported in the wrong format, the problem only surfaces deep into the import — sometimes
after thousands of rows have already been processed — with a confusing error.

**Proposed fix:**
After the file is parsed and headers are available, check for required columns before showing
the mapping UI:

```typescript
const REQUIRED_COLUMNS: Record<string, string[]> = {
  arketa_reservations: ['reservation_id', 'member_id', 'class_date'],
  arketa_subscriptions: ['subscription_id', 'member_id', 'start_date'],
  arketa_payments:      ['payment_id', 'member_id', 'amount'],
  staff_shifts:         ['shift_id', 'staff_id', 'start_time'],
};

const missingColumns = (REQUIRED_COLUMNS[selectedTable] ?? [])
  .filter(col => !csvHeaders.includes(col));

if (missingColumns.length > 0) {
  toast({
    title: 'Missing required columns',
    description: `This file is missing: ${missingColumns.join(', ')}`,
    variant: 'destructive',
  });
  return; // don't proceed to the mapping step
}
```

---

### ISSUE-08 · No shared query key convention across hooks
**File:** `src/hooks/` and `src/integrations/` throughout

**Plain-language explanation:**
The app uses a caching system (React Query) that saves server responses so pages don't have to
re-fetch data they just loaded. For the cache to work correctly, every hook that fetches the same
data must use the exact same label (query key) for that data. Currently different hooks use
different labels for the same data — for example, staff lists appear under `'profiles-list'`,
`'staff-documents'`, and `'staffShifts'` (camelCase vs. hyphenated). This means the cache can't
recognize they're related, so the same data gets fetched multiple times independently instead of
being shared.

**Proposed fix:**
Create a central query key file and use it everywhere:

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  staff:         { all: ['staff'] as const,        byId: (id: string) => ['staff', id] as const },
  members:       { all: ['members'] as const,       byId: (id: string) => ['members', id] as const },
  shifts:        { all: ['shifts'] as const,        byDate: (d: string) => ['shifts', d] as const },
  messages:      { all: ['messages'] as const },
  announcements: { all: ['announcements'] as const },
} as const;
```

Replace all inline string arrays like `['staff-list']`, `['staffShifts']`, `['profiles-list']`
with the corresponding `queryKeys.*` entry. This is a gradual refactor — start with the hooks
called from 3+ different places.

---

## Summary Table

| # | File | Priority | Effort |
|---|------|----------|--------|
| ISSUE-01 | `ConciergeForm.tsx:196` | **P1** | Medium — add Zod schema |
| ISSUE-02 | `DashboardLayout.tsx:9–798` | **P1** | Medium — staleTime + dedup triple call |
| ISSUE-03 | `DelegatedEditorsManager.tsx:126` | **P2** | Small — add try-catch |
| ISSUE-04 | `ConciergeForm.tsx:379` | **P2** | Small — add input guards |
| ISSUE-05 | `DashboardLayout.tsx` | **P2** | Medium — extract + React.memo |
| ISSUE-06 | FOH message compose | **P3** | Small — maxLength + counter |
| ISSUE-07 | `CSVImportMapper.tsx` | **P3** | Small — column pre-validation |
| ISSUE-08 | `src/hooks/` throughout | **P3** | Large — gradual refactor |

---

*Generated March 3, 2026.*



## Notifications Icon + Concierge Header Layout Fix

### 1. Fix Concierge header/sidebar overlap

**Problem**: The Concierge dashboard renders `ConciergeHeader` spanning full width above the sidebar+content row. The Admin/Manager `DashboardLayout` correctly places the header only in the content column next to the sidebar.

**Fix**: Restructure `ConciergeDashboard.tsx` to match the `DashboardLayout` pattern -- sidebar sits alongside a column containing the header + content, so the header only fills the space to the right of the nav menu.

Current (broken):
```text
+------ full width header ------+
| sidebar | content             |
+--------+----------------------+
```

Target (matching Admin layout):
```text
+--------+---------------------+
| sidebar| header (fills rest) |
|        +---------------------+
|        | content             |
+--------+---------------------+
```

### 2. Add NotificationBell to all headers (same position for all users)

**Placement**: In the header, between the page title and the HUME logo -- consistent across all dashboards.

**Changes**:
- Import and render `NotificationBell` in `DashboardHeader` inside `DashboardLayout.tsx` (covers Admin, Manager, BOH, Trainer, Cafe, and all other non-concierge pages).
- Import and render `NotificationBell` in `ConciergeHeader.tsx` (covers Concierge pages).
- The bell icon will sit to the left of the logo with the existing unread dot indicator.

---

### Technical Details

**Files to modify:**

1. **`src/pages/dashboards/ConciergeDashboard.tsx`**
   - Move `ConciergeHeader` from outside the sidebar/content flex row to inside the content column, matching the `DashboardLayout` pattern:
     - Outer div: `min-h-screen flex w-full` (horizontal flex with sidebar + content column)
     - Content column: `flex-1 flex flex-col min-w-0` containing header then main
   - On mobile, keep the current stacked layout (no sidebar).

2. **`src/components/concierge/ConciergeHeader.tsx`**
   - Add `import { NotificationBell } from './NotificationBell'`
   - Render `<NotificationBell />` in the header's right-side `flex items-center gap-2` div, before the logo.

3. **`src/components/layout/DashboardLayout.tsx`**
   - In the `DashboardHeader` component, add `import { NotificationBell } from '@/components/concierge/NotificationBell'`
   - Render `<NotificationBell />` in the header's right-side div, before the logo image.


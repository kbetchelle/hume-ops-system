

# Resources Sub-Menu Implementation

## Overview
Add expandable sub-page navigation (Quick Links, Resource Pages, Policies) under the "Resources" nav item in both the Concierge sidebar and the DashboardLayout sidebar (BOH, Cafe, Manager/Admin). The sub-menu expands on click, after a 2-second hover, or automatically when on a resources page -- and collapses when navigating away or moving the mouse off.

## Changes

### 1. DashboardLayout -- Fix ResourcesNavItem
**File:** `src/components/layout/DashboardLayout.tsx`

- Change hover delay from `3000ms` to `2000ms`
- Add a `useEffect` that auto-closes the sub-menu when navigating away from any `/dashboard/resources` route (currently it only auto-opens, never auto-closes)
- On `handleMouseLeave`, collapse the sub-menu if the user is NOT currently on a resources route

### 2. ConciergeSidebar -- Add Resources Sub-Menu
**File:** `src/components/concierge/ConciergeSidebar.tsx`

- Extend the `ConciergeView` type with `"resources-quick-links"`, `"resources-pages"`, `"resources-policies"`
- Remove "resources" from the flat nav items list in the "Resources" section
- Add a custom `ResourcesSubMenu` component inline (similar to the DashboardLayout pattern) that:
  - Shows a "Resources" parent item with a chevron
  - Expands to show 3 indented sub-items: Quick Links, Resource Pages, Policies
  - Expand triggers: click toggle, 2-second hover, or activeView starts with "resources"
  - Collapse triggers: activeView changes to non-resources, or mouse leaves and not on a resources view
- Each sub-item calls `onViewChange` with the corresponding view ID

### 3. ConciergeDashboard -- Render Sub-Views
**File:** `src/pages/dashboards/ConciergeDashboard.tsx`

- Import `QuickLinksTab`, `ResourcePagesTab`, `PoliciesTab` and their data hooks (`useQuickLinkGroupsByRole`, `useResourcePagesByRole`, policies query)
- Add switch cases for `"resources-quick-links"`, `"resources-pages"`, `"resources-policies"` that render the role-filtered data (using `activeRole` which defaults to "concierge")
- Add view titles for the new sub-views
- Keep the existing `"resources"` case as-is (shows the StaffResourcesView search hub)

### 4. ConciergeBottomNav -- Map New Sub-Views
**File:** `src/components/concierge/ConciergeBottomNav.tsx`

- Add `"resources-quick-links"`, `"resources-pages"`, `"resources-policies"` to the list that maps to the "templates" tab, so the bottom nav highlights correctly on mobile

## Technical Details

### Role-Specific Data
Each role sees their own data because the data hooks already filter by role:
- `useQuickLinkGroupsByRole(activeRole)` -- returns only groups assigned to the active role
- `useResourcePagesByRole(activeRole)` -- returns only pages assigned to the active role
- Policies are global (no role filter) -- same across all roles

### Updated ConciergeView Type
```typescript
export type ConciergeView =
  | "home" | "report" | "messages" | "announcements"
  | "whos-working" | "templates" | "resources"
  | "resources-quick-links" | "resources-pages" | "resources-policies"
  | "lost-found" | "qa";
```

### Sub-Menu Visual Structure
```text
Resources (FolderOpen icon) [chevron]
   Quick Links       (indented, smaller text)
   Resource Pages    (indented, smaller text)
   Policies          (indented, smaller text)
```

### Files Modified
| File | Change |
|------|--------|
| `src/components/layout/DashboardLayout.tsx` | Fix hover to 2s; add auto-collapse on navigate away |
| `src/components/concierge/ConciergeSidebar.tsx` | Extend type; add resources sub-menu with hover/click/auto-expand |
| `src/pages/dashboards/ConciergeDashboard.tsx` | Render resource sub-views with role-filtered data |
| `src/components/concierge/ConciergeBottomNav.tsx` | Map new views to "templates" tab |


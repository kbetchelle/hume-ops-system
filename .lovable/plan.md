

# Resources Sub-Menu in All Role Sidebars

## Overview
Add expandable sub-page navigation (Quick Links, Resource Pages, Policies) under the "Resources" nav item across all role sidebars. The sub-menu expands automatically when viewing a resources page, on click toggle, or after a 2-second hover -- and collapses when navigating away or moving the mouse off the menu area.

## Current State
- **DashboardLayout sidebar** (used by BOH, Cafe, Manager/Admin): Already has a `ResourcesNavItem` component with hover-expand (3s) and click-toggle behavior. However, it does NOT collapse when the user navigates away from resources pages, and the hover delay is 3 seconds instead of the requested 2 seconds.
- **ConciergeSidebar** (used only by Concierge role): Uses a view-based system (`ConciergeView` state) instead of URL routing. Has no sub-menu for Resources at all -- it's just a flat nav item.

## Changes

### 1. Fix DashboardLayout `ResourcesNavItem` (all non-concierge roles)
**File:** `src/components/layout/DashboardLayout.tsx`

- Change hover delay from `3000ms` to `2000ms`
- Add an `useEffect` to auto-close the sub-menu when navigating away from `/dashboard/resources*` (currently it only auto-opens but never auto-closes)
- On `handleMouseLeave`, also collapse the sub-menu if NOT currently on a resources route (so hovering away closes it, but it stays open if you're actively on a resources page)

### 2. Add Resources sub-menu to ConciergeSidebar
**File:** `src/components/concierge/ConciergeSidebar.tsx`

Since the Concierge uses a view-based system (not routes), the sub-menu items will set the `activeView` to new sub-view types. However, the resources sub-pages (Quick Links, Resource Pages, Policies) are route-based pages that live outside the Concierge view system. The approach:

- Add a new `ConciergeView` value: `"resources-quick-links"`, `"resources-pages"`, `"resources-policies"` to the type union
- Add the same hover/click/auto-expand logic used in `DashboardLayout.ResourcesNavItem` but adapted for the view-based system
- When a sub-item is clicked, the parent view switches to `"resources"` but the content renders the appropriate sub-page component
- The sub-menu auto-expands when `activeView` starts with `"resources"` and collapses when switching to a non-resources view

### 3. Update ConciergeDashboard to render sub-views
**File:** `src/pages/dashboards/ConciergeDashboard.tsx`

- Import the sub-page components (`QuickLinksTab`, `ResourcePagesTab`, `PoliciesTab`)
- Add cases for the new resource sub-views in the `renderContent` switch
- Add view titles for the new sub-views

## Technical Details

### ConciergeSidebar Resource Sub-Menu Logic
```text
Resources (FolderOpen icon)
  |-- Quick Links      (indented, smaller text)
  |-- Resource Pages   (indented, smaller text)
  |-- Policies         (indented, smaller text)
```

**Expand triggers:**
1. `activeView` is any resources view -> auto-expand via useEffect
2. Hover over Resources item for 2 seconds -> expand
3. Click on Resources -> toggle expand

**Collapse triggers:**
1. `activeView` changes to a non-resources view -> auto-collapse via useEffect
2. Mouse leaves the Resources area AND not on a resources view -> collapse

### Updated ConciergeView Type
```typescript
export type ConciergeView =
  | "home" | "report" | "messages" | "announcements"
  | "whos-working" | "templates" | "resources"
  | "resources-quick-links" | "resources-pages" | "resources-policies"
  | "lost-found" | "qa";
```

### Files Modified
| File | Change |
|------|--------|
| `src/components/concierge/ConciergeSidebar.tsx` | Add resource sub-menu with hover/click/auto-expand logic; extend ConciergeView type |
| `src/pages/dashboards/ConciergeDashboard.tsx` | Add rendering for resource sub-views; add view titles |
| `src/components/layout/DashboardLayout.tsx` | Fix hover delay to 2s; add auto-collapse on navigate away; collapse on mouse leave when not on resources route |
| `src/components/concierge/ConciergeBottomNav.tsx` | Map new resource sub-views to the "templates" tab grouping |




## Restructure Back-of-House Navigation Menu

### Overview
Reorganize the Spa Attendant and Floater sidebar navigation from a flat list into three clearly labeled groups matching the Concierge sidebar pattern. The Cafe role keeps its current navigation unchanged.

### Current BoH Nav (flat list)
- Checklist
- Messages
- Class Schedule
- Announcements
- Lost & Found
- Documents
- Who's Working
- Resources

### New BoH Nav (grouped)

```text
MAIN
  Checklists

COMMUNICATIONS
  Messages
  Announcements

REFERENCES
  Class Schedule
  Lost & Found
  Resources
    Quick Links
    Resource Pages
    Policies
  Who's Working
  Notes for Management  (NEW - links to a BoH-specific Q&A page)
```

### Changes

**1. Restructure nav items in DashboardLayout.tsx**
- Replace the single flat `NavItem[]` array for BoH roles with a grouped structure containing three sections: "Main", "Communications", and "References".
- Remove the "Documents" link entirely.
- Add a "Notes for Management" link pointing to a new BoH-specific Q&A page route.

**2. Add grouped rendering for BoH sidebar**
- When the effective role is a BoH role, render three `SidebarGroup` blocks with labeled section headers (matching the Concierge sidebar's visual style with `text-[10px] uppercase tracking-widest` labels).
- The Resources item within References will use the existing `ResourcesNavItem` expandable sub-menu component (Quick Links, Resource Pages, Policies).

**3. Create BoH Notes for Management page**
- Create a new page at `src/pages/dashboards/BoHNotesPage.tsx` that wraps the existing `PoliciesAndQA` component (or a simplified variant) in the `DashboardLayout`, filtered/contextualized for back-of-house staff.
- Add a route for `/dashboard/boh-notes` in `App.tsx`.

**4. Update App.tsx routing**
- Add the new `/dashboard/boh-notes` route pointing to the new BoH Notes page.

### Technical Details

- The grouping logic will be BoH-specific, using a new rendering branch in `DashboardSidebar` that checks `BOH_ROLES.includes(effectiveRole)`.
- The Resources sub-menu will reuse the existing `ResourcesNavItem` component already used in the DashboardLayout sidebar.
- No database changes required.
- No changes to the Cafe role navigation.
- The Concierge dashboard (which has its own separate sidebar component) is unaffected.


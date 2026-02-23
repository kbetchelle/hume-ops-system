
# Fix Concierge Navigation Sidebar

## Problem
When a Concierge user navigates to standalone pages (like Lost & Found at `/dashboard/lost-and-found`), the sidebar shows the wrong flat navigation menu instead of the grouped Concierge sidebar with **Main**, **Communications**, and **References** sections.

This happens because `SidebarNav` in `DashboardLayout.tsx` has grouped navigation for BOH, Cafe, and Admin/Manager roles, but the Concierge role falls through to the generic flat list.

## Solution
Add a Concierge-specific grouped navigation section in `SidebarNav` (inside `DashboardLayout.tsx`), matching the structure used by `ConciergeSidebar`:

### Concierge Navigation Groups

**Main**
- Home (`/dashboard/concierge` or `/dashboard`)
- Shift Report (`/dashboard/concierge`)

**Communications**
- Messages (`/dashboard/messages`)
- Announcements (`/dashboard/communications`)

**References**
- Response Templates (link back to concierge dashboard templates view)
- Resources (`/dashboard/resources`)
- Package Tracking (`/dashboard/package-tracking`)
- Lost & Found (`/dashboard/lost-and-found`)
- Who's Working (`/dashboard/whos-working`)

### Technical Details

**File: `src/components/layout/DashboardLayout.tsx`**

1. Add a `isConciergeRole` check after `isCafeRole` (around line 368):
   ```typescript
   const isConciergeRole = effectiveRole === "concierge";
   ```

2. Define concierge grouped nav items (alongside the existing BOH/Cafe/Admin groups):
   ```typescript
   const conciergeMainItems: NavItem[] = [
     { title: "Dashboard", url: "/dashboard", icon: Home },
     { title: "Shift Report", url: "/dashboard/concierge", icon: FileText },
   ];
   const conciergeCommsItems: NavItem[] = [
     { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
     { title: "Announcements", url: "/dashboard/communications", icon: Bell },
   ];
   const conciergeRefItems: NavItem[] = [
     { title: "Response Templates", url: "/dashboard/concierge?view=templates", icon: FileCode },
     { title: "Resources", url: "/dashboard/resources", icon: FolderOpen },
     { title: "Package Tracking", url: "/dashboard/package-tracking", icon: Package },
     { title: "Lost & Found", url: "/dashboard/lost-and-found", icon: Eye },
     { title: "Who's Working", url: "/dashboard/whos-working", icon: Users },
   ];
   ```

3. Insert a `isConciergeRole` branch in the render logic (around line 488), before the admin/manager check:
   ```
   isBohRole ? ... : isCafeRole ? ... : isConciergeRole ? (
     renderGroup("Main", conciergeMainItems)
     renderGroup("Communications", conciergeCommsItems)
     renderGroup("References", conciergeRefItems)
   ) : isAdminManagerRole ? ...
   ```

4. Update `getNavItems` to return empty for the concierge role (since grouped nav handles it), preventing duplicate items.

5. Update `getEffectiveRole` to detect concierge-specific paths if needed (e.g., `/dashboard/concierge`).

This ensures that all pages using `DashboardLayout` will show the correct grouped Concierge sidebar when the active role is Concierge.

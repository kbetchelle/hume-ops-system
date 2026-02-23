

# Global Color Differentiation and Badge Standardization

## Summary

Standardize all badges, icons, and color indicators across the entire application to match the Notification Examples page formatting. Every badge becomes a perfect square, every color maps to the brand palette (`add_color`), and all roles see consistent visual treatment.

---

## Color Assignment Map

### Sidebar Nav Badges (ALL roles)

| Nav Item | Badge Color | Shape |
|---|---|---|
| Messages | Yellow (`#fcb827`) | Square h-5 w-5 |
| Announcements | Orange (`#f6821f`) | Square h-5 w-5 |
| Dashboard (Mgmt Inbox) | Orange (`#f6821f`) | Square h-5 w-5 |
| Bug Reports (Dev Tools) | Red (`#e03a3c`) | Square h-5 w-5 |
| Package Tracking | Purple (`#7c3aed`) | Square h-5 w-5 |

### Mobile Bottom Nav Badges
- Messages: Yellow (`#fcb827`), rounded pill (keep existing shape)
- Color change only, shape stays rounded

### Notification Bell (Header)
- Change from pulsing red dot to a red square badge (`h-4 w-4`) showing unread count
- No animation (static)

### Concierge Sidebar Badges
- Messages: Yellow (was red)
- Announcements: Orange (was red "!")
- Announcement badge shows count instead of "!"

### User Management Page
- Pending Approvals: Red (`#e03a3c`), square (was rounded-full)

---

## Management Inbox Item Colors

| Inbox Type | Icon Badge | Label Tag | Tinted Row |
|---|---|---|---|
| Shift Note | Yellow solid | Yellow solid | Yellow 10% |
| Q&A Question | Purple solid | Purple solid | Purple 10% |
| Outdated Flag | Orange solid | Orange solid | Orange 10% |
| Sick Day | Orange solid (was purple) | Orange solid | Orange 10% |

- All text on tinted rows stays black
- All label tags remain solid (colored bg + white text)
- Shift type tags (AM/PM) change to neutral gray

---

## Badge Component Remap

Remap the `Badge` component variants to use `add_color` palette:

| Variant | Current | New |
|---|---|---|
| default | amber/amber | `add_color.yellow` (#fcb827) |
| secondary | skyBlue/skyBlue | `add_color.blue` (#009ddc) |
| destructive | crimson/crimson | `add_color.red` (#e03a3c) |
| outline | burntOrange | `add_color.orange` (#f6821f) |

---

## Icon Badge Sizing

Notification icon badges change from padded (p-1.5) to fixed square dimensions:
- `h-7 w-7` with centered icon (`h-4 w-4`)
- Applied in: `NotificationItem.tsx`, `NotificationBell.tsx`, all Management Inbox items, `NotificationExamplesPage.tsx`

---

## Technical Changes by File

### 1. `src/components/ui/badge.tsx`
- Remap all 4 variants to `add_color` values using inline styles or updated Tailwind tokens

### 2. `src/components/layout/DashboardLayout.tsx`
- Messages badge: change `bg-add-red` to yellow (`add_color.yellow`) via inline style
- Dashboard (Inbox) badge: keep orange (already correct)
- Bug Reports in Dev Tools: add red badge with `unreadBugCount`
- Package Tracking: add purple badge (requires hooking into a pending packages count if available)
- All badges: ensure `h-5 w-5 rounded-none` square

### 3. `src/components/concierge/ConciergeSidebar.tsx`
- Messages badge: yellow instead of red
- Announcements badge: orange instead of red, show count instead of "!"
- All badges: use inline styles with `solidStyle()` for consistency

### 4. `src/components/concierge/NotificationBell.tsx`
- Replace pulsing red dot with a static red square badge (`h-4 w-4`) showing unread count
- Use `solidStyle(add_color.red)` for the badge

### 5. `src/components/notifications/NotificationItem.tsx`
- Icon badge: change from `p-1.5` to fixed `h-7 w-7 flex items-center justify-center`

### 6. `src/components/mobile/MobileBottomNav.tsx`
- Messages badge: change `bg-primary` to yellow (`add_color.yellow`) with white text
- Keep rounded pill shape

### 7. `src/components/manager/inbox/SickDayInboxItem.tsx`
- Change `HEX` from `add_color.purple` to `add_color.orange`
- Icon badge: fixed square sizing

### 8. `src/components/manager/inbox/ShiftNoteInboxItem.tsx`
- Shift type tag: change from green tinted to neutral gray (`bg-muted text-muted-foreground border-border`)
- Icon badge: fixed square sizing

### 9. `src/components/manager/inbox/QAInboxItem.tsx`
- Icon badge: fixed square sizing (color stays purple)

### 10. `src/components/manager/inbox/FlagInboxItem.tsx`
- Icon badge: fixed square sizing (color stays orange)

### 11. `src/pages/admin/UserManagementPage.tsx`
- Pending Approvals badge: change from `rounded-full` to `rounded-none`, keep red
- Use inline style `solidStyle(add_color.red)`

### 12. `src/pages/admin/NotificationExamplesPage.tsx`
- Update icon badge samples to use fixed square sizing
- Ensure all samples reflect the finalized color mappings

### 13. `src/lib/notificationConfig.ts`
- No structural changes needed (hex-based system already in place)
- Already has correct mappings from previous work

---

## What Stays the Same
- Nav icons remain monochrome (black/muted)
- Mobile badge shape stays rounded pill
- All text on tinted backgrounds stays black
- Label tags in inbox stay solid style
- Management Inbox badge stays orange

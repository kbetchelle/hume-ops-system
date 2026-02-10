

## Read Tracking and Unread Banner for Announcements

### Overview
This plan changes how announcement read-tracking works, removes the "show all updates" toggle, and adds an unread indicator dot to the Announcements sidebar/bottom-nav item.

### Changes

**1. Scroll-to-bottom read tracking (AnnouncementsBoard.tsx)**
- Replace the current `IntersectionObserver` approach (which marks as read when 60% visible for 1.5s) with a new strategy: only mark an announcement as read when the user scrolls to the **bottom** of its div.
- Place a small sentinel element at the bottom of each announcement/weekly-update card. Attach an `IntersectionObserver` to that sentinel with a high threshold. When the sentinel becomes visible (meaning the user has scrolled to the bottom of that card), mark as read after a brief delay.

**2. Auto-mark old announcements as read for new users (database migration)**
- Add a SQL migration with a trigger on the `profiles` table: when a new profile row is inserted, automatically insert read records into `staff_announcement_reads` for all announcements created **before** the profile's `created_at` timestamp.
- This ensures new users don't see a wall of "unread" historical content.

**3. Remove "Show all updates" toggle (AnnouncementsBoard.tsx)**
- Remove the `showAllWeekly` state variable and the `Switch` toggle UI.
- Always render the full list of weekly updates (the "show all" view), removing the week-navigation UI entirely.

**4. Unread dot on Announcements sidebar item (ConciergeSidebar.tsx)**
- Query `staff_announcement_reads` vs active announcements to determine if the user has any unread announcements.
- Show a small pulsing dot (no count) next to the "Announcements" menu item in `ConciergeSidebar` and `ConciergeBottomNav`.

**5. Remove numeric badge counts from tab headers (AnnouncementsBoard.tsx)**
- Replace the `{unreadAll}`, `{unreadWeekly}`, `{unreadAnnouncements}` numeric badges on the tab triggers with simple dot indicators when unread > 0.

---

### Technical Details

**Database migration:**
```sql
CREATE OR REPLACE FUNCTION public.auto_mark_old_announcements_read()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.staff_announcement_reads (announcement_id, staff_id, read_at)
  SELECT sa.id, NEW.user_id, NOW()
  FROM public.staff_announcements sa
  WHERE sa.created_at < NEW.created_at
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_mark_old_announcements_read
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_old_announcements_read();
```

**Scroll-to-bottom sentinel pattern (AnnouncementsBoard.tsx):**
- Add a `<div ref={sentinelRef} className="h-1" />` at the very end of each announcement card.
- The `setupReadObserver` callback attaches to this sentinel instead of the outer card div, using `threshold: 1.0` so it only fires when fully visible (i.e., user scrolled to the bottom).

**Sidebar unread indicator (ConciergeSidebar.tsx):**
- Create a small hook or inline query that checks if `filteredAnnouncements.length > readAnnouncements.length`.
- Pass a boolean `hasUnread` instead of a count, and render a dot indicator on the Announcements nav item.

**Files to modify:**
- `src/components/concierge/AnnouncementsBoard.tsx` -- sentinel-based read tracking, remove toggle, dot badges
- `src/components/concierge/ConciergeSidebar.tsx` -- unread dot on Announcements item
- `src/components/concierge/ConciergeBottomNav.tsx` -- unread dot when on comms tab
- `src/pages/dashboards/ConciergeDashboard.tsx` -- pass unread state down
- New database migration for the auto-mark trigger


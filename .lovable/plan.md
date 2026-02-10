
## "This Week" Banner + Font Size Increase

### 1. "This Week" banner on the most recent weekly update

**Logic**: Determine the most recent weekly update (by `week_start_date` or `created_at`). If it was posted within the last 6 days (i.e., `created_at` is less than 6 days ago), show a "This Week" banner on that card only. After 6 days, no card gets the banner.

**Implementation in `renderWeeklyCard`**:
- Compute `thisWeekId` in a `useMemo`: find the first weekly update (already sorted newest-first) whose `created_at` is within 6 days of now. Store its `id` or `null`.
- Pass `isThisWeek` boolean to the render function.
- When `isThisWeek` is true, render a prominent `<Badge>` with "This Week" styling (e.g., green or primary color) at the top of the card, before the existing "Weekly Update" badge.

### 2. Increase body font size to match card titles

Currently:
- Weekly update title: `text-sm font-semibold` (h3, line 202)
- Weekly update body: `text-xs` (p, line 203)
- Announcement title: `text-sm font-medium` (h4, line 232)
- Announcement body: `text-xs` (p, line 240)

**Change**: Update all body `<p>` tags from `text-xs` to `text-sm` so they match the title font size.

---

### Technical Details

**File to modify:** `src/components/concierge/AnnouncementsBoard.tsx`

**Changes:**

1. Add a `thisWeekId` memo after `weeklyUpdates`:
```typescript
const thisWeekId = useMemo(() => {
  if (weeklyUpdates.length === 0) return null;
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const newest = weeklyUpdates[0]; // already sorted newest-first
  return new Date(newest.created_at) >= sixDaysAgo ? newest.id : null;
}, [weeklyUpdates]);
```

2. Update `renderWeeklyCard` to accept and use `isThisWeek`:
- Add a "This Week" Badge (green styling) when `isThisWeek` is true, placed before the "Weekly Update" badge.

3. Update callers of `renderWeeklyCard` to pass `item.id === thisWeekId`.

4. Change body text from `text-xs` to `text-sm` in both `renderWeeklyCard` (line 203) and `renderAnnouncementCard` (line 240).

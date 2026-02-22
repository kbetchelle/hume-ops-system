

# Past Reports: Continuous Scrollable View

## Overview
Replace the current paginated card grid (click-to-open detail) with a single scrollable page where all report content is displayed inline, grouped by date with AM/PM sections. No more dialogs or sheets -- everything is visible on one page.

## Layout

```text
[Search bar]                              [X reports]

---- Mon, Feb 16, 2026 ----
  AM · Staff Name
    Summary: ...
    Busiest areas: ...
    Tour notes: ...
    Member feedback: ...
    Facility issues: ...
    Handoff notes: ...

  PM · Staff Name
    Summary: ...
    ...

---- Sun, Feb 15, 2026 ----
  AM · Staff Name
    ...
```

- Reports grouped by `report_date` (descending), then AM before PM within each date
- Each date gets a sticky or visual header divider
- Each shift section shows all the detail fields inline (the same content currently in the dialog/sheet)
- Empty fields show a dash or are omitted entirely to keep things clean
- Search still works: filters reports, and highlights matching snippets
- On mobile: same continuous layout inside `MobilePageWrapper` with pull-to-refresh; date range filters remain at top
- Pagination and the detail dialog/sheet are removed entirely

## Technical Changes

**File: `src/components/concierge/PastReportsView.tsx`**

1. Remove `Dialog`, `Sheet`, pagination imports and related state (`detailReport`, `page`, `currentPage`, `paginatedReports`, `totalPages`)
2. Group `filteredReports` by `report_date` using a `useMemo` that produces `Map<string, ReportRow[]>` (sorted by date desc, AM first within each date)
3. Replace the card grid with a flat list:
   - Date header divider for each group
   - For each report in the group, render the full detail content inline (reuse the existing `detailContent` markup as a component)
4. Keep `ITEMS_PER_PAGE` as a "load more" batch size -- show first 30 reports initially with a "Show more" button at the bottom (avoids rendering 150+ reports at once)
5. Mobile and desktop share the same continuous layout; only the sticky search/date-filter header differs

No database or edge function changes needed.

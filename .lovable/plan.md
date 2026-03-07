

# Phased Latency Reduction Plan

## Problem Summary

The network requests reveal three categories of performance issues:

1. **Statement timeouts (500 errors)** on large tables: `arketa_reservations_history`, `daily_report_history`, `inbox_reads`, and `get_backfill_reservations_calendar` RPC are all hitting the database statement timeout limit.

2. **Data-API gateway cold starts**: 14 components still route reads through the `data-api` edge function (`selectFrom`), adding 2-20s of cold-start latency per request. The edge function logs show rapid boot/shutdown cycles confirming constant cold starts.

3. **Unindexed full-table scans**: `COUNT(*)` queries on `arketa_reservations_history` (potentially 1M+ rows) and unfiltered selects on `inbox_reads` and `daily_report_history` cause timeouts.

---

## Phase 1: Fix Statement Timeouts (Critical)

These are causing 500 errors right now and blocking page loads.

### 1A. Add database indexes

Create a migration adding indexes to the most-hit columns:

- `arketa_reservations_history`: index on `class_date`, composite index on `(class_id, class_date)`
- `daily_report_history`: composite index on `(status, management_notes)` for the inbox query
- `inbox_reads`: index on `user_id`
- `get_backfill_reservations_calendar` RPC: review and optimize the function body (likely doing a full sequential scan)

### 1B. Replace COUNT(*) with approximate counts

The backfill tabs run `select("*", { count: "exact", head: true })` on `arketa_reservations_history` — a full table scan on 1M+ rows. Replace with:

- A Postgres function using `reltuples` from `pg_class` for approximate counts, or
- Cache the count in a metadata row updated by the sync process

Affected files:
- `ReservationsBackfillTab.tsx`
- `ArketaClassesAndReservationsBackfillTab.tsx` (already removed from UI but file still exists)

### 1C. Fix the inbox unread count query

`useManagementInbox.ts` runs 5 parallel queries including an unfiltered `daily_report_history` select with `.not("management_notes", "is", null)` — this scans the entire table. Add the index from 1A, and add a `.limit()` or date filter to scope it.

---

## Phase 2: Migrate Off Data-API Gateway

Replace all `selectFrom` (data-api edge function) calls with direct Supabase client queries. This eliminates cold-start latency entirely for reads.

**Files to migrate** (14 components/hooks):

| File | Table(s) queried |
|------|-----------------|
| `UpcomingTodayCard.tsx` | `scheduled_tours`, `daily_schedule`, `mastercard_visits` |
| `MasterCalendar.tsx` | `scheduled_tours`, `daily_schedule`, `staff_shifts`, `mastercard_visits` |
| `ScheduleSyncTab.tsx` | `daily_schedule` |
| `LostAndFoundTab.tsx` | `lost_and_found`, `lost_and_found_member_requests` |
| `ResponseTemplatesManager.tsx` | `response_templates` |
| `QuickLinksManager.tsx` | `quick_links` |
| `useMastercardVisits.ts` | `mastercard_visits` |
| `useMastercardArrivals.ts` | `mastercard_visits` |
| `useNotificationTriggers.ts` | `notification_triggers` |
| `useClassTypeMappings.ts` | class type mappings |

Each migration is mechanical: replace `selectFrom<T>(table, { filters, order })` with `supabase.from(table).select(...).eq(...).order(...)`.

Write operations (`insertInto`, `updateTable`, `deleteFrom`) can remain on the data-api gateway for now since they are infrequent and benefit from the RBAC layer.

---

## Phase 3: Optimize Heavy Page Queries

### 3A. DataPatternsPage

Queries `arketa_reservations_history` with `.limit(5000)` — even with a limit, this can be slow on a huge table without proper indexes. After Phase 1A indexes are in place, this should resolve. Additionally, consider making this query lazy (only run when user navigates to the page).

### 3B. BackfillCalendarHeatmap RPC

The `get_backfill_reservations_calendar` RPC is timing out. The fix depends on the RPC body — likely needs to aggregate by date using the index from Phase 1A rather than scanning the full table. Create an optimized version that uses the `class_date` index.

### 3C. ConciergeDashboard checked-in count

Runs `COUNT(*)` on `arketa_reservations` filtered by `checked_in=true` and `class_date=today`. Add a composite index on `(class_date, checked_in)` if not present.

---

## Phase 4: React Query Tuning

Review `staleTime` and `refetchInterval` settings across all queries:

- Dashboard widgets: set `staleTime: 60_000` (1 min) to prevent redundant refetches on tab switches
- Backfill page: set `staleTime: 30_000` and avoid refetching calendar heatmap on every poll cycle
- Inbox count: set `staleTime: 30_000` — currently re-runs 5 parallel queries on every focus event

---

## Phase 5: Verification Tests

After implementing Phases 1-4, run a structured test suite to measure improvements:

### Test Matrix

| Test | Page/Feature | Role | Metric | Target |
|------|-------------|------|--------|--------|
| T1 | Login → Dashboard redirect | All roles | Time to interactive | < 3s |
| T2 | Manager Dashboard widgets | Admin/Manager | All widgets rendered | < 2s |
| T3 | Concierge Dashboard (UpcomingTodayCard) | Concierge | Card fully loaded | < 2s |
| T4 | Backfill page load | Admin | No 500 errors, counts visible | < 3s |
| T5 | Backfill calendar heatmap | Admin | Heatmap rendered | < 3s |
| T6 | Management Inbox unread count | Manager | Badge shows count | < 2s |
| T7 | Master Calendar (month view) | Manager | Events rendered | < 3s |
| T8 | Data Patterns page | Admin | Table rendered | < 5s |
| T9 | Lost & Found tab | Concierge | Items listed | < 2s |
| T10 | Concierge shift report load | Concierge | Form usable | < 2s |

### Test Method

Use browser performance profiling on each page:
1. Navigate to page, measure time-to-interactive
2. Check network tab for any 500 errors or requests > 3s
3. Verify no `statement timeout` errors in responses
4. Compare against pre-fix baseline (current: multiple 500s, 10s+ loads)

### Success Criteria

- Zero `57014` (statement timeout) errors across all pages
- No requests routed through `data-api` edge function for read operations
- All dashboard pages reach interactive state within 3 seconds
- Backfill page loads without 500 errors


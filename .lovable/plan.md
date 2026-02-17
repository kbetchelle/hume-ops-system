
# Plan: Page-Level Cursor for High-Volume Days

## Problem

Edge functions have a ~60s execution limit. A day with 177 orders requires 2 API pages, each with up to 60s timeout + retry delays. Combined with DB upserts, a single high-volume day can exceed the limit. If the function times out mid-pagination, all fetched-but-not-committed data for that day is lost.

## Solution: Resume-from-page cursor using toast_staging metadata

Instead of holding all pages in memory before writing, **stage each page immediately as it's fetched**, and track the last successfully staged page. If the function times out or errors, the next invocation skips already-staged pages.

## How It Works

```text
Invocation 1 (times out on page 3):
  Page 1 -> fetch -> stage (100 rows) -> OK
  Page 2 -> fetch -> stage (100 rows) -> OK
  Page 3 -> fetch -> TIMEOUT

Invocation 2 (resumes):
  Check toast_staging: max page for this date = 2
  Page 3 -> fetch -> stage (77 rows) -> OK
  No more pages -> promote to toast_sales -> clear staging
```

## Changes

### 1. Add `page_number` column to `toast_staging`

A new migration adds an integer `page_number` column (nullable, default null) so each staged batch knows which API page it came from.

```sql
ALTER TABLE toast_staging ADD COLUMN IF NOT EXISTS page_number integer;
```

### 2. Stage-per-page pattern in both sync functions

**Files:** `sync-toast-orders/index.ts`, `toast-backfill-sync/index.ts`

Replace the "fetch all pages into memory, then stage" pattern with:

```
For each business_date:
  1. Query toast_staging for max(page_number) WHERE business_date = X
     -> resume_from_page = max + 1 (or 1 if none)
  2. Fetch page resume_from_page from API
  3. Map to staging rows with page_number set
  4. Upsert into toast_staging immediately
  5. If hasMore, increment page and repeat from step 2
  6. When done (no more pages), promote all rows for this date to toast_sales
  7. Clear staging for this date
```

This means:
- Each page is persisted the moment it arrives -- no data loss on timeout
- On re-invocation, already-fetched pages are skipped via the `page_number` cursor
- Promotion to `toast_sales` only happens once ALL pages for a date are staged

### 3. Add a time budget guard

Both functions get a `TIME_BUDGET_MS` constant (e.g., 50000ms = 50s, leaving 10s buffer before the 60s limit). Before fetching each new page, check elapsed time:

```typescript
const TIME_BUDGET_MS = 50_000;
if (Date.now() - startTime > TIME_BUDGET_MS) {
  logger.warn(`Time budget exceeded after page ${page}, will resume next invocation`);
  return { partial: true, lastPage: page };
}
```

If the budget is exceeded, the function returns a `partial: true` response. The next cron/manual invocation picks up from where it left off.

### 4. Backfill state tracks partial days

**File:** `toast-backfill-sync/index.ts`

The `toast_backfill_state.cursor_page` field (already exists but always set to 1) will now be used properly:
- After a partial day, `cursor_page` is set to the next page to fetch
- `cursor_date` stays on the current day
- Next invocation resumes from `cursor_page` on `cursor_date`

### 5. Daily sync handles partials via staging check

**File:** `sync-toast-orders/index.ts`

For the daily sync (yesterday only), partial handling is simpler:
- On invocation, check `toast_staging` for any rows with yesterday's date
- If rows exist, query `max(page_number)` and resume from page N+1
- If the function completes all pages, promote and clear as normal

## Technical Summary

| Change | File |
|--------|------|
| Add `page_number` column | New migration |
| Stage each page immediately + resume cursor | `sync-toast-orders/index.ts` |
| Stage each page immediately + use `cursor_page` properly | `toast-backfill-sync/index.ts` |
| Time budget guard (50s) | Both sync functions |
| Query staging for resume point | Both sync functions |

This approach is resilient: even if the function is killed mid-execution, no data is lost because every page is staged before the next one is fetched. The next invocation seamlessly resumes.

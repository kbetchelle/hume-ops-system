# Fix Arketa Payments Sync — Plan

## Status: ✅ IMPLEMENTED

### Changes Made

#### 1. `sync-arketa-payments/index.ts` — Full rewrite
- ✅ **Cursor-based pagination**: Uses Arketa's `start_after` + `pagination.hasMore` to fetch all pages (100 per page, up to 50 pages = 5,000 records)
- ✅ **Fixed `arketa_payment_id`**: Now maps `String(p.id)` to the required NOT NULL column
- ✅ **Fixed `source_endpoint`**: Correctly set to `'purchases'` (removed phantom `/payments` endpoint call — Arketa API only has `/purchases`)
- ✅ **Added `start_date` mapping**: Maps from `p.start_date ?? p.created_at ?? p.date` so calendar heatmap and progress tracking work
- ✅ **Dedup by ID**: Removes duplicates before staging insert
- ✅ **Batched inserts**: Chunks of 100 so one bad record doesn't fail the entire batch
- ✅ **Uses `updated_at_min/max`**: Correct Arketa API filter params (not `start_date`/`end_date` query params)

#### 2. `sync-from-staging/index.ts` — Pagination + batch delete fixes
- ✅ **Paginated staging reads**: Uses `.range()` to read all staging rows beyond the 1000-row default limit
- ✅ **Batched deletes**: Deletes staging rows in chunks of 500 to avoid query size limits
- ✅ Applied to both reservations and payments transfer functions

#### 3. `ForcePasswordChangeDialog.tsx` — Build error fix
- ✅ Removed reference to deleted `must_change_password` column

### Test Results
- Pagination confirmed: 27+ pages fetched (2,700+ records) from wide date range
- 4,997 unique records staged and transferred to `arketa_payments_history`
- All records have `start_date` populated (range: 2023-06-11 to 2026-02-09)
- Staging properly cleared after transfer

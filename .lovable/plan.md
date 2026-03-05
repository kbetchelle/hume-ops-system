

## Root Cause: Double Logging

The alternating pattern of "304 processed (+304 new)" and "0 processed" is caused by **double logging** -- every sync cycle produces TWO `api_logs` entries under the same `api_name = 'arketa_classes'`:

1. **`sync-arketa-classes` (the child)** logs first with endpoint `/classes` -- it fetches classes from the API and upserts them. Since it's a recurring sync with identical data (upsert = no net-new rows), it reports `records_processed: 0, records_inserted: 0` (~5s).

2. **`sync-arketa-classes-and-reservations` (the wrapper/orchestrator)** logs second with endpoint `/classes+reservations` -- it aggregates the totals from classes + reservations sub-calls and reports `records_processed: 304, records_inserted: 304` (~50s).

Both log under `api_name = 'arketa_classes'`, so the UI's "Recent Sync History" shows them interleaved, creating the confusing pattern.

### Why the child reports 0

The child (`sync-arketa-classes`) calls `logApiCall` at line 343-352. When no new classes exist (all are upserted as duplicates), the upsert RPC returns 0 or the staging count is 0 because all records already exist. This is actually correct behavior -- no *new* data.

### Why the wrapper reports 304

The wrapper (`sync-arketa-classes-and-reservations`) aggregates `totalFetched` from both the classes and reservations sub-responses and logs the combined count. The 304 represents total records fetched from the API (not net-new inserts), but it's logged as `records_inserted` which is misleading.

## Proposed Fix

**Suppress the child's redundant log when called by the wrapper.** The wrapper already logs the combined result, so the child's separate log is noise.

### Changes

1. **`sync-arketa-classes/index.ts`**: Accept a `skipLogging` parameter. When `true`, skip the `logApiCall` at the end. The wrapper will handle logging.

2. **`sync-arketa-classes-and-reservations/index.ts`**: Pass `skipLogging: true` in the payload when invoking `sync-arketa-classes`.

This eliminates the "0 processed" ghost entries while preserving the child's standalone logging when triggered directly (e.g., from the backfill manager).

### Additionally: Fix misleading "records_inserted" on the wrapper

The wrapper currently logs `recordsInserted: totalSyncedCount` which conflates classes synced + reservations synced. The `syncedCount` from the classes child is the upsert count (often equal to total fetched), making it look like 304 are "new" every time. The wrapper should use `recordsProcessed` for the fetch total and `recordsInserted` only for genuinely new/updated records. This requires the child to return a distinct `newCount` vs `upsertedCount` -- but the simpler fix is just removing the duplicate log entry.




## Sync Log History Table Improvements

### Summary
Enhance the Sync Log History table with grouped wrapper visualization, color-coded row backgrounds, split insert/update columns, and inline skip reason display.

### Database Changes

**Add columns to `api_logs`:**
- `parent_log_id` (uuid, nullable, FK to api_logs.id) -- links child function logs to their wrapper
- `records_skipped` (int, default 0) -- explicit skip count
- `skip_reasons` (jsonb, nullable) -- e.g. `{"empty_class_id": 5, "duplicate": 3}`

**Index:** `idx_api_logs_parent_log_id` on `parent_log_id`

### Edge Function Changes

**`_shared/apiLogger.ts`:** Add `parentLogId`, `recordsSkipped`, `skipReasons` to `LogData` interface and insert them into the new columns.

**`sync-arketa-classes-and-reservations/index.ts`:** 
1. Insert a parent api_log row at the start of execution, capture its ID
2. Pass `parentLogId` to the child function calls (classes, reservations, sync-from-staging) via the request body
3. Child functions (`sync-arketa-classes`, `sync-arketa-reservations`, `sync-from-staging`) read `parentLogId` from the request and pass it to `logApiCall`

**All sync functions that track skips:** Populate `records_skipped` and `skip_reasons` when calling `logApiCall`. Aggregate skip reasons from `api_sync_skipped_records` inserts that happen during the sync.

### Frontend Changes

**`src/hooks/useApiLogs.ts`:**
- Add `parent_log_id`, `records_skipped`, `skip_reasons` to `ApiLog` interface
- Modify query to fetch all fields

**`src/pages/admin/ApiSyncingPage.tsx` -- `SyncLogHistoryTable`:**

1. **Grouped blocks:** Group logs by `parent_log_id` (or treat standalone logs as their own group). Render each group with a shared background band:
   - Light green-50 tint for all-success groups
   - Light red-50 tint for any-failed groups  
   - Light amber-50 tint for partial success (parent succeeded but a child failed, or records_processed > 0 but sync_success = false)
   - Parent row rendered slightly bolder/larger as the group header
   - Child rows indented with a left border matching the group color

2. **Column changes:** Replace current "Upserted" column with two columns:
   - **Inserted** -- `records_inserted`, green text when > 0
   - **Updated** -- `records_updated`, blue text when > 0
   - **Skipped** stays, shows `records_skipped` (or derived from processed - inserted - updated)

3. **Skip reason inline:** When `records_skipped > 0`, show the count in red plus the top reason from `skip_reasons` jsonb (e.g. "12 skipped: empty_class_id"). Truncate with title tooltip for full breakdown.

4. **Row color differentiation:**
   - Success: `bg-green-50/40` (light green tint)
   - Failed: `bg-red-50/60` (current destructive tint, stronger)
   - Partial: `bg-amber-50/40` (amber tint for partial success)

5. **Wrapper badge:** Child rows show a small muted badge like "↳ via classes+reservations" next to the API name.

### Implementation Order
1. Database migration (add 3 columns)
2. Update `apiLogger.ts` shared utility
3. Update wrapper function (`sync-arketa-classes-and-reservations`) to create parent log and propagate ID
4. Update child sync functions to accept and log `parentLogId`, `recordsSkipped`, `skipReasons`
5. Deploy updated edge functions
6. Update `useApiLogs.ts` interface and query
7. Rebuild `SyncLogHistoryTable` with grouping, colors, and split columns


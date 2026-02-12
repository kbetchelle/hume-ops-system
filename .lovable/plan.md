# Fix Arketa Payments Sync — Plan

## Problems Identified

### 1. `sync-arketa-payments` (core fetch function)
- **No pagination**: Hard cap of 400 records per endpoint (`/purchases` and `/payments`). Records beyond 400 are silently dropped.
- **Hardcoded `source_endpoint`**: All records (even from `/payments`) get `source_endpoint: 'purchases'` (line 155). This breaks the history table's `(payment_id, source_endpoint)` unique key — records from `/payments` overwrite `/purchases` records with the same ID instead of being stored separately.
- **No dedup between endpoints**: `/purchases` and `/payments` responses are naively merged. If the same payment appears in both, it's inserted twice into staging (causing potential constraint violations or duplicates).
- **Batch-level failure**: A single bad record causes the entire staging insert to fail (one `.insert()` call for all rows).
- **Missing `arketa_payment_id`**: Staging table requires `arketa_payment_id` (NOT NULL) but the insert maps to `payment_id` instead, likely causing insert failures.

### 2. `run-backfill-job` (backfill orchestrator)
- **Payments use day-by-day sync**: Each date calls `sync-arketa-payments` with `startDate=endDate=<date>`. This is fine but inherits the 400-record cap from the sync function.
- **`start_date` column mismatch**: The history table count uses `start_date` as the date column, but `sync-arketa-payments` never sets `start_date` in staging rows — it's always null. This means `run-backfill-job` always sees 0 existing records and 0 new records for any date, breaking progress tracking.
- **sync-from-staging transfer**: After batch, calls `sync-from-staging` to move staging → history. This works but the `payment_id` mapping in staging may be wrong (see #1).

### 3. `historical-backfill-cron` (daily cron)
- Calls `sync-arketa-payments` with date ranges — inherits all issues from #1.
- Progress tracking via `historical_backfill_progress` table works but records will be undercounted due to the `start_date` null issue.

### 4. `sync-from-staging` (staging → history transfer)
- Falls back to `source_endpoint: 'purchases'` when staging has null — this masks the hardcoded source issue.
- Uses `payment_id ?? arketa_payment_id ?? id` — correct fallback chain.
- Works correctly otherwise.

## Fix Plan

### Task 1: Fix `sync-arketa-payments` staging insert
- [ ] Map `arketa_payment_id` field (required by staging table) — use `String(p.id)`
- [ ] Set correct `source_endpoint`: `'purchases'` for records from `/purchases`, `'payments'` for records from `/payments`
- [ ] Dedup merged records by `id` before insert (prefer `/purchases` version if same ID appears in both)
- [ ] Add `start_date` mapping from `p.created_at` or `p.date` so history date tracking works
- [ ] Batch inserts (chunks of 100) so one bad record doesn't fail the entire batch
- [ ] Add pagination support (cursor/offset) to fetch beyond 400 records per endpoint

### Task 2: Fix `run-backfill-job` progress tracking for payments
- [ ] Verify `dateColumn: "start_date"` is correct now that staging populates it
- [ ] No code changes needed if Task 1 fixes the `start_date` mapping

### Task 3: Verify `historical-backfill-cron` works with fixes
- [ ] No code changes needed — it calls `sync-arketa-payments` which gets fixed in Task 1
- [ ] Verify `sync-from-staging` transfer still works after field mapping changes

### Task 4: Deploy and test
- [ ] Deploy updated `sync-arketa-payments`
- [ ] Test with a small date range via backfill UI
- [ ] Verify records appear in `arketa_payments_history` with correct `start_date` and `source_endpoint`

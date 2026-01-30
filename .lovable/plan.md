

## Enhanced Backfill Sync for Arketa Clients

This plan addresses the requirements for real-time progress updates, staging table workflow, and handling 11,000+ clients from Arketa.

---

### Current Issues Identified

1. **Progress updates are delayed**: Records count only updates after each full page (500 records), not in smaller increments
2. **Direct target table writes**: Currently upserting directly to `arketa_clients` instead of using the staging workflow
3. **No staging-to-production promotion**: The `arketa_clients_staging` table exists but is not utilized
4. **Edge function timeout risk**: Large batch operations can exceed the edge function time limits
5. **Realtime already enabled**: `backfill_jobs` table is already in supabase_realtime publication

---

### Solution Architecture

```text
+-------------------+     +----------------------+     +-------------------+
|   Arketa API      | --> | arketa_clients_staging | --> | arketa_clients    |
| (500 per page)    |     | (batch inserts)        |     | (final upsert)    |
+-------------------+     +----------------------+     +-------------------+
        |                          |                          |
        v                          v                          v
   Fetch page              Update records_processed    Clear staging after
   with cursor             every 5 records synced      successful promotion
```

---

### Implementation Tasks

#### 1. Update Edge Function: Staging Table Workflow

Modify `supabase/functions/backfill-historical/index.ts`:

- **Batch size of 5 for progress updates**: Insert records to staging in small batches (5 records), updating `records_processed` after each batch for live UI feedback
- **Write to staging table first**: Insert fetched clients into `arketa_clients_staging` with a `sync_batch_id` (UUID per sync session)
- **Track progress per batch**: Update `backfill_jobs.records_processed` after every 5 records for real-time feedback
- **Resume from last synced record**: Use `last_cursor` to continue pagination where sync left off
- **Handle 11,000+ clients**: Process in pages of 500, update progress frequently, auto-continue with 3-minute retry gaps

#### 2. Implement Staging-to-Production Promotion

Add a new function or extend existing logic:

- After all pages are fetched (no more `hasMore`):
  - Promote records from `arketa_clients_staging` to `arketa_clients` using upsert on `external_id`
  - Track promotion progress separately
  - Clear staging table records for the completed `sync_batch_id`
- Set `staging_synced: true` after successful promotion
- Handle partial failures gracefully

#### 3. Update UI Progress Display

Modify `src/pages/admin/BackfillManagerPage.tsx`:

- Show more granular progress during sync
- Add staging indicator (e.g., "Fetching..." -> "Promoting..." -> "Complete")
- Display both staged and promoted record counts if needed

#### 4. Enhanced Job Tracking Fields

The `backfill_jobs` table already has these fields:
- `records_processed` - tracks records written to staging
- `staging_synced` - boolean flag for promotion status
- `last_cursor` - cursor for resumable sync
- `total_records_expected` - estimated total (can update after first page)

---

### Technical Details

**Staging Table Schema** (`arketa_clients_staging`):
- `id` (uuid) - primary key
- `sync_batch_id` (uuid) - groups records from single sync session
- `staged_at` (timestamp)
- `arketa_client_id` (text) - external ID from Arketa
- `client_name`, `client_email`, `client_phone`, etc.
- `raw_data` (jsonb)

**Progress Update Flow**:
```text
1. Fetch 500 clients from API (1 page)
2. Insert to staging in batches of 5
3. After each batch of 5:
   - Update backfill_jobs.records_processed += 5
   - Realtime pushes update to frontend
4. After page complete, check hasMore
5. If hasMore, continue to next page (or schedule retry)
6. When complete, promote staging to production
7. Clear staging table for batch_id
```

**Edge Function Changes**:
- Generate `sync_batch_id` at job start
- Insert to `arketa_clients_staging` instead of `arketa_clients`
- Update progress after every 5 records (not 100)
- Add promotion step at end
- Truncate staging records for completed batch

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/backfill-historical/index.ts` | Add staging workflow, 5-record batch progress updates, promotion logic |
| `src/pages/admin/BackfillManagerPage.tsx` | Add staging status display, show "Fetching/Promoting" phases |
| `src/hooks/useBackfillJobs.ts` | No changes needed (realtime already working) |

---

### Edge Cases Handled

- **Timeout during fetch**: Job saves `last_cursor`, auto-resumes in 3 minutes
- **Timeout during promotion**: Track promoted count, resume promotion
- **Duplicate records**: Upsert on `external_id` handles duplicates
- **Failed records**: Log errors, continue with remaining records
- **11,000+ clients**: Paginated fetch with auto-continuation handles unlimited records

---

### Expected Outcome

- Records count updates visibly every few seconds (after each 5 records)
- Sync uses staging table for data integrity
- Staging table is cleared after successful promotion
- Sync automatically resumes from last position if interrupted
- Full 11,000+ client sync completes reliably across multiple edge function invocations


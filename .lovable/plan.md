

## Arketa Reservations Pipeline Overhaul

### Problem Summary

Four interrelated issues causing timeouts, data loss, and staging bloat:

1. **Staging never clears** — `sync-arketa-reservations` inserts rows but only `sync-from-staging` (Phase 3 of the wrapper) clears them. If Phase 3 fails or is skipped, rows accumulate (1.3M+ observed).
2. **Circular redundant syncs** — `refresh-daily-schedule` calls `sync-arketa-reservations`, and `sync-arketa-reservations` calls `refresh-daily-schedule` back. This doubles API calls and compounds timeout pressure. (To answer your question: yes, issue 2 is about the batching in `sync-arketa-reservations` — it inserts 3,400+ rows to staging in chunks of 50, but the staging inserts are timing out because the table is bloated, and the circular calls amplify the problem.)
3. **21 API fields not stored as columns** — The flat `GET /{partnerId}/reservations` endpoint returns a rich `ReservationsReportRow` DTO. Currently only ~12 fields are stored as dedicated columns; the rest (`booking_id`, `instructor_name`, `location_name`, `coupon_code`, `package_name`, `payment_method`, `tags`, `canceled_at`, `milestone`, etc.) exist only in `raw_data` JSONB.
4. **Backfill depends on Classes endpoint** — `arketa_reservations` backfill currently routes through `sync-arketa-classes-and-reservations`, coupling it to classes. Needs to operate independently using the flat reservations endpoint directly.

---

### Plan

#### A. Fix staging cleanup (Issue 1)

**In `sync-arketa-reservations/index.ts`:**
- After successful staging insert, immediately call `sync-from-staging` with `api: 'arketa_reservations'` and `clear_staging: true` inline (not as a separate edge function call — do the transfer logic directly within the function to avoid timeout chains).
- Alternative: Add a `TRUNCATE arketa_reservations_staging` at the START of each sync run (before inserting new data), ensuring a clean slate. This is simpler and prevents accumulation regardless of downstream failures.
- **Chosen approach**: TRUNCATE at the start of each sync. This guarantees cleanup even if the function crashes mid-run.

#### B. Break circular sync loop (Issue 2)

**In `refresh-daily-schedule/index.ts`:**
- Remove the internal call to `sync-arketa-reservations` (lines 68-100). The schedule refresh should only rebuild from existing data in `arketa_reservations_history` — it should not trigger a new API sync. The sync is the caller's responsibility.
- Add `skipReservationSync: true` as a default or remove the sync block entirely.

**In `sync-arketa-reservations/index.ts`:**
- Remove the call to `refresh-daily-schedule` at the end (lines 648-658). The wrapper (`sync-arketa-classes-and-reservations`) already handles schedule refresh as Phase 4.

#### C. Add missing columns (Issue 3 + 4)

**Database migration** — Add 21 columns to both `arketa_reservations_staging` and `arketa_reservations_history`:

```text
booking_id              TEXT
email_marketing_opt_in  BOOLEAN
date_purchased          TIMESTAMPTZ
instructor_name         TEXT
location_name           TEXT
location_address        TEXT
purchase_type           TEXT
estimated_gross_revenue NUMERIC
estimated_net_revenue   NUMERIC
coupon_code             TEXT
package_name            TEXT
package_period_start    TIMESTAMPTZ
package_period_end      TIMESTAMPTZ
offering_id             TEXT
payment_method          TEXT
payment_id              TEXT
service_id              TEXT
tags                    JSONB
canceled_at             TIMESTAMPTZ
canceled_by             TEXT
milestone               INTEGER
```

**In `sync-arketa-reservations/index.ts` — `mapFlatRowToStaging()`:**
- Map all 21 new fields from `ReservationsReportRow` to staging columns.

**In `sync-from-staging/index.ts` — `transferReservations()`:**
- Add the 21 new columns to the select, mapping, and upsert logic.

#### D. Independent backfill for reservations (Issue 5)

**In `run-backfill-job/index.ts`:**
- Change `arketa_reservations` job type to call `sync-arketa-reservations` DIRECTLY (not `sync-arketa-classes-and-reservations`).
- Use `created_min`/`created_max` parameters matching the API reference.
- Flow per batch:
  1. **Fetch** — Call `sync-arketa-reservations` with the chunk's date range → data lands in staging
  2. **Promote** — Call `sync-from-staging` with `api: 'arketa_reservations'` and `clear_staging: true`
  3. **Clear** — Staging is cleared by sync-from-staging
  4. **Next** — Update `backfill_jobs` progress, self-queue next chunk
- Track progress in `backfill_jobs` (already has the schema for this).
- On timeout/failure: log the failed chunk, do NOT skip — retry on next invocation using the same chunk index.
- Use 2-day chunks with no overlap (existing setting) but call the flat reservations endpoint directly.

**Update `getSyncConfig()` for `arketa_reservations`:**
```typescript
case "arketa_reservations":
  return {
    syncFunction: "sync-arketa-reservations",  // Direct, not via wrapper
    historyTable: "arketa_reservations_history",
    dateColumn: "class_date",
    transferApi: "arketa_reservations",
    needsTransfer: true,  // Explicitly call sync-from-staging
  };
```

---

### Files to modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-arketa-reservations/index.ts` | Truncate staging at start; map 21 new fields; remove `refresh-daily-schedule` call |
| `supabase/functions/refresh-daily-schedule/index.ts` | Remove internal reservation sync call |
| `supabase/functions/sync-from-staging/index.ts` | Add 21 new columns to reservation transfer |
| `supabase/functions/run-backfill-job/index.ts` | Decouple reservation backfill from classes; call reservations directly with explicit staging promotion |
| DB migration | Add 21 columns to `arketa_reservations_staging` and `arketa_reservations_history` |

### One-time cleanup
- Truncate `arketa_reservations_staging` (already done in prior migration, but verify it's empty).


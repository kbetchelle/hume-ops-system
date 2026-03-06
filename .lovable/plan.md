

# Fix Plan: Arketa Reservation Sync Reliability

## Issues Identified

1. **`strict_three_phase` + classes fail → entire job aborts** (combined function lines 120-148)
2. **Staging filter silently drops reservations without `class_id`** (sync-from-staging line 169)
3. **Empty `class_id` reservations logged but never synced** (sync-arketa-reservations line 555)
4. **Dead code at line 395** in run-backfill-job (condition can never be true)
5. **Tier 3 discovery total failure → 0 reservations** (no fallback)

## Fixes

### Fix 1: Soften `strict_three_phase` for classes — don't abort reservations
**File:** `supabase/functions/sync-arketa-classes-and-reservations/index.ts`

Change the `strict_three_phase` behavior so that a classes-phase failure **logs a warning and continues** to the reservations phase (which has its own Tier 3 discovery). The strict abort should only apply if the *reservations* phase itself fails.

- Lines 119-151: Remove the early `return` on classes failure when `strictThreePhase=true`. Instead, just log a warning and proceed. The reservations function already handles missing classes via Tier 3 discovery.
- Update the final `success` calculation: in strict mode, success = `reservationsOk && stagingOk` (same as non-strict). Classes failure is recorded but non-blocking.

### Fix 2: Allow reservations without `class_id` through staging
**File:** `supabase/functions/sync-from-staging/index.ts`

- Line 169: Change filter from `r.reservation_id && r.class_id` to `r.reservation_id` only. Reservations without a `class_id` are still valid data (they represent bookings where the class reference is missing from the API).
- Add a `class_id: r.class_id ?? null` fallback so the column is nullable rather than filtering the row out entirely.

### Fix 3: Stage empty-class_id reservations instead of only logging them
**File:** `supabase/functions/sync-arketa-reservations/index.ts`

- Lines 554-575: Still log to `api_sync_skipped_records` for visibility, but **also include** these rows in the staging insert. Change the `rowsToInsert` filter (line 573) from requiring `class_id` in `knownClassIds` to: include all rows that have a `reservation_id`, regardless of `class_id`.
- The skipped-records log becomes informational ("reservation has no class_id") rather than meaning "dropped".

### Fix 4: Remove dead code block
**File:** `supabase/functions/run-backfill-job/index.ts`

- Lines 395-414: Delete the entire `if (jobType === "arketa_reservations" && config.syncFunction === "sync-arketa-reservations" ...)` block. Since `config.syncFunction` for `arketa_reservations` is now `"sync-arketa-classes-and-reservations"`, this condition is always false. The combined function already handles staging transfer and daily schedule refresh internally.

### Fix 5: Add future-proofing comment for direct date-range endpoint
**File:** `supabase/functions/sync-arketa-reservations/index.ts`

- Add a `// TODO:` comment near the Tier 1 endpoints (line 88-92) noting that if Arketa adds a date-range reservations endpoint, it should be added as a Tier 1 candidate.

## Verification Steps (post-implementation)

After deploying, verify each fix:

1. **Fix 1 verification:** Query `api_logs` for recent `arketa_classes` entries with `/classes+reservations` endpoint — confirm that jobs where classes failed still produced reservation records (no more 502 aborts).
2. **Fix 2 verification:** Query `arketa_reservations_history` for rows where `class_id IS NULL` — should now contain records that were previously filtered out.
3. **Fix 3 verification:** Query `api_sync_skipped_records` for `reason = 'empty_class_id'` — these should still exist for observability, but the same `reservation_id`s should also appear in `arketa_reservations_history`.
4. **Fix 4 verification:** Confirm `run-backfill-job/index.ts` no longer contains the dead code block. Run a reservations backfill and confirm it completes without errors.
5. **Integration test:** Run a backfill for a historical date range (e.g., 30+ days ago) where classes may not exist in the DB. Confirm reservations are fetched via Tier 3 discovery and persisted.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/sync-arketa-classes-and-reservations/index.ts` | Remove early abort on classes failure |
| `supabase/functions/sync-from-staging/index.ts` | Remove `class_id` requirement from filter |
| `supabase/functions/sync-arketa-reservations/index.ts` | Stage all reservations including empty class_id |
| `supabase/functions/run-backfill-job/index.ts` | Delete dead code block (lines 395-414) |




# Fix: Arketa Reservation Sync Pulling Fewer Records Than Pre-Existing

## Root Cause Analysis

The investigation revealed two interconnected bugs causing the `pulled < pre-existing` shortfall:

### Bug 1: Standalone Reservation Backfill Skips Class Discovery

When `run-backfill-job` processes `arketa_reservations` (standalone), it calls `sync-arketa-reservations` directly -- **without syncing classes first**. The reservation sync relies on Tier 2 (DB-driven), which only fetches reservations for classes already in `arketa_classes`. If any class was never synced (e.g., a new daily "Gym Check In" class_id), its reservations are invisible.

The combined `arketa_classes_and_reservations` path works correctly because it runs `sync-arketa-classes` before `sync-arketa-reservations`, discovering all real class_ids from the API first.

### Bug 2: Synthetic Gym Check-In Rows Have Fake External IDs

The previously inserted placeholder Gym Check-In rows use `external_id = 'gym-checkin-2026-YYYY-MM-DD'` -- these are not real Arketa class IDs. When Tier 2 uses these to call `GET /classes/gym-checkin-2026-.../reservations`, the API returns nothing (404). This actively prevents discovery of real Gym Check-In reservations because Tier 3 only runs when Tier 2 finds **zero** classes (and these placeholders count as "found").

### Bug 3: Reservation Filter Drops Valid Records

After fetching reservations, `sync-arketa-reservations` (lines 539-541) filters out any reservation whose `class_id` isn't in `arketa_classes`. If the API returns a reservation with a rescheduled or different class_id not yet in the catalog, it's silently dropped (logged to `api_sync_skipped_records` but not synced).

## Fix Plan

### 1. Remove Synthetic Gym Check-In Rows
- SQL migration to delete rows from `arketa_classes` where `external_id LIKE 'gym-checkin-2026-%'`
- These fake IDs block Tier 3 discovery and never return real data

### 2. Redirect Standalone Reservation Backfill to Combined Sync
- In `run-backfill-job/index.ts`, change the per-day loop for `arketa_reservations` to call `sync-arketa-classes-and-reservations` instead of `sync-arketa-reservations` directly
- This ensures classes are always discovered before fetching reservations
- Remove the separate `sync-from-staging` call since the combined function already handles it
- Update `buildSyncBody` and `extractRecordCount` accordingly

### 3. Auto-Upsert Unknown Class Stubs During Reservation Sync
- In `sync-arketa-reservations/index.ts`, after fetching reservations in Tier 2, for any `class_id` NOT in `arketa_classes`, insert a stub row rather than filtering the reservation out
- This prevents the class_id filter from silently dropping valid reservations
- The stub includes `class_id`, `class_name`, `class_date` from the reservation metadata

### 4. Update Metric Labels for Clarity (Minor)
- In the backfill sync results UI, rename "pulled" to "fetched from API" to distinguish from "pre-existing in DB"

### Files Modified
- `supabase/functions/run-backfill-job/index.ts` -- redirect reservation backfill to combined sync
- `supabase/functions/sync-arketa-reservations/index.ts` -- auto-upsert unknown class stubs instead of filtering
- SQL migration to clean up synthetic gym check-in rows


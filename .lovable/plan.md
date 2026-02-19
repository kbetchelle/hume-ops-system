

# Fix Arketa Classes and Reservations Sync

## Problem

The sync functions use different API parameters than the working implementation, causing HTTP 500 errors from the Arketa API for recent dates.

## Key Differences Found

| Parameter | Working App | Our Implementation |
|---|---|---|
| **Classes: date filter** | No date filter (fetches all) | `start_date` + `end_date` (causes 500) |
| **Pagination cursor** | `start_after={cursor}` | `cursor={cursor}` |
| **Page size** | `limit=500` (classes), `limit=100` (Tier 3) | `limit=400` |
| **Classes params** | Only `include_cancelled=true` | Also `include_past=true`, `include_completed=true` |
| **Tier 3 class listing** | `include_canceled=true` (one L), `status=all` | `include_cancelled=true` (two Ls), no `status` param |
| **Reservations auth** | `Authorization: Bearer {API_KEY}` directly | OAuth token flow with API key fallback |

## Changes

### 1. `supabase/functions/sync-arketa-classes/index.ts`

- Remove `start_date` and `end_date` query params (fetch all classes, no date filter)
- Change `cursor` param to `start_after`
- Change `limit` default to `500`
- Remove `include_past` and `include_completed` params (keep only `include_cancelled=true`)
- Read `pagination.nextCursor` or `pagination.next_cursor` from response for `start_after`
- After fetching all classes, filter to only those within the requested date range before staging (so the function still respects caller's date range for what gets persisted)

### 2. `supabase/functions/sync-arketa-reservations/index.ts`

**Tier 1 (direct /reservations):**
- Change `limit` to `500`
- Add `start_after` pagination support (currently only fetches one page)

**Tier 3 (class listing for discovery):**
- Change `limit` to `100`
- Change `include_cancelled` to `include_canceled` (one L)
- Add `status=all` param
- Add `include_completed=true` and `include_past=true` only for past date ranges
- Change `cursor` to `start_after`

**Per-class reservations (Tier 2):**
- Add `limit=500` and `start_after` pagination support

**Auth for reservations:**
- Use `Authorization: Bearer {ARKETA_API_KEY}` directly (the API key as a Bearer token, not OAuth)

### 3. `supabase/functions/sync-arketa-classes-and-reservations/index.ts`

- No structural changes needed; it delegates to the above two functions

### 4. `supabase/functions/run-backfill-job/index.ts`

- No structural changes needed; it delegates to sync functions

## Technical Details

- The root cause of the 500 error is likely the `start_date`/`end_date` parameters on the classes endpoint, which the working app does not use at all
- The wrong cursor parameter name (`cursor` vs `start_after`) may cause silent pagination failures (only first page returned)
- The spelling difference (`cancelled` vs `canceled`) may cause the API to ignore the parameter entirely
- Client-side date filtering after fetch ensures we don't regress the staging/upsert logic


## Fix Arketa Classes Sync Pagination Failure — COMPLETED

### Problem

The `sync-arketa-classes` function fetches all classes historically (no date filter), but the Arketa API returns HTTP 500 on page 2+ of pagination, breaking "Sync Now".

### Solution

Date filtering via query params (`start_date`/`end_date`) also causes Arketa API 500 errors, so instead we **cap pagination to 1 page** (500 records) and apply **local date filtering** on the results. This avoids both failure modes.

### Changes Made

**File: `supabase/functions/sync-arketa-classes/index.ts`**

1. Moved date calculation **before** the fetch loop for local filtering
2. Added `MAX_PAGES = 1` cap to prevent pagination 500 errors
3. Kept local date filtering with default range -7 to +30 days
4. No date params sent to API (they cause 500 errors)

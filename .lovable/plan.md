

## Add Reverse Sort Strategy to Classes Sync

### Problem
The `sync-arketa-classes` function only fetches the first page of classes in default (oldest-first) order, returning records from Jul-Aug 2024. It lacks the reverse sort strategy already proven to work in the reservations sync, which successfully retrieves recent data (Apr-Dec 2026).

### Solution
Add the same multi-strategy fetch logic from `sync-arketa-reservations` to `sync-arketa-classes`, trying reverse sort parameters first, then cursor skip-ahead, then falling back to the plain first page.

### Technical Details

**File:** `supabase/functions/sync-arketa-classes/index.ts`

1. **Replace the single fetch block** (lines 56-83) with a 3-tier strategy:
   - **Strategy A (Reverse Sort):** Try sort params (`sort=created_at&order=desc`, `sort=start_time&order=desc`, etc.) to get newest classes on page 1
   - **Strategy B (Cursor Skip-ahead):** Query `arketa_classes` for a recent `external_id` and use it as `start_after` to jump past old records
   - **Strategy C (Plain Fallback):** Original behavior -- fetch first page in default order

2. **Add local date filtering:** After fetching, filter results to only include classes within the requested `startDate`-`endDate` range (already computed on lines 46-52)

3. **Add logging:** Include console logs for each strategy attempt showing record counts and date ranges returned, matching the pattern used in the reservations sync

4. **Return metadata:** Add `strategy` field to the response JSON so callers know which tier succeeded

The staging insert, RPC upsert, and response logic remain unchanged -- only the fetch portion is replaced.




## Add Cursor-Based Pagination to Classes Sync

### Problem
The `sync-arketa-classes` function currently fetches only the first page of results and applies local date filtering. This limits it to ~500 records per call. However, the Arketa API does support cursor-based pagination via `pagination.nextCursor` and `start_after` -- this is already used successfully in the backfill and clients sync functions.

The known constraint is that *page-number-based* pagination and *date query parameters* cause 500 errors. Cursor-based pagination (`start_after`) may work fine, as evidenced by the backfill function paginating through classes without issues.

### Solution
Add a pagination loop to the classes sync that follows `pagination.nextCursor` from the API response, continuing to fetch pages until either:
- No more pages (`hasMore` is false or no `nextCursor`)
- The fetched classes are past the target date range (no point continuing)
- A safety cap is hit (e.g., 30 pages to stay within the 60-second gateway timeout)

### Technical Details

**File:** `supabase/functions/sync-arketa-classes/index.ts`

**Changes to each strategy tier:**

1. **Strategy A (Reverse Sort):** After the initial fetch, check `response.pagination.nextCursor`. If present and we still need more data, loop with `start_after` cursor until we've covered the target date range or hit the page cap.

2. **Strategy B (Cursor Skip-ahead):** Same pagination loop -- after the initial skip-ahead fetch, continue following cursors.

3. **Strategy C (Plain Fallback):** Same pagination loop -- follow cursors from the plain first page forward.

**Pagination loop logic (shared across all strategies):**
```text
let cursor = response.pagination?.nextCursor
let pageCount = 1
const MAX_PAGES = 30

while (cursor && pageCount < MAX_PAGES) {
  fetch with start_after = cursor
  parse classes from response
  filter to date range
  add matches to allClasses
  
  // Early exit: if all classes in this page are past endDate, stop
  cursor = response.pagination?.nextCursor
  pageCount++
}
```

**Safety measures:**
- MAX_PAGES cap of 30 to stay within the 60-second timeout
- Early termination if a page returns classes entirely outside (after) the target date range
- If any page returns a 500, stop pagination gracefully and use what we have so far
- Log page count and total classes fetched for debugging

**Response updates:**
- Add `pagesFetched` to the response JSON alongside existing `strategy` field

No changes to the staging insert, RPC upsert, or other downstream logic.


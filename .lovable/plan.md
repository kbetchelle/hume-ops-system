## Re-add Date Filtering to Arketa Classes Sync

### Problem

The `sync-arketa-classes` function currently fetches **all classes historically** with no date filter, which causes the Arketa API to return HTTP 500 errors on pagination (page 2+). This breaks the "Sync Now" button.

### Solution

Re-add `start_date` and `end_date` query parameters to the API request URL so only the relevant date window is fetched, avoiding the pagination failure.

### Changes

**File: `supabase/functions/sync-arketa-classes/index.ts**`

1. Move date calculation **before** the API fetch loop (currently it happens after)
2. Add `start_date` and `end_date` as URL query parameters on the Arketa `/classes` endpoint
3. Remove the "local filtering" comment since filtering now happens server-side
4. Keep default range as -7 to +30 days (matching the orchestrator's caller range)

### Technical Detail

The fetch loop (lines 49-68) will change from:

```text
GET /classes?limit=500
```

to:

```text
GET /classes?limit=500&start_date=2026-01-20&end_date=2026-02-26
```

The date variables (`startDate`, `endDate`) will be computed from the request body before the loop starts, using the same defaults (-7 to +30 days). The rest of the function (staging insert, upsert RPC) remains unchanged.


## Root Cause Analysis

The Arketa clients backfill completes instantly with 0 records because the API response format is not being recognized by the parsing logic.

### Evidence from Edge Function Logs

The newly deployed function shows this critical sequence:
```text
API response received {"topLevelKeys":"items, pagination",...}
UNKNOWN RESPONSE FORMAT - Records will be empty!
```

**The Arketa API returns clients in an `items` array, not `data` or `clients`.**

### Current Code vs Expected Response

The `unified-backfill-sync` function checks for these response formats:
- `data.data`
- `data.clients`
- `data.classes`
- `data.reservations`
- `data.payments`
- `data.purchases`
- `data.staff`

But the actual Arketa `/clients` endpoint returns:
```json
{
  "items": [...clients...],
  "pagination": { "hasMore": true, "nextCursor": "..." }
}
```

---

## Fix Required

Update `supabase/functions/unified-backfill-sync/index.ts` in the `fetchFromApi` function to add support for the `items` response format.

### Code Change (lines ~407-420)

Add a check for `data.items` in the response format detection logic:

```typescript
// After the existing checks for data.staff...
} else if (data.items && Array.isArray(data.items)) {
  records = data.items;
  matchedFormat = 'items_field';
}
```

This should be inserted after the `staff_field` check and before the `else` clause that logs the unknown format error.

### Why This Fixes It

1. The Arketa Partner API uses `items` as the standard array field name
2. Once the parser recognizes `items`, it will extract the client records correctly
3. The existing pagination logic (`data.pagination.nextCursor`, `data.pagination.hasMore`) is already correct
4. The 10,000+ clients will sync properly across multiple batches

---

## Technical Details

| Aspect | Current State | After Fix |
|--------|---------------|-----------|
| Response Format | Not recognized (`none`) | Matches `items_field` |
| Records Extracted | 0 | 400 per batch |
| hasMore Detection | Works (pagination field exists) | Works |
| Cursor Pagination | Works when cursor present | Works |

### Files to Modify

- `supabase/functions/unified-backfill-sync/index.ts` - Add `items` field check in response parsing

### Verification Steps

After deployment:
1. Create a new clients backfill job
2. Monitor logs for `matchedFormat: 'items_field'`
3. Confirm records are being staged and upserted
4. Verify progress updates in the UI


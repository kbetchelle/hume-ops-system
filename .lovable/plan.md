# Arketa Backfill Pagination Fix - IN PROGRESS 🔄

## Summary

Working to fix the backfill sync to properly paginate through all 11k+ Arketa clients.

## Current Issue

The clients backfill stops after 1 batch (400 records) because:
1. Arketa API says `hasMore: true` but returns NO `nextCursor`
2. Previous fix set `hasMore = cursorPresent` which breaks when cursor is missing

## Latest Fix (2026-01-30)

### Synthetic Cursor Strategy

When Arketa's `/clients` endpoint returns `hasMore: true` but no cursor:
1. Use the **last record's ID** as a synthetic cursor
2. Pass it as `?cursor={lastId}` on the next request
3. Continue until we get less than 400 records

```typescript
// If API says hasMore but no cursor, use last record ID
if (paginationHasMore && isBatchFull && !cursorPresent) {
  const lastId = records[records.length - 1].id;
  effectiveCursor = String(lastId);
  hasMore = true;
}
```

## Verification Steps

1. Create a new clients backfill job
2. Monitor logs for "Using last record ID as synthetic cursor"
3. Job should continue to batch 2, 3, etc. until all ~11k records synced
4. Final records_processed should be close to total client count

## Files Modified

- `supabase/functions/unified-backfill-sync/index.ts` - Synthetic cursor logic

## Known Limitations

| Endpoint | Pagination | Notes |
|----------|------------|-------|
| `/clients` | Synthetic cursor | Uses last record ID when no cursor provided |
| `/classes` | Cursor + date range | Full native support |
| `/reservations` | Cursor + date range | Full native support |
| `/purchases` | Cursor + date range | Full native support |
| `/staff` | Unknown | Uses dev API endpoint |

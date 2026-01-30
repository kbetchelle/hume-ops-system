# Arketa Backfill Pagination Fix - RESOLVED ✅

## Summary

Fixed the backfill sync to properly paginate through all 11k+ Arketa clients using **offset-based pagination**.

## Root Cause

The Arketa `/clients` endpoint returns `hasMore: true` but provides NO `nextCursor`. The previous fix tried to use the last record's ID as a synthetic cursor, but the API doesn't support cursor-based pagination for this endpoint - it was returning the same 400 records each time.

## Solution (2026-01-30)

### Offset-Based Pagination

When no cursor is provided by the API, we now use the `skip` parameter:

```typescript
// If no cursor available, use offset-based pagination
if (job.records_processed > 0) {
  const offset = job.records_processed;
  url += `&skip=${offset}`;
}
```

### Pagination Logic

1. If API returns a `nextCursor` → use cursor-based pagination
2. If no cursor but `hasMore: true` and full batch → use offset (skip=records_processed)
3. If batch size < 400 → sync complete

## Verification Steps

1. Create a new clients backfill job
2. Monitor logs for "Using offset-based pagination"
3. Each batch should skip records_processed records
4. Job should continue until all ~11k records synced

## Files Modified

- `supabase/functions/unified-backfill-sync/index.ts` - Offset-based pagination

## Endpoint Pagination Support

| Endpoint | Pagination Method | Notes |
|----------|-------------------|-------|
| `/clients` | Offset (skip) | No cursor support |
| `/classes` | Cursor + date range | Full native support |
| `/reservations` | Cursor + date range | Full native support |
| `/purchases` | Cursor + date range | Full native support |
| `/staff` | Offset (skip) | Uses dev API endpoint |

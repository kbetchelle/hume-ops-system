

# Plan: Arketa Classes PST Timezone Fix, Toast Raw Order Storage, and Page Size Increase

## 1. Arketa Classes: Convert start_time to PST for class_date

**Problem:** Currently, `class_date` is derived from `start_time` using UTC (`new Date(startTime).toISOString().split('T')[0]`), which can assign the wrong calendar date for classes in the America/Los_Angeles timezone.

**Changes:**

### Edge Function: `supabase/functions/sync-arketa-classes/index.ts`
- Replace the UTC-based date extraction with PST/PDT-aware conversion
- Use `Intl.DateTimeFormat` with `timeZone: 'America/Los_Angeles'` to derive the correct local date from the `start_time` timestamp
- No external dependencies needed; Deno supports IANA timezones natively

### Database Migration: Fix existing `arketa_classes` records
- Run a migration that updates all existing rows:
  ```sql
  UPDATE arketa_classes
  SET class_date = (start_time AT TIME ZONE 'America/Los_Angeles')::date
  WHERE start_time IS NOT NULL;
  ```

---

## 2. Toast: Store Raw Individual Orders (No Aggregation)

**Problem:** Both `toast-backfill-sync` and `sync-toast-orders` currently aggregate all orders for a business date into a single summary row. The requirement is to store every individual order as its own row in both `toast_staging` and `toast_sales`.

**Changes:**

### Database Migration
- **Restructure `toast_staging`:**
  - Drop the existing `UNIQUE(business_date, sync_batch_id)` constraint
  - Add an `order_guid` TEXT column (Toast order GUID, unique identifier per order)
  - Add a `UNIQUE(order_guid)` constraint for deduplication
  - Keep `raw_data` JSONB for the full raw order object
  - Keep `business_date`, `net_sales`, `gross_sales`, `cafe_sales` per-order (individual amounts, not aggregated)

- **Restructure `toast_sales`:**
  - Drop the existing `UNIQUE(business_date)` constraint (was one row per day; now one row per order)
  - Add an `order_guid` TEXT column with a `UNIQUE(order_guid)` constraint
  - Add `order_count` INTEGER column (always 1 per row, for compatibility)
  - Keep per-order `net_sales`, `gross_sales`, `cafe_sales`, `raw_data`

- **Truncate existing data** in both `toast_staging` and `toast_sales` (175 and 231 rows respectively -- all aggregated, not useful in new schema)

- **Update `get_backfill_toast_calendar` RPC** to count individual order rows per date instead of expecting one row per date

### Edge Function: `supabase/functions/toast-backfill-sync/index.ts`
- Remove the `aggregateOrdersByDate` function entirely
- Instead of aggregating, insert each raw order individually:
  - Extract `order_guid` from `order.guid` (Toast's unique order identifier)
  - Extract per-order `netAmount`, `totalAmount` for `net_sales`/`gross_sales`
  - Store full raw order JSON in `raw_data`
  - Upsert to `toast_staging` on `order_guid`, then upsert to `toast_sales` on `order_guid`
- Use batch upserts (100 records at a time) instead of one-by-one for performance

### Edge Function: `supabase/functions/sync-toast-orders/index.ts`
- Same changes: remove `aggregateOrdersForDate`, store each order individually
- Upsert on `order_guid` instead of `business_date`
- Batch upserts for efficiency

### Frontend: `src/components/settings/backfill/ToastBackfillTab.tsx`
- Update description text from "daily aggregated sales" to "individual order records"
- The count query already uses `select("*", { count: "exact" })` so it will automatically reflect the new row count

---

## 3. Toast Backfill Page Size: Increase to 300

**Problem:** Current `PAGE_SIZE` is 100, but the Toast API documentation notes page size is "strictly limited to 100 records per request."

**Important note:** The Toast `ordersBulk` API has a hard cap of 100 per page. Setting `pageSize=300` in the request will either be ignored (Toast returns 100 anyway) or cause an error. The pagination logic already fetches all pages automatically via `hasMore`. However, per your request:

**Changes:**
- In `toast-backfill-sync/index.ts`: Change `PAGE_SIZE` from 100 to 300
- In `sync-toast-orders/index.ts`: Change `PAGE_SIZE` from 100 to 300
- Update the `hasMore` check to compare against the new PAGE_SIZE

If Toast rejects or silently caps at 100, the existing pagination loop will still work correctly -- it just means fewer pages will be needed if Toast honors the larger size.

---

## Technical Summary of All Files Changed

| File | Change |
|------|--------|
| `supabase/functions/sync-arketa-classes/index.ts` | PST timezone conversion for `class_date` |
| `supabase/functions/toast-backfill-sync/index.ts` | Remove aggregation, store raw orders, PAGE_SIZE to 300 |
| `supabase/functions/sync-toast-orders/index.ts` | Remove aggregation, store raw orders, PAGE_SIZE to 300 |
| `src/components/settings/backfill/ToastBackfillTab.tsx` | Update description text |
| New migration SQL | Update existing `arketa_classes.class_date` to PST; restructure `toast_staging` and `toast_sales` tables (add `order_guid`, drop old unique constraints, truncate old data); update `get_backfill_toast_calendar` RPC |


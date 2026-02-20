# Arketa Payments API Sync – Troubleshooting & Data Pipeline

This document analyzes the full sync flow for Arketa payments (API sync + backfill) and documents failure points and fixes. Reference: [Partner API docs](https://sutrafitness.github.io/api-docs/#/).

---

## 1. Data pipeline overview

| Path | Trigger | Function(s) | API endpoint | Target table(s) |
|------|--------|-------------|--------------|-----------------|
| **API sync** (manual / cron) | UI "Sync payments" or cron | `sync-arketa-payments` | `GET …/partnerApi**Dev**/v0/{id}/**payments**` (cursor) | `arketa_payments` + `arketa_payments_staging` |
| **Date backfill** | Backfill job (Select dates) | `run-backfill-job` → `sync-arketa-payments` → `sync-from-staging` | Same as above (no date filter) | Staging → `arketa_payments` |

Documented Partner API (production) only exposes:

- **Base:** `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0`
- **Purchases:** `GET /{partnerId}/purchases` (date range + cursor pagination)
- **No `/payments`** in the public spec.

So:

- **Backfill** was originally implemented in `backfill-historical` using **`/purchases`** with `start_date`/`end_date` and `cursor` (correct per docs).
- **sync-arketa-payments** uses **`/payments`** on **partnerApiDev** and **ignores** any `start_date`/`end_date` in the body.

---

## 2. Identified issues and failure points

### 2.1 Wrong endpoint / base URL for documented API

- **sync-arketa-payments** calls:
  - `partnerApi**Dev**/v0` (dev base)
  - `.../payments?limit=25&start_after={cursor}`
- Public docs only describe **production** `partnerApi/v0` and **`/purchases`** (not `/payments`).
- **Risk:** 404 or different behavior if `/payments` does not exist or is dev-only; production backfill cannot use the documented `/purchases` when run via `sync-arketa-payments`.

**Fix (implemented):** When `start_date` and `end_date` are provided (e.g. from `run-backfill-job`), use the documented **production** base and **`/purchases`** with date range and cursor. This restores correct date-based backfill.

---

### 2.2 Date-based backfill does not apply a date filter

- **run-backfill-job** for `arketa_payments`:
  - Loops over each date in the range.
  - Calls `sync-arketa-payments` with `{ startDate, endDate, triggeredBy: "backfill-job", manual: true, noLimit: true }`.
- **sync-arketa-payments** does **not** read `startDate`/`endDate` (or `start_date`/`end_date`). It always does a single cursor-based run (up to 30 pages).
- **Result:** Every “date” in the backfill gets the **same** global cursor fetch. Counts per date (`eq(created_at_api, dateStr)`) are wrong; most dates show 0 new records; backfill is effectively not date-scoped.

**Fix (implemented):** Support optional `start_date`/`end_date` (or `startDate`/`endDate`) in the request body. When both are present, use **date-mode**: call `GET /purchases?start_date=…&end_date=…&limit=…&cursor=…`, write only to **staging** with a `sync_batch_id`, and return counts so the job can track progress per date. When dates are not provided, keep existing cursor-based behavior for the “Sync payments” button.

---

### 2.3 Staging schema and transfer compatibility

- **sync-arketa-payments** (cursor mode) writes staging rows with: `payment_id`, `created_at_api`, `amount_refunded`, `normalized_category`, etc. (same shape as `arketa_payments`).
- **backfill-historical** (when used) wrote staging rows with: `payment_id`, `source_endpoint`, `total_refunded`, `updated_at`, `start_date`/`end_date`, and **no** `created_at_api` or `amount_refunded`.
- **sync-from-staging** maps: `payment_id`, `created_at_api`, `amount_refunded`, etc. It does **not** map `total_refunded` → `amount_refunded` or derive `created_at_api` from `updated_at`/`start_date`.

**Risks:** Rows originating from a purchases-style backfill can have `created_at_api` = null and refunds in `total_refunded` only, so transfer loses refund data and date accuracy.

**Fix (implemented):** In `transferPayments`, when building the upsert payload, set:
- `amount_refunded: r.amount_refunded ?? r.total_refunded ?? null`
- `created_at_api: r.created_at_api ?? r.updated_at ?? (r.start_date ? `${r.start_date}T00:00:00Z` : null) ?? null`
so both API-sync and backfill-shaped staging rows land correctly in `arketa_payments`.

---

### 2.4 sync-from-staging batch and clearing

- After each batch of dates, **run-backfill-job** calls **sync-from-staging** with `api: "arketa_payments"`, `clear_staging: true`, and **`sync_batch_id: undefined`**.
- With `sync_batch_id` undefined, transfer reads **all** rows from `arketa_payments_staging`, not just the current backfill batch. If multiple batches or both API sync and backfill write to staging, this can:
  - Transfer more than intended in one go.
  - Delete staging rows that belonged to another batch (because clear uses the set of rows that were just read, which is “all” when no `sync_batch_id` is set).

**Recommendation:** When run-backfill-job invokes sync-arketa-payments in date-mode, it should pass a stable `sync_batch_id` for that job (or per date) and then call sync-from-staging with that same `sync_batch_id` so only that batch is transferred and cleared. (Implementation can be done in a follow-up: run-backfill-job generates a batch id and passes it through; sync-arketa-payments returns it; run-backfill-job passes it to sync-from-staging.)

---

### 2.5 Retry and non-5xx responses

- **sync-arketa-payments** uses `fetchWithRetry` but only retries when `response.status >= 500`. So 401/403/404 are not retried (correct), but any transient 4xx or network error is not retried.
- **backfill-historical** treats 429 and 5xx as `RetryableError` and others as non-retryable.

No change in this doc; worth keeping in mind when debugging “sync failed” once.

---

### 2.6 Pagination and response shape mismatch

- **Docs:** Purchases use cursor-based pagination (e.g. `pagination.nextCursor` or similar).
- **sync-arketa-payments** (payments): expects `data.items` and `data.pagination.nextStartAfterId`.
- **backfill-historical** (purchases): uses `responseData.pagination?.nextCursor` and treats body as array or `responseData.purchases` / `responseData.payments` / `responseData.data`.

If the real `/purchases` response uses a different shape (e.g. `items` + `nextCursor`), the backfill loop must use the same field names. The implemented date-mode in sync-arketa-payments uses the same pattern as backfill-historical and can be adjusted to match the actual API response (e.g. rename `nextCursor` to `nextStartAfterId` or vice versa).

---

## 3. Summary of code changes made

1. **sync-arketa-payments**
   - **Date-mode:** If `start_date`/`end_date` (or `startDate`/`endDate`) are present in the body:
     - Use production base `partnerApi/v0` and **`/purchases`**.
     - Request: `GET /{partnerId}/purchases?limit=400&start_date=…&end_date=…` and append `&cursor=…` when present.
     - Parse response (array or `purchases`/`items`/`data`), paginate with `pagination.nextCursor` (or equivalent).
     - Map each purchase to the same DB row shape as today (including `created_at_api` from `created_at`/`created_at_api` when available).
     - Write **only to staging** with the provided or generated `sync_batch_id`; do not update the global cursor in `arketa_payments_sync_state`.
     - Return `syncedCount`, `totalFetched`, `payments_staged`, etc., so run-backfill-job can use `extractRecordCount`.
   - **Cursor-mode (no dates):** Unchanged: partnerApiDev, `/payments`, cursor in state table, upsert to `arketa_payments` and staging.

2. **sync-from-staging (transferPayments)**
   - When building each row: `amount_refunded: r.amount_refunded ?? r.total_refunded ?? null`, and `created_at_api: r.created_at_api ?? r.updated_at ?? (r.start_date ? \`${r.start_date}T00:00:00Z\` : null) ?? null`, so backfill/purchases-sourced staging rows map correctly into `arketa_payments`.

---

## 4. How to verify

- **Backfill:** Create a backfill job for Arketa payments for a small date range (e.g. 2 days). Confirm each date shows non-zero “new records” when that date has purchases, and that `arketa_payments` has rows with `created_at_api` in that range.
- **API sync:** Use “Sync payments” in the UI; confirm no 404 and that `arketa_payments` and `arketa_payments_sync_state` update (or that a clear error appears if `/payments` is unavailable).
- **Staging:** After backfill, run sync-from-staging and confirm no constraint/column errors and that refund and date fields are populated where the API provides them.

---

## 5. References

- Partner API: https://sutrafitness.github.io/api-docs/#/
- Production base: `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0`
- Purchases: `GET /{partnerId}/purchases` (date range + cursor)
- Local: `supabase/functions/sync-arketa-payments/index.ts`, `supabase/functions/backfill-historical/index.ts`, `supabase/functions/run-backfill-job/index.ts`, `supabase/functions/sync-from-staging/index.ts`

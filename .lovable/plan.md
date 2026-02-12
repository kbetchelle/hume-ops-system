

# Arketa Payments API Migration Plan

## Summary
Switch from the `/purchases` endpoint to the correct `/payments` endpoint, rebuild all three payment tables (staging, history, main) to match the actual PaymentDTO fields, and update the edge functions and frontend code accordingly.

## What Changes

### 1. Database Migration - Rebuild Payment Tables

**Drop and recreate all 3 tables** to match the actual `/payments` API response:

**`arketa_payments_staging`** (landing zone for raw API data):
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| sync_batch_id | uuid | Batch tracking |
| cursor_position | text | For resumable sync |
| payment_id | text NOT NULL | Arketa payment ID |
| amount | numeric | Payment amount |
| status | text | e.g. succeeded, refunded |
| created_at_api | timestamptz | ISO timestamp from API (renamed to avoid conflict) |
| currency | text | e.g. "usd" |
| amount_refunded | numeric | Amount refunded |
| description | text | Payment description |
| invoice_id | text | Associated invoice ID |
| normalized_category | text[] | Category tags (array) |
| net_sales | numeric | Net sales amount |
| transaction_fees | numeric | Processing fees |
| tax | numeric | Tax amount |
| location_name | text | Location name |
| source | text | Payment source |
| payment_type | text | Type of payment |
| promo_code | text | Promo code used |
| offering_name | text[] | Names of offerings (array) |
| seller_name | text | Seller/staff name |
| client_id | text | Flattened from client.id |
| client_first_name | text | From client object |
| client_last_name | text | From client object |
| client_email | text | From client object |
| client_phone | text | From client object |
| raw_data | jsonb | Full API response |
| staged_at | timestamptz | Default now() |

**`arketa_payments_history`** (same columns + synced_at, unique on payment_id):
- Unique constraint on `payment_id` only (no more `source_endpoint` since we only use `/payments`)
- Add `synced_at` timestamptz

**`arketa_payments`** (main table, same columns + synced_at):
- Unique constraint on `payment_id`
- Indexes on: payment_id, client_id, status, location_name, created_at_api

### 2. Edge Function - `sync-arketa-payments/index.ts`

Complete rewrite to match the spec:
- **Endpoint**: `GET ...partnerApiDev/v0/{PARTNER_ID}/payments` (NOT `/purchases`)
- **Batch size**: 25 per page (per spec, to avoid 500 errors)
- **Resumable cursor**: Save/load cursor from a `sutra_sync_state` table (or reuse existing pattern)
- **Retry**: Up to 8 retries with jittered exponential backoff (3s base, 60s cap)
- **Upsert**: Direct upsert to `arketa_payments` on `payment_id` (idempotent)
- **Also stage**: Write to `arketa_payments_staging` for backfill pipeline compatibility
- **Field mapping**: Flatten `client` object, rename `created_at` to `created_at_api`, store all fields including `invoice_id`, `normalized_category`, `seller_name`, `offering_name`

### 3. Edge Function - `sync-from-staging/index.ts`

Update `transferPayments()`:
- Remove `source_endpoint` from mapping (no longer needed)
- Map all new fields (client_first_name, client_last_name, client_email, client_phone, invoice_id, normalized_category, offering_name, seller_name, promo_code, etc.)
- Change upsert conflict key to just `payment_id`

### 4. Edge Function - `run-backfill-job/index.ts`

Update `getSyncConfig` for `arketa_payments`:
- No date filtering needed (cursor-based, not date-based) -- but keep date column for heatmap
- Change `dateColumn` to `created_at_api` for calendar heatmap tracking

### 5. Database Function - `get_backfill_payments_calendar()`

Update to query on `created_at_api::date` instead of `start_date`.

### 6. Frontend Code Updates

**`src/hooks/useArketaApi.ts`** - `useTodaysPayments()`:
- Query `arketa_payments` using `created_at_api` instead of `payment_date`

**`src/hooks/useShiftSystemData.ts`**:
- Same change: filter on `created_at_api` instead of `payment_date`

**`src/lib/backfill-config.ts`**:
- Update `arketa-payments` config: change `endpointPath` to `/payments`, update `fieldsToFetch` to match new schema

**`src/components/settings/backfill/BackfillCalendarHeatmap.tsx`**:
- Lower payments threshold from 3 to 1

**`src/pages/admin/ApiDataMappingPage.tsx`**:
- Update description to reflect single `/payments` endpoint

### 7. Create sync state table (if not exists)

Create `arketa_payments_sync_state` table to store the resumable cursor:
| Column | Type |
|--------|------|
| id | text PK (default 'payments') |
| cursor | text |
| status | text (running/completed/partial/failed) |
| records_synced | integer |
| estimated_total | integer |
| updated_at | timestamptz |

---

## Technical Details

### API Field to DB Column Mapping

```text
API Field              -> DB Column            Notes
id                     -> payment_id           Renamed to avoid PK conflict
amount                 -> amount
status                 -> status
created (unix)         -> (not stored)         Redundant with created_at
created_at             -> created_at_api       Renamed to avoid DB conflict
currency               -> currency
amount_refunded        -> amount_refunded
description            -> description
invoice_id             -> invoice_id
normalized_category    -> normalized_category  TEXT[] array
net_sales              -> net_sales
transaction_fees       -> transaction_fees
tax                    -> tax
location_name          -> location_name
source                 -> source
payment_type           -> payment_type
promo_code             -> promo_code
offering_name          -> offering_name        TEXT[] array
seller_name            -> seller_name
client.id              -> client_id            Flattened
client.first_name      -> client_first_name    Flattened
client.last_name       -> client_last_name     Flattened
client.email           -> client_email         Flattened
client.phone           -> client_phone         Flattened
(added by sync)        -> synced_at
(added by sync)        -> raw_data             Full JSON
```

### Migration Safety
- The existing `arketa_payments_history` has ~4,997 records from the old `/purchases` endpoint
- These will be dropped since they are from the wrong endpoint
- A full re-sync from `/payments` will be needed after migration
- The `DROP TABLE IF EXISTS ... CASCADE` approach is safe since no other tables reference these

### Files Modified
1. `supabase/functions/sync-arketa-payments/index.ts` - Complete rewrite
2. `supabase/functions/sync-from-staging/index.ts` - Update transferPayments()
3. `supabase/functions/run-backfill-job/index.ts` - Update payments config
4. `src/hooks/useArketaApi.ts` - Update date column reference
5. `src/hooks/useShiftSystemData.ts` - Update date column reference
6. `src/lib/backfill-config.ts` - Update payments config
7. `src/pages/admin/ApiDataMappingPage.tsx` - Update description
8. Database migration - Drop/recreate 3 tables + update calendar function + create sync state table


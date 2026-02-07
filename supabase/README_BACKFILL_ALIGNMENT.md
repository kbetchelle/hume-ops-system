# Backfill system alignment: API sync, tables, and DB

This doc describes how the Select Dates backfill (per-date flow) aligns with the hume-ops DB: api_endpoints, api_logs, staging/history tables, and **sync-from-staging**.

For Arketa API shape, 3-tier reservation fetch, table roles, and aggregation chain, see **[docs/ARKETA_ARCHITECTURE.md](../docs/ARKETA_ARCHITECTURE.md)**.

## Deployment (required for date-selector backfill)

The Arketa reservations/payments **Select dates** backfill needs these edge functions deployed to the **same** Supabase project the app uses:

```bash
supabase functions deploy refresh-arketa-token sync-from-staging run-backfill-job historical-backfill-cron sync-arketa-reservations sync-arketa-payments sync-arketa-subscriptions sync-arketa-classes aggregate-arketa-to-daily-reports
```

Or use the npm script: `npm run supabase:deploy-backfill`. **refresh-arketa-token** is required for Arketa API auth; if it returns 404, the job card will show an error with the deploy hint.

If either function is missing or deployed to a different project, you can get a **404** when starting the backfill. The UI will show the error; if the body includes `error_message` (e.g. "Job not found" or a PostgREST code), the function ran but could not find the job row (e.g. app and functions use different projects).

**Lovable preview:** If the app is deployed or previewed on Lovable, ensure the **Supabase project** configured in that environment (e.g. Lovable’s env vars) is the same project you deploy these functions to. Deploy with `supabase link` pointing at that project, then run the deploy command above. If the preview uses a different Supabase URL, 404 will persist until functions are deployed to that project.

## Architecture in hume-ops

- **Select Dates (reservations / payments):** UI → `run-backfill-job` edge function.
- **run-backfill-job** for reservations/payments: processes dates one-by-one, calls `sync-arketa-reservations` or `sync-arketa-payments` per date, writes to **staging**, then invokes **sync-from-staging** to transfer staging → **history**. Unique targets: (reservation_id, class_id) and (payment_id, source_endpoint).
- **sync-from-staging** edge function: copies staging → history (upsert on conflict), optionally clears staging, logs to api_logs.
- **Other backfill types (e.g. clients, classes):** Use `backfill-historical` (deprecated), which does fetch → staging → transform → upsert → clear in one function.

Hume-ops has a `sync-from-staging` edge function for Arketa reservations and payments. The reference system’s staging → history flow is not used here; Date-based backfill uses run-backfill-job → sync-arketa-reservations/payments → staging → sync-from-staging → history. historical-backfill-cron runs periodically (hourly recommended).

## Tables and columns (staging → history)

### Reservations

- **Staging:** `arketa_reservations_staging` — CSV fields only: `id`, `client_id`, `reservation_id`, `purchase_id`, `reservation_type`, `class_id`, `class_name`, `status`, `checked_in`, `checked_in_at`, `experience_type`, `late_cancel`, `created_at`, `gross_amount_paid`, `net_amount_paid`, `class_date`, `sync_batch_id`, `raw_data`. sync-arketa-reservations inserts here.
- **Target:** `arketa_reservations_history` — same columns as staging plus `synced_at`. **Unique:** `(reservation_id, class_id)`. Filled by **sync-from-staging** from staging.

### Payments

- **Staging:** `arketa_payments_staging` — columns: `record_id`, `source_endpoint`, `payment_id`, `arketa_payment_id`, `client_id`, `amount`, `status`, `description`, `payment_type`, `category`, `offering_id`, `start_date`, `end_date`, `remaining_uses`, `currency`, `total_refunded`, `net_sales`, `transaction_fees`, `stripe_fees`, `tax`, `updated_at`, `synced_at`, `sync_batch_id`. Backfill-historical inserts here when using staging flow.
- **Target:** `arketa_payments_history` — same columns as staging. **Unique:** `(payment_id, source_endpoint)`. Filled by **sync-from-staging** from staging.
- **Legacy:** `arketa_payments` still exists; backfill-historical can write there when not using staging.

## api_endpoints (rate limit)

- **backfill-historical** uses `getApiEndpointConfig(supabase, job.api_source, endpointType)` for rate limit.
- **Lookup:** `api_name = 'arketa'`, `endpoint_type = 'reservations'` or `'payments'`, `is_active = true`.
- **Migrations:** `20260129180932` and `20260129224849` seed `(arketa, reservations)`; `20260130000600` adds `(arketa, payments)`. Both are present so rate limiting works.

## api_logs (sync history)

- **Columns (reference):** `api_name`, `endpoint`, `sync_success`, `duration_ms`, `records_processed`, `records_inserted`, `records_updated`, `error_message`, `triggered_by`. Migration adds `records_updated` if missing.
- **backfill-historical** inserts on job completion (success) or top-level catch (failure). **sync-from-staging** inserts on each run with `records_processed`, `records_inserted`, `records_updated`, `duration_ms`, `triggered_by` (e.g. `backfill-job`).

## api_sync_status

- **Columns (reference):** `last_processed_date` (cursor, e.g. `page:{num}:{endpoint}`), `last_sync_status` (e.g. `fetching:45%:2300/5000` or `stop_requested`), `is_enabled`. Migration `20260209120000_arketa_history_staging_api_sync.sql` adds `last_processed_date` and `last_sync_status` if missing.
- **run-backfill-job** and **sync-arketa-reservations/payments** do not update `api_sync_status`; progress is in `backfill_jobs` only.

## backfill_jobs

- **Columns used by run-backfill-job:** `id`, `job_type`, `start_date`, `end_date`, `processing_date`, `status`, `total_dates`, `completed_dates`, `total_records`, `total_new_records`, `results`, `started_at`, `completed_at`. `job_type` = arketa_reservations | arketa_payments.

## Staging and sync-from-staging

- **arketa_reservations_staging** and **arketa_payments_staging** are used by **run-backfill-job** (via sync-arketa-reservations/payments) and by **historical-backfill-cron**. sync-arketa-reservations/payments write to staging, then **sync-from-staging** transfers to history.

## Summary

| Component                    | Used by Select Dates backfill? | Notes                                                                 |
|-----------------------------|--------------------------------|-----------------------------------------------------------------------|
| arketa_reservations_staging | Yes                            | Backfill writes here; sync-from-staging → history.                    |
| arketa_reservations_history | Yes (target)                   | Unique (reservation_id, class_id). Filled by sync-from-staging.       |
| arketa_payments_staging     | Yes                            | Backfill writes here; sync-from-staging → history.                    |
| arketa_payments_history     | Yes (target)                   | Unique (payment_id, source_endpoint). Filled by sync-from-staging.   |
| api_endpoints               | Yes                            | Rate limit for reservations and payments.                            |
| api_logs                    | Yes                            | backfill-historical and sync-from-staging insert.                    |
| api_sync_status             | No                             | Optional; columns last_processed_date, last_sync_status added.       |
| sync-from-staging           | Yes                            | Transfers staging → history; clears staging; logs to api_logs.        |

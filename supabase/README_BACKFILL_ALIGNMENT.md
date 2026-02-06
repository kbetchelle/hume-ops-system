# Backfill system alignment: API sync, tables, and DB

This doc describes how the Select Dates backfill (per-date flow) aligns with the hume-ops DB: api_endpoints, api_logs, target tables, and the fact that there is **no** separate sync-from-staging step for this path.

## Architecture in hume-ops

- **Select Dates (reservations / payments):** UI → `backfill-historical` edge function.
- **backfill-historical** writes **directly** to `arketa_reservations` and `arketa_payments` (no staging table, no separate sync-from-staging function for this path).
- **Other backfill types (e.g. clients, classes):** Use `unified-backfill-sync`, which does fetch → staging → transform → upsert → clear in one function (no separate sync-from-staging).

So hume-ops does **not** have a `sync-from-staging` edge function. The reference system’s staging → history flow is not used here; backfill-historical and unified-backfill-sync each write to their target tables (or staging then target in one run).

## Tables and columns used by backfill-historical

### arketa_reservations

- **Upsert key:** `external_id` (unique).
- **Columns written:** `external_id`, `class_id`, `client_id`, `client_name`, `client_email`, `status`, `checked_in`, `checked_in_at`, `raw_data`, `synced_at`.
- **Schema:** Defined in migrations (e.g. `20260129224307`, `20260131230100_expand_arketa_reservations_schema`, `20260205224055`). Table has `external_id` unique; backfill-historical uses `onConflict: 'external_id'`.

### arketa_payments

- **Upsert key:** `external_id` (unique).
- **Columns written:** `external_id`, `client_id`, `amount`, `payment_type`, `status`, `payment_date`, `notes`, `raw_data`, `synced_at`.
- **Schema:** Defined in migrations (e.g. `20260129224307`, `20260131230000_expand_arketa_payments_schema_v2`). backfill-historical uses `onConflict: 'external_id'`.

## api_endpoints (rate limit)

- **backfill-historical** uses `getApiEndpointConfig(supabase, job.api_source, endpointType)` for rate limit.
- **Lookup:** `api_name = 'arketa'`, `endpoint_type = 'reservations'` or `'payments'`, `is_active = true`.
- **Migrations:** `20260129180932` and `20260129224849` seed `(arketa, reservations)`; `20260130000600` adds `(arketa, payments)`. Both are present so rate limiting works.

## api_logs (sync history)

- **backfill-historical** inserts into `api_logs` on:
  - **Success:** When the job completes (all dates done). `api_name` = `arketa_reservations` or `arketa_payments`, `endpoint` = `backfill-historical`, `triggered_by` = `backfill-job`, `sync_success` = true, `records_processed` / `records_inserted` set.
  - **Failure:** On top-level catch. `api_name` = `backfill-historical`, `endpoint` = `backfill-historical`, `triggered_by` = `backfill-job`, `sync_success` = false, `error_message` set.
- **Columns used:** `api_name`, `endpoint`, `sync_success`, `records_processed`, `records_inserted`, `error_message`, `triggered_by` (others use defaults). Matches existing `api_logs` schema.

## api_sync_status

- **backfill-historical** does **not** update `api_sync_status`. Progress is stored only in `backfill_jobs`.
- Other syncs (e.g. `sync-arketa-reservations`, `sync-arketa-payments`) do update `api_sync_status` and write to `api_logs`. Backfill runs are visible via `api_logs` and `backfill_jobs` only.

## backfill_jobs

- **Columns used by backfill-historical:** `id`, `api_source`, `data_type`, `start_date`, `end_date`, `processing_date`, `status`, `total_days`, `days_processed`, `records_processed`, `errors`, `started_at`, `completed_at`, `retry_scheduled_at`, `last_cursor` (clients path only). All exist in migrations.

## Staging tables (unified-backfill-sync path only)

- **arketa_reservations_staging**, **arketa_payments_staging** are used only by `unified-backfill-sync` (and any other code that explicitly writes to them). They are **not** used by the Select Dates backfill path (backfill-historical), which writes directly to `arketa_reservations` and `arketa_payments`.

## Summary

| Component            | Used by Select Dates backfill? | Notes                                                                 |
|---------------------|--------------------------------|-----------------------------------------------------------------------|
| arketa_reservations | Yes                            | Direct upsert; columns and `external_id` unique aligned with code.   |
| arketa_payments     | Yes                            | Direct upsert; columns and `external_id` unique aligned with code.   |
| api_endpoints       | Yes                            | Rate limit for reservations and payments.                            |
| api_logs            | Yes                            | Insert on completion (success/failure).                               |
| api_sync_status     | No                             | Not updated by backfill-historical.                                  |
| sync-from-staging   | N/A                            | No such function in hume-ops; backfill writes directly to target.    |
| Staging tables      | No (for this path)             | Used by unified-backfill-sync only.                                  |

# Sync failures and proposed fixes

This document summarizes **per-sync failure modes** and **proposed fixes** for the API sync pipeline. It supports the [ARKETA_SYNC_AND_API_SYNC_PLAN.md](ARKETA_SYNC_AND_API_SYNC_PLAN.md) and [ARKETA_ARCHITECTURE.md](ARKETA_ARCHITECTURE.md).

## Where status comes from

- **API Sync Overview** and **SyncStatusIndicator** (Reports): `sync_schedule` (enabled rows only). Status = `last_status` (e.g. `success`, `failed`, `timeout`), `last_error`, `failure_count`.
- **Sync Log History**: `api_logs` (per-invocation detail).
- **Backfill Manager**: `backfill_jobs` + calendar RPCs for day-by-day coverage.

## Per-sync failure modes and fixes

| Sync | Typical failures | Proposed fix |
|------|------------------|--------------|
| **Arketa Classes + Reservations** | Missing ARKETA_API_KEY / ARKETA_PARTNER_ID; classes or reservations API error/timeout; sync-from-staging failure; skipped reservations (no class_id). | Env validated at start of `sync-arketa-classes-and-reservations` (503 if missing). Run classes then reservations for the same range. Use Sync Log History (arketa_classes) to diagnose. |
| **Arketa Classes** | Env missing; API rate limit; pagination timeout; "Gym Check In" has new class_id daily. | Uses `include_cancelled`, `include_past`, `include_completed`. Backfill uses 7-day chunks; retry only remaining chunks on failure. |
| **Arketa Reservations** | Env missing; no classes for range (run classes first); staging→history fails; many skipped (no class_id). | Combined sync runs classes first. Skipped rows logged to `api_sync_skipped_records`. sync-from-staging: do not clear staging on transfer error. |
| **Arketa Payments** | Env missing; transfer error. | Env validation at start; do not clear staging on transfer failure. |
| **Toast Backfill** | Toast API keys; cursor state; date boundary (through 08/01/24). | Removed from Overview (is_enabled = false). Validate credentials at start of toast-backfill-sync. |
| **scheduled-sync-runner** | Timeout; repeated failures. | Updates `last_status` / `last_error`; admin alert at failure_count >= 3. UI shows ERROR for failed/timeout. |
| **sync-from-staging** | Transfer failure; clearing staging before success. | Transfer first; only clear staging on success. Idempotent upsert for retries. |

## Quick diagnostics

1. **"The app encountered an error" on a row** — Check `last_error` on that row; open Sync Log History filtered by that API name.
2. **Arketa sync fails** — Confirm ARKETA_API_KEY and ARKETA_PARTNER_ID in Supabase Edge Function secrets; check Sync Log History for classes vs reservations vs sync-from-staging.
3. **Reservations missing for a date** — Run classes for that range first (Backfill Manager → Classes + Reservations or Arketa Classes); then run reservations or combined sync.
4. **Toast backfill** — Disabled in Overview after backfill through 08/01/24; re-enable only if needed and cursor state is correct.

See [ARKETA_SYNC_AND_API_SYNC_PLAN.md](ARKETA_SYNC_AND_API_SYNC_PLAN.md) section 4 for the full table and implementation notes.

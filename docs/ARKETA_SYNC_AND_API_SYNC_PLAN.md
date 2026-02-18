# Arketa sync move, API sync updates, and pipeline documentation

**Plan overview:** Move the Arketa Classes + Reservations manual sync tool to the Backfill Manager as a new tab with day-by-day status; document sync behaviour and failure modes with **proposed fixes**; remove Toast Backfill from the API overview; align all API/sync-related pages to a single source of truth for sync status.

**Notes incorporated from:**
- [ARKETA_ARCHITECTURE.md](ARKETA_ARCHITECTURE.md) — 3-tier reservation fetch, why `arketa_classes` is critical, `include_cancelled` / `include_past` / `include_completed`, pagination and "Gym Check In" class_id per day.
- [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md) — Env/security and logging practices where relevant to sync.

---

## 1. Move Arketa Classes + Reservations to Backfill Manager (new tab, day-by-day)

**Current state:** The Arketa (Classes + Reservations) manual sync lives on `ApiSyncingPage.tsx` as `ArketaClassesAndReservationsSync` (date range + "Sync classes then reservations" button) calling `sync-arketa-classes-and-reservations`.

**Goal:** Same layout as other Data Backfill tabs (DateSelector, SyncProgressCard, BackfillSyncLog, BackfillCalendarHeatmap) and day-by-day sync status.

**Option A (recommended):** Add job type `arketa_classes_and_reservations` to `run-backfill-job` that invokes the combined function per day (or per 7-day chunk), writes `SyncResult` to `backfill_jobs.results`, and reuses BackfillSyncLog + BackfillCalendarHeatmap (reservations calendar RPC for coverage). New tab component + `useBackfillJob` support; remove Manual Sync card from API Syncing page.

**Option B (lighter):** New Data Backfill tab with only the moved date range + button; use existing Reservations (and optionally Classes) BackfillCalendarHeatmap as coverage for the range. No new job type.

---

## 2. How the Arketa combined sync works and possible errors

**Flow (`sync-arketa-classes-and-reservations`):**
1. Parse `start_date` / `end_date` (default -7 to +7 days).
2. **Classes:** POST `sync-arketa-classes` → `arketa_classes_staging` → upsert `arketa_classes`. (Already uses `include_cancelled`, `include_past`, `include_completed` per ARKETA_ARCHITECTURE.)
3. **Reservations:** POST `sync-arketa-reservations` (same range) → `arketa_reservations_staging` (3-tier fetch: direct /reservations → DB-driven class_ids → classes-based).
4. **Staging → history:** POST `sync-from-staging` for `arketa_reservations` (clear staging, write to `arketa_reservations_history`).
5. **Daily schedule:** POST `refresh-daily-schedule` (non-blocking).
6. **Logging:** `logApiCall(..., apiName: 'arketa_classes', endpoint: '/classes+reservations')` → `api_logs` and `api_sync_status`.

**Possible failures:** Missing `ARKETA_API_KEY` / `ARKETA_PARTNER_ID`; classes or reservations API 4xx/5xx or timeout; pagination break (cursor loop/timeout) so classes or reservations are partial; sync-from-staging failure; reservations with no matching `class_id` (logged to `api_sync_skipped_records`).

---

## 3. Update API syncing pages, data mapping, backfill manager, skipped reports; remove Toast Backfill

- **Remove "Toast Backfill (through 08/01/24)" from API Sync Overview:** Migration `UPDATE sync_schedule SET is_enabled = false WHERE sync_type = 'toast_backfill';` (or UI filter in overview + SyncStatusIndicator).
- **API Syncing page:** After moving the Arketa tool, remove the Manual Sync card; keep Overview + Sync Log History.
- **Data Mapping page:** Optionally add sync status per endpoint via `useSyncSchedules()` next to each API card.
- **Backfill Manager:** New "Classes + Reservations" tab; existing tabs unchanged.
- **Sync Skipped Records:** No change; if toast_backfill is disabled in DB it won’t show as running.
- **Single source of truth:** `sync_schedule` (+ `api_logs` / `api_sync_status` for detail). Use same filters everywhere (e.g. `is_enabled` after migration).

---

## 4. Per-sync failure modes and proposed fixes

Each row lists the sync, typical failures, and **proposed fix** (implementation or operational).

| Sync | Typical failures | Proposed fix |
|------|-------------------|--------------|
| **Arketa Classes + Reservations** | Missing ARKETA_API_KEY / ARKETA_PARTNER_ID; classes or reservations API error/timeout; sync-from-staging failure; skipped reservations (no class_id). | **Fix 1:** At start of `sync-arketa-classes-and-reservations`, validate env and return 503 with clear message if missing. **Fix 2:** Ensure `sync-from-staging` is not called with `clear_staging: true` until transfer succeeds; on transfer error return error so caller can retry (idempotent upsert). **Fix 3:** In API Syncing UI, surface `last_error` for the row and link "Show logs" to Sync Log History filtered by `arketa_classes`. **Fix 4:** Document in ARKETA_ARCHITECTURE or runbook: always run classes then reservations for the same range. |
| **Arketa Classes** (standalone / backfill) | Env missing; API rate limit or 4xx/5xx; pagination timeout so some classes missed (e.g. "Gym Check In" has new class_id daily). | **Fix 1:** Already uses `include_cancelled`, `include_past`, `include_completed`; keep. **Fix 2:** In `sync-arketa-classes`, add a safe upper bound on pagination iterations (e.g. max 100 pages) and log page count + last cursor; on timeout retry with `fetchWithRetry`. **Fix 3:** Backfill job 7-day chunks: on failure do not clear completed chunks; retry only remaining chunks. **Fix 4:** Health check or deploy checklist: verify ARKETA_API_KEY and ARKETA_PARTNER_ID in Supabase Edge Function secrets. |
| **Arketa Reservations** | Env missing; no classes for date range (Tier 2/3 need classes first); staging→history transfer fails; many reservations skipped (no class_id). | **Fix 1:** Combined sync already runs classes first; for standalone reservations backfill, document "run classes for range before reservations" or add a pre-step that calls sync-arketa-classes for the same range. **Fix 2:** Keep writing skipped rows to `api_sync_skipped_records`; add optional alert (e.g. system_alerts) when skipped count for a run exceeds a threshold (e.g. > 50). **Fix 3:** sync-from-staging: on reservation transfer error, do not clear staging; return error and let caller retry. |
| **Arketa Payments** | Env missing; date range or transfer error. | **Fix 1:** Validate ARKETA_API_KEY and ARKETA_PARTNER_ID at start of sync-arketa-payments; return 503 with message if missing. **Fix 2:** sync-from-staging already logs to api_logs; ensure api_name used for payments is consistent (e.g. arketa_payments) so Sync Log History shows it. **Fix 3:** On transfer failure, do not clear staging; return error for retry. |
| **Arketa Clients / Instructors / Subscriptions** | Env missing; full sync timeout; staging upsert errors. | **Fix 1:** Same env validation at start; 503 if missing. **Fix 2:** Consider cursor/checkpoint or chunking for very large datasets to avoid timeout; log progress (e.g. records_processed) to api_logs. **Fix 3:** Ensure logApiCall (or equivalent) is called so api_sync_status and Sync Overview stay accurate. |
| **Toast POS / Toast Backfill** | Toast API keys missing; cursor/state in `toast_backfill_state`; pagination or date boundary (through 08/01/24). | **Fix 1:** Remove from API Sync Overview: migration `UPDATE sync_schedule SET is_enabled = false WHERE sync_type = 'toast_backfill';` (or UI filter). **Fix 2:** Document that backfill through 08/01/24 is complete; if re-enabling, ensure toast_backfill_state.status and cursor_date are correct. **Fix 3:** Validate Toast API credentials at start of toast-backfill-sync; return clear error if missing. **Fix 4:** scheduled-sync-runner already triggers follow-up run when `completed === false`; keep. |
| **Sling Users / Shifts** | Sling credentials; roster/report API errors. | **Fix 1:** Validate Sling env at start of sync; return 503 with message if missing. **Fix 2:** Ensure sync_schedule row is updated by scheduled-sync-runner (last_status, last_error) so Overview shows accurate status. **Fix 3:** Log to api_logs with consistent api_name (e.g. sling_users, sling_shifts). |
| **Calendly** | Calendly token; staging→scheduled_tours. | **Fix 1:** Env check at start; 503 if token missing. **Fix 2:** On transfer error do not clear staging; return error for retry. **Fix 3:** Ensure logApiCall or sync_schedule update so status is visible in Overview. |
| **scheduled-sync-runner** | Timeout (SYNC_TIMEOUT_MS); repeated failures (failure_count); runner does not update sync_schedule on success/fail. | **Fix 1:** Already updates last_status to `timeout` or `failed` and last_error; ensure API Syncing Overview and SyncStatusIndicator show "ERROR" for both and display last_error. **Fix 2:** Already creates admin alert at failure_count >= 3; optional: add exponential backoff or pause after N consecutive failures (e.g. set is_enabled = false and create alert for manual re-enable). **Fix 3:** Do not swallow errors; always update sync_schedule with result so UI is accurate. |
| **sync-from-staging** | Transfer failure (constraint, duplicate, partial write); clearing staging before successful transfer. | **Fix 1:** Perform transfer first; only clear staging if transfer succeeds (or if clear_staging is false, never clear). **Fix 2:** Use idempotent upsert (on conflict update) so retries are safe. **Fix 3:** Log transfer errors to api_logs with api_name and error_message; return structured error to caller (sync-arketa-classes-and-reservations) so it can set success = false and log. |
| **api_sync_status / api_logs** | Sync functions not calling logApiCall; api_name mismatch; sync_schedule not updated by runner. | **Fix 1:** Audit all sync edge functions: each must call logApiCall (or be invoked only via scheduled-sync-runner which updates sync_schedule). **Fix 2:** Use consistent api_name (e.g. arketa_classes for combined sync, arketa_reservations for reservation-only). **Fix 3:** scheduled-sync-runner already updates sync_schedule.last_run_at, last_status, last_error, failure_count; ensure no sync path bypasses runner for scheduled rows (manual "Sync Now" goes through runner). |

---

## 5. Implementation order

1. **Remove Toast Backfill from overview** — Migration `is_enabled = false` for `toast_backfill` (or UI filter in overview + SyncStatusIndicator).
2. **Per-sync hardening (optional, can be done in parallel)** — Env validation and staging-clear behaviour as in section 4 (sync-arketa-classes-and-reservations, sync-arketa-classes, sync-arketa-reservations, sync-from-staging, toast-backfill-sync, etc.).
3. **Backend for new backfill tab (if Option A)** — Add `arketa_classes_and_reservations` to run-backfill-job; add/use calendar RPC if needed.
4. **Frontend for new tab** — types, useBackfillJob, ArketaClassesAndReservationsBackfillTab, DataBackfillPage tab.
5. **Remove Arketa manual sync from ApiSyncingPage** — Delete Manual Sync card and ArketaClassesAndReservationsSync usage.
6. **Data Mapping** — Optional: add sync status (useSyncSchedules) to ApiDataMappingPage.
7. **Documentation** — See [SYNC_FAILURES_AND_FIXES.md](SYNC_FAILURES_AND_FIXES.md) for sync behaviour, failure modes, and quick diagnostics (references this plan and section 4).

---

## 6. Files to touch (summary)

| Area | Files |
|------|--------|
| Toast backfill removal | New migration **or** `src/pages/admin/ApiSyncingPage.tsx`, `src/components/reports/SyncStatusIndicator.tsx` |
| Per-sync fixes (env, staging, logging) | `supabase/functions/sync-arketa-classes-and-reservations/index.ts`, `supabase/functions/sync-arketa-classes/index.ts`, `supabase/functions/sync-arketa-reservations/index.ts`, `supabase/functions/sync-from-staging/index.ts`, `supabase/functions/toast-backfill-sync/index.ts`, others as needed |
| New backfill tab | `src/components/settings/DataBackfillPage.tsx`, new `ArketaClassesAndReservationsBackfillTab.tsx`, `src/components/settings/backfill/types.ts`, `src/components/settings/backfill/useBackfillJob.ts`, `supabase/functions/run-backfill-job/index.ts`; optional calendar RPC migration |
| Remove manual Arketa from API Syncing | `src/pages/admin/ApiSyncingPage.tsx` |
| Data Mapping status | `src/pages/admin/ApiDataMappingPage.tsx` |
| Docs | This file; optionally `docs/ARKETA_ARCHITECTURE.md` or new `docs/SYNC_FAILURES_AND_FIXES.md` |

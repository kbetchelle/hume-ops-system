# Hume-Ops-System — Deep Scan Report

**Date:** 2026-02-04  
**Scope:** Migrations, app code (Supabase tables/functions usage), Edge functions, root SQL files.

---

## 1. Critical: App References Dropped Table — checklist_shift_submissions (Resolved)

**Severity: High — runtime failure after migrations**

- **Migration `20260204000004_deprecate_old_checklist_tables.sql`** drops:
  - `checklist_completions`, `checklist_items`, `checklists`
  - **`checklist_comments`** — feature removed by design (table dropped, component deleted).
  - **`checklist_shift_submissions`**

- **App still uses:** **`checklist_shift_submissions`** in `EmbeddedChecklist.tsx` and `EmbeddedChecklistUpdated.tsx` (select, insert) for concierge shift submission status and submit.

- **Migration `20260205000000_integrate_dept_specific_cleanup.sql`** was written to *adapt* those tables **only if** they exist. Because `20260204000004` runs first and drops them, the adaptation blocks never run.

**Result:** After migrations, shift submissions would fail with “relation does not exist.” Checklist comments were removed by design (no table, no UI).

**Fix:** Migration `20260208000000_restore_checklist_comments_and_shift_submissions.sql` drops `checklist_comments` if present and re-creates only `checklist_shift_submissions` with the schema the app expects.

---

## 2. Types Out of Sync With Schema

- **`checklist_shift_submissions`** is **not** in `src/integrations/supabase/types.ts`. The code uses `as any` when querying it in `EmbeddedChecklist*.tsx`.
- **`staff_shifts`** *is* in `types.ts` (line ~3545), but `ConciergeForm.tsx` still uses `.from('staff_shifts' as any)` — the cast is unnecessary if types are current.

**Recommendation:** After applying the fix migration, run `supabase gen types typescript` and remove the `as any` casts for `checklist_shift_submissions` and `staff_shifts` where types now match.

---

## 3. Root-Level SQL Files (Potential Duplicates / Manual Runs)

These live in the repo root and may be one-off or manual; running them again could create duplicates or conflict with migrations:

| File | Risk / Note |
|------|----------------|
| `CREATE_SUBSCRIPTIONS_TABLES.sql` | Subscriptions are already created in `supabase/migrations/20260131060000_add_arketa_subscriptions.sql`. Running this again could conflict. |
| `MANUAL_FIX_PAYMENTS_SCHEMA.sql` | Manual fix; idempotency unknown. Prefer fixing via migrations. |
| `TEST_PAYMENTS_SCHEMA.sql` | Test/verification script; not for production as-is. |
| `VERIFY_PAYMENTS_SCHEMA.sql` | Verification only. |
| `VERIFY_RESERVATIONS_SCHEMA.sql` | Verification only. |
| `FORCE_POSTGREST_RELOAD.sql` | Operational reload; usually safe but environment-specific. |
| `import-qa-history.sql` | Data import; may duplicate data if run twice. |

**Recommendation:** Move one-off/verification scripts into `scripts/` or `docs/` and document that migrations are the source of truth for schema.

---

## 4. Tables in Types vs App Usage

- **Used in app:** All tables referenced by `.from(...)` in `src/` are present in `types.ts` except `checklist_shift_submissions` (re-created by fix migration). Checklist comments table and UI were removed by design.
- **Staging / internal tables** (e.g. `*_staging`, `sync_metrics`, `sling_sync_log`, `checklist_migrations_log`) are in migrations and possibly types but not queried from the frontend — that’s expected for ETL/sync.
- **Legacy/deprecated:** Old unified checklist tables (`checklists`, `checklist_items`, `checklist_completions`) are dropped by `20260204000004`; the app uses only department-specific checklist tables (concierge, boh, cafe). No orphaned app references to the old table names.

---

## 5. RPC / Functions

- App calls: `admin_get_all_users`, `admin_update_user_roles`, `admin_toggle_user_deactivation`, `admin_get_users_with_sling_info`, `admin_link_user_to_sling`, `search_sling_users`.
- All are defined in migrations (`20260129002158_*`, `20260202154206_*`) and are present in `types.ts` under `Functions`. No orphaned RPC calls found.

---

## 6. Storage Buckets

- **`staff-announcements`**: Created in `20260130163917_add_announcement_comments_and_scheduling.sql`; used in `useStaffAnnouncements.ts` for upload/delete — consistent.
- **`lost-and-found-photos`**: Created in `20260207000000_lost_and_found_enhancements.sql`; used in `LostAndFoundTab.tsx` — consistent.

---

## 7. Enum `lost_and_found_category`

- Created only in `20260207000000_lost_and_found_enhancements.sql` and reflected in `types.ts`. No duplicate creation.

---

## 8. Edge Functions / scheduled-sync-runner

- Uses `sync_schedule` table and invokes sync functions by name; no references to dropped checklist tables. No issues found in the reviewed portion.

---

## 9. Summary of Recommended Actions

1. **Apply fix migration** that drops `checklist_comments` (if present) and re-creates only `checklist_shift_submissions` (see migration `20260208000000_restore_checklist_comments_and_shift_submissions.sql`).
2. **Regenerate Supabase types** after applying the migration, then remove unnecessary `as any` for `checklist_shift_submissions` and `staff_shifts` where types now match.
3. **Tidy root SQL:** Move or document one-off/verification scripts so it’s clear migrations own schema and duplicate runs are avoided.

---

*Report generated from static analysis of migrations and `src/` usage. Runtime verification (e.g. after applying the fix migration) is recommended.*

# Applying migrations in Lovable Cloud SQL editor

When the project uses **Lovable Cloud** (Supabase owned by Lovable), you cannot use `supabase link` or `supabase db push`. Apply migrations manually in Lovable’s SQL editor using the consolidated script and order below.

## Excluded files (do not run)

These three migrations are **full schema diffs** from `supabase db pull`. They DROP and recreate objects and would break an existing database. **Do not** paste or run them in Lovable:

| File | Reason |
|------|--------|
| `20260210162035_remote_schema.sql` | Full schema diff; DROP + recreate. |
| `20260211232056_remote_schema.sql` | Same. |
| `20260219221303_remote_schema.sql` | Same. |

All other migrations in the ordered list are safe to apply (they use `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc., or are idempotent seeds).

## Base schema assumption

The migration list starts at **20260130163917**. Everything *before* that (e.g. `profiles`, `staff_announcements`, `is_manager_or_admin()`, `sling_users`) must already exist in Lovable.

- **If Lovable already has the app’s current schema:** run only the **missing** migrations (compare Lovable’s schema to the list and run the ones not yet applied).
- **If Lovable is behind:** run the **94 migrations in strict chronological order** (see below). Ensure base schema exists in Lovable or from pre-20260130 migrations.

## Base schema dependencies (for consolidated script)

The consolidated script **lovable_consolidated_migrations.sql** currently starts at migration **20260206000000**. It assumes the following already exist (from migrations before that or from pre-20260130 base):

- **Tables:** `staff_qa`, `profiles`, `user_roles`, `lost_and_found`, `staff_announcements`, `announcements`, `api_sync_status`, `api_logs`, `backfill_jobs`, `arketa_classes`, `arketa_reservations`, `arketa_reservations_staging`, `arketa_reservations_history`, `arketa_payments_staging`, `daily_schedules` (or `daily_schedule` after rename), and any other tables created or altered in apply-order migrations 1–35.
- **Functions:** `public.is_manager_or_admin(uuid)`, `public.update_updated_at_column()`.
- **Schema:** `auth.users` (Supabase).

If you run only the consolidated file (e.g. in Lovable's SQL editor), ensure Lovable's database already has these objects; otherwise run the earlier migrations from **lovable_apply_order.txt** first or apply the full 94-migration set in order.

## Apply order (94 migrations)

Use the ordered list in **supabase/lovable_apply_order.txt**. Each line is one migration filename (no comments in the runnable list). Apply in that exact order.

## Consolidated script

A single SQL file containing all 94 migrations in order, with comment headers and **phase markers**, is at:

**supabase/lovable_consolidated_migrations.sql**

1. Open Lovable’s Supabase SQL editor (or whatever SQL runner Lovable exposes).
2. Paste the contents of `lovable_consolidated_migrations.sql` and run.

If the editor or execution has size/time limits, split the script by **phases** (see the `########## PHASE N ##########` markers in the file) or by migration headers (`-- ========== Migration: ... ==========`). Phases are ordered by dependency (later phases require earlier ones to have completed):

| Phase | Migrations | Description |
|-------|------------|-------------|
| 0 | (inline) | Creates `checklist_templates`, `checklist_template_items`, `checklist_template_completions` IF NOT EXISTS (from 20260129193856; not in apply order). Run this if Lovable is missing these tables. |
| 1 | 20260202000000 .. 20260202000003 | Checklist item metadata |
| 2 | 20260202000004 .. 20260202000005 | Checklist storage bucket + completion_value |
| 3 | 20260203000000 | Align checklist schema (large) |
| 4 | 20260203000001 .. 20260204000006 | Role templates, cafe, concierge/boh/cafe tables, imports, bug reports |
| 5 | 20260204100000 .. 20260206120000 | Toast, api sync, qa reads, backfill |
| 6 | 20260207000000 .. 20260211120000 | Lost and found, restore comments, arketa, backfill calendar |
| 7 | 20260211125441 .. 20260218120002 | Messaging, account approval, event drinks, order checks, resources |
| 8 | 20260219000000 .. 20260227120000 | Bug report reads, notifications, package tracking, policy sections, pdf |
| 9 | 20260228120000 .. end | Primary role, user_walkthrough_state |

The consolidated file is idempotent where possible (e.g. `DROP POLICY IF EXISTS` before `CREATE POLICY` for storage and checklist policies, `CREATE INDEX IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` before triggers).

## Seeds (data migrations)

- **20260130165252_seed_historical_weekly_updates.sql** and **20260218120002_import_weekly_updates_csv.sql** are idempotent (they use `ON CONFLICT (id) DO UPDATE`). Safe to re-run.
- **20260204000003** and **20260204000006** (checklist imports): keep order (000003 then 000006). 000006 TRUNCATEs then inserts; no change needed for one-time run.

## Step-by-step: Fix local migrations and apply in Lovable

### Part A: Fix local Supabase migration history (so `supabase db pull` works)

1. **Remove macOS metadata files** (they break Supabase’s migration pattern):
   ```bash
   cd /path/to/hume-ops-system
   find supabase/migrations -maxdepth 1 -name '._*' -type f -delete
   ```
   Or delete by hand any file in `supabase/migrations` whose name starts with `._`.

2. **If the CLI still says “migration history does not match”**, repair the migration table so it matches what’s actually applied on the remote:
   ```bash
   supabase migration repair --status applied 20260219222856
   supabase migration repair --status applied 20260219223026
   supabase migration repair --status applied 20260219223050
   ```
   Use the exact timestamps the CLI suggests. Then run `supabase db pull` again.

3. **Optional:** To avoid new `._` files, exclude them from git and avoid copying migrations via Finder to external drives:
   - Add to `.gitignore`: `supabase/migrations/._*`
   - Prefer `cp` or `rsync` when copying the repo.

### Part B: Apply migrations in Lovable Cloud (SQL editor)

1. **Ensure base schema exists in Lovable.**  
   The consolidated script assumes tables like `staff_qa`, `profiles`, `user_roles`, `lost_and_found`, `sync_schedule`, `storage_deletion_queue`, and functions `public.is_manager_or_admin(uuid)`, `public.update_updated_at_column()` already exist. If your Lovable DB is brand new or missing these, run the **first 35 migrations** from `supabase/lovable_apply_order.txt` in order (as individual files from `supabase/migrations/`) before running the consolidated script.

2. **Open Lovable’s SQL editor** (Supabase SQL editor for the Lovable project).

3. **Run the consolidated script:**
   - Copy the full contents of **supabase/lovable_consolidated_migrations.sql**.
   - Paste into the SQL editor and run.
   - If you hit size or timeout limits, run in chunks by **phase** (search for `########## PHASE` in the file) or by **migration** (search for `-- ========== Migration:`).

4. **If you see errors:**
   - **“relation … does not exist”** → Base schema is missing; apply earlier migrations from `lovable_apply_order.txt` until that object exists.
   - **“function … does not exist”** → Ensure `public.is_manager_or_admin` and `public.update_updated_at_column` exist (from base or earlier migrations).
   - **“permission denied”** → Run as a user that can create tables/functions (e.g. Supabase project owner / postgres).

5. **Do not run** the three excluded `remote_schema` migrations (see Excluded files above).

## Summary

| What | Where |
|------|--------|
| Ordered list of 94 filenames | [supabase/lovable_apply_order.txt](../supabase/lovable_apply_order.txt) |
| Single consolidated SQL script | [supabase/lovable_consolidated_migrations.sql](../supabase/lovable_consolidated_migrations.sql) |
| Excluded (do not run) | 20260210162035_remote_schema.sql, 20260211232056_remote_schema.sql, 20260219221303_remote_schema.sql |

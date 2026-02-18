# Migrations

## Proper CLI flow (pull, push, repair, reset)

Run all commands from the **project root** (where `supabase/` lives).

### 1. Link to your remote project (one-time per machine)

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Get `YOUR_PROJECT_REF` from the Supabase Dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

### 2. Pull remote schema into a new migration (optional)

Use when you changed the DB in the Dashboard and want to record it as a migration:

```bash
supabase db pull
```

This creates a new file like `supabase/migrations/<timestamp>_remote_schema.sql` with the current remote schema. You can rename or edit it, then commit.

### 3. Push local migrations to remote

```bash
supabase db push
```

- **If it says "Found local migration files to be inserted before the last migration on remote"**  
  Your local folder has migrations that are *older* (by timestamp) than the last migration already applied on remote. Supabase will not apply them by default so that it doesn’t reorder history. Either:
  - Run **with** the older migrations included:  
    `supabase db push --include-all`  
    (Only do this if the remote does *not* already have those changes; otherwise you’ll get "relation already exists".)
  - Or **repair** the migration history (see step 4) so remote matches what’s already there, then push again.

- **If push fails with "relation ... already exists"**  
  The remote DB already has that table/object but the migration that creates it is not marked as applied on remote. Use **repair** (step 4) to mark those migrations as applied, then run `supabase db push` again.

### 4. Repair migration history (when remote is ahead or inconsistent)

When the remote database already has the schema from some migrations but they’re not in the remote migration history (e.g. you applied SQL manually or from another branch):

**Mark a single migration as applied** (so Supabase won’t run it again):

```bash
supabase migration repair 20260226120000 --status applied
```

Use the **version** (timestamp only), e.g. `20260226120000` for `20260226120000_disable_toast_backfill_in_overview.sql`.

**Mark several as applied** (for the “relation already exists” case):

```bash
supabase migration repair 20260131174712 --status applied
supabase migration repair 20260131174713 --status applied
supabase migration repair 20260131174714 --status applied
supabase migration repair 20260131230400 --status applied
supabase migration repair 20260217183507 --status applied
supabase migration repair 20260217191140 --status applied
```

Then run `supabase db push` again; only migrations not yet applied (e.g. `20260226120000`) will run.

**List what’s applied locally vs remotely:**

```bash
supabase migration list
```

### 5. Reset (local only)

**Resets only your local Supabase stack**, not the remote project. Useful to test migrations from scratch locally:

```bash
supabase db reset
```

This drops the local DB, recreates it, and runs all files in `supabase/migrations/` in order. Do **not** use this to “fix” remote; use **repair** and **push** for remote.

---

## Quick fix: apply only the toast backfill disable

If you just need to disable Toast Backfill on remote and don’t want to repair the six older migrations:

1. **Supabase Dashboard → SQL Editor**, run:

```sql
UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'toast_backfill';
```

2. Mark the migration as applied so future pushes don’t re-apply it:

```bash
supabase migration repair 20260226120000 --status applied
```

---

## macOS `._*` files

Supabase only runs files matching `<timestamp>_name.sql`. macOS sometimes creates resource-fork files like `._20260226120000_disable_toast_backfill_in_overview.sql` in this folder; those get **skipped** and can clutter `supabase db push` output. They are in `.gitignore`. If you see "Skipping migration ._..." messages, delete them:

```bash
find supabase/migrations -maxdepth 1 -name '._*' -type f -delete
```

## When `db push` fails with "relation already exists"

If the remote database already has the schema (e.g. tables were created earlier or by another branch) but the migration history doesn’t include those migrations, `supabase db push --include-all` will try to re-run them and fail with "relation ... already exists".

**Option A – Apply only the latest migration (e.g. disable toast backfill)**  
1. In **Supabase Dashboard → SQL Editor**, run the contents of the migration file (e.g. `20260226120000_disable_toast_backfill_in_overview.sql`).  
2. Mark it as applied so future pushes don’t re-apply it:
   ```bash
   supabase migration repair 20260226120000 --status applied
   ```

**Option B – Align migration history with remote**  
Use `supabase migration repair <version> --status applied` for each migration that is already reflected on the remote DB, then run `supabase db push` again. See [Supabase docs](https://supabase.com/docs/guides/cli/managing-environments#repair-migration-history) for details.

# Concierge Shift Report System - Database Migrations

## Overview

This document describes the database migrations for the Concierge Shift Report System v2. The migration **files** live in `supabase/migrations/` and must match the pattern `<timestamp>_name.sql`. This README is in `docs/` so Supabase CLI does not try to parse it.

**Migration files:**
- `20260131174712_create_concierge_drafts.sql`
- `20260131174713_create_concierge_helpers.sql`
- `20260131174714_expand_daily_report_history.sql`

They create the necessary tables, indexes, and policies for the real-time collaborative shift reporting feature.

## Migration Files (summary)

### 1. `20260131174712_create_concierge_drafts.sql`
- **Creates:** `concierge_drafts` table, indexes, RLS, `increment_draft_version()`, trigger.
- UNIQUE (report_date, shift_time); form_data JSONB; version auto-increment.

### 2. `20260131174713_create_concierge_helpers.sql`
- **Creates:** `celebratory_events`, `facility_issues_tracker`, `foh_questions` with indexes and RLS.

### 3. `20260131174714_expand_daily_report_history.sql`
- **Adds columns** to `daily_report_history`: celebratory_events_na, system_issues_na, future_shift_notes_na, screenshot; index on status.

## Applying migrations

Use the Supabase CLI from the project root:

```bash
# Ensure you're linked to the right project
supabase link --project-ref YOUR_PROJECT_REF

# Push pending migrations to remote
supabase db push
```

If you see "Found local migration files to be inserted before the last migration on remote", see **supabase/MIGRATIONS_README.md** for the full CLI flow (repair, push, when to use --include-all).

## Post-migration

- Enable Realtime for `concierge_drafts` in Dashboard (Database → Replication) or run:
  `ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;`
- Verify RLS and test with a concierge user.

## Rollback

See the Supabase CLI docs for `supabase migration repair <version> --status reverted`. Dropping tables manually is possible but not tracked in migration history.

---

**Status:** Documentation only. Migration SQL lives in `supabase/migrations/`.

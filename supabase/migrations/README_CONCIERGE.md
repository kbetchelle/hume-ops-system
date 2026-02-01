# Concierge Shift Report System - Database Migrations

## Overview

This directory contains the database migrations for the Concierge Shift Report System v2. These migrations create the necessary tables, indexes, and policies for the real-time collaborative shift reporting feature.

## Migration Files

### 1. `20260131174712_create_concierge_drafts.sql`
**Purpose:** Create the main drafts table for auto-save functionality

**Creates:**
- `concierge_drafts` table
- Indexes on (report_date, shift_time) and updated_at
- RLS policies for concierges and managers
- `increment_draft_version()` function
- Trigger for auto-versioning

**Key Features:**
- UNIQUE constraint on (report_date, shift_time) - one draft per shift
- `form_data` JSONB column stores entire form state
- `version` INTEGER auto-increments on each update
- Session tracking via `last_updated_by_session`

### 2. `20260131174713_create_concierge_helpers.sql`
**Purpose:** Create tracker tables for report data

**Creates:**
- `celebratory_events` - Member birthdays, anniversaries, etc.
- `facility_issues_tracker` - Maintenance issues with 48-hour deduplication
- `foh_questions` - System issues and questions for management

**Key Features:**
- All tables have proper indexes for performance
- RLS policies for data security
- `facility_issues_tracker` has UNIQUE partial index for deduplication
- Status tracking and resolution timestamps

### 3. `20260131174714_expand_daily_report_history.sql`
**Purpose:** Extend existing daily_report_history table

**Adds:**
- `celebratory_events_na` BOOLEAN - N/A flag
- `system_issues_na` BOOLEAN - N/A flag
- `future_shift_notes_na` BOOLEAN - N/A flag
- `screenshot` TEXT - Legacy Arketa screenshot support
- Index on `status` column for query optimization

## Applying Migrations

### Automated (Recommended)

Use the provided script:

```bash
./apply-concierge-migrations.sh
```

This script will:
1. ✅ Verify all migration files exist
2. ✅ Push migrations to remote database
3. ✅ Verify successful application
4. ✅ List next steps

### Manual

Apply migrations individually:

```bash
# Push all migrations
npx supabase db push

# Or apply specific migration
npx supabase migration up 20260131174712_create_concierge_drafts.sql
```

### Verify Application

Check that tables exist:

```sql
-- List all new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'concierge_drafts',
  'celebratory_events',
  'facility_issues_tracker',
  'foh_questions'
);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%concierge%' 
   OR tablename LIKE '%celebratory%'
   OR tablename LIKE '%facility%'
   OR tablename LIKE '%foh%';
```

## Post-Migration Setup

### 1. Enable Realtime

The `concierge_drafts` table needs Realtime enabled:

```sql
-- Enable Realtime for live collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;
```

Verify in Supabase Dashboard:
- Go to Database > Replication
- Check that `concierge_drafts` is listed under supabase_realtime

### 2. Verify RLS Policies

Check policies are active:

```sql
-- View all policies for new tables
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'concierge_drafts',
  'celebratory_events', 
  'facility_issues_tracker',
  'foh_questions'
)
ORDER BY tablename, policyname;
```

Expected policies per table:
- **concierge_drafts:** 5 policies (1 manager, 4 concierge)
- **celebratory_events:** 3 policies
- **facility_issues_tracker:** 3 policies
- **foh_questions:** 3 policies

### 3. Test Access

Test with a concierge user:

```sql
-- Set current user context (replace with real user ID)
SET LOCAL my.user_id = 'your-test-user-id';

-- Should succeed (concierge can insert)
INSERT INTO concierge_drafts (report_date, shift_time, form_data)
VALUES (CURRENT_DATE, 'AM', '{}'::jsonb);

-- Should succeed (concierge can read)
SELECT * FROM concierge_drafts WHERE report_date = CURRENT_DATE;

-- Clean up
DELETE FROM concierge_drafts WHERE report_date = CURRENT_DATE;
```

## Rollback

If you need to rollback migrations:

### Drop All Tables

```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS concierge_drafts CASCADE;
DROP TABLE IF EXISTS celebratory_events CASCADE;
DROP TABLE IF EXISTS facility_issues_tracker CASCADE;
DROP TABLE IF EXISTS foh_questions CASCADE;

-- Remove columns from daily_report_history
ALTER TABLE daily_report_history 
  DROP COLUMN IF EXISTS celebratory_events_na,
  DROP COLUMN IF EXISTS system_issues_na,
  DROP COLUMN IF EXISTS future_shift_notes_na,
  DROP COLUMN IF EXISTS screenshot;
```

### Revert with Supabase CLI

```bash
# List migrations
npx supabase migration list

# Revert specific migration
npx supabase migration repair 20260131174712_create_concierge_drafts.sql --status reverted

# Push changes
npx supabase db push
```

## Migration Dependencies

### Required Functions

These functions must exist (usually from previous migrations):

1. **`user_has_role(uuid, text)`**
   - Checks if user has specific role
   - Required for RLS policies
   - Should already exist in your schema

2. **`is_manager_or_admin(uuid)`**
   - Checks if user is manager or admin
   - Required for manager RLS policies
   - Should already exist in your schema

3. **`update_updated_at_column()`**
   - Updates `updated_at` timestamp
   - Used by facility_issues and foh_questions triggers
   - Should already exist in your schema

If any are missing, check previous migrations or create them:

```sql
-- Example: create user_has_role if missing
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Volume Estimates

Expected table sizes after 1 year of use (assuming 2 shifts/day):

| Table | Records/Year | Storage Est. |
|-------|--------------|--------------|
| concierge_drafts | ~10 active | < 100 KB |
| daily_report_history | ~730 | ~50 MB |
| celebratory_events | ~500 | ~2 MB |
| facility_issues_tracker | ~200 | ~5 MB |
| foh_questions | ~150 | ~3 MB |

**Total:** ~60 MB/year (negligible for most databases)

## Performance Considerations

### Indexes

All critical queries are indexed:

- `concierge_drafts`: (report_date, shift_time), updated_at
- `celebratory_events`: event_date, reported_date
- `facility_issues_tracker`: status, reported_date, (description, reported_date) partial
- `foh_questions`: issue_type, resolved, reported_date

### Query Optimization

```sql
-- Fast: Uses index
SELECT * FROM concierge_drafts 
WHERE report_date = CURRENT_DATE AND shift_time = 'AM';

-- Fast: Uses status index
SELECT * FROM facility_issues_tracker 
WHERE status = 'open';

-- Fast: Uses reported_date index
SELECT * FROM celebratory_events 
WHERE reported_date >= CURRENT_DATE - INTERVAL '7 days';
```

## Monitoring Queries

### Check Draft Activity

```sql
-- Active drafts
SELECT report_date, shift_time, version, last_updated_by, updated_at
FROM concierge_drafts
ORDER BY updated_at DESC;

-- High edit count (lots of collaboration)
SELECT report_date, shift_time, version
FROM concierge_drafts
WHERE version > 10
ORDER BY version DESC;
```

### Check Tracker Tables

```sql
-- Recent celebratory events
SELECT * FROM celebratory_events 
WHERE reported_date >= CURRENT_DATE - 7
ORDER BY reported_date DESC;

-- Open facility issues
SELECT description, reported_date, status
FROM facility_issues_tracker
WHERE status IN ('open', 'in_progress')
ORDER BY reported_date;

-- Unresolved FOH questions
SELECT issue_type, description, reported_date
FROM foh_questions
WHERE resolved = false
ORDER BY reported_date;
```

### Check Deduplication

```sql
-- Facility issues reported multiple times (should be minimal)
SELECT description, COUNT(*), array_agg(reported_date)
FROM facility_issues_tracker
GROUP BY description
HAVING COUNT(*) > 1;
```

## Troubleshooting

### Issue: Migration fails with "function does not exist"

**Solution:** Ensure required functions exist (see Migration Dependencies section above)

### Issue: RLS blocks all access

**Solution:** 
1. Check user has correct role in `user_roles` table
2. Verify RLS policies with `SELECT * FROM pg_policies`
3. Check function `user_has_role` works correctly

### Issue: Realtime not working

**Solution:**
1. Verify `ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;` was run
2. Check Supabase Dashboard > Database > Replication
3. Restart Realtime server if needed (Supabase Dashboard > Project Settings > Restart)

### Issue: Deduplication not working

**Solution:**
1. Check partial unique index exists on `facility_issues_tracker`
2. Verify status is 'open' or 'in_progress' (deduplication only for unresolved)
3. Check Edge Function handles duplicate key errors gracefully

## Additional Resources

- **Deployment Guide:** `../CONCIERGE_SYSTEM_DEPLOYMENT.md`
- **Test Cases:** `../CONCIERGE_SYSTEM_TESTS.md`
- **Implementation Summary:** `../CONCIERGE_IMPLEMENTATION_SUMMARY.md`
- **Migration Script:** `../apply-concierge-migrations.sh`

## Support

For migration issues:
1. Check Supabase logs: Project Dashboard > Logs
2. Review error messages in terminal
3. Consult this README
4. Check Supabase documentation: https://supabase.com/docs

---

**Migration Version:** 1.0  
**Created:** January 31, 2026  
**Status:** ✅ Ready for deployment

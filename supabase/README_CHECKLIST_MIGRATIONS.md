# Checklist System Migrations

**Date**: 2026-02-02  
**Total Migrations**: 6  
**Status**: Ready for deployment

## Migration Order (IMPORTANT!)

These migrations **MUST** be run in the exact order listed below:

### 1. `20260202000000_add_checklist_item_metadata.sql`
**Purpose**: Add metadata columns to `checklist_template_items`  
**Duration**: ~2-5 seconds  
**Changes**:
- Adds 11 new columns: `task_type`, `time_hint`, `category`, `color`, `is_high_priority`, `due_time`, `label_spanish`, `required`, `task_description`, `is_class_triggered`, `class_trigger_minutes_after`
- Creates 4 indexes for performance
- Migrates existing `item_text` to `task_description`

**Risk**: Low - Only adds columns, doesn't modify existing data

### 2. `20260202000001_assign_floater_templates.sql`
**Purpose**: Assign 4 uncategorized templates to FLOATER role  
**Duration**: <1 second  
**Changes**:
- Inserts/updates 4 templates in `checklist_templates`
- Uses `ON CONFLICT` for idempotency

**Risk**: Low - Only inserts/updates template records

### 3. `20260202000002_merge_duplicate_floater_templates.sql`
**Purpose**: Merge duplicate FLOATER templates  
**Duration**: ~5-10 seconds  
**Changes**:
- Updates all items from duplicate templates to reference primary template
- Updates completions to reference primary template
- Marks duplicate templates as inactive
- Creates audit log table

**Risk**: Medium - Modifies existing item and completion references  
**Rollback**: Backup `checklist_template_items` and `checklist_template_completions` before running

### 4. `20260202000003_import_csv_metadata.sql`
**Purpose**: Import all 702 checklist items with metadata  
**Duration**: ~30-60 seconds (702 items)  
**Changes**:
- Inserts/updates all 702 items with task_type, time_hint, etc.
- Uses `ON CONFLICT` for idempotency
- Handles merged templates automatically

**Risk**: Low - Uses upsert pattern, safe to rerun  
**Note**: This is the largest migration file

### 5. `20260202000004_create_checklist_storage.sql`
**Purpose**: Create storage bucket for checklist photos  
**Duration**: <1 second  
**Changes**:
- Creates `checklist-photos` storage bucket
- Adds RLS policies for photo uploads

**Risk**: Low - Only creates storage resources

### 6. `20260202000005_add_completion_value.sql`
**Purpose**: Add completion_value column for storing task data  
**Duration**: <1 second  
**Changes**:
- Adds `completion_value` column to `checklist_template_completions`
- Creates index on completion_value

**Risk**: Low - Only adds column

## Running Migrations

### Option 1: Supabase CLI (Recommended)

```bash
cd /Volumes/SSDdeKat/HUME_Project/hume-ops-system
supabase db push
```

This will automatically run all pending migrations in order.

### Option 2: Manual Execution

```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000000_add_checklist_item_metadata.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000001_assign_floater_templates.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000002_merge_duplicate_floater_templates.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000003_import_csv_metadata.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000004_create_checklist_storage.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260202000005_add_completion_value.sql
```

## Pre-Deployment Checklist

- [ ] Backup database (especially `checklist_template_items` and `checklist_template_completions`)
- [ ] Verify CSV file location: `/Users/katharinegreen/Downloads/checklist_items-export-2026-02-02_07-44-28.csv`
- [ ] Review template-role mapping: `docs/template-role-mapping.md`
- [ ] Ensure no active checklist submissions during migration
- [ ] Test on staging environment first
- [ ] Schedule downtime window (recommended 5-10 minutes)

## Post-Deployment Verification

### 1. Check Migration Log

```sql
SELECT * FROM public.checklist_migrations_log ORDER BY executed_at DESC;
```

Should show 2 entries:
- `20260202000002_merge_duplicate_floater_templates`
- `20260202000003_import_csv_metadata`

### 2. Verify Template Count

```sql
-- Should have 21 templates (19 active, 2 inactive)
SELECT 
  is_active,
  COUNT(*) as count
FROM public.checklist_templates 
GROUP BY is_active;
```

### 3. Verify Item Count

```sql
-- Should have 702 items
SELECT COUNT(*) FROM public.checklist_template_items;
```

### 4. Verify Metadata Columns

```sql
-- Check that metadata was imported
SELECT 
  task_type,
  COUNT(*) as count 
FROM public.checklist_template_items 
GROUP BY task_type 
ORDER BY count DESC;
```

Expected distribution:
- checkbox: 489
- photo: 59
- free_response: 45
- signature: 34
- short_entry: 10
- multiple_choice: 7
- yes_no: 4
- header: 3
- employee: 1

### 5. Verify Merged Templates

```sql
-- Check that duplicate templates were merged
SELECT 
  template_id,
  COUNT(*) as item_count
FROM public.checklist_template_items
WHERE template_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444'
)
GROUP BY template_id;
```

Should show:
- a1111111: 28 items (14 original + 14 from a3333333)
- a2222222: 58 items (29 original + 29 from a4444444)
- a3333333: 0 items (merged into a1111111)
- a4444444: 0 items (merged into a2222222)

### 6. Verify Storage Bucket

```sql
-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'checklist-photos';
```

## Rollback Plan

If issues occur, rollback steps:

### 1. Restore from Backup

```bash
pg_restore -d <database> <backup_file>
```

### 2. Revert Merged Templates (if needed)

```sql
-- Mark merged templates as active again
UPDATE public.checklist_templates 
SET is_active = true,
    name = REPLACE(name, ' (MERGED - Do Not Use)', '')
WHERE id IN (
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444'
);

-- Revert item references (would need to determine which items came from which template)
-- This is complex - better to restore from backup
```

### 3. Drop New Columns (if needed)

```sql
ALTER TABLE public.checklist_template_items 
  DROP COLUMN IF EXISTS task_type,
  DROP COLUMN IF EXISTS time_hint,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS is_high_priority,
  DROP COLUMN IF EXISTS due_time,
  DROP COLUMN IF EXISTS label_spanish,
  DROP COLUMN IF EXISTS required,
  DROP COLUMN IF EXISTS task_description,
  DROP COLUMN IF EXISTS is_class_triggered,
  DROP COLUMN IF EXISTS class_trigger_minutes_after;

ALTER TABLE public.checklist_template_completions 
  DROP COLUMN IF EXISTS completion_value;
```

## Troubleshooting

### Migration 3 Takes Too Long

If migration 3 (import CSV) takes more than 2 minutes:
- Check database connection
- Verify no table locks
- Consider running in smaller batches

### Duplicate Key Errors

If you see duplicate key errors:
- Check that migrations 1 and 2 completed successfully
- Verify no manual data was added between migrations

### Storage Bucket Already Exists

If migration 4 fails with "bucket already exists":
- This is safe to ignore (ON CONFLICT DO NOTHING)
- Verify RLS policies were created

## Support

For issues or questions:
1. Check `checklist_migrations_log` table for execution history
2. Review logs in Supabase dashboard
3. Consult `docs/checklist-implementation-summary.md`
4. Check backup files in `src/components/concierge/EmbeddedChecklist.backup.tsx`

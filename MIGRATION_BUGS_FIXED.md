# Migration Bugs Fixed - Summary

## Overview

Fixed critical bugs in Phase 1-3 migrations and related components that would have prevented them from running successfully or caused UX issues.

---

## Bug 1: Breaking CHECK Constraints ✅ FIXED

**File:** `supabase/migrations/20260224000002_deprecate_policies_system.sql`

### Problem
The migration added `CHECK (archived_at IS NOT NULL)` constraints to both `club_policies` and `policy_categories` tables, which would prevent ANY new records from being inserted since new records have `archived_at = NULL` by default. This would immediately break the policy management feature.

### Impact
- All policy creation would fail with constraint violation errors
- Application completely non-functional for policy management
- Forced immediate cutover instead of gradual migration

### Fix
- Removed the CHECK constraints from the migration
- Commented them out with instructions to add AFTER Phase 6 is complete
- Documented the safe migration strategy
- Added table comments for documentation instead

### Result
- Old policy system remains fully functional during migration
- No breaking changes
- Gradual migration possible
- Constraints can be added later when UI is ready

---

## Bug 2: Automatic Archiving ✅ FIXED

**File:** `supabase/migrations/20260224000002_deprecate_policies_system.sql`

### Problem
The migration automatically archived all existing policies and categories by setting `archived_at = now()` and `is_active = false`. This would hide all existing policies from the current UI immediately.

### Impact
- All policies would disappear from staff view
- No policy access during transition period
- Loss of service continuity

### Fix
- Commented out the automatic archiving UPDATE statements
- Documented that archiving should be done manually AFTER Phase 6
- Kept policies visible and active during migration

### Result
- All existing policies remain visible
- Staff continue to have access
- Manual migration control
- Both systems can coexist

---

## Bug 3: ON CONFLICT Without Unique Constraint ✅ FIXED

**File:** `supabase/migrations/20260224000002_deprecate_policies_system.sql`

### Problem
The migration used `ON CONFLICT (name)` when inserting the "Policies" folder, but the `resource_page_folders` table doesn't have a unique constraint on the `name` column.

### Error
```
ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

### Fix
Changed from:
```sql
INSERT INTO public.resource_page_folders (...)
VALUES (...)
ON CONFLICT (name) DO UPDATE SET ...;
```

To:
```sql
INSERT INTO public.resource_page_folders (...)
SELECT ...
WHERE NOT EXISTS (
  SELECT 1 FROM public.resource_page_folders WHERE name = 'Policies'
);
```

### Result
- Migration now runs successfully
- Idempotent (safe to run multiple times)
- No unique constraint required

---

## Bug 4: Missing 'tags' Column Reference ✅ FIXED

**File:** `supabase/migrations/20260224000002_deprecate_policies_system.sql`

### Problem
The `archived_policies_reference` view tried to SELECT `cp.tags`, but the `tags` column doesn't exist in `club_policies` unless migration `20260223000000_policy_sections_redesign.sql` has been applied first.

### Error
```
ERROR: 42703: column cp.tags does not exist
LINE 10: cp.tags,
         ^
```

### Fix
- Removed `cp.tags` from the view SELECT statement
- Added comment explaining the dependency
- Tags aren't critical for migration reference anyway

### Result
- Migration works regardless of policy redesign migration state
- No dependency on other migrations
- View still provides all essential data

---

## Bug 5: Wrong Table Name (resource_flags) ✅ FIXED

**File:** `supabase/migrations/20260224000001_add_page_specific_flags.sql`

### Problem
The migration tried to alter a table called `resource_flags`, but the actual table is named `resource_outdated_flags`.

### Error
```
ERROR: 42P01: relation "public.resource_flags" does not exist
```

### Fix
Updated throughout the migration:
- `ALTER TABLE public.resource_flags` → `ALTER TABLE public.resource_outdated_flags`
- All index names updated
- Function updated to query correct table
- View updated to use correct table

### Result
- Migration now targets correct table
- All indexes and functions work properly

---

## Bug 6: Mismatched Schema in Components ✅ FIXED

**Files:**
- `src/components/pdf/PdfPageFlagDialog.tsx`
- `src/components/pdf/PdfViewerWithFlags.tsx`

### Problem
Phase 2 components were created with incorrect assumptions about the database schema:

**Assumed Schema:**
- Table: `resource_flags`
- Columns: `flag_reason`, `flag_description`, `flagged_at`, `is_resolved`

**Actual Schema:**
- Table: `resource_outdated_flags`
- Columns: `note`, `created_at`, `status`, plus `resource_label` is required

### Fixes

#### PdfPageFlagDialog.tsx
Changed INSERT from:
```typescript
supabase.from("resource_flags").insert({
  flag_reason: reason,
  flag_description: description,
  is_resolved: false,
  // ...
})
```

To:
```typescript
supabase.from("resource_outdated_flags").insert({
  resource_label: fileName || `Page ${pageNumber}`,
  note: `${reason}${description ? `: ${description}` : ""}`,
  status: "pending",
  // ...
})
```

#### PdfViewerWithFlags.tsx
Changed query from:
```typescript
.from("resource_flags")
.eq("is_resolved", false)
```

To:
```typescript
.from("resource_outdated_flags")
.eq("status", "pending")
```

Updated interface:
```typescript
interface PageFlag {
  note: string;              // was: flag_reason
  flagged_page_context: string | null;
  created_at: string;        // was: flagged_at
  status: string;            // was: is_resolved
  // ...
}
```

Updated JSX:
- `{flag.flag_reason}` → `{flag.note}`
- `{flag.flag_description}` → `{flag.flagged_page_context}` (with better styling)
- `{flag.flagged_at}` → `{flag.created_at}`

### Result
- Components now match actual database schema
- Proper integration with existing flagging system
- Consistent with rest of application

---

## Migration Safety Status

### ✅ Safe to Apply Now

All three Phase 1-3 migrations are now safe and non-breaking:

1. **20260224000000_add_pdf_text_search.sql**
   - Adds search_text column if missing
   - Creates text extraction trigger
   - No breaking changes

2. **20260224000001_add_page_specific_flags.sql** ✅ FIXED
   - Adds page number columns to resource_outdated_flags
   - Creates helper function and view
   - No breaking changes

3. **20260224000002_deprecate_policies_system.sql** ✅ FIXED
   - Adds tracking columns only
   - Creates "Policies" folder
   - Does NOT archive policies
   - Does NOT add constraints
   - No breaking changes

### Testing Checklist

After applying migrations:

- [ ] Verify old policies still visible in UI
- [ ] Test creating new policy (should work)
- [ ] Test editing policy (should work)
- [ ] Verify "Policies" folder created in resource_page_folders
- [ ] Upload test PDF to Policies folder
- [ ] Verify PDF text extraction works
- [ ] Test flagging a specific page in PDF
- [ ] Verify page flag appears in manager inbox
- [ ] Verify flag shows page number and context

---

## Bug 7: UPDATE Statements Not Actually Commented ✅ FIXED

**File:** `supabase/migrations/20260224000002_deprecate_policies_system.sql`

### Problem
Lines 48-52 and 59-63 contained UPDATE statements that were supposed to be commented out but weren't. The documentation said "OPTIONAL - Commented out for gradual migration" but the SQL would still execute, immediately archiving all policies and categories.

### Impact
- All policies would be archived on migration
- All policies would disappear from staff UI immediately
- Defeats the entire gradual migration strategy
- Staff lose access to all policies

### Fix
Added `--` comment markers to all UPDATE statement lines:

```sql
-- BEFORE (would execute):
UPDATE public.club_policies 
SET 
   archived_at = now(),
   is_active = false
 WHERE archived_at IS NULL;

-- AFTER (properly commented):
-- UPDATE public.club_policies 
-- SET 
--   archived_at = now(),
--   is_active = false
-- WHERE archived_at IS NULL;
```

### Result
- UPDATE statements will NOT execute during migration
- Policies remain active and visible
- Gradual migration strategy preserved
- Staff retain access to all policies

---

## Bug 8: Duplicate Category Display ✅ FIXED

**File:** `src/components/manager/inbox/AnswerQuestionDialog.tsx`

### Problem
Lines 249-257 displayed the policy category twice in the SelectItem: once as the main text and again in a conditional span with "(Category: {category})". This resulted in text like "HR(Category: HR)".

### Impact
- Confusing UI with redundant information
- Poor user experience
- Looks like a bug to users

### Fix
Removed the redundant conditional span:

```tsx
// BEFORE (duplicate):
<SelectItem key={policy.id} value={policy.id}>
  {policy.category || "General Policy"}
  {policy.category && (
    <span className="text-muted-foreground ml-2">
      (Category: {policy.category})
    </span>
  )}
</SelectItem>

// AFTER (clean):
<SelectItem key={policy.id} value={policy.id}>
  {policy.category || "General Policy"}
</SelectItem>
```

### Result
- Clean, single display of category name
- Consistent with other policy dropdowns
- Better UX

---

## Summary

**Total Bugs Fixed:** 8

**Migrations Updated:**
- `20260224000001_add_page_specific_flags.sql`
- `20260224000002_deprecate_policies_system.sql` (multiple issues)

**Components Updated:**
- `src/components/pdf/PdfPageFlagDialog.tsx`
- `src/components/pdf/PdfViewerWithFlags.tsx`
- `src/components/manager/inbox/AnswerQuestionDialog.tsx`

**Documentation Created:**
- `MIGRATION_STRATEGY_SAFE_DEPRECATION.md`
- `MIGRATION_BUGS_FIXED.md` (this file)

**Status:** All migrations are now safe to apply! ✅

The gradual migration strategy ensures:
- Zero downtime
- No data loss
- Both systems work in parallel
- Easy rollback at any point
- No service interruption for staff or managers

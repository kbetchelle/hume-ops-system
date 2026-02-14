# Resource Pages Migration Guide

## Overview

This guide helps you migrate existing Resource Pages from the legacy HTML format to the new TipTap JSON format.

## Migration Script

**Location:** `src/scripts/migrateResourcePagesToTiptap.ts`

### Prerequisites

- Ensure Supabase environment variables are set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Node.js and npm installed
- `tsx` package available (should be in dev dependencies)

### Usage

```bash
# Dry run (preview changes without applying)
npm run tsx src/scripts/migrateResourcePagesToTiptap.ts --dry-run --verbose

# Full migration (apply changes to database)
npm run tsx src/scripts/migrateResourcePagesToTiptap.ts --verbose

# Quiet mode (less output)
npm run tsx src/scripts/migrateResourcePagesToTiptap.ts
```

### Options

- `--dry-run`: Preview changes without applying them to the database
- `--verbose`: Show detailed output for each page being processed

## Migration Process

### Step 1: Backup Current Data

Before running the migration, create a backup:

```sql
-- Via psql or Supabase SQL Editor
COPY (SELECT * FROM resource_pages) TO '/path/to/backup_resource_pages.csv' WITH CSV HEADER;
```

Or use Supabase Studio to export the `resource_pages` table.

### Step 2: Run Dry Run

Execute the migration in dry-run mode to preview changes:

```bash
npm run tsx src/scripts/migrateResourcePagesToTiptap.ts --dry-run --verbose
```

Review the output for:
- Number of pages to be migrated
- Any errors or warnings
- Sample content conversions

### Step 3: Verify Sample Conversions

Pick 2-3 pages from the dry-run output and manually verify:
- Open the page in the current system
- Compare the HTML content with what would be generated
- Ensure formatting is preserved

### Step 4: Run Full Migration

If the dry-run looks good, execute the full migration:

```bash
npm run tsx src/scripts/migrateResourcePagesToTiptap.ts --verbose
```

### Step 5: Post-Migration Verification

After migration completes:

1. **Check migration summary:**
   - Review success/failure counts
   - Investigate any failed pages

2. **Spot-check pages in the app:**
   - Open 5-10 different pages
   - Verify content renders correctly
   - Check that formatting (bold, italic, lists, links) is preserved

3. **Test search functionality:**
   - Search for keywords that should appear in migrated content
   - Verify search results are accurate

## HTML to TipTap JSON Conversion

The conversion handles:

### Supported Formatting

- **Text styles:** Bold (`<b>`, `<strong>`), Italic (`<i>`, `<em>`), Underline (`<u>`), Strikethrough (`<s>`, `<strike>`)
- **Headings:** H1, H2, H3
- **Lists:** Bullet lists (`<ul>`) and ordered lists (`<ol>`)
- **Links:** `<a href>` with target and rel attributes
- **Colors:** Inline color styles (`<span style="color: ...">`)
- **Line breaks:** `<br>` converted to hard breaks
- **Paragraphs:** `<p>` and `<div>` converted to paragraph nodes

### Known Limitations

- Advanced HTML (tables, complex nested structures) may need manual adjustment
- Custom CSS classes are not preserved
- Images in old content need to be handled separately (not embedded in HTML)

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution:** Ensure `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Error: "Failed to fetch pages"

**Solution:** 
- Check Supabase connection
- Verify RLS policies allow access
- Ensure you're using correct credentials

### Error: "Update failed"

**Solution:**
- Check if the page still exists
- Verify you have write permissions
- Review RLS policies on `resource_pages` table

### Some pages show "conversion error"

**Solution:**
- Note the page IDs from the migration output
- Manually review the HTML content of those pages
- May contain malformed HTML or unsupported elements
- Can manually edit these pages after migration using the new editor

## Rollback

If you need to rollback the migration:

1. **Restore from backup:**
   ```sql
   -- Restore content_json and search_text from backup
   UPDATE resource_pages SET 
     content_json = backup.content_json,
     search_text = backup.search_text
   FROM backup_resource_pages backup
   WHERE resource_pages.id = backup.id;
   ```

2. **Or revert to basic migration:**
   The Phase 1 migration already set basic TipTap JSON. Pages won't look formatted, but won't break.

## Post-Migration Cleanup (Optional)

After verifying the migration is successful, you may optionally:

1. **Mark old content column as deprecated:**
   ```sql
   COMMENT ON COLUMN resource_pages.content IS 'DEPRECATED: Legacy HTML content. Use content_json instead.';
   ```

2. **Archive old content (if needed for audit trail):**
   Keep the column but ensure new pages don't populate it.

## Support

If you encounter issues:

1. Review the error messages in the migration output
2. Check the `htmlToTiptapJson.ts` conversion logic
3. Test individual problematic pages manually
4. Contact the development team with specific page IDs and error messages

## Success Indicators

Migration is successful when:

- ✅ All pages show "successful" in migration summary
- ✅ Pages render correctly in the new editor and reading view
- ✅ Formatting (bold, italic, lists, links) is preserved
- ✅ Search finds content from migrated pages
- ✅ No console errors when viewing pages
- ✅ PDF export works correctly for migrated pages

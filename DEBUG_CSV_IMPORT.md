# CSV Import Troubleshooting Guide

## Why Are Records Being Skipped?

### Check #1: Unique Key Column
The most common reason records are skipped is **missing or null unique key values**.

**For subscriptions CSV:**
- Unique key is: `external_id`
- Check your CSV: Does every row have a value in the `subscription_id` or `id` column?
- The import maps this to `external_id` in the database

**To verify:**
```bash
# Check how many rows have empty subscription_id
cat subscriptions_1_of_1.csv | awk -F',' '{print $1}' | grep -c '^$'

# Check first few rows
head -5 subscriptions_1_of_1.csv
```

### Check #2: Database Constraints
The target table must have a UNIQUE constraint on the unique key column.

**Verify in Supabase:**
```sql
-- Check if external_id has UNIQUE constraint
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'arketa_subscriptions' 
  AND constraint_type = 'UNIQUE';

-- Check column details
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'arketa_subscriptions' 
  AND column_name = 'external_id';
```

### Check #3: Field Mapping Issues
The CSV column names must exactly match what you selected in the mapper.

**Common issues:**
- CSV has `subscription_id` but you mapped `id`
- Leading/trailing spaces in column names
- Case sensitivity mismatches

### Check #4: Batch Failures
If entire batches fail, check Edge Function logs:

**View logs:**
```bash
supabase functions logs import-csv-mapped --tail 50
```

Look for error messages like:
- `violates unique constraint` → Duplicate data or wrong unique key
- `column does not exist` → Field mapping names don't match DB columns
- `ON CONFLICT` error → The unique key column doesn't have UNIQUE constraint

## How the Import Works

### Current Flow:
```
CSV File 
  ↓
CSVImportMapper (Frontend)
  ↓
import-csv-mapped Edge Function
  ↓
DIRECT UPSERT → arketa_subscriptions table
```

### What's NOT Happening:
- ❌ NOT using arketa_subscriptions_staging
- ❌ NOT triggering unified-backfill-sync
- ❌ NOT applying transformSubscription() function
- ❌ NOT creating backfill_jobs entry

### Records Are Skipped When:

1. **Missing Unique Key** (line 232-235 of index.ts)
   - If `record[uniqueKeyColumn]` is null/empty
   - Error: "Missing unique key value"

2. **Batch Upsert Failure** (line 268-286 of index.ts)
   - Entire 100-record batch fails
   - Common causes:
     - Column doesn't exist in table
     - Unique constraint violation
     - Data type mismatch
     - Permission issues

3. **Parse Errors** (caught at line 238-240)
   - Malformed CSV row
   - Encoding issues

## Solutions

### Option 1: Fix CSV Data
Ensure every row has:
- A valid unique key value (subscription_id)
- Properly formatted data
- No special characters that break parsing

### Option 2: Use Backfill Instead
For API data, use the Backfill feature instead:
1. Go to Backfill Manager
2. Select "Arketa" → "Subscriptions"
3. Set date range
4. This will:
   - Fetch from Arketa API
   - Use staging table
   - Apply transform functions
   - Track progress in backfill_jobs

### Option 3: Check Import Logs
The import function logs details:
```
- Starting import to table: {table}
- Unique key column: {column}
- Field mappings: {mappings}
- Parsed X valid records (Y errors)
- Batch N: X inserted, Y updated
- Import complete: {result}
```

Check these logs to see exactly where records are being skipped.

## Quick Diagnosis Commands

```bash
# 1. Check your CSV structure
head -2 subscriptions_1_of_1.csv | cat -A

# 2. Count total rows
wc -l subscriptions_1_of_1.csv

# 3. Check for empty unique keys (adjust column number for your CSV)
awk -F',' 'NR>1 && $1=="" {print NR": Missing ID"}' subscriptions_1_of_1.csv | head -10

# 4. View import logs
supabase functions logs import-csv-mapped --tail 100

# 5. Check database
# Run in Supabase SQL Editor:
SELECT COUNT(*) as total_subscriptions FROM arketa_subscriptions;
SELECT COUNT(*) as records_today FROM arketa_subscriptions 
WHERE created_at::date = CURRENT_DATE;
```

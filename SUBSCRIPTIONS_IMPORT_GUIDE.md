# Subscriptions Import & Sync Setup Guide

## 1. Create Tables

Run this SQL in Supabase SQL Editor:

```sql
-- See CREATE_SUBSCRIPTIONS_TABLES.sql for full schema
-- Or run the migration:
```

```bash
supabase db push
```

This creates:
- `arketa_subscriptions` - Final target table with all subscription fields
- `arketa_subscriptions_staging` - Staging table for backfill sync workflow

## 2. CSV Import Method

### Step 1: Open CSV Import Tool
1. Go to Backfill Manager Page
2. Click "Advanced Import with Mapping" button

### Step 2: Upload & Configure
1. Select your `subscriptions_1_of_1.csv` file
2. Choose target table: "Arketa Subscriptions"
3. **Important Field Mappings**:
   - `subscription_id` (CSV) → `external_id` (DB) ← **Set as unique key**
   - `client_id` → `client_id`
   - `client_email` → `client_email`
   - Map all other fields as needed

### Step 3: Configure Options
- **Unique Key**: Set to `external_id`
- **Overwrite existing records**: 
  - ✅ Checked = Update existing + insert new (recommended)
  - ☐ Unchecked = Only insert new, skip existing

### Step 4: Review Results
After import completes, if records were skipped:
- View "Skipped Records Details" section
- Click on each error to see:
  - Row number
  - Reason for skip
  - Actual record data

## 3. Backfill Sync Method (Recommended for Ongoing Syncs)

### Step 1: Create Backfill Job
1. Go to Backfill Manager Page
2. Click "Create New Backfill"
3. Select:
   - API Source: **Arketa**
   - Data Type: **Subscriptions**
   - Date Range: Set your range

### Step 2: Monitor Progress
- Fetches from Arketa `/subscriptions` endpoint
- Uses `arketa_subscriptions_staging` table
- Applies `transformSubscription()` function
- Final data in `arketa_subscriptions` table

## Common Issues & Solutions

### Issue: Records Being Skipped

**Check 1: Unique Key Mapping**
```
CSV column: subscription_id
  ↓ Must map to ↓
DB column: external_id
```

**Check 2: Empty Values**
- CSV must have `subscription_id` value in every row
- Run: `awk -F',' 'NR>1 && $2=="" {print NR}' subscriptions_1_of_1.csv`

**Check 3: View Detailed Errors**
After import, expand "Skipped Records Details" to see:
- Exact row number
- Reason (missing key, constraint violation, etc.)
- The actual record data

### Issue: "Column does not exist"

**Solution**: Verify field mappings match database columns
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'arketa_subscriptions'
ORDER BY ordinal_position;
```

### Issue: "ON CONFLICT" error

**Solution**: Ensure external_id has UNIQUE constraint
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'arketa_subscriptions' 
  AND constraint_type = 'UNIQUE';
```

## Verify Import Success

```sql
-- Count total subscriptions
SELECT COUNT(*) FROM arketa_subscriptions;

-- View recent imports
SELECT 
  external_id,
  client_email,
  name,
  status,
  created_at
FROM arketa_subscriptions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for duplicates
SELECT external_id, COUNT(*) as count
FROM arketa_subscriptions
GROUP BY external_id
HAVING COUNT(*) > 1;
```

## Field Mapping Reference

| CSV Column | Database Column | Type | Notes |
|------------|----------------|------|-------|
| `id` | (skip) | UUID | Internal UUID, not needed |
| `subscription_id` | `external_id` | TEXT | **UNIQUE KEY** - Arketa's subscription ID |
| `client_id` | `client_id` | TEXT | |
| `client_email` | `client_email` | TEXT | |
| `type` | `type` | TEXT | |
| `offering_id` | `offering_id` | TEXT | |
| `status` | `status` | TEXT | |
| `name` | `name` | TEXT | |
| `start_date` | `start_date` | TIMESTAMPTZ | |
| `end_date` | `end_date` | TIMESTAMPTZ | |
| `remaining_uses` | `remaining_uses` | INTEGER | |
| `price` | `price` | NUMERIC | |
| `api_updated_at` | `api_updated_at` | TIMESTAMPTZ | |
| `cancellation_date` | `cancellation_date` | TIMESTAMPTZ | |
| `pause_start_date` | `pause_start_date` | TIMESTAMPTZ | |
| `cancel_at_date` | `cancel_at_date` | TIMESTAMPTZ | |
| `pause_end_date` | `pause_end_date` | TIMESTAMPTZ | |
| `next_renewal_date` | `next_renewal_date` | TIMESTAMPTZ | |
| `has_payment_method` | `has_payment_method` | BOOLEAN | |
| `substatus` | `substatus` | TEXT | |

## Next Steps

1. ✅ Run `supabase db push` to create tables
2. ✅ Import CSV via Advanced Import tool
3. ✅ Review any skipped records in detailed errors
4. ✅ Optionally set up recurring backfill jobs for ongoing sync

# Why Are All My CSV Records Being Skipped?

## The Problem
You uploaded a CSV file, configured the import, but when you check the results: **0 inserted, 0 updated, 2,354 skipped**

## Root Cause Analysis

### Issue 1: Wrong Unique Key Selected ⚠️

**Most Common Mistake:**
The unique key dropdown shows **database column names**, not CSV column names.

**Your Screenshot Shows:**
- Unique Key: `subscription_id` 
- **This is WRONG if you meant the CSV column!**

**What's Happening:**
1. Your CSV has a column called `subscription_id`
2. You mapped it to database column `external_id`
3. You selected `subscription_id` as the unique key
4. But `subscription_id` doesn't exist in the database - it's the CSV name!
5. The import tries to use `subscription_id` (which doesn't exist in your mapping)
6. All records fail because the unique key resolves to null/empty

**The Fix:**
```
CSV Column: subscription_id
    ↓ maps to ↓
Database Column: external_id  ← SELECT THIS as unique key!
```

### How to Identify This Issue

**Check your field mappings table:**
```
Use  CSV Column        →  Database Column    Type    Status
[✓]  subscription_id  →  external_id        Text    MAPPED  ← This one!
[✓]  client_id        →  client_id          Text    MAPPED
[✓]  client_email     →  client_email       Text    MAPPED
```

**Your unique key should be:** `external_id` (the database column)
**NOT:** `subscription_id` (the CSV column)

## Issue 2: Empty Values in Unique Key Column

Even if you select the correct database column, records will be skipped if:
- The CSV has empty/null values in that column
- The values are just whitespace

**Check your CSV:**
```bash
# Count empty subscription_id values (column 2)
awk -F',' 'NR>1 && $2=="" {print NR}' subscriptions_1_of_1.csv
```

## Issue 3: Missing UNIQUE Constraint

The database column must have a UNIQUE constraint for upsert to work.

**Check in Supabase SQL Editor:**
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'arketa_subscriptions' 
  AND constraint_type = 'UNIQUE';
```

**Should show:**
```
arketa_subscriptions_external_id_key  |  UNIQUE
```

## Step-by-Step Fix for Your Screenshot

### 1. Check Your Current Mapping
Looking at your preview, you should see:
- CSV has: `subscription_id` (the Arketa identifier)
- Database needs: `external_id` (the unique key column)

### 2. Verify the Mapping
In the Field Mappings section, ensure:
```
subscription_id  →  external_id  ← This mapping must exist
```

### 3. Select the Correct Unique Key
In the "Unique Key Column" dropdown:
- ❌ DON'T select: `subscription_id`
- ✅ DO select: `external_id`

The dropdown now shows both names:
```
external_id ← from CSV: subscription_id
```

### 4. Verify in Preview
After selecting `external_id` as unique key, the preview will highlight it:
- Header shows "UNIQUE KEY" badge
- Column has primary-colored background
- Each cell in that column is highlighted

## How to Prevent This

### New UI Improvements (Just Added!)

1. **Preview Shows Mapped Names**
   - Headers display database column names
   - Shows "from: csv_column" underneath
   - Unique key column is highlighted

2. **Prominent Warning Box**
   - Blue info box explains unique key requirements
   - Lists what will cause records to be skipped
   - Shows specific example for subscriptions

3. **Better Dropdown Labels**
   - Shows both database and CSV column names
   - Helper text clarifies what to select
   - No more confusion between CSV and DB columns

## Quick Checklist

Before importing, verify:
- [ ] Unique key is a **database column** (e.g., `external_id`)
- [ ] That column is mapped from your CSV (e.g., `subscription_id → external_id`)
- [ ] Every row in CSV has a value in the source column
- [ ] The database column has a UNIQUE constraint
- [ ] Preview shows the unique key column highlighted

## Still Having Issues?

**View Detailed Errors:**
After import completes, scroll down to see:
- "Skipped Records Details" section
- Each error shows:
  - Exact row number
  - Reason for skip
  - Full record data

**Example Error:**
```
Row 42                                    [Skipped]
Missing or empty unique key field: external_id

▸ View record data
  {
    "subscription_id": "abc123",  ← CSV column
    "external_id": null,          ← DB column (PROBLEM!)
    ...
  }
```

## Common Scenarios

### Scenario 1: Subscriptions CSV
```
CSV Column          Database Column    Select as Unique Key
subscription_id  →  external_id        ✓ external_id
client_id        →  client_id          
client_email     →  client_email       
```

### Scenario 2: Clients CSV
```
CSV Column     Database Column    Select as Unique Key
client_id   →  external_id        ✓ external_id
name        →  name               
email       →  email              
```

### Scenario 3: Custom Table
```
CSV Column    Database Column    Select as Unique Key
order_id   →  external_id        ✓ external_id
customer   →  customer_name      
amount     →  price              
```

## Summary

**The Fix is Simple:**
1. Map your CSV's ID column → `external_id` in database
2. Select `external_id` (not your CSV column name!) as unique key
3. Verify every row has a value in that CSV column
4. Import again - records should succeed! 🎉

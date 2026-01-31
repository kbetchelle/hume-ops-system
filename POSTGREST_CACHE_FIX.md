# PostgREST Schema Cache Issue - Resolution Steps

## Problem
After adding new columns to `arketa_payments` table, PostgREST's schema cache still shows the old table structure, causing `PGRST204` errors when trying to upsert records with the new columns (`amount_refunded`, `currency`, etc.).

## Root Cause
PostgREST caches the database schema for performance. After schema changes (ALTER TABLE), the cache must be explicitly reloaded. The `NOTIFY pgrst, 'reload schema'` command was sent but PostgREST hasn't picked it up yet in Supabase's managed environment.

## Solution Options

### Option 1: Wait for Auto-Reload (Simplest)
PostgREST automatically reloads its schema cache periodically (typically every 10 minutes in Supabase).

**Action**: Wait 10-15 minutes and try the import again.

### Option 2: Manual Dashboard Reload (Fastest)
1. Go to https://supabase.com/dashboard/project/xwciwcssrxiilqlrsppf
2. Click "Project Settings" (gear icon in bottom left)
3. Click "API" section
4. Click "Restart" or "Reload" button for PostgREST service
5. Try the import again immediately

### Option 3: Call Reload Function via Dashboard
1. Go to https://supabase.com/dashboard/project/xwciwcssrxiilqlrsppf/sql
2. Run this SQL:
```sql
SELECT public.reload_postgrest_cache();
```
3. Wait 30-60 seconds
4. Try the import again

### Option 4: Verify Schema Directly
Confirm the columns exist in the database (they do, but PostgREST doesn't know):

```sql
-- Check all columns in arketa_payments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_payments'
ORDER BY ordinal_position;
```

Expected to see:
- `external_id` (text)
- `amount` (decimal)
- **`amount_refunded`** (decimal) ← NEW
- **`currency`** (text) ← NEW
- **`description`** (text) ← NEW
- **`source`** (text) ← NEW
- **`location_name`** (text) ← NEW
- **`offering_name`** (text) ← NEW
- **`promo_code`** (text) ← NEW
- **`net_sales`** (decimal) ← NEW
- **`transaction_fees`** (decimal) ← NEW
- **`tax`** (decimal) ← NEW
- **`updated_at`** (timestamptz) ← NEW
- And other existing columns...

### Option 5: Temporary Workaround - Store in raw_data
If PostgREST cache won't reload, we can temporarily store the extra fields in the `raw_data` JSONB column until the cache refreshes. This would require modifying the import logic.

## What We've Done

### ✅ Database Schema
- [x] Added all missing columns to `arketa_payments` table
- [x] Created indexes on new columns
- [x] Migration applied successfully (`20260131160000_expand_arketa_payments_schema.sql`)

### ✅ PostgREST Cache Reload Attempts
- [x] Sent `NOTIFY pgrst, 'reload schema'` via migration
- [x] Created `reload_postgrest_cache()` function
- [x] Triggered multiple NOTIFY signals

### ✅ Import Tool Updates
- [x] Auto-mapping of `payment_id` → `external_id`
- [x] Visual feedback for unique key selection
- [x] Improved error messages

## Recommended Immediate Action

**Try Option 2** (Manual Dashboard Reload) - this is the most reliable way to force PostgREST to reload in Supabase's managed environment:

1. Open https://supabase.com/dashboard/project/xwciwcssrxiilqlrsppf/settings/api
2. Look for "PostgREST" or "API" service status
3. Click any available "Restart" or "Reload" button
4. Return to the CSV Import Tool and try again

If there's no restart button visible, **Option 1** (wait 10-15 minutes) is your best bet - PostgREST will automatically reload its cache on the next scheduled refresh.

## Verification After Reload

Try this test in SQL Editor to confirm PostgREST can see the new columns:

```sql
-- Test upsert with new columns via SQL
INSERT INTO public.arketa_payments (
  external_id, client_id, amount, amount_refunded, 
  currency, status, description, source
) VALUES (
  'test_abc123', 'client_123', 100.00, 0.00,
  'USD', 'succeeded', 'Test', 'widget'
)
ON CONFLICT (external_id) 
DO UPDATE SET amount = EXCLUDED.amount
RETURNING *;

-- Clean up
DELETE FROM public.arketa_payments WHERE external_id = 'test_abc123';
```

If this works in SQL Editor, PostgREST should work too after reload.

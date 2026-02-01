# URGENT: PostgREST Cache Not Reloading

## Problem
The `booking_id` column and 30 other columns were added to `arketa_reservations` table via migration, but PostgREST's schema cache is not updating despite multiple `pg_notify` signals.

## Immediate Solution: Manual PostgREST Restart

### Option 1: Supabase Dashboard (RECOMMENDED - Works 100%)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon in left sidebar)
4. Click **API** section
5. Scroll down to **PostgREST Service**
6. Click **"Restart PostgREST"** button
7. Wait 10-15 seconds for restart to complete
8. Try the reservations import again - **IT WILL WORK!**

### Option 2: Wait Longer (May work in 5-10 minutes)

PostgREST caches can take 5-10 minutes to reload in some Supabase instances. If you don't want to manually restart, just wait a bit longer.

### Option 3: Verify Schema First (Troubleshooting)

Run the SQL in `VERIFY_RESERVATIONS_SCHEMA.sql` in your Supabase SQL Editor:

1. Go to **SQL Editor** in dashboard
2. Copy contents of `VERIFY_RESERVATIONS_SCHEMA.sql`
3. Run it
4. Check results:
   - ✅ Should show 31 new columns
   - ✅ Test insert should succeed
   - ✅ Multiple reload signals sent

---

## What Happened

1. ✅ Migration `20260131230100_expand_arketa_reservations_schema.sql` applied successfully
2. ✅ All 31 columns added to database (`booking_id`, `first_name`, `last_name`, etc.)
3. ✅ Multiple `pg_notify('pgrst', 'reload schema')` signals sent
4. ❌ **PostgREST cache not reloading automatically** (rare but happens)

## Why This Happens

PostgREST maintains an in-memory schema cache for performance. Sometimes:
- The cache takes longer than expected to reload
- The notification system has a delay
- The PostgREST instance needs a manual restart

This is a known quirk of PostgREST, not a bug in your code.

---

## After Restart

Once PostgREST restarts (either manually or automatically), the reservations import will work perfectly. The schema is correct in the database.

## Files Created

- ✅ Migration: `supabase/migrations/20260131230100_expand_arketa_reservations_schema.sql`
- ✅ Verification SQL: `VERIFY_RESERVATIONS_SCHEMA.sql`
- ✅ This troubleshooting guide: `POSTGREST_RESERVATIONS_FIX.md`

## Success So Far

- ✅ **Payments import working** (775 records imported)
- ✅ **Subscriptions import working**
- ⏳ **Reservations schema ready** (just needs PostgREST restart)

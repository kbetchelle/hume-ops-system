

# Plan: Fix Toast Staging Cleanup, Aggregate from toast_sales, Fix Build Errors, and Data Report

This plan addresses three areas: (1) ensuring toast_staging is cleared after sync-from-staging, (2) switching the daily report aggregation to read from toast_sales instead of toast_staging, (3) fixing all TypeScript build errors caused by stale generated types, and (4) providing a toast_sales data completeness report.

---

## 1. Add Toast Staging Transfer to sync-from-staging

**File:** `supabase/functions/sync-from-staging/index.ts`

Currently, `sync-from-staging` handles arketa_reservations, arketa_payments, and order_checks -- but NOT toast. Toast data goes directly from API to both `toast_staging` and `toast_sales` in `sync-toast-orders` and `toast-backfill-sync`, but `toast_staging` is never cleaned up afterward.

**Changes:**
- Add a new `transferToastSales()` function that reads all rows from `toast_staging`, upserts them into `toast_sales` (on conflict `order_guid`), then deletes the staged rows -- following the same pattern as the other transfer functions.
- Update the `TransferApi` type to include `"toast"`.
- Call `transferToastSales()` when `api === "toast"` or `api === "both"`.

---

## 2. Switch Daily Report Aggregation to toast_sales

**File:** `supabase/functions/auto-aggregate-daily-report/index.ts`

Currently at line 189-198, the aggregation queries `toast_staging`. Change this to query `toast_sales` instead.

**Changes (lines ~189-198):**
- Change `from("toast_staging")` to `from("toast_sales")`
- Change `dataSources.toast_staging` to `dataSources.toast_sales`
- Also aggregate `gross_sales` alongside `net_sales` so both `cafe_net_sales` and `cafe_gross_sales` are populated in the daily report
- Add `cafe_order_count` (count of toast rows for that date)
- Update the upsert payload (lines ~347-381) to include `cafe_gross_sales`, `cafe_net_sales`, and `cafe_order_count`

---

## 3. Fix Build Errors -- Regenerate Types

The root cause of ALL the build errors is that the generated `types.ts` file is out of sync with the actual database. The `daily_reports` table in the DB has 38 columns (including `weather`, `private_appointments`, `gross_sales_membership`, `gross_sales_other`, `cafe_sales`, `class_details`, feedback fields, etc.) but the generated types only show 13 columns. Similarly, the `lost_and_found_category` enum in the DB includes `tech_headphones` but the generated types don't have it.

**Fix:** Trigger a types regeneration. This is automatic when a migration runs, so a no-op migration or schema touch will refresh the types. Since we need a migration for the toast changes anyway, the types will regenerate automatically.

**If types still don't regenerate**, each affected component would need to cast `report` as `any` -- but this should not be necessary since the types file auto-updates on schema changes.

---

## 4. Toast Sales Data Completeness Report

Based on querying the `toast_sales` table, here are the data quality findings:

**Dates with zero sales (net_sales = 0 AND gross_sales = 0):**
- 2024-08-05 (1 order, $0 net, $0 gross)
- 2024-08-08 (5 orders, $0 net, $0 gross)
- 2024-08-09 (9 orders, $0 net, $0 gross)
- 2024-08-12 (4 orders, $0 net, $0 gross)

**Dates with suspiciously low order counts (fewer than 5 orders):**
- 2024-08-02 (1 order)
- 2024-08-05 (1 order)
- 2024-08-08 (5 orders -- but $0 sales)
- 2024-08-12 (4 orders)
- 2024-11-21 (1 order)
- 2025-01-14 (1 order)
- 2025-01-17 (2 orders)
- 2025-02-12 (4 orders)

**Missing dates (no data at all, excluding Sundays):**
- 2024-08-01, 2024-08-06, 2024-08-07, 2024-08-10
- 2024-11-28 (Thanksgiving)
- 2024-12-25, 2024-12-26 (Christmas)
- 2025-01-01 (New Year's)
- 2025-01-08 through 2025-01-18 (multiple gaps -- 6 missing days)
- 2025-02-05 through 2025-02-07 (3 consecutive missing days)
- 2025-02-13
- Various future dates in 2025-2026 (expected -- haven't occurred yet)

The early August 2024 dates (8/01-8/12) likely represent the start of Toast integration where data was incomplete or the system wasn't fully configured. The January 2025 gaps and February 2025 gaps may indicate sync failures or closures.

---

## Technical Summary

| Step | File | Change |
|------|------|--------|
| 1 | `supabase/functions/sync-from-staging/index.ts` | Add `transferToastSales()` function, clear toast_staging after upsert to toast_sales |
| 2 | `supabase/functions/auto-aggregate-daily-report/index.ts` | Query `toast_sales` instead of `toast_staging`; add cafe_gross_sales, cafe_net_sales, cafe_order_count |
| 3 | Types regeneration | Automatic on next migration -- fixes all TS2339/TS2344/TS2353 errors across ReportDataSection, ReportNotesSection, ClassScheduleTable, LostAndFoundTab |


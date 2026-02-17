

# Combined Plan: Toast Pipeline Overhaul + Page-Level Cursor

This is the full consolidated plan merging all 11 items from the pipeline overhaul with the page-level cursor strategy. Items marked with [DONE] are already implemented; items marked [REMAINING] still need work.

---

## Status Summary

| # | Item | Status |
|---|------|--------|
| 1 | Daily sync writes to staging only | REMAINING -- still has inline `promoteAndClearDate`, should use shared `transferToastSales` with validation |
| 2 | Clear toast_staging at start of each sync | REMAINING -- not implemented in either function |
| 3 | Toast sync-from-staging transfer function | PARTIAL -- `transferToastSales` exists in `sync-from-staging` but lacks validation; sync functions use their own inline promote instead |
| 4 | Daily sync pulls only yesterday | DONE |
| 5 | Page size cap / timeout resilience | DONE -- page-level cursor + time budget guard |
| 6 | Content-type validation before promotion | REMAINING |
| 7 | Amount extraction fragility | REMAINING -- still uses fragile logic in `toastOrderMapping.ts` |
| 8 | Business date mismatch fix | REMAINING -- `toBusinessDate` still uses order's integer date |
| 9 | Per-day atomic pipeline (fetch-stage-validate-promote-clear) | PARTIAL -- fetch-stage-promote-clear works, but missing validation step |
| 10 | Backfill sync log error highlighting | REMAINING |
| 11 | API syncing page color-coded status | REMAINING |

---

## Remaining Changes

### 1. Write to staging only + use shared transfer function

**File:** `supabase/functions/sync-toast-orders/index.ts`

- Remove import of `mapOrderToSalesRow` (line 6) -- it is imported but unused after the cursor refactor, so this is cleanup
- Replace the inline `promoteAndClearDate` function (lines 88-123) with a call to `sync-from-staging` via Supabase function invoke, OR keep inline but add the validation step from item 6
- The simplest approach: keep the inline `promoteAndClearDate` but add validation before upserting (see item 6 below)

### 2. Clear toast_staging at start of each sync

**Files:**
- `supabase/functions/sync-toast-orders/index.ts` -- after auth succeeds (around line 188), before the day loop
- `supabase/functions/toast-backfill-sync/index.ts` -- after auth succeeds, before processing days

Add:
```typescript
// Clear stale staging data from previous runs
const { error: clearErr } = await supabase.from('toast_staging').delete().neq('id', '00000000-0000-0000-0000-000000000000');
if (clearErr) logger.warn('Failed to clear toast_staging at start: ' + clearErr.message);
```

Note: For the backfill cron mode, staging may contain partial-day data from a previous timed-out run. We should only clear staging for dates we are about to re-process, NOT all staging data. So the clear should be per-date before fetching that date, not a blanket delete. For the daily sync (yesterday only), a blanket clear is safe.

Revised approach:
- **Daily sync (`sync-toast-orders`):** Blanket clear all staging at start (only processes yesterday)
- **Backfill (`toast-backfill-sync`):** Clear staging per-date ONLY if we are starting that date fresh (page 1). If resuming from page N > 1, do NOT clear.

### 3. Validation in promotion step (items 3 + 6 combined)

**File:** `supabase/functions/sync-toast-orders/index.ts` (in `promoteAndClearDate`)
**File:** `supabase/functions/toast-backfill-sync/index.ts` (in `promoteAndClearDate`)
**File:** `supabase/functions/sync-from-staging/index.ts` (in `transferToastSales`)

Add a `validateStagingRow` function to the shared mapping file or inline in the promote function:

```typescript
function validateStagingRow(row: Record<string, unknown>): { valid: boolean; reason?: string } {
  if (!row.order_guid || typeof row.order_guid !== 'string') 
    return { valid: false, reason: 'missing order_guid' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.business_date))) 
    return { valid: false, reason: 'invalid business_date format' };
  const net = Number(row.net_sales);
  const gross = Number(row.gross_sales);
  if (!isFinite(net) || net < 0 || !isFinite(gross) || gross < 0) 
    return { valid: false, reason: 'invalid sales amounts' };
  return { valid: true };
}
```

In `promoteAndClearDate`, filter rows through validation before upserting to `toast_sales`. Log skipped rows with reasons.

### 7. Fix amount extraction

**File:** `supabase/functions/_shared/toastOrderMapping.ts`

Replace `extractOrderAmounts` (lines 16-27):

```typescript
export function extractOrderAmounts(order: Record<string, unknown>): OrderAmounts {
  const grossTop = Number(order.totalAmount ?? order.amount ?? 0) || 0;
  const netTop = Number(order.netAmount ?? 0) || 0;

  const checks = (order.checks as Array<{ 
    totalAmount?: number; amount?: number; taxAmount?: number 
  }>) ?? [];
  const grossChecks = checks.reduce(
    (s, c) => s + (Number(c.totalAmount ?? c.amount ?? 0) || 0), 0
  );
  const taxChecks = checks.reduce(
    (s, c) => s + (Number(c.taxAmount ?? 0) || 0), 0
  );

  // Prefer root-level if available, else derive from checks
  let gross = grossTop > 0 ? grossTop : grossChecks;
  let net = netTop > 0 ? netTop : Math.max(0, grossChecks - taxChecks);

  // Sanity: gross should always be >= net
  if (gross < net) {
    const tmp = gross;
    gross = net;
    net = tmp;
  }

  return { net, gross };
}
```

### 8. Fix business date mismatch

**File:** `supabase/functions/_shared/toastOrderMapping.ts`

Replace `toBusinessDate` (lines 32-39) to always use the query date:

```typescript
export function toBusinessDate(
  _order: Record<string, unknown>, 
  fallbackDate: string
): string {
  // Always use the query date as canonical business_date.
  // The order's own businessDate integer may differ due to 
  // Toast timezone handling. Original value preserved in raw_data.
  return fallbackDate;
}
```

### 10. Backfill sync log -- error highlighting

**File:** `src/components/settings/backfill/BackfillSyncLog.tsx`

Changes to the results list:
- Failed rows get `bg-destructive/10` background instead of `bg-muted/50`
- Error messages become expandable (not truncated to 150px)
- Add a summary banner at top: "X succeeded, Y failed" with colored counts

Updated row rendering:
```tsx
<div
  key={r.date + i}
  className={`flex items-center justify-between text-sm px-2 py-1.5 rounded ${
    r.success ? 'bg-muted/50' : 'bg-destructive/10 border border-destructive/20'
  }`}
>
```

Error text becomes a full-width block below the row when present:
```tsx
{r.error && (
  <p className="text-destructive text-xs mt-1 break-words">
    {r.error}
  </p>
)}
```

### 11. API syncing page -- color-coded status badges

**File:** `src/pages/admin/ApiSyncingPage.tsx`

Update `StatusBadge` (lines 144-160):

- SUCCESS: green background (`bg-green-600 hover:bg-green-700 text-white`)
- FAILED: already uses `destructive` variant -- keep as-is
- Failed rows: increase background intensity from `bg-destructive/5` to `bg-destructive/10`

```tsx
if (status === "success" || status === true) {
  return (
    <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
      <CheckCircle2 className="h-3 w-3" />
      SUCCESS
    </Badge>
  );
}
```

Also update HEALTHY badge (line 132) to use green:
```tsx
<Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
```

---

## File Change Summary

| File | Changes |
|------|---------|
| `_shared/toastOrderMapping.ts` | Fix `extractOrderAmounts` (checks fallback + gross>=net), fix `toBusinessDate` (always use query date), add `validateStagingRow` export |
| `sync-toast-orders/index.ts` | Remove unused `mapOrderToSalesRow` import, add blanket staging clear at start, add validation in `promoteAndClearDate` |
| `toast-backfill-sync/index.ts` | Add per-date staging clear (only when starting fresh, not resuming), add validation in `promoteAndClearDate` |
| `sync-from-staging/index.ts` | Add validation in `transferToastSales` before upsert |
| `BackfillSyncLog.tsx` | Red background for failed rows, expandable error messages, summary banner |
| `ApiSyncingPage.tsx` | Green SUCCESS/HEALTHY badges, stronger failed row highlighting |


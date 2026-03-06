

# Sprint 1 Implementation Plan — Critical Bug Fixes

## Issues Covered

1. **Spacebar/scroll bug in RichTextEditor** — contentEditable div
2. **Report deletion blocked** — no DELETE RLS policy on `daily_report_history`
3. **Reports not saving (re-submission)** — UPDATE RLS restricts to `status = 'draft'`
4. **Café checklist buttons broken** — cross-platform touch issue
5. **Response templates paste raw URLs** — clipboard copies plain text instead of HTML
6. **Financials inflated** — formula adds `transaction_fees` instead of subtracting

---

## Fix 1: RichTextEditor Spacebar + Scroll Jump

**Root cause**: The `useEffect` on line 53-64 resets `innerHTML` when `value` changes, even during active editing. The `isInternalChangeRef` flag helps but race conditions remain. On mobile, spacebar triggers browser default "page down" scroll.

**Changes in `src/components/shared/RichTextEditor.tsx`**:
- Add `onKeyDown` handler to the contentEditable div that calls `e.stopPropagation()` on spacebar (prevents parent scroll)
- Add `overflow-y: auto` style to the editor div so scrolling stays contained
- Guard the `useEffect` innerHTML sync: skip when `document.activeElement === editorRef.current` (user is actively typing)

---

## Fix 2: Report Deletion — Add DELETE RLS Policy

**Root cause**: `daily_report_history` has no DELETE policy for concierges. Only managers (via `is_manager_or_admin`) have ALL access.

**Database migration**:
```sql
CREATE POLICY "Concierges can delete their own draft reports"
ON public.daily_report_history
FOR DELETE
TO authenticated
USING (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
  AND status = 'draft'
);
```

Also need to add delete UI in `PastReportsView.tsx` or `ReportDetailInline.tsx` — currently there is no delete button for shift reports at all. Will add a delete button visible on own draft reports.

---

## Fix 3: Reports Not Saving (Re-submission Blocked)

**Root cause**: The UPDATE policy on `daily_report_history` requires `status = 'draft'`. When a concierge tries to re-submit an already-submitted report via `upsert`, the UPDATE portion fails RLS.

**Database migration**: Replace the UPDATE policy to allow the original author to update their own reports regardless of status:
```sql
DROP POLICY "Concierges can update their own reports" ON public.daily_report_history;
CREATE POLICY "Concierges can update their own reports"
ON public.daily_report_history
FOR UPDATE
TO authenticated
USING (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
)
WITH CHECK (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
);
```

---

## Fix 4: Café Checklist Buttons Not Pressable

**Root cause investigation**: The `CafeChecklistItem.tsx` code looks correct — buttons use standard `onClick`, checkboxes use `<label htmlFor>` pattern. The issue is likely that `Collapsible` sections or sticky headers with `z-index` are overlaying the buttons on mobile/tablet. The `CollapsibleContent` in `CafeChecklistView.tsx` may need `position: relative` to ensure buttons are tappable.

**Changes in `src/components/checklists/cafe/CafeChecklistView.tsx`**:
- Add `relative z-0` to CollapsibleContent wrappers
- Ensure sticky date headers don't overlap interactive elements below

**Changes in `src/components/checklists/cafe/CafeChecklistItem.tsx`**:
- Add `relative z-[1]` to all interactive button containers
- Add `touch-action: manipulation` to prevent double-tap zoom delays on mobile

---

## Fix 5: Response Templates Copy Raw HTML

**Root cause**: Line 842 uses `navigator.clipboard.writeText(template.content)` which copies raw HTML as plain text.

**Change in `src/components/concierge/ResponseTemplatesWithAI.tsx`**:
```typescript
const handleCopy = async (template: ResponseTemplate) => {
  try {
    const blob = new Blob([template.content], { type: "text/html" });
    const plainBlob = new Blob([
      new DOMParser().parseFromString(template.content, "text/html").body.textContent || ""
    ], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blob,
        "text/plain": plainBlob,
      }),
    ]);
  } catch {
    // Fallback for browsers that don't support clipboard.write
    await navigator.clipboard.writeText(template.content);
  }
  setCopiedId(template.id);
  toast.success("Copied to clipboard");
  setTimeout(() => setCopiedId(null), 2000);
};
```

---

## Fix 6: Financials Inflated

**Root cause**: Line 223 of `auto-aggregate-daily-report/index.ts`: `const dollars = amount + fees - refunded`. The `transaction_fees` field represents processing costs (consistently ~3% of amount), so adding it inflates the total.

**Change in `supabase/functions/auto-aggregate-daily-report/index.ts`**:
```typescript
// Before: const dollars = amount + fees - refunded;
// After:
const dollars = amount - refunded;
```

Using `amount - refunded` gives gross sales (before fees). If they want net sales, it would be `amount - fees - refunded`. Gross is more standard for revenue reporting.

After fixing, will need to re-aggregate recent dates to correct historical data.

---

## Verification Steps

After implementation:
1. **Editor**: Type in any rich text editor field on mobile — spacebar should not scroll page; typing should not jump to top
2. **Deletion**: As a concierge, verify a delete button appears on own draft reports; confirm deletion works
3. **Re-submission**: Submit a report, then edit and re-submit the same date/shift — should succeed without RLS error
4. **Café checklist**: On mobile Safari/Chrome, tap Yes/No buttons, photo buttons, and checkboxes in café checklist
5. **Templates**: Copy a template containing a hyperlink, paste into a rich text field — link should be formatted, not raw HTML
6. **Financials**: Query `daily_reports` for a known date, compare `gross_sales_arketa` before and after re-aggregation against Arketa dashboard totals


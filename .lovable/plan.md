# Hume Ops — Bug Fix & Feature Plan (March 2026)

## TIER 1: Critical Bugs (Staff-Blocking)

### 1. ✏️ Spacebar / Scroll Bug in Report Editor
**Diagnosis:** `RichTextEditor.tsx` uses `contentEditable` div. The `onChange → value prop → useEffect resets innerHTML` loop causes the browser to lose scroll position. On mobile, any keystroke triggers `onChange` → debounced `formData` update → `useEffect` detects value change and calls `editorRef.current.innerHTML = sanitizeHtml(value)`, which resets scroll to top. Spacebar specifically triggers the browser's default "scroll page down" on the outer container.
**Fix:**
- Add `e.stopPropagation()` guard in the editor's keydown handler to prevent spacebar from bubbling
- Ensure the `useEffect` that syncs `value → innerHTML` never fires during active user input by checking `document.activeElement === editorRef.current`
- Add `overflow-y: auto` to the editor div and remove scroll from parent
**Verify:** Type multi-line content on mobile, press spacebar mid-sentence — page should not jump.

### 2. 🗑️ Report Deletion Blocked by RLS
**Diagnosis:** RLS on `daily_report_history` has NO delete policy for concierges. Only `is_manager_or_admin` has `ALL` access. Concierges can only INSERT and UPDATE (own drafts). The `daily_reports` table also only has manager ALL + concierge SELECT.
**Fix:** If concierges should delete their own drafts: add DELETE policy `WHERE staff_user_id = auth.uid() AND status = 'draft'`. If only managers delete: the bug may be that managers are hitting the wrong table or role check is failing. Clarify intended behavior.
**Verify:** As a concierge, attempt to delete a draft report. As a manager, attempt to delete any report.

### 3. 📝 Reports Not Saving (Monday AM / Sunday PM)
**Diagnosis:** The submit uses `upsert` on `daily_report_history` with `onConflict: 'report_date,shift_type'`. The INSERT policy (`Concierges can create reports`) has no `WITH CHECK` clause shown — but the UPDATE policy restricts to `staff_user_id = auth.uid() AND status = 'draft'`. If a report was previously submitted (status='submitted'), the upsert tries an UPDATE which fails the `status = 'draft'` check. This is a **general bug** that manifests when re-editing submitted reports, not specific to Monday/Sunday.
**Fix:** Either: (a) change UPDATE policy to allow status changes by the original author, or (b) use a different upsert strategy that handles re-submission.
**Verify:** Submit a report, then try to edit and re-submit — should succeed.

### 4. ☕ Café Checklist Buttons Not Working (Cross-Platform)
**Diagnosis:** `CafeChecklistItem.tsx` looks correct with `<label htmlFor>` + hidden `<input>` pattern. However, for non-checkbox types (photo, signature, yes/no, short_entry), the buttons use standard `<Button onClick>`. The issue may be a parent `<label>` or event propagation problem, OR the checklist view's collapsible sections are intercepting events. Need to test: are ALL buttons broken, or only checkboxes?
**Fix:** Investigate if `Collapsible` or sticky headers are intercepting touch events. Add `position: relative; z-index: 1` to interactive elements.
**Verify:** On mobile Safari and Chrome, tap each button type in café checklist.

### 5. 🌡️ Cold Plunge Temp Field (FOH/Concierge)
**Diagnosis:** `short_entry` task type renders a standard `<Input>`. If FOH staff can't type, it may be: (a) the `onBlur` handler calling `handleToggle(textValue)` is causing the component to re-render and lose focus, or (b) an overlapping element is blocking the input. Need to check which checklist module (concierge, boh, cafe) has this item.
**Fix:** Ensure the input maintains focus during typing; debounce the save instead of saving on every blur.
**Verify:** Navigate to the cold plunge checklist item, tap the field, type a temperature value.

---

## TIER 2: Data Accuracy Bugs

### 6. 📊 Class Count Includes Waitlist
**Diagnosis:** In `aggregate_reservation_counts()` SQL function, `total_class_checkins` filters `WHERE r.checked_in = true` — this correctly excludes waitlisted. BUT `total_waitlisted` counts `WHERE r.status = 'waitlisted'` separately. The **daily report PDF** may be adding `total_class_checkins + total_waitlisted` together. Check `ReportDataSection.tsx` and PDF export logic.
**Fix:** Audit the PDF template and `ReportDataSection` to ensure class count = `total_class_checkins` only, with waitlist shown separately.
**Verify:** Compare `aggregate_reservation_counts('2026-03-04')` output with what appears in the daily report page and PDF.

### 7. 💰 Financials Inflated
**Diagnosis:** Payment formula in `auto-aggregate-daily-report`: `dollars = amount + fees - refunded`. This **adds** `transaction_fees` to the total. If `transaction_fees` represents costs/deductions, the formula should be `amount - fees - refunded`. The Arketa API likely stores `transaction_fees` as a positive number representing processing costs.
**Fix:** Change to `const dollars = amount - fees - refunded;` (line 223). Then re-aggregate historical dates.
**Verify:** Pick a known date, compare the Arketa dashboard payment total with the aggregated `gross_sales_arketa`.

### 8. 📋 Check-in / Classes Not in Daily Report
**Diagnosis:** The `auto-aggregate-daily-report` function correctly fetches reservation counts via RPC and class details from `arketa_classes`. If these sections are empty in the PDF, the issue is likely in the PDF rendering/export logic, not the aggregation. Check `useExportPDF` and `generate-report-pdf` edge function.
**Fix:** Verify `daily_reports` table has populated `class_details` JSONB and `total_gym_checkins` for recent dates. If data exists but PDF is blank, fix the PDF template.
**Verify:** Query `daily_reports` for Mar 4, check `class_details`, `total_gym_checkins`, `total_class_checkins` values.

### 9. 🎯 Appointment Count Not Pulling
**Diagnosis:** `private_appointments` in `aggregate_reservation_counts` requires `reservation_type IN ('Personal Training', 'Private Treatment')`. This depends on `arketa_classes.reservation_type` being populated (via `classify_reservation_type()` function), or the fallback in the SQL. If classes are missing or the classifier doesn't match, counts will be wrong.
**Fix:** Run the classifier against recent classes to verify coverage. Update `classify_reservation_type()` if new class names aren't matching.
**Verify:** `SELECT classify_reservation_type(name) FROM arketa_classes WHERE class_date = '2026-03-04' AND name ILIKE '%massage%'` should return 'Private Treatment'.

---

## TIER 3: UX / Feature Bugs

### 10. 📋 Response Templates Paste Raw URLs
**Diagnosis:** Line 842 in `ResponseTemplatesWithAI.tsx`: `navigator.clipboard.writeText(template.content)` copies the raw HTML string as plain text. When pasted into email/chat, the HTML tags appear as visible text instead of rendered links.
**Fix:** Use `navigator.clipboard.write()` with both `text/html` and `text/plain` MIME types, so the formatted HTML is preserved when pasting into rich text fields.
**Verify:** Copy a template with a link, paste into Gmail — link should be clickable, not raw HTML.

### 11. 🔗 Quick Links Copy Button (Mobile)
**Diagnosis:** Copy button in `QuickLinksTab.tsx` uses `opacity-0 group-hover/link:opacity-100` — invisible on touch devices. Also, the Concierge dashboard view passes hardcoded `searchTerm=""` with no search input.
**Fix:** Make copy button always visible (remove hover-only opacity). The standalone page already has search.
**Verify:** On mobile, copy button should be visible next to each link without hovering.

### 12. ☕ Move Café Section Higher in Daily Report
**Diagnosis:** Layout order in the daily report view. Café notes are rendered after other sections.
**Fix:** Reorder the section rendering in `ReportDataSection.tsx` or `DailyReportView.tsx`.
**Verify:** Open daily report — café section should appear in the top half.

---

## TIER 4: Feature Requests (New Development)

### 13. 📱 Mobile Optimization (General)
Broad scope — needs specific screens identified. Likely candidates: daily report form, checklist views, quick links.

### 14. 🔄 Cancellation & Pause Reason Tracking
New feature: capture reasons from Arketa API, backfill to Feb 18, store in dedicated table. Requires Arketa API investigation for cancel/pause reason fields.

### 15. 📋 Sync Old Cancellation Log from v1
Import from previous Google Sheet / membership-tracker-v1. Backfill since Feb 17.

### 16. 🧹 Clean Up Admin Cancellations View
Filter out Arketa noise (rate switches, billing errors). Add cancellation reason column. **Jillian wants to review together.**

### 17. 💬 Discuss Cancellation Form Workflow
Meeting/discussion item with Jillian re: forwarded email chain with Roger & Ben about procedures.

### 18. 👥 Member Funnel Classifications (Phase 1)
Planning item — will make announcement.

### 19. 🆕 Onboarding New Employees UI for Managers
Described as "VERY EASY UI" — likely a simple checklist/form for manager onboarding flow.

### 20. 📊 Class View Display Fix
Jillian flagged as incorrect but not top priority.

---

## Execution Order

**Sprint 1 (Immediate — this week):**
- Fix #1 (editor scroll), #2 (deletion RLS), #3 (save RLS), #4 (café buttons), #10 (templates copy)
- Diagnose & fix #7 (financials formula)

**Sprint 2 (Data accuracy):**
- Fix #6 (class count), #8 (daily report PDF), #9 (appointment count)
- Fix #5 (cold plunge input)

**Sprint 3 (UX):**
- Fix #11 (quick links mobile), #12 (café section order)
- General mobile optimization (#13)

**Sprint 4 (Features):**
- #14 (cancellation tracking), #15 (sync old log), #16 (admin cleanup)
- #19 (onboarding UI)

**Requires Discussion:**
- #17 (cancellation workflow with Jillian)
- #18 (member funnel phase 1)
- #20 (class view)

---

## Verification Queries (run after fixes)

```sql
-- #7: Check financials formula impact
SELECT report_date, gross_sales_arketa, gross_sales_membership, gross_sales_other
FROM daily_reports WHERE report_date >= '2026-03-01' ORDER BY report_date;

-- #8: Check if class_details is populated
SELECT report_date, total_gym_checkins, total_class_checkins, private_appointments,
       jsonb_array_length(COALESCE(class_details, '[]'::jsonb)) as class_count
FROM daily_reports WHERE report_date = '2026-03-04';

-- #9: Check appointment classification
SELECT name, classify_reservation_type(name) as classified
FROM arketa_classes WHERE class_date = '2026-03-04'
AND classify_reservation_type(name) IN ('Personal Training', 'Private Treatment');
```

# Hume Ops System – Remediation Plan

This plan addresses all issues from the deep scan report. Work is ordered by priority and grouped into phases so you can approve and execute in stages.

---

## npm audit results (current)

```
# npm audit report
ajv  <8.18.0
Severity: moderate
ajv has ReDoS when using `$data` option - https://github.com/advisories/GHSA-2g4f-4pwh-qvx6
fix available via `npm audit fix --force`
Will install typescript-eslint@8.14.0, which is a breaking change

10 moderate severity vulnerabilities
- node_modules/ajv
- @eslint/eslintrc → eslint → @eslint-community/eslint-utils → @typescript-eslint/* → typescript-eslint
- eslint-plugin-react-refresh
```

**Recommendation:** Do **not** run `npm audit fix --force` blindly (downgrades typescript-eslint). Prefer:
1. Run `npm audit fix` (no `--force`) to apply safe fixes only.
2. If vulnerabilities remain, upgrade ESLint and typescript-eslint to latest compatible versions and re-run audit, or accept the moderate risk (ReDoS in ESLint’s ajv when using `$data`, which this project may not use).

**Phase 3 outcome:** `npm audit fix` was run (no `--force`); safe fixes were applied. Moderate ajv/ESLint chain issues remain. Risk accepted: ReDoS in ajv applies when using `$data`; this project uses ESLint flat config and does not use that option. Re-run audit periodically.

---

## Phase 1: Critical & security (do first)

### 1.1 Bug: NotFound.tsx self-assignment
- **File:** `src/pages/NotFound.tsx`
- **Change:** Replace `window.location.href = window.location.href` with the correct OAuth behavior. Options:
  - If the intent is “let the page load so the auth bridge can handle it”: remove the line (no-op).
  - If the intent is “reload so the auth bridge runs”: use `window.location.reload()`.
  - If the intent is “redirect to auth”: set `window.location.href` to the auth URL.
- **Check:** ESLint `no-self-assign` clears.

### 1.2 Security: PolicyManagement.tsx XSS
- **File:** `src/components/manager/PolicyManagement.tsx` (line ~532)
- **Change:** Sanitize before rendering:  
  `dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }}`  
  Use the same `sanitizeHtml` helper used in PoliciesTab.tsx / StaffResourcesView.tsx (e.g. from `dompurify` or project utility). Ensure the helper is imported in this file.

### 1.3 Debug / telemetry in client code
- **Files:**  
  `src/integrations/supabase/client.ts`  
  `src/pages/auth/Login.tsx`  
  `src/hooks/useUserRoles.ts`  
  `src/pages/NotFound.tsx`
- **Change:** Remove or guard all `fetch('http://127.0.0.1:7246/ingest/...')` and any associated `console.log` of the same payloads.
  - Option A: Delete the blocks entirely (recommended if ingest is not used).
  - Option B: Wrap in `if (import.meta.env.DEV)` or a dedicated `ENABLE_DEBUG_INGEST` env so they never run in production.
- **Check:** No production bundle should hit 127.0.0.1:7246.

---

## Phase 2: ESLint – stop linting junk & fix easy wins

### 2.1 Ignore macOS resource-fork files
- **File:** `eslint.config.js`
- **Change:** In the top-level config, add to `ignores`: `"**/._*"` (or `"**/.\\_*"` if needed for escaping). This removes the large number of “Invalid character” parsing errors from `._*` files.

### 2.2 Auto-fixable ESLint issues
- **Command:** `npm run lint -- --fix`
- **Fixes:** Up to ~10–11 issues (per scan: “10 errors and 1 warning potentially fixable with the `--fix` option”), e.g.:
  - `prefer-const` (e.g. LostAndFoundTab.tsx `filtered`, useStaffMessages.ts `query`, useConciergeShiftStaff.ts `userNameMap`, Supabase functions).
  - Possibly some whitespace or formatting.
- **Check:** Re-run `npm run lint` and confirm no new errors; fix any remaining by hand if needed.

### 2.3 Fix no-case-declarations
- **Files:**  
  `src/components/settings/backfill/DateSelector.tsx` (case "yesterday")  
  `supabase/functions/import-csv-mapped/index.ts`  
  `supabase/functions/backfill-historical/index.ts` (multiple cases)
- **Change:** Wrap each `case` body that contains `const`/`let` in a block `{ }` so the declaration is block-scoped.  
  Example (DateSelector.tsx):
  ```ts
  case "yesterday": {
    const yesterday = subDays(now, 1);
    onStartDateChange(format(yesterday, "yyyy-MM-dd"));
    ...
    break;
  }
  ```

### 2.4 Fix no-irregular-whitespace
- **File:** `src/components/admin/BuildStatusModal.tsx` (line 360)
- **Change:** In the header cell that contains the invisible/irregular character, delete the bad character and type a normal space (or remove if it’s meant to be empty). Re-run ESLint to confirm.

### 2.5 Fix no-self-assign
- **File:** `src/pages/NotFound.tsx`  
- **Change:** Handled in Phase 1.1; no separate step.

### 2.6 @ts-ignore → @ts-expect-error
- **File:** `src/lib/registerSW.ts` (line 98)
- **Change:** Replace `@ts-ignore` with `@ts-expect-error` and add a one-line comment explaining why the next line is expected to error (e.g. “Service Worker type not in DOM types”).

### 2.7 Unused eslint-disable
- **File:** `src/components/backfill/CSVImportMapper.tsx` (lines 571–573)
- **Change:** Remove the eslint-disable that doesn’t apply, or move it to the line that actually has the `any` (line 573). Fix the `any` in a later phase or leave with a single, correct disable.

---

## Phase 3: Dependency & config clean-up

### 3.1 npm audit
- Run `npm audit fix` (without `--force`).
- If moderate ajv/ESLint issues remain, either:
  - Upgrade `eslint`, `typescript-eslint`, and related packages to latest compatible versions and run `npm audit` again, or
  - Document the accepted risk (ReDoS in ajv when using `$data`) and re-run audit periodically.

### 3.2 npm “devdir” warning
- **Message:** `Unknown env config "devdir". This will stop working in the next major version of npm.`
- **Action:** Check global or project npm config for `devdir` and remove or update it (`npm config list` / `npm config get devdir`). Optional; does not block remediation.

### 3.3 tailwind.config.ts require()
- **File:** `tailwind.config.ts` (line 111)
- **Change:** Replace `require(...)` with a dynamic `import()` if the config is ESM, or add an ESLint disable for that line with a short comment (“Tailwind plugin only available as CommonJS”). Prefer converting to `import` if the build supports it.

---

## Phase 4: React hooks (exhaustive-deps)

Fix missing or incorrect dependency arrays to avoid stale closures and wrong effect timing. Prefer minimal, safe changes (add deps or use refs/callbacks where appropriate).

### 4.1 ConciergeForm.tsx
- **Effects:** Multiple useEffects (lines ~148, 160, 168, 175, 192) with missing deps: autoDetectedShift, setShift, loadDraft, saveDraft, handleDatabaseChange, conciergeStaffNames, staffNameWasAutoPopulated, isDirty, isSubmitted.
- **Approach:** For each effect, either:
  - Add the missing dependency if it’s safe (no infinite loop), or
  - Wrap the handler in `useCallback` with correct deps and add that to the effect deps, or
  - Document with an eslint-disable-next-line and a one-line comment (e.g. “intentional run once on mount”) only where the current behavior is correct.

### 4.2 Other components
- **ConciergeShiftReport.tsx:** handleSaveDraft in useEffect deps.
- **EmbeddedChecklist.tsx:** syncPendingCompletions.
- **ScheduledToursDisplay.tsx:** fetchTours.
- **ShiftEventsMiniCalendar.tsx, UpcomingTodayCard.tsx:** filterByShift in useMemo deps.
- **PdfViewer.tsx:** pdf in useEffect deps.
- **useBackfillJob.ts:** activeJob.
- **ResourcePageEditorPage.tsx:** existingPage.
- **AnnouncementsBoard.tsx:** useMemo – ensure `roles` (or the value that depends on it) is stable or move the conditional inside the useMemo so deps are stable.

Apply the same pattern: add deps, useCallback, or a justified eslint-disable with a short comment.

---

## Phase 5: TypeScript – reduce `any` (incremental)

Do not enable strict `noImplicitAny` / `noUnusedLocals` globally in one step; reduce `any` file-by-file or by area.

### 5.1 Priority areas (high traffic / shared code)
- **Hooks:** useResourcePages, useCanEditPage, usePolicies, usePopularPages, useRecordPageRead, useResourcePageEditors, useResourcePageFolders, useResourceSearch, useManagementInbox, useBackfillJobs.
- **Components:** ConciergeForm, EmbeddedChecklist, checklist views (Concierge/Cafe/BoH), BuildStatusModal, UserManagementTable, SlingUserLinkingTable.
- **Supabase client usage:** Replace `.from("table_name") as any` with proper typings (e.g. extend or fix `Database` types so table names are valid).

### 5.2 Approach per file
- Replace `any` with:
  - Specific types from `@/integrations/supabase/types` or local interfaces.
  - `unknown` and type guards where the shape is not known.
  - Generic types for callbacks (e.g. `(err: Error)` instead of `(err: any)`).
- For Supabase: ensure `Database` (and any generated types) include all tables used in the app; regenerate from DB if needed, then remove `as any` where possible.

### 5.3 ESLint
- Keep `@typescript-eslint/no-explicit-any` as error. Fix newly touched files as you go; optionally add a list of “allowed” files with a disable comment and a TODO to fix later.

---

## Phase 6: Safe HTML and minor clean-up

### 6.1 RichTextEditor.tsx
- **File:** `src/components/shared/RichTextEditor.tsx` (line 52)
- **Issue:** `editorRef.current.innerHTML = value` can be XSS if `value` is user-controlled.
- **Change:** If `value` comes from the DB or another trusted source, add a one-line comment. If it can be user input, run it through the same sanitizer used elsewhere (e.g. DOMPurify) before assigning to `innerHTML`, or use a safe setter that strips script.

### 6.2 ResponseTemplatesWithAI.tsx
- **File:** `src/components/concierge/ResponseTemplatesWithAI.tsx` (line 764)
- **Issue:** `div.innerHTML = guide.content` in a detached div for text extraction.
- **Change:** Prefer a sanitizer or a tag-stripping utility that doesn’t use raw `innerHTML` (e.g. use DOMPurify with a config that returns plain text, or a small parser that only extracts text). If keeping current approach, ensure `guide.content` is always from a trusted source and add a short comment.

### 6.3 PolicyManagement.tsx
- Handled in Phase 1.2.

### 6.4 Empty interface / only-export-components
- **command.tsx, textarea.tsx:** Fix `@typescript-eslint/no-empty-object-type` by adding a property to the interface or using a type alias.
- **react-refresh/only-export-components:** For files that export both components and constants (e.g. badge, button, form, LanguageContext, AuthProvider), either move constants to a separate file or add an eslint-disable with a comment. Prefer splitting where it improves clarity.

---

## Phase 7: Optional / longer-term

### 7.1 TODOs in code
- **ChecklistTaskComponents.tsx:** “TODO: Make configurable” (options), “TODO: Fetch actual staff list from database.” Create tickets or implement when prioritised.

### 7.2 Console statements
- Replace or gate `console.log`/`console.error`/`console.warn` in production paths (e.g. ConciergeForm, useBackfillJobs, registerSW, api-logger). Use a small logger that no-ops in production or guard with `import.meta.env.DEV`.

### 7.3 TypeScript strictness
- Consider enabling over time: `strictNullChecks`, then `noImplicitAny`, then `noUnusedLocals` / `noUnusedParameters`, file-by-file or by directory.

### 7.4 Test coverage
- Add unit tests for critical paths (e.g. auth redirect, policy rendering, ConciergeForm submit). Even a few tests will help catch regressions from the above fixes.

---

## Execution checklist (summary)

| Phase | Item | Status |
|-------|------|--------|
| 1.1 | NotFound.tsx self-assign → correct OAuth handling | ☑ |
| 1.2 | PolicyManagement.tsx sanitize `policy.content` | ☑ |
| 1.3 | Remove/guard debug ingest (client, Login, useUserRoles, NotFound) | ☑ |
| 2.1 | ESLint ignore `**/._*` | ☑ |
| 2.2 | `npm run lint -- --fix` | ☑ |
| 2.3 | no-case-declarations (DateSelector, import-csv-mapped, backfill-historical) | ☑ |
| 2.4 | BuildStatusModal irregular whitespace | ☑ |
| 2.6 | registerSW.ts @ts-expect-error | ☑ |
| 2.7 | CSVImportMapper eslint-disable | ☑ |
| 3.1 | npm audit fix (and optionally upgrade ESLint stack) | ☑ |
| 3.3 | tailwind.config.ts require → import or disable | ☑ |
| 4.x | React hooks exhaustive-deps (ConciergeForm + list in 4.2) | ☑ |
| 5.x | Reduce `any` (priority areas first) | ☐ |
| 6.1 | RichTextEditor safety comment or sanitize | ☐ |
| 6.2 | ResponseTemplatesWithAI innerHTML comment or safe strip | ☐ |
| 6.4 | Empty interfaces + react-refresh (optional) | ☐ |

---

## Order of operations recommendation

1. **Phase 1** (critical + security) – one PR.
2. **Phase 2** (ESLint ignore + auto-fix + case/whitespace/ts-expect/disable) – one PR.
3. **Phase 3** (npm audit + tailwind) – one PR.
4. **Phase 4** (hooks) – one PR or split by component.
5. **Phase 5** (any) – incremental PRs by area.
6. **Phase 6** (safe HTML + minor) – one PR.
7. **Phase 7** – as needed (TODOs, console, strictness, tests).

After each phase, run:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- Manual smoke test of auth, policies, and concierge form.

Use this document as the single plan for fixing all issues from the deep scan; update the checklist as items are completed.

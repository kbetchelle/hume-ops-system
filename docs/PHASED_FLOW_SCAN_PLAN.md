# Phased Flow Scan Plan: Login, Checklists, Shift Report

This document defines a phased manual (or future E2E) scan for edge cases, errors, and loading time across **login**, **checklists**, and **shift report** flows, from **concierge**, **back-of-house (BoH)**, and **cafe** account perspectives.

---

## Account Types and Entry Points

| Account type | Role(s) | Dashboard path after login | Key features |
|-------------|---------|----------------------------|--------------|
| Concierge | `concierge` | `/dashboard/concierge` | Shift report, Concierge checklists, Embedded checklist on home |
| Back of house | `floater` | `/dashboard/floater` | BoH checklists only |
| Back of house | `female_spa_attendant` | `/dashboard/spa/female` | BoH checklists only |
| Back of house | `male_spa_attendant` | `/dashboard/spa/male` | BoH checklists only |
| Cafe | `cafe` | `/dashboard/cafe` | Cafe checklists only |

Shared route used by all roles that have checklists: **`/dashboard/my-checklists`** (shows role-appropriate view or "No checklists for your role").

---

## Phase 1: Login Flow

**Goal:** Cover edge cases, errors, and load time from unauthenticated to dashboard.

### 1.1 Concierge account

- **Steps:** Open `/`, enter concierge credentials (email or username), submit.
- **Success:** Redirect to `/dashboard` then `/dashboard/concierge`; toast "Welcome back".
- **Edge cases / errors to verify:**
  - **Username login:** Use username (no `@`); ensure `get_email_by_username` RPC is called; wrong username shows "No account found for that username."
  - **Email login:** Use email; wrong password shows Supabase error toast.
  - **Empty fields:** Submit with empty email/username or password; see validation messages (min length 6 for password).
  - **Stay signed in:** Toggle off on desktop; close browser, reopen; expect session-only (sign out on new session). Toggle on; reopen; expect still signed in.
  - **Mobile:** On viewport ≤768px, "Stay signed in" forced on; no session-only sign-out on new tab.
- **Loading time:** Note time from click "Sign in" to redirect; watch for spinner and no duplicate navigations.
- **Post-login states:** If profile has `onboarding_completed: false` → redirect to `/onboarding`. If `approval_status: pending` → `/pending-approval`. If `deactivated: true` or `approval_status: rejected` → `/account-disabled`.

### 1.2 Back-of-house accounts (floater, female spa, male spa)

- Same login flow as 1.1; only redirect path differs: `/dashboard/floater`, `/dashboard/spa/female`, or `/dashboard/spa/male`.
- **Edge case:** User with multiple BoH roles: redirect follows `primary_role` from profile, or first in priority order (e.g. female_spa before male_spa before floater).
- **Loading time:** Same as 1.1; Dashboard.tsx waits on `useUserRoles` and `useUserProfile` before redirect.

### 1.3 Cafe account

- Same as 1.2 with redirect to `/dashboard/cafe`.
- **Edge case:** User with both cafe and another role: redirect to higher-priority role per `getPrimaryRole` (e.g. concierge before cafe).

### 1.4 Google OAuth

- Click "Sign in with Google"; complete OAuth; land on origin. Expect redirect to `/dashboard` then role dashboard.
- **Error:** If OAuth fails, toast with error message; no redirect.

### 1.5 Protected route without auth

- Open `/dashboard/concierge` (or any protected route) while logged out. Expect redirect to `/` with `state.from` for post-login redirect.
- **Loading:** ProtectedRoute shows loader until auth + profile + roles resolve.

---

## Phase 2: Checklists Flow

**Goal:** Cover loading, empty/error states, and performance for Concierge, BoH, and Cafe checklist views.

### 2.1 Concierge checklists

- **Entry:** Log in as concierge → `/dashboard/concierge` (home shows `EmbeddedChecklist`) and/or `/dashboard/my-checklists` (full `ConciergeChecklistView`).
- **Edge cases / errors:**
  - **Time-based slot:** Concierge view uses current time for slot (opening / AM / PM / closing); verify correct checklist for weekday vs weekend and time boundaries (e.g. 6:00, 13:30, 20:00 weekdays).
  - **Date picker:** Change date to past/future; confirm correct weekday vs weekend templates and completions load.
  - **Hide completed:** Toggle "Hide completed"; state persisted in `localStorage` key `checklist-hide-completed`.
  - **No checklists:** If no active concierge checklists for day type, view should show empty state, not crash.
- **Loading time:** Note time until list and items appear; ConciergeChecklistView uses `useQuery` for `concierge-checklists-all` and items; watch for "Loading..." or skeleton.
- **Tasks:** Open a checklist with photo/signature/free-text tasks; confirm upload and completion save without errors.

### 2.2 Back-of-house checklists (floater, female spa, male spa)

- **Entry:** Log in as floater → `/dashboard/floater`; as female spa → `/dashboard/spa/female`; as male spa → `/dashboard/spa/male`. Each shows `BoHChecklistView`.
- **Edge cases / errors:**
  - **PST date:** BoH uses PST for "today" and weekend detection; verify selected date and day-of-week match PST.
  - **Role:** View filters by `role_type` (floater, male_spa_attendant, female_spa_attendant); ensure only that role’s checklists appear.
  - **PM shift cutoff:** BoH uses PM checklist time_hints to detect shift; verify AM/PM checklist selection matches expectations.
  - **No role / no checklists:** User with BoH role but no matching templates sees empty or "no checklist" state.
- **Loading time:** BoH runs `boh-pm-start` and checklist query; note delay until "Loading..." is replaced.
- **My Checklists:** Open `/dashboard/my-checklists` as BoH; same BoH view and behavior.

### 2.3 Cafe checklists

- **Entry:** Log in as cafe → `/dashboard/cafe`; shows `CafeChecklistView`.
- **Edge cases / errors:**
  - **Shift toggle:** `useCurrentShift()` (AM/PM); toggle if available; confirm correct checklist and completions for shift.
  - **Weekend:** Cafe checklists may have weekend variants; switch date/weekend and confirm correct list.
  - **No checklists:** Empty state, no crash.
- **Loading time:** Note initial load of cafe checklists and items.
- **My Checklists:** Open `/dashboard/my-checklists` as cafe; same Cafe view.

### 2.4 Role with no checklists

- Log in as a role that has no checklist assignment (e.g. admin or manager with no concierge/BoH/cafe). Open `/dashboard/my-checklists`. Expect message: "No checklists available for your role."

---

## Phase 3: Shift Report Flow (Concierge only)

**Goal:** Cover draft load, save, submit, past reports, and loading/errors. Shift report is **concierge-only**.

### 3.1 Open and load

- **Entry:** Concierge dashboard → Report tab (or "Shift Report" in nav). Component: `ConciergeForm` (lazy-loaded with `Suspense`).
- **Edge cases / errors:**
  - **First load:** Suspense fallback (e.g. `SkeletonLoader variant="form"`) appears until ConciergeForm is loaded; then `useShiftReport(today, currentShift)` runs; existing draft or empty form.
  - **No existing report:** Form empty; date and shift match `useCurrentShift()` (today, AM or PM).
  - **Existing draft:** Form pre-filled; "Saved [time]" or equivalent; no duplicate draft created on load.
  - **Existing submitted:** Form read-only; submit button disabled.
- **Loading time:** Measure time from clicking Report tab to form usable (including lazy chunk and first query).

### 3.2 Draft and auto-save

- Type in fields; wait for auto-save (e.g. debounce ~1.5s in ConciergeForm or 30s in ConciergeShiftReport legacy path). Confirm "Saving..." then "Saved" and data in `daily_report_history` (or draft table if used).
- **Error:** Simulate network failure or Supabase error; confirm toast and no silent fail.

### 3.3 Submit

- Fill required content; click Submit. Expect success toast, form read-only, status submitted.
- **Edge case:** Submit when already submitted; button disabled, no double submit.

### 3.4 Past reports

- On desktop, switch to "Past Reports" tab; `PastReportsView` uses `useSubmittedShiftReports(200)`. List loads; no infinite loading.
- **Loading time:** Note time to first list render when many reports exist (limit 200).
- **Empty:** No submitted reports; empty state.

### 3.5 Auto-submit (if enabled)

- If concierge auto-submit is enabled near shift end, confirm toast "Auto-submitting shift report" and transition to submitted state without errors.

---

## Execution Order (Phased)

1. **Phase 1** – Run all login scenarios (concierge, BoH, cafe, OAuth, protected route) and record any errors or slow redirects.
2. **Phase 2** – For each account type, run checklist flows (dashboard + `/dashboard/my-checklists`), then role-with-no-checklists.
3. **Phase 3** – Concierge only: shift report load, draft, submit, past reports, and auto-submit if applicable.

---

## Loading Time Checklist (all phases)

- Login: click to dashboard redirect &lt; 3s (depends on network and Supabase).
- Dashboard redirect: roles + profile load &lt; 2s before redirect.
- Checklist views: first paint of list/items &lt; 2s after route load.
- Shift report: Suspense fallback &lt; 1s; form data loaded &lt; 2s after tab switch.
- Past reports: list visible &lt; 3s.

Record any threshold exceedances and flaky loading (sometimes slow, sometimes fast).

---

## Automated Tests (Vitest)

- **[src/pages/dashboards/MyChecklistsPage.test.tsx](src/pages/dashboards/MyChecklistsPage.test.tsx)** – Role-based rendering: concierge/BoH/cafe see correct checklist view; admin/manager see "No checklists for your role"; loading state shows fallback.
- **[src/hooks/useShiftReports.test.tsx](src/hooks/useShiftReports.test.tsx)** – Shift report hooks: `useShiftReport` loading then data, error when query fails; `useSubmittedShiftReports` empty list; `useSaveShiftReport` insert when no id.

Run: `npm run test -- --run src/pages/dashboards/MyChecklistsPage.test.tsx src/hooks/useShiftReports.test.tsx`

---

## Reference: Key Files

- Login: [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)
- Auth guard: [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx)
- Dashboard redirect: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- Role paths: [src/hooks/useUserRoles.ts](src/hooks/useUserRoles.ts) (`getRoleDashboardPath`)
- My Checklists page: [src/pages/dashboards/MyChecklistsPage.tsx](src/pages/dashboards/MyChecklistsPage.tsx)
- Concierge checklist: [src/components/checklists/concierge/ConciergeChecklistView.tsx](src/components/checklists/concierge/ConciergeChecklistView.tsx)
- BoH checklist: [src/components/checklists/boh/BoHChecklistView.tsx](src/components/checklists/boh/BoHChecklistView.tsx)
- Cafe checklist: [src/components/checklists/cafe/CafeChecklistView.tsx](src/components/checklists/cafe/CafeChecklistView.tsx)
- Shift report: [src/components/concierge/ConciergeForm.tsx](src/components/concierge/ConciergeForm.tsx), [src/hooks/useShiftReports.ts](src/hooks/useShiftReports.ts)
- Concierge dashboard (report tab): [src/pages/dashboards/ConciergeDashboard.tsx](src/pages/dashboards/ConciergeDashboard.tsx)

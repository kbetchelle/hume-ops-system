# Concierge Shift Report System - Test Cases

## Test Environment Setup

### Prerequisites
- Local Supabase instance running OR access to staging/production
- Two browser windows/tabs for multi-user tests
- Browser DevTools open for network inspection
- User account with 'concierge' role

### Test Data Preparation

```sql
-- Ensure test user has concierge role
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'concierge')
ON CONFLICT DO NOTHING;

-- Create test shift in staff_shifts for Sling API
INSERT INTO staff_shifts (shift_date, shift_start, shift_end, user_name, staff_name)
VALUES (CURRENT_DATE, '06:00', '14:00', 'Test User', 'Test User');

-- Create test check-ins for Arketa integration
INSERT INTO arketa_reservations (client_name, class_time, status)
VALUES 
  ('Test Member 1', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'checked_in'),
  ('Test Member 2', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'checked_in');
```

---

## Test Suite 1: Core Functionality

### Test 1.1: Form Initialization
**Objective:** Verify form loads with correct initial state

**Steps:**
1. Navigate to Concierge Dashboard
2. Click "Shift Report" in sidebar
3. Observe form load

**Expected Results:**
- ✅ Form displays current date and shift (AM/PM based on time)
- ✅ Staff name auto-populated from Sling API
- ✅ All sections are empty arrays
- ✅ All N/A checkboxes unchecked
- ✅ Auto-save indicator shows "No changes"

**Pass Criteria:** All expected results met

---

### Test 1.2: Basic Field Entry
**Objective:** Verify all form fields accept input

**Steps:**
1. Enter staff name
2. Add member feedback with all sentiment types (positive, negative, neutral)
3. Add celebratory event for each type (birthday, anniversary, wedding, promotion, other)
4. Add tour entry with follow-up checkbox
5. Add membership cancel request
6. Add facility issue
7. Add system issue for each type (arketa, jolt, database, question)
8. Fill busiest areas textarea
9. Fill management notes textarea
10. Add future shift note

**Expected Results:**
- ✅ All fields accept input correctly
- ✅ Dropdowns show correct options
- ✅ Date pickers work
- ✅ Checkboxes toggle properly
- ✅ Array items can be added/removed

**Pass Criteria:** All fields functional

---

### Test 1.3: Auto-Save Draft
**Objective:** Verify auto-save functionality

**Steps:**
1. Type in any field
2. Wait 1.5 seconds (no further typing)
3. Observe auto-save indicator

**Expected Results:**
- ✅ "Saving..." badge appears after 1.5s
- ✅ Badge changes to "Saved [time]" after save completes
- ✅ Database query shows draft record:
   ```sql
   SELECT * FROM concierge_drafts 
   WHERE report_date = CURRENT_DATE 
   AND shift_time = 'AM';  -- or 'PM'
   ```
- ✅ `form_data` JSONB contains entered values
- ✅ `version` = 1 for first save
- ✅ `last_updated_by` = current user email

**Pass Criteria:** Draft saved within 2 seconds, data matches input

---

### Test 1.4: Draft Persistence
**Objective:** Verify draft loads on page refresh

**Steps:**
1. Fill out form partially
2. Wait for auto-save
3. Close browser tab
4. Reopen Concierge Dashboard > Shift Report
5. Observe loaded data

**Expected Results:**
- ✅ All previously entered data appears
- ✅ "Saved [time]" badge shows last save time
- ✅ No duplicate database records created

**Pass Criteria:** Data persists exactly as entered

---

### Test 1.5: Form Submission
**Objective:** Verify report submission works correctly

**Steps:**
1. Fill out all required sections
2. Click "Submit Report" button
3. Wait for confirmation

**Expected Results:**
- ✅ Success toast appears
- ✅ Form becomes read-only (all fields disabled)
- ✅ "Submitted" badge appears in header
- ✅ Submit button disabled
- ✅ Database checks:
   ```sql
   -- Main report created
   SELECT * FROM daily_report_history 
   WHERE report_date = CURRENT_DATE 
   AND shift_type = 'AM'
   AND status = 'submitted';
   
   -- Celebratory events cascaded
   SELECT * FROM celebratory_events 
   WHERE reported_date = CURRENT_DATE;
   
   -- Facility issues cascaded
   SELECT * FROM facility_issues_tracker 
   WHERE reported_date = CURRENT_DATE;
   
   -- System issues cascaded
   SELECT * FROM foh_questions 
   WHERE reported_date = CURRENT_DATE;
   
   -- Draft deleted
   SELECT COUNT(*) FROM concierge_drafts 
   WHERE report_date = CURRENT_DATE;  -- Should be 0
   ```

**Pass Criteria:** Report submitted, all data cascaded, draft removed

---

## Test Suite 2: Real-Time Collaboration

### Test 2.1: Active Editors Detection
**Objective:** Verify presence tracking works

**Setup:** Open two browser windows/tabs

**Steps:**
1. Window 1: Open shift report for today
2. Window 2: Open same shift report
3. Observe both windows

**Expected Results:**
- ✅ Both windows show "1 other person is editing this report" banner
- ✅ Banner shows user name/email of other editor
- ✅ Each window excludes itself from editor list
- ✅ When one window closes, banner disappears in other window

**Pass Criteria:** Presence tracking accurate in both windows

---

### Test 2.2: Real-Time Data Sync
**Objective:** Verify changes sync between clients

**Setup:** Open two browser windows/tabs

**Steps:**
1. Window 1: Add member feedback entry
2. Wait for auto-save (1.5s)
3. Observe Window 2

**Expected Results:**
- ✅ Window 2 receives database change via Postgres Realtime
- ✅ New feedback entry appears in Window 2
- ✅ No duplicate entries
- ✅ Both windows show same version number

**Pass Criteria:** Changes appear in both windows within 3 seconds

---

### Test 2.3: Typing Indicators
**Objective:** Verify focused field tracking

**Setup:** Open two browser windows/tabs

**Steps:**
1. Window 1: Click into "Busiest Areas" field
2. Start typing
3. Observe Window 2

**Expected Results:**
- ✅ Window 2 shows badge near "Busiest Areas" field: "[User] is editing"
- ✅ Badge disappears 3 seconds after typing stops
- ✅ Moving to different field updates badge location

**Pass Criteria:** Typing indicators accurate and timely

---

### Test 2.4: Conflict Resolution - Different Fields
**Objective:** Verify non-conflicting edits merge correctly

**Setup:** Open two browser windows/tabs

**Steps:**
1. Window 1: Add member feedback
2. Window 2: Add facility issue
3. Both: Wait for auto-save
4. Observe both windows

**Expected Results:**
- ✅ No conflict modal appears
- ✅ Both windows show both changes (feedback + issue)
- ✅ Version increments correctly
- ✅ No data loss

**Pass Criteria:** Both changes preserved, no conflicts

---

### Test 2.5: Conflict Resolution - Same Field
**Objective:** Verify conflict detection and resolution

**Setup:** Open two browser windows/tabs

**Steps:**
1. Window 1: Type in "Management Notes"
2. Window 2: Type different text in "Management Notes"
3. Window 1: Wait for auto-save
4. Window 2: Wait for auto-save
5. Observe conflict modal

**Expected Results:**
- ✅ Conflict modal appears in one or both windows
- ✅ Modal shows version numbers (e.g., "Local: v2, Remote: v3")
- ✅ Modal lists differences detected
- ✅ Two buttons: "Accept Remote" and "Keep Local"
- ✅ Choosing "Accept Remote" loads remote data
- ✅ Choosing "Keep Local" overwrites remote with local
- ✅ Version increments after resolution

**Pass Criteria:** Conflict detected, user can choose resolution, data consistent after

---

### Test 2.6: Multi-Device Same User
**Objective:** Verify same-user multi-device editing

**Setup:** Open on laptop and phone (or two different browsers)

**Steps:**
1. Laptop: Open shift report
2. Phone: Open same shift report
3. Laptop: Add entry
4. Phone: Observe update

**Expected Results:**
- ✅ Both devices see each other in active editors
- ✅ Changes sync between devices
- ✅ Conflict modal shows "Multi-Device Edit Detected"
- ✅ Resolution works same as multi-user conflicts

**Pass Criteria:** Same-user edits handled correctly

---

## Test Suite 3: Offline Support

### Test 3.1: Go Offline Mid-Edit
**Objective:** Verify offline mode activates correctly

**Steps:**
1. Open shift report
2. Make some changes
3. Open DevTools > Network tab
4. Select "Offline" from throttling dropdown
5. Continue editing

**Expected Results:**
- ✅ Orange "You're offline" banner appears at top
- ✅ "Offline (X queued)" badge replaces "Saved" badge
- ✅ Form remains editable
- ✅ Changes are queued (check browser IndexedDB)
- ✅ Console shows "[OfflineQueue] Added to queue" messages

**Pass Criteria:** Offline mode activates, edits queue correctly

---

### Test 3.2: Reconnect and Sync
**Objective:** Verify offline queue syncs when reconnected

**Steps:**
1. Follow Test 3.1 to go offline
2. Make 3-4 changes while offline
3. Set Network back to "No throttling"
4. Observe auto-sync

**Expected Results:**
- ✅ "Back online" toast appears
- ✅ "Syncing queued changes..." message shown
- ✅ Queued operations process in order
- ✅ "Sync complete" toast appears
- ✅ Database reflects all changes
- ✅ Queue size drops to 0
- ✅ Console shows "[OfflineQueue] Processing X operations"

**Pass Criteria:** All queued changes sync successfully

---

### Test 3.3: Offline Queue Persistence
**Objective:** Verify queue survives page refresh

**Steps:**
1. Go offline (DevTools > Network > Offline)
2. Make changes
3. Close browser tab (don't disconnect)
4. Reopen browser and go to shift report
5. Reconnect (enable network)

**Expected Results:**
- ✅ Queue size persisted via sessionStorage/IndexedDB
- ✅ Changes still queued after reopening
- ✅ Auto-sync triggers on reconnect

**Pass Criteria:** Queue persists and syncs after reopen

---

### Test 3.4: Offline Form Submission
**Objective:** Verify submission queues when offline

**Steps:**
1. Fill out complete form
2. Go offline
3. Click "Submit Report"
4. Reconnect

**Expected Results:**
- ✅ Submission queued for later
- ✅ User sees appropriate message
- ✅ On reconnect, submission processes
- ✅ Report appears in database after sync

**Pass Criteria:** Offline submission queues and completes on reconnect

---

## Test Suite 4: Auto-Submit

### Test 4.1: Auto-Submit Countdown - Weekday AM
**Objective:** Verify auto-submit timer for weekday morning shift

**Setup:** 
- Set system time to today at 1:30 PM PST (shift ends 1:30 PM)
- Fill form with meaningful content

**Steps:**
1. Open shift report
2. Observe countdown badge
3. Wait for countdown to reach 0 (or set time to 1:45 PM)

**Expected Results:**
- ✅ Badge shows "Auto-submit in X minutes"
- ✅ Countdown updates every minute
- ✅ At 1:45 PM PST, auto-submit triggers
- ✅ Toast: "Auto-submitting shift report"
- ✅ Report submits automatically
- ✅ Form becomes read-only

**Pass Criteria:** Auto-submit triggers at correct time

---

### Test 4.2: Auto-Submit Countdown - Weekday PM
**Objective:** Verify auto-submit for weekday evening shift

**Setup:**
- System time: 9:05 PM PST (shift ends)
- Form filled

**Expected Results:**
- ✅ Auto-submit triggers at 9:20 PM PST (15 min after shift end)

**Pass Criteria:** Correct timing for PM shift

---

### Test 4.3: Auto-Submit Countdown - Weekend AM
**Objective:** Verify weekend morning shift timing

**Setup:**
- Weekend date (Saturday or Sunday)
- System time: 1:00 PM PST (weekend AM ends)
- Form filled

**Expected Results:**
- ✅ Auto-submit triggers at 1:15 PM PST

**Pass Criteria:** Weekend AM timing correct

---

### Test 4.4: Auto-Submit Countdown - Weekend PM
**Objective:** Verify weekend evening shift timing

**Setup:**
- Weekend date
- System time: 7:00 PM PST (weekend PM ends)
- Form filled

**Expected Results:**
- ✅ Auto-submit triggers at 7:15 PM PST

**Pass Criteria:** Weekend PM timing correct

---

### Test 4.5: Auto-Submit Empty Form
**Objective:** Verify empty forms don't auto-submit

**Setup:**
- System time past shift end + 15 min
- Form completely empty

**Steps:**
1. Open shift report
2. Observe no countdown appears

**Expected Results:**
- ✅ No auto-submit countdown
- ✅ No automatic submission
- ✅ Form remains editable

**Pass Criteria:** Empty forms don't auto-submit

---

### Test 4.6: Auto-Submit After Manual Submit
**Objective:** Verify auto-submit doesn't trigger after manual submit

**Steps:**
1. Fill form
2. Manually submit before auto-submit time
3. Wait past auto-submit time

**Expected Results:**
- ✅ No second submission
- ✅ Form remains read-only
- ✅ No errors in console

**Pass Criteria:** No duplicate submission

---

## Test Suite 5: API Integrations

### Test 5.1: Sling API - Staff Name Population
**Objective:** Verify staff name auto-fills from Sling

**Prerequisites:** Test data in `staff_shifts` table for today

**Steps:**
1. Open shift report for today
2. Observe staff name field

**Expected Results:**
- ✅ Staff name auto-populated
- ✅ Name matches Sling schedule for current shift
- ✅ User can override if incorrect

**Pass Criteria:** Auto-population works

---

### Test 5.2: Sling API - No Staff Scheduled
**Objective:** Verify graceful handling when no staff scheduled

**Setup:** Ensure no entries in `staff_shifts` for tomorrow

**Steps:**
1. Change form date to tomorrow
2. Observe staff name field

**Expected Results:**
- ✅ Field remains empty
- ✅ No errors shown
- ✅ User can manually enter name

**Pass Criteria:** No errors when staff not found

---

### Test 5.3: Arketa Check-ins - Display Count
**Objective:** Verify check-in data displays

**Prerequisites:** Test data in `arketa_reservations` with today's check-ins

**Steps:**
1. Open shift report for today
2. Observe info banner at top of form

**Expected Results:**
- ✅ Blue banner shows "Shift Check-ins from Arketa"
- ✅ Badge shows correct count (e.g., "15 total")
- ✅ Description mentions "Real-time data"

**Pass Criteria:** Check-in count accurate

---

### Test 5.4: Arketa Check-ins - No Data
**Objective:** Verify banner hidden when no check-ins

**Setup:** Form for date/shift with no check-ins

**Steps:**
1. Open shift report
2. Observe no banner appears

**Expected Results:**
- ✅ No Arketa banner shown
- ✅ Form works normally

**Pass Criteria:** Banner only shows when data exists

---

## Test Suite 6: Data Validation & Edge Cases

### Test 6.1: N/A Checkboxes
**Objective:** Verify N/A checkboxes disable sections

**Steps:**
1. Check "N/A" for "Celebratory Events"
2. Observe section behavior
3. Try to add event
4. Submit form

**Expected Results:**
- ✅ Add button disabled
- ✅ Existing entries remain visible but greyed out
- ✅ Submission includes N/A flag
- ✅ Database stores `celebratory_events_na = true`

**Pass Criteria:** N/A flags work for all applicable sections

---

### Test 6.2: Facility Issue Deduplication
**Objective:** Verify 48-hour deduplication works

**Steps:**
1. Submit report with facility issue: "Broken treadmill #3"
2. Next day, submit report with same issue text
3. Check database

**Expected Results:**
- ✅ First submission creates record
- ✅ Second submission silently skips duplicate (no error)
- ✅ Only one record in `facility_issues_tracker` for that description
- ✅ If 48+ hours pass, duplicate is allowed

**Pass Criteria:** Deduplication prevents duplicates within 48 hours

---

### Test 6.3: Long Text Handling
**Objective:** Verify large text entries work

**Steps:**
1. Paste 1000+ word essay into Management Notes
2. Save draft
3. Submit report

**Expected Results:**
- ✅ Text saves without truncation
- ✅ Database JSONB handles large text
- ✅ Form performance remains good

**Pass Criteria:** Large text handled gracefully

---

### Test 6.4: Special Characters
**Objective:** Verify special characters in text

**Steps:**
1. Enter text with emojis: "Member said gym is 🔥🔥🔥!"
2. Enter text with quotes: "She said "amazing" experience"
3. Save and reload

**Expected Results:**
- ✅ All special characters preserved
- ✅ No encoding issues
- ✅ Display correctly after reload

**Pass Criteria:** Special characters work

---

### Test 6.5: Submit Already Submitted Report
**Objective:** Verify duplicate submission prevention

**Steps:**
1. Submit report for a shift
2. Refresh page
3. Try to submit again

**Expected Results:**
- ✅ Form loads in read-only mode
- ✅ Submit button disabled
- ✅ "Submitted" badge shown
- ✅ Edge function rejects duplicate submission

**Pass Criteria:** Cannot submit twice

---

## Test Suite 7: Version Control

### Test 7.1: Version Incrementing
**Objective:** Verify version increments on each save

**Steps:**
1. Make change, wait for save (version = 1)
2. Make another change, wait (version = 2)
3. Continue for 5 saves
4. Check database

**Expected Results:**
- ✅ Each save increments version
- ✅ Version badge shows in conflict modal
- ✅ Database query confirms:
   ```sql
   SELECT version FROM concierge_drafts 
   WHERE report_date = CURRENT_DATE;
   ```

**Pass Criteria:** Version increments monotonically

---

### Test 7.2: Version Conflict Detection
**Objective:** Verify conflict detection uses versions

**Setup:** Two windows

**Steps:**
1. Window 1: Local version = 3
2. Window 2: Makes change, saves (remote version = 4)
3. Window 1: Makes conflicting change
4. Observe Window 1

**Expected Results:**
- ✅ Window 1 detects remote version > local version
- ✅ Conflict modal shows versions: "Local: 3, Remote: 4"
- ✅ After resolution, version = 5

**Pass Criteria:** Version comparison detects conflicts

---

## Performance Tests

### Perf Test 1: Form Load Time
**Objective:** Measure initial form load performance

**Steps:**
1. Clear browser cache
2. Open shift report
3. Measure time to interactive

**Expected Results:**
- ✅ Form visible within 2 seconds
- ✅ Staff name populated within 3 seconds
- ✅ Arketa data loaded within 3 seconds

**Pass Criteria:** < 3 seconds to fully loaded

---

### Perf Test 2: Auto-Save Responsiveness
**Objective:** Ensure auto-save doesn't block UI

**Steps:**
1. Type rapidly in multiple fields
2. Observe UI responsiveness

**Expected Results:**
- ✅ No input lag
- ✅ Typing remains smooth
- ✅ Save happens in background

**Pass Criteria:** No perceivable lag

---

### Perf Test 3: Large Form Submission
**Objective:** Test submission with max data

**Steps:**
1. Add 10+ entries in each array field
2. Fill all text areas to capacity
3. Submit

**Expected Results:**
- ✅ Submission completes within 5 seconds
- ✅ No timeout errors
- ✅ All data saved correctly

**Pass Criteria:** Large forms submit successfully

---

## Security Tests

### Sec Test 1: RLS Policy Enforcement
**Objective:** Verify non-concierge users can't access

**Setup:** User without concierge role

**Steps:**
1. Try to access shift report
2. Try to query `concierge_drafts` directly

**Expected Results:**
- ✅ Access denied or no data shown
- ✅ RLS policies block unauthorized access

**Pass Criteria:** Only concierges can access

---

### Sec Test 2: SQL Injection Prevention
**Objective:** Verify input sanitization

**Steps:**
1. Enter SQL injection attempt in text field: `'; DROP TABLE users; --`
2. Save and check database

**Expected Results:**
- ✅ Text stored as literal string
- ✅ No SQL execution
- ✅ Parameterized queries prevent injection

**Pass Criteria:** No SQL injection vulnerability

---

## Test Results Template

```
Test Suite: [Suite Name]
Test Date: [Date]
Tester: [Name]
Environment: [Local/Staging/Production]

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Form Initialization | ⬜ Pass / ❌ Fail | |
| 1.2 | Basic Field Entry | ⬜ Pass / ❌ Fail | |
| ... | | | |

Overall Result: ⬜ All Pass / ❌ Some Failed
Critical Issues Found: [Yes/No]
Blocker Issues: [List]
```

---

## Automated Testing (Future)

### Suggested E2E Tests with Playwright/Cypress

```typescript
// Example: Auto-save test
describe('ConciergeForm - Auto-Save', () => {
  it('should auto-save draft after 1.5 seconds', async () => {
    // Navigate to form
    await page.goto('/concierge/report');
    
    // Type in field
    await page.fill('[placeholder="Enter your name"]', 'Test User');
    
    // Wait 1.5s
    await page.waitForTimeout(1500);
    
    // Verify save indicator
    await expect(page.locator('text=Saved')).toBeVisible();
    
    // Verify database
    const draft = await supabase
      .from('concierge_drafts')
      .select('*')
      .single();
    expect(draft.data.form_data.staffName).toBe('Test User');
  });
});
```

---

**Test Plan Version:** 1.0  
**Last Updated:** January 31, 2026  
**Total Test Cases:** 40+

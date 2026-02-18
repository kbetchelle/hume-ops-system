# Concierge Shift Report System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get the Concierge Shift Report System up and running quickly.

---

## Prerequisites

✅ Supabase project set up  
✅ Node.js and npm installed  
✅ Supabase CLI installed (`npm i supabase -g`)  
✅ Git repository cloned  

---

## Step 1: Apply Database Migrations (2 minutes)

### Option A: Automated (Recommended)

```bash
# From project root
./apply-concierge-migrations.sh
```

### Option B: Manual

```bash
npx supabase db push
```

### Verify

```bash
# Check migrations applied
npx supabase migration list

# Should show:
# ✓ 20260131174712_create_concierge_drafts.sql
# ✓ 20260131174713_create_concierge_helpers.sql
# ✓ 20260131174714_expand_daily_report_history.sql
```

---

## Step 2: Enable Realtime (30 seconds)

Run this SQL in Supabase Dashboard > SQL Editor:

```sql
-- Enable Realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;
```

**Verify:** Dashboard > Database > Replication → `concierge_drafts` should be listed

---

## Step 3: Deploy Edge Function (1 minute)

```bash
# Deploy the submission handler
npx supabase functions deploy submit-concierge-report

# Verify
npx supabase functions list
# Should show: submit-concierge-report
```

---

## Step 4: Set Up Test User (30 seconds)

Run in Supabase SQL Editor:

```sql
-- Ensure your test user has concierge role
-- Replace 'your-user-id' with your actual user UUID
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'concierge')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Step 5: Start Frontend (30 seconds)

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:5173 (or your dev URL)
```

---

## Step 6: Test Basic Functionality (1 minute)

### Quick Test Checklist

1. **Navigate to form:**
   - Dashboard → Shift Report

2. **Test auto-save:**
   - Type in "Staff Name" field
   - Wait 2 seconds
   - See "Saved [time]" badge ✅

3. **Test form sections:**
   - Add member feedback ✅
   - Add facility issue ✅
   - Fill management notes ✅

4. **Test submission:**
   - Click "Submit Report"
   - See success toast ✅
   - Form becomes read-only ✅

---

## 🎉 You're Done!

The system is now running. For advanced testing, see:

- **Full Test Suite:** [`CONCIERGE_SYSTEM_TESTS.md`](CONCIERGE_SYSTEM_TESTS.md)
- **Deployment Guide:** [`CONCIERGE_SYSTEM_DEPLOYMENT.md`](CONCIERGE_SYSTEM_DEPLOYMENT.md)
- **Architecture:** [`CONCIERGE_ARCHITECTURE.md`](CONCIERGE_ARCHITECTURE.md)

---

## Quick Testing Scenarios

### Test Real-Time Collaboration

1. Open shift report in two browser windows
2. See "1 other person is editing" banner
3. Type in one window
4. See updates in other window ✅

### Test Offline Mode

1. Open DevTools → Network tab
2. Select "Offline" throttling
3. Continue editing
4. See "Offline (X queued)" badge
5. Re-enable network
6. See "Sync complete" toast ✅

### Test Auto-Submit

1. Set computer time to shift end + 15 minutes:
   - Weekday AM: 1:45 PM PST
   - Weekday PM: 9:20 PM PST
   - Weekend AM: 1:15 PM PST
   - Weekend PM: 7:15 PM PST
2. Fill form with content
3. See countdown badge
4. Wait for auto-submit ✅

---

## Troubleshooting

### Issue: "Failed to save"

**Fix:**
```bash
# Check RLS policies
npx supabase db remote commit
```

### Issue: "Function not found"

**Fix:**
```bash
# Redeploy function
npx supabase functions deploy submit-concierge-report
```

### Issue: No auto-save badge

**Fix:**
- Check browser console for errors
- Verify network tab shows successful PATCH to `concierge_drafts`
- Check Supabase logs

### Issue: Realtime not working

**Fix:**
```sql
-- Re-enable Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE concierge_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;
```

---

## Common Development Commands

```bash
# Start local Supabase
npx supabase start

# View database
npx supabase db remote commit

# View Edge Function logs
npx supabase functions logs submit-concierge-report

# Run TypeScript check
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build
```

---

## Data Verification Queries

### Check if drafts are saving:

```sql
SELECT report_date, shift_time, version, last_updated_by, updated_at 
FROM concierge_drafts 
ORDER BY updated_at DESC 
LIMIT 5;
```

### Check submitted reports:

```sql
SELECT report_date, shift_type, staff_name, status, submitted_at 
FROM daily_report_history 
WHERE status = 'submitted' 
ORDER BY submitted_at DESC 
LIMIT 5;
```

### Check tracker tables:

```sql
-- Celebratory events
SELECT * FROM celebratory_events 
WHERE reported_date >= CURRENT_DATE - 7;

-- Open facility issues
SELECT * FROM facility_issues_tracker 
WHERE status = 'open';

-- Unresolved questions
SELECT * FROM foh_questions 
WHERE resolved = false;
```

---

## Performance Monitoring

### Check form load performance:

1. Open DevTools → Network tab
2. Reload shift report page
3. Look for:
   - `concierge_drafts` query: < 500ms
   - `sling-api` call: < 1000ms
   - `arketa_reservations` query: < 500ms
   - Total page load: < 2 seconds

### Check auto-save performance:

1. Type in field
2. Open DevTools → Network tab
3. Wait for auto-save
4. Look for PATCH to `concierge_drafts`: < 300ms

---

## Environment Variables

Required in `.env` or deployment platform:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge Function environment (set in Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All migrations applied and verified
- [ ] Realtime enabled on `concierge_drafts`
- [ ] Edge Function deployed and tested
- [ ] Test user can create/submit reports
- [ ] Real-time collaboration tested
- [ ] Offline mode tested
- [ ] Auto-submit tested (or schedule for later)
- [ ] Performance metrics acceptable (< 2s load time)
- [ ] No console errors in production build
- [ ] RLS policies verified (concierges can only access their data)
- [ ] Backup/recovery plan in place

---

## Need Help?

1. **Check Documentation:**
   - [`CONCIERGE_IMPLEMENTATION_SUMMARY.md`](CONCIERGE_IMPLEMENTATION_SUMMARY.md)
   - [`CONCIERGE_SYSTEM_DEPLOYMENT.md`](CONCIERGE_SYSTEM_DEPLOYMENT.md)
   - [`CONCIERGE_SYSTEM_TESTS.md`](CONCIERGE_SYSTEM_TESTS.md)

2. **Check Logs:**
   - Browser console (F12)
   - Supabase Dashboard → Logs
   - Edge Function logs: `npx supabase functions logs submit-concierge-report`

3. **Common Issues:**
   - See troubleshooting section above
   - Check [`CONCIERGE_SYSTEM_DEPLOYMENT.md`](CONCIERGE_SYSTEM_DEPLOYMENT.md) troubleshooting section

---

## What's Next?

After basic setup works:

1. **Run Full Test Suite**
   - Follow [`CONCIERGE_SYSTEM_TESTS.md`](CONCIERGE_SYSTEM_TESTS.md)
   - Test all 40+ scenarios
   - Document results

2. **Deploy to Staging**
   - Apply same steps on staging environment
   - Have real users test for 1 week
   - Gather feedback

3. **Production Rollout**
   - Deploy with monitoring
   - Watch first 48 hours closely
   - Iterate based on feedback

4. **Future Enhancements**
   - Photo uploads
   - Calendly integration
   - Push notifications
   - Analytics dashboard

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Status:** ✅ Production Ready

Happy reporting! 🎉

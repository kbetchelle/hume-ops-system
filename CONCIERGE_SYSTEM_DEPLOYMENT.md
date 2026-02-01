# Concierge Shift Report System - Deployment Guide

## Overview

The Concierge Shift Report System has been completely rebuilt with real-time collaboration, auto-save, offline support, and automatic submission features.

## System Architecture

### Three-Layer Synchronization
1. **Postgres Realtime** - Database-level change detection
2. **Broadcast Channels** - Client-to-client messaging for instant updates  
3. **Presence API** - Live tracking of active editors

### Key Features
- ✅ Auto-save drafts every 1.5 seconds
- ✅ Real-time collaboration with conflict resolution
- ✅ Offline mode with IndexedDB queue
- ✅ Auto-submit 15 minutes after shift end
- ✅ Active editor presence tracking
- ✅ Version-based conflict detection
- ✅ Sling API integration for staff names
- ✅ Arketa check-ins display

## Database Schema

### New Tables Created
1. **`concierge_drafts`** - Auto-save working copies
2. **`celebratory_events`** - Birthday/anniversary tracker
3. **`facility_issues_tracker`** - Maintenance issues with 48-hour deduplication
4. **`foh_questions`** - System issues and questions for management

### Modified Tables
- **`daily_report_history`** - Added N/A flags and screenshot field

## Deployment Steps

### 1. Apply Database Migrations

```bash
# Push migrations to remote database
npx supabase db push

# Verify migrations applied successfully
npx supabase migration list
```

The following migrations will be applied:
- `20260131174712_create_concierge_drafts.sql`
- `20260131174713_create_concierge_helpers.sql`
- `20260131174714_expand_daily_report_history.sql`

### 2. Deploy Edge Function

```bash
# Deploy the submit-concierge-report function
npx supabase functions deploy submit-concierge-report

# Verify deployment
npx supabase functions list
```

### 3. Enable Realtime on Tables

Ensure Realtime is enabled for the `concierge_drafts` table:

```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE concierge_drafts;
```

### 4. Verify RLS Policies

Check that Row Level Security policies are active:

```sql
-- Verify concierge_drafts policies
SELECT * FROM pg_policies WHERE tablename = 'concierge_drafts';

-- Verify helper tables policies
SELECT * FROM pg_policies WHERE tablename IN (
  'celebratory_events', 
  'facility_issues_tracker', 
  'foh_questions'
);
```

### 5. Frontend Deployment

The frontend changes are already in place:
- ✅ `ConciergeForm.tsx` - New comprehensive form
- ✅ All custom hooks implemented
- ✅ All UI components created
- ✅ Dashboard updated to use new form

Simply deploy the frontend:

```bash
# Build and deploy
npm run build

# Or if using a deployment platform, push to git
git add .
git commit -m "Deploy Concierge Shift Report System v2"
git push
```

## Testing Checklist

### Local Testing (Before Deployment)

#### 1. Auto-Save Functionality
- [ ] Open form and type in any field
- [ ] Wait 1.5 seconds
- [ ] Verify "Saved [time]" badge appears
- [ ] Check `concierge_drafts` table has a record
- [ ] Close tab and reopen - data should persist

#### 2. Real-Time Collaboration
- [ ] Open form in two browser tabs (same date/shift)
- [ ] See "1 other person is editing" banner
- [ ] Type in one tab
- [ ] Other tab should receive updates via Realtime
- [ ] Verify no duplicate entries in database

#### 3. Conflict Resolution
- [ ] Open form in two tabs
- [ ] Make different changes in each tab
- [ ] Wait for save in both
- [ ] Conflict modal should appear
- [ ] Test "Accept Remote" and "Keep Local" buttons
- [ ] Verify correct version is saved

#### 4. Offline Mode
- [ ] Open form and make changes
- [ ] Disable network (DevTools > Network > Offline)
- [ ] Make more changes
- [ ] Verify "Offline (X queued)" badge appears
- [ ] Re-enable network
- [ ] Changes should sync automatically

#### 5. Auto-Submit
- [ ] Set system time to 15 minutes after shift end
  - Weekday AM: 1:45 PM
  - Weekday PM: 9:20 PM
  - Weekend AM: 1:15 PM
  - Weekend PM: 7:15 PM
- [ ] Open form with meaningful content
- [ ] Wait for countdown badge to appear
- [ ] Report should auto-submit when countdown reaches 0
- [ ] Draft should be deleted from `concierge_drafts`
- [ ] Report should appear in `daily_report_history`

#### 6. Sling API Integration
- [ ] Open form for today's shift
- [ ] Staff name should auto-populate
- [ ] Verify name matches Sling schedule

#### 7. Arketa Check-ins Display
- [ ] Open form for a shift with check-ins
- [ ] Blue info banner should show check-in count
- [ ] Verify count matches `arketa_reservations` table

#### 8. Form Submission
- [ ] Fill out all sections
- [ ] Click "Submit Report"
- [ ] Verify success toast
- [ ] Check `daily_report_history` for new record
- [ ] Verify cascaded to tracker tables:
  - `celebratory_events`
  - `facility_issues_tracker`
  - `foh_questions`
- [ ] Draft should be deleted from `concierge_drafts`

### Multi-User Testing (Post-Deployment)

#### Test with Real Users
1. **Two Concierges Edit Simultaneously**
   - Have two concierges open the same shift report
   - Both should see each other in the active editors banner
   - Changes should sync in real-time
   - Test conflict resolution when editing same fields

2. **Mobile + Desktop**
   - Same user opens form on phone and laptop
   - Changes on one device appear on the other
   - Test offline on mobile, then reconnect

3. **Shift Handoff**
   - AM shift concierge starts filling out form
   - PM shift concierge continues editing later
   - Both should see previous work
   - No data loss or duplication

## Monitoring

### Key Metrics to Track

1. **Database Performance**
   ```sql
   -- Check draft table size
   SELECT COUNT(*) FROM concierge_drafts;
   
   -- Check version increments (high = many edits)
   SELECT report_date, shift_time, version 
   FROM concierge_drafts 
   ORDER BY version DESC 
   LIMIT 10;
   
   -- Check tracker tables
   SELECT COUNT(*) FROM celebratory_events WHERE reported_date >= CURRENT_DATE - 7;
   SELECT COUNT(*) FROM facility_issues_tracker WHERE status = 'open';
   SELECT COUNT(*) FROM foh_questions WHERE resolved = false;
   ```

2. **Edge Function Logs**
   ```bash
   # View recent function invocations
   npx supabase functions logs submit-concierge-report
   ```

3. **Realtime Connections**
   - Check Supabase Dashboard > Realtime Inspector
   - Monitor active channels: `presence-*`, `broadcast-*`, `draft-*`

## Troubleshooting

### Issue: Drafts not saving
**Solution:**
- Check browser console for errors
- Verify RLS policies allow concierge role to write
- Check Supabase logs for auth failures

### Issue: Auto-submit not triggering
**Solution:**
- Verify PST timezone calculation is correct
- Check shift end times in `useAutoSubmitConcierge.ts`
- Ensure form has meaningful content (check `hasMeaningfulContent` function)

### Issue: Conflict modal appears constantly
**Solution:**
- Check if multiple devices/tabs are open for same user
- Verify session ID generation is working
- Check Realtime subscription is filtering by session

### Issue: Offline queue not syncing
**Solution:**
- Check browser IndexedDB permissions
- Verify `useOfflineQueue` is processing queue on reconnect
- Check browser console for IndexedDB errors

### Issue: Active editors not showing
**Solution:**
- Check Presence channel subscription
- Verify user metadata has name/email
- Check Supabase Realtime is enabled

## Rollback Plan

If issues arise, rollback by:

1. **Revert Frontend**
   ```bash
   # Restore old component
   git revert <commit-hash>
   git push
   ```

2. **Database Tables Remain**
   - Keep new tables for future use
   - Old `daily_report_history` structure is compatible

3. **Edge Function**
   - Old manual submission flow still works
   - New function only called by new form

## Performance Optimization

### Recommended Settings

1. **Postgres Connection Pooling**
   - Set `pool_size` appropriately for concurrent users
   - Monitor connection count during peak hours

2. **Realtime Rate Limiting**
   - Default settings should handle 10-20 concurrent editors
   - Adjust if seeing throttling warnings

3. **IndexedDB Cleanup**
   - Implement periodic cleanup of old offline queue items
   - Currently set to max 3 retries per operation

## Security Considerations

### RLS Policies Active
- ✅ Concierges can only read/write their own shifts
- ✅ Managers can view all drafts
- ✅ Tracker tables have proper access control

### Data Validation
- ✅ Edge function validates auth tokens
- ✅ TypeScript types enforce data structure
- ✅ Conflict resolution prevents data corruption

### Privacy
- ✅ Session IDs are ephemeral (not stored)
- ✅ User presence data is cleared on disconnect
- ✅ Offline queue is client-side only

## Next Steps

### Phase 2 Enhancements (Future)
- [ ] Photo upload for facility issues
- [ ] Calendly integration for tours
- [ ] Push notifications for auto-submit warnings
- [ ] Advanced diff view in conflict modal
- [ ] Export reports to PDF
- [ ] Analytics dashboard for management

## Support

For issues or questions:
1. Check Supabase logs first
2. Review browser console errors
3. Check this deployment guide
4. Contact system administrator

---

**Deployment Date:** January 31, 2026  
**Version:** 2.0  
**Status:** ✅ Ready for Production

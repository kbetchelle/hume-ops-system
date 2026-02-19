# End-to-End Integration Test Checklist

Use this checklist to verify messaging, push notifications, Notification Control Center, and class-end triggers. Run through each scenario and confirm it works.

---

## MESSAGING

- [ ] Send 1:1 message → recipient sees it in real-time
- [ ] Send message with Notify checked → recipient gets push notification AND in-app notification
- [ ] Optimistic UI: message appears instantly with clock icon, transitions to delivered
- [ ] Send urgent message → amber ring on conversation + ⚠️ icon
- [ ] Create custom group → send group message → all members receive
- [ ] Send to role group (All Concierge) → all concierge users receive
- [ ] Save draft → resume draft → send from draft
- [ ] Schedule message 2 min in future → confirm delivery after 2 min
- [ ] Archive conversation → moves to archived → unarchive → returns
- [ ] Mobile swipe-to-archive works
- [ ] Global search finds messages across all conversations
- [ ] Edit message within 12h → shows "edited" label
- [ ] Delete message within 12h → removed
- [ ] Emoji reactions real-time sync between users
- [ ] Read receipts: sending → delivered → read
- [ ] Unread badge on Messages nav updates in real-time
- [ ] Deep-link via /dashboard/messages?messageId=X opens correct conversation

---

## PUSH NOTIFICATIONS

- [ ] Enable push toggle → browser permission prompt → subscription saved
- [ ] Disable push toggle → subscription removed
- [ ] Receive push when app is in background/closed
- [ ] Click push notification → app focuses/opens and navigates correctly

---

## NOTIFICATION CONTROL CENTER

- [ ] Create event trigger → appears in list → toggle active/inactive
- [ ] View notification history → resend → mark as failed
- [ ] Staff push status shows correct subscription state per staff
- [ ] Send test push to individual staff from push status tab
- [ ] Schedule sync generates triggers from today's classes
- [ ] Class type mappings correctly categorize classes

---

## CLASS-END TRIGGERS

- [ ] check-mat-cleaning cron fires and sends notification at class end time
- [ ] Deduplication prevents duplicate notifications within 60 min
- [ ] filterByWorking only notifies on-shift staff

---

## Type regeneration (Prompt 27)

After schema changes (e.g. new tables `notification_triggers`, `class_type_mappings`, `notification_history`, `staff_push_subscriptions`), regenerate Supabase types:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Requires a running local Supabase stack (`supabase start`). After regeneration, TypeScript compilation should succeed with zero errors and new table types should be importable.

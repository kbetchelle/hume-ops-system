-- Seed historical weekly updates from arketa-gym-flow
-- These are imported from the weekly_updates table export

INSERT INTO public.staff_announcements (
  id,
  title,
  content,
  announcement_type,
  priority,
  target_departments,
  week_start_date,
  photo_url,
  expires_at,
  scheduled_at,
  is_active,
  created_by,
  created_by_id,
  created_at
) VALUES
-- Weekly Updates - 12/5/25
(
  'cf640abb-f12f-4b93-8263-05f0d6d003f4',
  'Weekly Updates - 12/5/25',
  E'SAUNA & STEAM ROOM:\nThere is a new change to the sauna and steam room policy–the steam room is going to be programmed 15 minutes before close instead of 30 mins. Members are now allowed to stay in both spaces until 15 minutes before close.\n\nVENN DIAGRAM FOR CC''S:\nThere is a new chart for who to CC/ forward emails to. It can be found in the master email templates. Please check before forwarding because many more things are being sent to Abbey and Roger than needed. Please use the events form template when anyone inquires about a photoshoot/ space rental/ event.\n\nNEW PAYMENT TERMINAL:\nWe now have a tap to pay option! The tap to pay terminal will live at the front desk. For members, proceed as usual and then select "send to payment terminal" → select Payment Terminal → send to payment terminal again and then tap to pay. You can email receipts the same way you normally do.\n\nFor non members, click the "New Sale" button that lives above the "Home" button in the top left corner of arketa. Once selected, click "create a walk in sale" under "search client". The terminal will need to stay charged, so please keep an eye on it.\n\nNEW MEMBER & GUEST POLICY CARDS:\nThese need to be given out every time there is a guest and every time there is a new member. There are backups in the cabinet behind the desk.\n\nNEW MAT CLEANING LOCATION:\nThe office is officially gone. The new mat cleaning spot is now in the garage next to where the break room will be (far left corner of the garage, past the huge towel bins).\n\nNEW DATABASE:\nI have created a new database! This is a way to consolidate the many forms we have into one spot. This will now be filled out instead of the daily reports apply, will let them know when a spot opens up.',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-12-01',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),

-- Weekly Updates - 12/2/25
(
  'd12e6cc0-eb36-4055-b7c3-b008405b2a06',
  'Weekly Updates - 12/2/25',
  E'NEW TEMPLATES:\nThere are new templates for the following:\n1. If a brand or someone in the industry wants to come see the space (it is a polite no)\n2. If people complain about the pause policy/ billing cycle\n3. For questions/ complaints regarding the upcoming holiday/ renovation closure\n\nAll can be found in the master email templates doc. For context: we currently have many people on our waitlist, which means we are able to enforce our policies and risk the cancellations. We will not be offering exemptions 99% of the time.\n\nAPPOINTMENT AVAILABILITY LINK:\nYou can send links to view appointment availability. This will be helpful if someone is like "I want to book a massage next week. When is available?". I added the links to the important links page.\n\nTEMPORARY PASSES REMINDER:\nReminder on day passes and temporary passes: you can still send an application for temporary passes or day passes when people inquire. However, please know that our day passes/ temp memberships now require member referral and a week''s notice. Since we are at capacity, Roger is approving all temporary passes.\n\nPAUSE/ CANCELLATION IN DAILY NOTES:\nPlease do not add just a name under the "pause/ cancellation" section. Add full name, whether they are pausing or canceling, and the reason.\n\nCAPACITY & NEW MEMBERS:\nWhen I say we are "at capacity", this means we are not increasing the number of members that we have. However, we are still accepting new members when spots become available.',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-12-01',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),

-- Weekly Updates - 11/21/25
(
  'b752fcd2-d469-4d3c-8bdc-1be9b595e165',
  'Weekly Updates - 11/21/25',
  E'SWAPPING CLASSES:\nThe members are trying to get sneaky by asking us to swap them out of one class and into another to avoid the late cancel fees.\n\nSwapping Class - 1st Time Request:\nThank you for reaching out! We are able to facilitate the switch as a one-time courtesy. In the future, to switch classes, please first cancel the class you are currently signed up for through the app.\n\nSwapping Class - Repeated Request:\nThank you for reaching out! To switch classes, please cancel the class you are currently signed up for through the app.\n\nNEW STUDIO:\nThe new HIIT studio will have 8 treadmills and boxing bags. Please don''t mention classes or other programming in there to members yet.\n\nDAILY NOTES - CANCELLATIONS/ PAUSES:\nPlease don''t just put someone''s name in the "cancellation/ pause" section with no additional information. Please add if they paused or cancelled with the reason why.\n\nCANCELLING AN APPLICATION:\nIf someone wants to cancel their application and they have already given CC, you must cancel their "trial membership".\n\nEARLY CLOSURE:\nWe will be closed for thanksgiving next Thursday and we close early on Wednesday at 1:30 PM.\n\nARKETA INBOX:\nThe arketa inbox has been a little neglected. Please be sure to close out a conversation once it has been answered.\n\nDAY PASSES/ SERVICES AVAILABLE TO NON MEMBERS:\nWe are no longer selling day passes or temporary memberships to randoms. To purchase a day pass, use a service, or get a temp membership, the person must fill out the temp pass application at least one week before their intended visit with a member referral.',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-11-17',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),

-- Weekly Updates - 11/14/25
(
  '65d67a4c-074c-4e80-a9fe-dbf8182791f9',
  'Weekly Updates - 11/14/25',
  E'CAPACITY:\nWe are aware capacity is an issue and have capped membership. If someone complains, please ask them what space was full, what time, etc.\n\nGOODBYE BELLA:\nOur beautiful Bella has moved on from HUME. Dustin is now our Events and Partnerships Lead. Abbey will be continuing her social media/ content role at a greater capacity.\n\nCONCERNS/ QUESTIONS TRACKER:\nRemember to please add your questions/ concerns in the tracker instead of just in notes!\n\nTARP FOLDING:\nPlease fold tarps after uncovering the machines in the morning and drape them over the railings.\n\nCLOCKING OUT:\nDo not clock in before you are in the facilities. Clock out when you leave the facilities.\n\nBREAKS:\nWeekday AM - clock out for break by 10:20 at the LATEST\nWeekday PM - clock out for break by 6:20 at the LATEST\nWeekend AM - clock out for break by 11:20 at the LATEST\nWeekend PM - 5:50 at the LATEST\n\nLOST AND FOUND:\nIt is in the old staff closet. Please do not let that closet get messy.\n\nOSEA LAUNCH:\nWe are now selling OSEA retail! All products are in arketa. There is an OSEA product reference page on our important links.',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-11-10',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),

-- Weekly Updates - 10/24/25
(
  '32dd183b-4742-466b-ada4-be8185672df5',
  'Weekly Updates - 10/24/25',
  E'PRICING REMINDER:\nThe new membership price is $450, not $495. The new annual rate is $4,595 (no initiation).\n\nPOLICY CARDS:\nReminder to please give out policy cards to guests, day pass holders, and new members!\n\nMASTERCARD:\nIf someone reaches out inquiring about Mastercard, please give them my email and let them know I am happy to help.\n\nPOTENTIAL MEMBERS ASKING FOR OLD PRICING:\nUnless someone has already put in CC info for Phase 2 pricing, they cannot get Phase 2 pricing. There is 0.1% room for negotiation.\n\nHBOT BEING LEFT ON:\nThe HBOT keeps being left on. Even if the member prefers to let themselves out, please remember to turn the HBOT off afterward and remake the sheets.\n\nNEW MASTER EMAIL GUIDE & OUTLOOK FOLDER:\nDustin has put together a new Master Email Templates guide! It is beautiful and should be fully up to date.\n\nPAUSE CHART:\nRoger still wants us to track all pause requests. Please remember to update it!\n\nCANCELLATIONS:\nReminder to always get a reason before confirming a cancellation!\n\nTRAINER/ INSTRUCTOR AVAIL:\nThere is now a document that has the general availability of our instructors and trainers on the important links page.',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-10-20',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),

-- WEEKLY UPDATES 12-12-25
(
  '1b3edfaf-6d9d-4550-a294-a9b41fd3a54b',
  'WEEKLY UPDATES 12-12-25',
  E'GOODBYE JOLT:\nWe have a new app! It is built by me and we will be trialing it out over the next several weeks. Here are download directions:\nPaste the link below into the web browser of your choice & follow directions to install on your home screen. I named mine "Staff Portal" but choose whatever. LINK: arketa-gym-flow.lovable.app/install\nLogin with your pin (the last 4 digits of your phone number)\nThe "Since You''ve Been Gone" notification will pop up with any unread messages and alerts.\nClick "Open Checklist" to see the list for the day. It is the same as jolt, but has music reset and mat cleaning times at the top. Pictures have been glitchy. Let me know if it doesn''t work!\n\nCAPACITY LANGUAGE:\nReminder we are not telling any prospective members that we "are not accepting new members". We still are, just on a very limited capacity and only when spots open. We are once again selling day/ temp passes, so please have people fill them out. I receive all apps and review with roger weekly.\n\nBLAKE GUESTS:\nBlake gets one guest pass per week for classes (not including his partner, Lea, who must be both checked in and signed up for class). Blake will text the desk the name and email of the guest. The guest must be checked in, given the policy handout, and added to class. They should not be late and Blake should meet them at the desk. There should NEVER be more than 21 mats for any of Blake''s classes. Please let me know if you have questions!\n\nCLASSES IN NEW IMPACT ROOM:\nTBD on this. If people ask, please tell them we are still trialing programing but are excited to be offering private sessions\n\nMOVIE NIGHT - 12/19\nWe are having a movie night for members next Friday on the rooftop. Tickets are $25 and must be reserved in advance. There will be goodie bags. Staff can buy tickets day-of. We are showing Elf.\n\nCLOSURE LANGUAGE & EMAILS:\nIf someone complains about the closure over email, still respond with the usual templates but forward to me for visibility. I will take over the thread if they push back after initial response. If people complain at the desk, please explain why we are closing (can use language from the template). If they still really press back, have them email the desk/ me\n\nMEMBERSHIP PAUSES & FEES:\nPlease remember to actually charge people the pause fee. It needs to be added as a membership and set to start the date their membership is set to pause. Also, we are no longer requiring 7 days advance notice before their billing cycle but we will not refund for billing dates already passed. The following circumstances are exempted from paying but still need to align with billing cycles: illness, injury, pregnancy or maternity/ paternity leave, emergency\n\nMEMBERSHIP ACTIVATIONS:\nBig change! We are now activating/ charging memberships at the desk. In the past, new members were charged both initiation and first month/ annual when they received the "Welcome to HUME" email. Now, new members will be charged initiation beforehand but their memberships will not be activated until their first visit. This is also true for annual members, who will be charged in full at the desk (they do not pay initiation)\n\nTo show you read this, please send me a screenshot of the homepage of the new app! Bonus if you tell me what you want for christmas/ a general gift (i wanted more vuori)',
  'weekly_update',
  'normal',
  NULL, -- all departments
  '2025-12-12',
  NULL,
  NULL,
  NULL,
  true,
  'Jillian Brenner',
  NULL,
  '2025-12-12 21:17:00.143917+00'
),

-- 1/16/26
(
  'a69fe6f7-7b79-4015-a0c1-601f5c821f1b',
  '1/16/26',
  E'DATABASE LINK:\nI will now be referring to the database as the "OS", short for Operations System. Kat, Dustin, and Roger have informed me it is not actually a database :/\n\nIf you accidentally x out of the OS, here is the link: https://arketa-gym-flow.lovable.app/\n\nDAY PASS PASSWORD:\nThe template has been updated to include the password for the day pass. We had to include a password because randoms somehow kept buying them. The password is HUME2026\n\nReminder that anyone purchasing a day pass must reach out before purchasing another one. For example, if someone bought a day pass last September and wants to visit in Feb, they must reach out ahead of time. We do not sell day passes at the door. Repeat visitors do not have to fill out the form more than once.\n\nTIME ZONE CLASSES\nFyi that time zone affects class times. If someone is on the east coast, they will see east coast times in the app. If someone is confused about class times seemingly changing, pls ask them if they are out of state\n\nNON-RESIDENT PASS:\nThe 30 day annual pass should only be offered to people who are moving. It is exclusively for non-LA residents\n\nTWO CLASSES IN ONE DAY:\nReminder that we can''t add people to their second class in one day more than 30-1 hour before their second class starts. I know a couple people like to call/ text often to be added. This particularly must be enforced for classes that often fill up or have 2 or less spots left.\n\nGUESTS IN CLASSES:\nI have updated the templates to say that guests can be added to class 30 minutes or less before class start time. I realized there has been some mixed messaging about how long before class members can add guests. Let''s keep our messaging as 30 minutes. That said, if someone shows up in the morning with a guest and wants to sign up for a class in a few hours with their guest, you may make a judgement call (if there is a lot of room in the class) but please let them know it is a one-time courtesy.\n\nRETAIL UPDATE:\nReminder that the osea items in the display are NOT FOR SALE. You MUST only take items from beneath the cabinets. The display items are not part of our retail. Dustin has provided a helpful osea product overview and cabinet supply index that can be found in important links.\n\nCABINET AND LOST AND FOUND UPDATE:\nThe cabinets have been labeled and lost and found has been organized. I will be walking each staff member through the new process in person. If I haven''t shown you by next Friday, pls find me and ask.\n\nCHANGING PAUSE DATES:\nThere seems to be ongoing confusion about to adjust a pause date after it has been set. If someone wants to extend their pause, please select "resume payment collections". The member will then be set to "active". From there, add a new pause date. Members are not automatically charged when you hit "resume payment collection"',
  'weekly_update',
  'normal',
  ARRAY['concierge'], -- FOH = Front of House = Concierge
  '2026-01-16',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2026-01-16 19:54:35.826607+00'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  announcement_type = EXCLUDED.announcement_type,
  priority = EXCLUDED.priority,
  target_departments = EXCLUDED.target_departments,
  week_start_date = EXCLUDED.week_start_date,
  is_active = EXCLUDED.is_active,
  created_by = EXCLUDED.created_by,
  created_at = EXCLUDED.created_at;

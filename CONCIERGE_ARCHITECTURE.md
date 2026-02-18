# Concierge Shift Report System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONCIERGE SHIFT REPORT SYSTEM v2                     │
│                         Real-Time Collaborative Architecture                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │                    ConciergeDashboard.tsx                       │
    │                  (Main Navigation Container)                    │
    └──────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ├─ Home View
                                   ├─ Who's Working
                                   ├─ Announcements
                                   └─ Shift Report ──────────┐
                                                              │
                                                              ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                      ConciergeForm.tsx                           │
    │                   (Main Form Component)                          │
    │                                                                  │
    │  State Management:                                               │
    │  • formData: FormDataType                                        │
    │  • localVersion: number                                          │
    │  • isDirty: boolean                                              │
    │  • isSaving: boolean                                             │
    │  • isSubmitted: boolean                                          │
    │  • arketaCheckIns: array                                         │
    │                                                                  │
    │  Form Sections:                                                  │
    │  ├─ Staff Name (auto from Sling API)                             │
    │  ├─ Arketa Check-ins (read-only display)                         │
    │  ├─ Member Feedback (dynamic array)                              │
    │  ├─ Celebratory Events (dynamic array + N/A)                     │
    │  ├─ Tours Given (dynamic array)                                  │
    │  ├─ Cancel/Pause Requests (dynamic array)                        │
    │  ├─ Facility Issues (dynamic array)                              │
    │  ├─ Busiest Areas (textarea)                                     │
    │  ├─ System Issues (dynamic array + N/A)                          │
    │  ├─ Management Notes (textarea)                                  │
    │  └─ Future Shift Notes (dynamic array + N/A)                     │
    └───────────────┬──────────────────┬───────────────┬───────────────┘
                    │                  │               │
                    ▼                  ▼               ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ ActiveEditorsBar │  │  ConflictModal   │  │ AutoSaveIndicator│
    │                  │  │                  │  │                  │
    │ Shows:           │  │ Shows:           │  │ Shows:           │
    │ • Other users    │  │ • Version #s     │  │ • Saving...      │
    │ • Focused fields │  │ • Differences    │  │ • Saved [time]   │
    │ • User badges    │  │ • Resolution UI  │  │ • Offline (X)    │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
                    │
                    ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    OfflineBanner.tsx                         │
    │    Displays when offline with queue size & retry button      │
    └──────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOM HOOKS LAYER                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐   ┌──────────────────────┐
    │ useEditorPresence    │   │  useBroadcastSync    │
    │                      │   │                      │
    │ • Supabase Presence  │   │ • Broadcast channels │
    │ • Track active users │   │ • Client-to-client   │
    │ • Typing indicators  │   │ • Debounced updates  │
    │ • 3s timeout cleanup │   │ • Message types      │
    │                      │   │                      │
    │ Returns:             │   │ Returns:             │
    │ • activeEditors[]    │   │ • broadcastUpdate()  │
    │ • typingFields       │   │ • broadcastTyping()  │
    │ • broadcastTyping()  │   │ • broadcastSaved()   │
    │ • sessionId          │   │ • requestSync()      │
    └──────────────────────┘   └──────────────────────┘
            │                          │
            └──────────┬───────────────┘
                       │
    ┌──────────────────┴─────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌─────────────────────┐                ┌──────────────────────┐
│ useAutoSubmitCon..  │                │   useOfflineQueue    │
│                     │                │                      │
│ • PST timezone calc │                │ • IndexedDB queue    │
│ • Shift end times   │                │ • Online/offline     │
│ • 15-min delay      │                │ • Auto-sync          │
│ • Content check     │                │ • Beacon API         │
│                     │                │                      │
│ Returns:            │                │ Returns:             │
│ • willAutoSubmit    │                │ • isOnline           │
│ • timeUntilSubmit   │                │ • queueSize          │
│ • formatted time    │                │ • addToQueue()       │
│ • shiftEndTime      │                │ • processQueue()     │
└─────────────────────┘                └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME CHANNELS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    Presence Channel                 Broadcast Channel              Postgres Realtime
    ━━━━━━━━━━━━━━━                 ━━━━━━━━━━━━━━━                ━━━━━━━━━━━━━━━
    presence-{date}-{shift}          broadcast-{date}-{shift}       draft-{date}-{shift}
    
    Purpose:                         Purpose:                       Purpose:
    • Track active editors           • Instant updates              • Database changes
    • Show who's editing             • Client-to-client             • Version conflicts
    • Field focus tracking           • Low-latency sync             • Authoritative source
    
    Data:                            Messages:                      Events:
    • user_id                        • data_updated                 • INSERT
    • user_name                      • user_typing                  • UPDATE
    • session_id                     • user_saved                   • DELETE
    • focused_field                  • request_sync                 
    • online_at                                                     


┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────────┐
    │             Supabase Edge Function: submit-concierge-report     │
    │                                                                 │
    │  POST /functions/v1/submit-concierge-report                    │
    │                                                                 │
    │  Steps:                                                         │
    │  1. Validate auth token                                         │
    │  2. Check user has 'concierge' role                             │
    │  3. Verify no existing submission for this shift                │
    │  4. Insert/update daily_report_history                          │
    │  5. Cascade to tracker tables:                                  │
    │     • celebratory_events                                        │
    │     • facility_issues_tracker (with deduplication)              │
    │     • foh_questions                                             │
    │  6. Delete draft from concierge_drafts                          │
    │  7. Return success { reportId }                                 │
    └────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌────────────────────────────────────────────────────────────────┐
    │                 External API Integrations                       │
    │                                                                 │
    │  Sling API                           Arketa Data                │
    │  ━━━━━━━━━━                          ━━━━━━━━━━                │
    │  GET /sling-api?action=              SELECT * FROM              │
    │      get-foh-shift-staff             arketa_reservations        │
    │                                                                 │
    │  Returns:                            WHERE:                     │
    │  • staffNames[]                      • status = 'checked_in'   │
    │  • shiftType                         • class_time BETWEEN      │
    │  • count                             •   shift_start AND       │
    │                                      •   shift_end              │
    │                                                                 │
    │  Used for:                           Used for:                 │
    │  • Auto-populate staff name          • Display check-in count  │
    │  • Validate scheduled staff          • Show shift activity     │
    └────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    Main Table                       Tracker Tables
    ━━━━━━━━━━                      ━━━━━━━━━━━━━━━

    ┌──────────────────────┐       ┌─────────────────────────┐
    │  concierge_drafts    │       │  celebratory_events     │
    │  ──────────────────  │       │  ─────────────────────  │
    │  id (PK)             │       │  id (PK)                │
    │  report_date         │       │  member_name            │
    │  shift_time          │       │  event_type             │
    │  form_data (JSONB)   │       │  event_date             │
    │  last_updated_by     │       │  reported_date          │
    │  last_updated_by_    │       │  reported_by            │
    │    session           │       │  shift_type             │
    │  version (auto++)    │◄─┐    │  created_at             │
    │  created_at          │  │    └─────────────────────────┘
    │  updated_at          │  │
    │                      │  │    ┌─────────────────────────┐
    │  UNIQUE(report_date, │  │    │ facility_issues_tracker │
    │         shift_time)  │  │    │  ─────────────────────  │
    └──────────────────────┘  │    │  id (PK)                │
             │                │    │  description            │
             │ On Submit      │    │  photo_url              │
             │                │    │  reported_date          │
             ▼                │    │  reported_by            │
    ┌──────────────────────┐ │    │  shift_type             │
    │ daily_report_history │ │    │  status                 │
    │  ──────────────────  │ │    │  resolved_at            │
    │  id (PK)             │ │    │  resolved_by            │
    │  report_date         │ │    │  created_at             │
    │  shift_type          │ │    │  updated_at             │
    │  staff_user_id       │ │    │                         │
    │  staff_name          │ │    │  UNIQUE(description,    │
    │  member_feedback     │ │    │    reported_date)       │
    │  membership_requests │ │    │    WHERE status IN      │
    │  celebratory_events  │ │    │      ('open',           │
    │  tour_notes          │ │    │       'in_progress')    │
    │  facility_issues     │ │    └─────────────────────────┘
    │  busiest_areas       │ │
    │  system_issues       │ │    ┌─────────────────────────┐
    │  management_notes    │ │    │     foh_questions       │
    │  future_shift_notes  │ │    │  ─────────────────────  │
    │  status              │ │    │  id (PK)                │
    │  submitted_at        │ │    │  issue_type             │
    │  celebratory_        │ │    │  description            │
    │    events_na         │ │    │  photo_url              │
    │  system_issues_na    │ │    │  reported_date          │
    │  future_shift_       │ │    │  reported_by            │
    │    notes_na          │ │    │  shift_type             │
    │  screenshot          │ │    │  resolved               │
    └──────────────────────┘ │    │  resolved_at            │
             │               │    │  resolved_by            │
             └───────────────┴────│  resolution_notes       │
                Cascade           │  created_at             │
                                  │  updated_at             │
                                  └─────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      ROW LEVEL SECURITY (RLS)                                │
└─────────────────────────────────────────────────────────────────────────────┘

    Policies Applied to All Tables:
    
    ┌─────────────────────────────────────────────────────────────┐
    │  Concierges:                                                │
    │  • SELECT: All rows (for collaboration)                     │
    │  • INSERT: Own rows only                                    │
    │  • UPDATE: Own rows only                                    │
    │  • DELETE: Own rows only                                    │
    │                                                             │
    │  Managers/Admins:                                           │
    │  • ALL: Full access (SELECT, INSERT, UPDATE, DELETE)       │
    │                                                             │
    │  Public/Unauthenticated:                                    │
    │  • DENY: No access                                          │
    └─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAMS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    AUTO-SAVE FLOW:
    ═══════════════
    
    User types in field
           │
           ▼
    Form state updates (React)
           │
           ▼
    setIsDirty(true)
           │
           ▼
    Debounce 1.5 seconds ─────────────┐
           │                          │
           ▼                          │ User continues typing
    saveDraft() called                │ → Reset debounce timer
           │                          │
           ▼                          │
    UPSERT concierge_drafts ◄─────────┘
           │
           ├─ Success ──────────────┐
           │                        │
           ▼                        ▼
    setLastSaved(now)      broadcastUpdate()
           │                        │
           ▼                        ▼
    Auto-save badge         Other clients notified
    shows "Saved [time]"


    CONFLICT RESOLUTION FLOW:
    ══════════════════════════

    User A: Local version = 3        User B: Local version = 3
           │                                 │
           ├─ Edits field A                 ├─ Edits field A (different)
           ▼                                 ▼
    Auto-save triggered              Auto-save triggered
           │                                 │
           ▼                                 ▼
    UPSERT (version = 4)             UPSERT attempts
           │                                 │
           │                                 ▼
           │                          Remote version (4) > Local (3)
           │                                 │
           │                                 ▼
           │                          Postgres Realtime event
           │                                 │
           │                                 ▼
           │                          handleDatabaseChange()
           │                                 │
           │                                 ▼
           │                          isDirty = true (local edits)
           │                                 │
           │                                 ▼
           │                          Show ConflictModal
           │                                 │
           │                        ┌────────┴────────┐
           │                        ▼                 ▼
           │                  Accept Remote     Keep Local
           │                        │                 │
           │                        ▼                 ▼
           │                  Load remote      Force save local
           │                  Set version=4    Create version=5
           │                        │                 │
           └────────────────────────┴─────────────────┘
                                    │
                                    ▼
                            Conflict resolved
                            Both users in sync


    OFFLINE → ONLINE FLOW:
    ═══════════════════════

    User is online
           │
           ▼
    Network disconnects
           │
           ▼
    'offline' event detected
           │
           ▼
    setIsOnline(false)
           │
           ▼
    OfflineBanner shown
           │
           ▼
    User continues editing ───────┐
           │                      │
           ▼                      │
    Auto-save attempts fail       │
           │                      │
           ▼                      │
    addToQueue(operation) ◄───────┘
           │
           ▼
    Operation stored in IndexedDB
           │
           ▼
    queueSize++
           │
           ▼
    Network reconnects
           │
           ▼
    'online' event detected
           │
           ▼
    setIsOnline(true)
           │
           ▼
    processQueue() triggered
           │
           ▼
    For each queued operation:
           │
           ├─ Execute operation
           ├─ Remove from queue
           └─ Continue to next
           │
           ▼
    "Sync complete" toast
           │
           ▼
    OfflineBanner hidden


    SUBMIT FLOW:
    ════════════

    User clicks "Submit Report"
           │
           ▼
    Validate: hasMeaningfulContent()
           │
           ├─ No content ──────────┐
           │                       ▼
           │                 Show error toast
           │                 "Cannot submit empty"
           │
           ▼
    Call Edge Function:
    POST /submit-concierge-report
           │
           ▼
    Edge Function validates:
           │
           ├─ Auth token valid?
           ├─ User has 'concierge' role?
           └─ No existing submission?
           │
           ▼
    INSERT daily_report_history
           │
           ▼
    Cascade to tracker tables:
           │
           ├─ celebratory_events
           ├─ facility_issues_tracker
           └─ foh_questions
           │
           ▼
    DELETE concierge_drafts
           │
           ▼
    Return { success: true, reportId }
           │
           ▼
    Frontend:
           │
           ├─ setIsSubmitted(true)
           ├─ Show "Submitted" badge
           └─ Disable all form fields
           │
           ▼
    Success toast shown
           │
           ▼
    Report complete!


┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE METRICS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────┬────────────────┬──────────────┐
    │ Operation                   │ Target         │ Maximum      │
    ├─────────────────────────────┼────────────────┼──────────────┤
    │ Form Initial Load           │ < 2 seconds    │ 3 seconds    │
    │ Auto-Save Latency           │ 1.5-2 seconds  │ 3 seconds    │
    │ Real-Time Update Propagation│ < 1 second     │ 2 seconds    │
    │ Offline Queue Sync          │ < 5 seconds    │ 10 seconds   │
    │ Form Submission             │ < 3 seconds    │ 5 seconds    │
    │ Conflict Detection          │ Immediate      │ 2 seconds    │
    │ Presence Update             │ Immediate      │ 1 second     │
    │ Broadcast Message           │ < 500ms        │ 1 second     │
    └─────────────────────────────┴────────────────┴──────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCALABILITY LIMITS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    Concurrent Editors per Shift:    10-20 comfortable, 50+ possible
    Database Write Rate:              Max 1 write per 1.5s per user
    Realtime Channel Subscriptions:   3 per user (presence, broadcast, postgres)
    IndexedDB Storage:                Unlimited (browser dependent)
    Form Data Size:                   < 1MB typical, 5MB max
    Draft Retention:                  Until submitted or manually deleted


┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERSION HISTORY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    v1.0 (Legacy)
    ────────────
    • Basic form submission
    • No collaboration
    • No auto-save
    • Manual data entry only

    v2.0 (Current) - January 31, 2026
    ──────────────────────────────────
    • Real-time collaboration
    • Auto-save with versioning
    • Offline support
    • Auto-submit capability
    • API integrations (Sling, Arketa)
    • Conflict resolution
    • Tracker tables with deduplication
    • Comprehensive test suite

    Future (v2.1+)
    ──────────────
    • Photo uploads to Supabase Storage
    • Calendly integration for tours
    • Push notifications
    • Advanced diff view
    • PDF export
    • Analytics dashboard
    • Mobile app


═══════════════════════════════════════════════════════════════════════════════
                        END OF ARCHITECTURE DIAGRAM
═══════════════════════════════════════════════════════════════════════════════

For detailed implementation information, see:
• CONCIERGE_IMPLEMENTATION_SUMMARY.md
• CONCIERGE_SYSTEM_DEPLOYMENT.md
• CONCIERGE_SYSTEM_TESTS.md

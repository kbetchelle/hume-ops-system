import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, Send, Save, CheckCircle2, Clock, History, Cloud, RefreshCw, Upload, X } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
'@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEditorPresence } from '@/hooks/useEditorPresence';
import { useBroadcastSync } from '@/hooks/useBroadcastSync';
import { useAutoSubmitConcierge } from '@/hooks/useAutoSubmitConcierge';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useConciergeShiftStaff } from '@/hooks/useConciergeShiftStaff';
import { useCurrentShift } from '@/hooks/useCurrentShift';
import { ActiveEditorsBar } from './ActiveEditorsBar';
import { ConflictModal } from './ConflictModal';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { OfflineBanner } from './OfflineBanner';
import { ScheduledToursDisplay } from './ScheduledToursDisplay';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import type { FormDataType, ConciergeDraft } from '@/types/concierge-form';
import { INITIAL_FORM_DATA, hasMeaningfulContent } from '@/types/concierge-form';

/** Normalize legacy shift_type (morning/afternoon/evening) or AM/PM to 'AM' | 'PM'. Noon cutoff. */
function normalizeShiftType(st: string): 'AM' | 'PM' {
  if (st === 'morning') return 'AM';
  if (st === 'afternoon' || st === 'evening') return 'PM';
  return st === 'AM' || st === 'PM' ? st : 'AM';
}

export function ConciergeForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<FormDataType>(INITIAL_FORM_DATA);
  const [localVersion, setLocalVersion] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<ConciergeDraft | null>(null);
  const [arketaCheckIns, setArketaCheckIns] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportHistory, setReportHistory] = useState<{report_date: string;shift_type: string;staff_name: string | null;status: string | null;submitted_at: string | null;}[]>([]);
  const [notesForShift, setNotesForShift] = useState<{id: string;from: string;text: string;}[]>([]);
  const [photoUploadOpen, setPhotoUploadOpen] = useState<{type: 'facility' | 'system';index: number;} | null>(null);

  // Click-to-edit state for staff names
  const [isEditingStaffName, setIsEditingStaffName] = useState(false);
  const [staffNameWasAutoPopulated, setStaffNameWasAutoPopulated] = useState(false);
  const staffNameInputRef = useRef<HTMLInputElement>(null);

  const reportDate = formData.reportDate;
  const shiftType = formData.shiftTime;

  // Concierge shift staff hook - fetches AM and PM staff names from Sling
  const { staffNames: conciergeStaffNames, shiftBoundaryMinutes } = useConciergeShiftStaff(reportDate, shiftType as 'AM' | 'PM');

  // Current shift hook - uses dynamic boundary from Sling data
  const { currentShift: autoDetectedShift, setShift } = useCurrentShift({
    dynamicBoundaryMinutes: shiftBoundaryMinutes
  });

  // Custom hooks
  const { activeEditors, typingFields, broadcastTyping, sessionId } = useEditorPresence(reportDate, shiftType);
  const { broadcastUpdate, broadcastSaved } = useBroadcastSync({
    reportDate,
    shiftType,
    sessionId,
    onRemoteUpdate: handleRemoteUpdate
  });
  const { isOnline, queueSize, addToQueue, processQueue } = useOfflineQueue();

  // Debounced form data for auto-save
  const [debouncedFormData] = useDebounce(formData, 1500);
  // Track whether the initial user-specific shift lookup has completed
  const [userShiftResolved, setUserShiftResolved] = useState(false);

  // On mount: look up the *current user's* scheduled shift first.
  // Fall back to the wall-clock auto-detected shift only when the user
  // has no shift in staff_shifts for today.
  useEffect(() => {
    let cancelled = false;
    async function resolveUserShift() {
      if (!user?.email) {
        // No user yet – use wall-clock shift as fallback
        setFormData((prev) => ({ ...prev, shiftTime: autoDetectedShift }));
        setUserShiftResolved(true);
        return;
      }
      try {
        // 1. Map email → sling_user_id
        const { data: slingUser } = await supabase.
        from('sling_users').
        select('sling_user_id').
        eq('email', user.email).
        maybeSingle();

        if (slingUser) {
          // 2. Find today's shift for this specific user
          const today = new Date().toISOString().split('T')[0];
          const { data: shift } = (await supabase.
          from('staff_shifts' as any).
          select('shift_start, position').
          eq('sling_user_id', slingUser.sling_user_id).
          eq('schedule_date', today).
          maybeSingle()) as {data: {shift_start: string;position: string;} | null;};

          if (!cancelled && shift?.shift_start) {
            const startHour = new Date(shift.shift_start).getHours();
            const shiftAmPm: 'AM' | 'PM' = startHour < 12 ? 'AM' : 'PM';
            setFormData((prev) => ({ ...prev, shiftTime: shiftAmPm }));
            setShift(shiftAmPm);
            setUserShiftResolved(true);
            return;
          }
        }
      } catch (error) {
        console.error('[ConciergeForm] Failed to fetch user shift:', error);
      }
      // Fallback: no scheduled shift found – use wall-clock detection
      if (!cancelled) {
        setFormData((prev) => ({ ...prev, shiftTime: autoDetectedShift }));
        setUserShiftResolved(true);
      }
    }
    resolveUserShift();
    return () => {cancelled = true;};
  }, [user?.email]);

  // Auto-populate staff names from Sling when shift changes and name is empty or was auto-populated
  useEffect(() => {
    if (conciergeStaffNames.length > 0) {
      const formatted = conciergeStaffNames.map((n) => n.toUpperCase()).join(' + ');
      // Only auto-populate if staff name is empty or was previously auto-populated
      if (!formData.staffName || staffNameWasAutoPopulated) {
        setFormData((prev) => ({ ...prev, staffName: formatted }));
        setStaffNameWasAutoPopulated(true);
      }
    }
  }, [conciergeStaffNames.join(','), shiftType]);

  // Load existing draft or report (wait until user shift is resolved so we
  // load the correct shift's draft on first render)
  useEffect(() => {
    if (userShiftResolved) {
      loadDraft();
    }
  }, [reportDate, shiftType, userShiftResolved]);

  // Auto-save when form changes
  useEffect(() => {
    if (isDirty && !isSubmitted) {
      saveDraft();
    }
  }, [debouncedFormData]);

  // Supabase Realtime subscription for database changes
  useEffect(() => {
    const channel = supabase.
    channel(`draft-${reportDate}-${shiftType}`).
    on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'concierge_drafts',
      filter: `report_date=eq.${reportDate},shift_time=eq.${shiftType}`
    }, handleDatabaseChange).
    subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [reportDate, shiftType, sessionId]);

  // Auto-submit hook
  const { willAutoSubmit, timeUntilSubmitFormatted } = useAutoSubmitConcierge(
    reportDate,
    shiftType,
    formData,
    handleSubmit,
    isSubmitted
  );

  async function loadDraft() {
    try {
      // Check for submitted report first
      const { data: report } = await supabase.
      from('daily_report_history').
      select('*').
      eq('report_date', reportDate).
      eq('shift_type', shiftType).
      maybeSingle();

      if (report && report.status === 'submitted') {
        setIsSubmitted(true);
        // Load read-only data from report
        return;
      }

      // Load draft
      const { data: draft } = await supabase.
      from('concierge_drafts').
      select('*').
      eq('report_date', reportDate).
      eq('shift_time', shiftType).
      maybeSingle();

      if (draft) {
        const loadedFormData = draft.form_data as unknown as FormDataType;
        const shift = loadedFormData.shiftTime;
        setFormData({
          ...loadedFormData,
          shiftTime: normalizeShiftType(shift),
          _sessionId: sessionId
        });
        setLocalVersion(draft.version);
        setLastSaved(new Date(draft.updated_at));
      } else {
        // Staff name will be auto-populated by useConciergeShiftStaff hook
        // Load Arketa check-ins
        fetchArketaCheckIns();
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to load draft:', error);
      toast({
        title: 'Error loading draft',
        description: 'Please refresh the page',
        variant: 'destructive'
      });
    }
  }

  async function fetchArketaCheckIns() {
    try {
      // Calculate shift start and end times
      const shiftDate = new Date(reportDate);
      let startHour = shiftType === 'AM' ? 6 : 14;
      let endHour = shiftType === 'AM' ? 14 : 22;

      // Check if weekend (Saturday = 6, Sunday = 0)
      const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
      if (isWeekend) {
        startHour = shiftType === 'AM' ? 6 : 13;
        endHour = shiftType === 'AM' ? 13 : 19;
      }

      const shiftStart = new Date(shiftDate);
      shiftStart.setHours(startHour, 0, 0, 0);
      const shiftEnd = new Date(shiftDate);
      shiftEnd.setHours(endHour, 0, 0, 0);

      // Reservations only have class_date; use arketa_classes for time range and ordering
      const { data: classes, error: classError } = await supabase.
      from('arketa_classes').
      select('external_id, start_time').
      gte('start_time', shiftStart.toISOString()).
      lte('start_time', shiftEnd.toISOString());

      if (classError) throw classError;
      const classIds = (classes || []).map((c) => c.external_id);
      if (classIds.length === 0) {
        setArketaCheckIns([]);
        return;
      }

      const { data: reservations, error } = await supabase.
      from('arketa_reservations').
      select('*').
      eq('checked_in', true).
      eq('class_date', reportDate).
      in('class_id', classIds);

      if (error) throw error;

      const classStartByExternalId = new Map((classes || []).map((c) => [c.external_id, c.start_time]));
      const sorted = (reservations || []).sort((a, b) => {
        const tA = classStartByExternalId.get(a.class_id) || '';
        const tB = classStartByExternalId.get(b.class_id) || '';
        return tA.localeCompare(tB);
      });
      setArketaCheckIns(sorted);
      console.log('[ConciergeForm] Loaded', sorted.length, 'check-ins from Arketa');
    } catch (error) {
      console.error('[ConciergeForm] Failed to fetch Arketa check-ins:', error);
    }
  }

  async function saveDraft() {
    if (isSaving || isSubmitted) return;

    setIsSaving(true);

    try {
      const draftData = {
        report_date: reportDate,
        shift_time: shiftType,
        form_data: formData as unknown as Record<string, unknown>,
        last_updated_by: user?.email || null,
        last_updated_by_session: sessionId
      };

      if (isOnline) {
        const { data, error } = await supabase.
        from('concierge_drafts').
        upsert(draftData as any, {
          onConflict: 'report_date,shift_time'
        }).
        select().
        single();

        if (error) throw error;

        setLocalVersion(data.version);
        setLastSaved(new Date());
        setIsDirty(false);

        // Broadcast update to other clients
        await broadcastUpdate(formData);
        await broadcastSaved();
      } else {
        // Save draft locally when offline - it will sync when back online
        console.log('[ConciergeForm] Offline - draft saved locally, will sync when online');
        setIsDirty(false);
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to save draft:', error);
      toast({
        title: 'Failed to save',
        description: 'Your changes will be saved when you reconnect',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isSubmittingRef = useRef(false);

  async function handleSubmit() {
    if (isSubmittingRef.current) return;

    if (!hasMeaningfulContent(formData)) {
      toast({
        title: 'Cannot submit empty report',
        description: 'Please add some content before submitting',
        variant: 'destructive'
      });
      return;
    }

    isSubmittingRef.current = true;

    try {
      const payload = {
        report_date: reportDate,
        shift_type: shiftType,
        staff_user_id: user?.id || '',
        staff_name: formData.staffName || user?.user_metadata?.full_name || '',
        member_feedback: formData.memberFeedback as any,
        membership_requests: formData.membershipCancelRequests as any,
        celebratory_events: formData.celebratoryEvents as any,
        scheduled_tours: formData.tours as any,
        tour_notes: formData.tours as any,
        facility_issues: formData.facilityIssues as any,
        busiest_areas: formData.busiestAreas || '',
        system_issues: formData.systemIssues as any,
        management_notes: formData.managementNotes || '',
        future_shift_notes: formData.futureNotes as any,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      // Try upsert based on date + shift
      const { error } = await supabase.
      from('daily_report_history').
      upsert(payload as any, {
        onConflict: 'report_date,shift_type'
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Report submitted',
        description: 'Your shift report has been submitted successfully'
      });
    } catch (error) {
      console.error('[ConciergeForm] Failed to submit:', error);
      toast({
        title: 'Submission failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }

  function handleDatabaseChange(payload: any) {
    const change = payload.new as ConciergeDraft;

    // Ignore changes from same session
    if (change?.last_updated_by_session === sessionId) return;

    // Check for version conflict
    if (change && change.version > localVersion) {
      if (isDirty) {
        // Show conflict modal
        setConflictData(change);
        setShowConflictModal(true);
      } else {
        // Auto-accept remote if no local changes
        setFormData(change.form_data);
        setLocalVersion(change.version);
      }
    }
  }

  function handleRemoteUpdate(data: Partial<FormDataType>) {
    // Handle broadcast updates from other clients
    console.log('[ConciergeForm] Remote update received');
  }

  function handleAcceptRemote() {
    if (conflictData) {
      setFormData(conflictData.form_data);
      setLocalVersion(conflictData.version);
      setIsDirty(false);
      setShowConflictModal(false);
    }
  }

  function handleKeepLocal() {
    setShowConflictModal(false);
    // Force save local version
    saveDraft();
  }

  function updateFormField<K extends keyof FormDataType>(field: K, value: FormDataType[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    broadcastTyping(field as string);
  }

  // Array field handlers
  const addMemberFeedback = () => {
    updateFormField('memberFeedback', [...formData.memberFeedback, { id: crypto.randomUUID(), sentiment: 'neutral', text: '' }]);
  };

  const addFacilityIssue = () => {
    updateFormField('facilityIssues', [...formData.facilityIssues, { id: crypto.randomUUID(), description: '', photoUrl: null }]);
  };

  const addSystemIssue = () => {
    updateFormField('systemIssues', [...formData.systemIssues, { id: crypto.randomUUID(), issueType: '', description: '', photoUrl: null }]);
  };

  const addCelebratoryEvent = () => {
    updateFormField('celebratoryEvents', [...formData.celebratoryEvents, { id: crypto.randomUUID(), memberName: '', eventType: 'birthday', date: '' }]);
  };

  const addTour = () => {
    updateFormField('tours', [...formData.tours, { id: crypto.randomUUID(), name: '', followupCompleted: false }]);
  };

  const addCancelRequest = () => {
    updateFormField('membershipCancelRequests', [...formData.membershipCancelRequests, {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      membershipType: '',
      requestType: 'cancel',
      endDate: ''
    }]);
  };

  const addFutureNote = () => {
    updateFormField('futureNotes', [...formData.futureNotes, {
      id: crypto.randomUUID(),
      targetDate: '',
      targetShift: 'AM',
      note: ''
    }]);
  };

  return (
    <>
      {/* Offline banner */}
      {!isOnline && <OfflineBanner queueSize={queueSize} onRetry={processQueue} />}
      
      {/* Active editors bar */}
      <ActiveEditorsBar editors={activeEditors} />
      
      {/* Conflict resolution modal */}
      <ConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        localData={formData}
        remoteData={conflictData?.form_data || INITIAL_FORM_DATA}
        localVersion={localVersion}
        remoteVersion={conflictData?.version || 0}
        onAcceptRemote={handleAcceptRemote}
        onKeepLocal={handleKeepLocal} />

      
      <Card>
        {/* ── Shift Report Document Header ── */}
        <div className="px-6 pt-6 pb-0 space-y-0">
          {/* Title */}
          


          

          {/* Info row: AM/PM toggle | Date | Staff names */}
          <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
            {/* Left: AM/PM toggle */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  updateFormField('shiftTime', 'AM');
                  setShift('AM');
                  setStaffNameWasAutoPopulated(true);
                }}
                disabled={isSubmitted}
                className={`px-3 py-1.5 text-sm font-medium tracking-wider transition-colors ${
                shiftType === 'AM' ?
                'border border-foreground' :
                'border border-transparent hover:text-foreground/80'}`
                }>

                AM
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFormField('shiftTime', 'PM');
                  setShift('PM');
                  setStaffNameWasAutoPopulated(true);
                }}
                disabled={isSubmitted}
                className={`px-3 py-1.5 text-sm font-medium tracking-wider transition-colors ${
                shiftType === 'PM' ?
                'border border-foreground' :
                'border border-transparent hover:text-foreground/80'}`
                }>

                PM
              </button>
            </div>

            {/* Center: Date */}
            <span className="text-sm font-medium">
              {format(new Date(reportDate + 'T12:00:00'), 'EEEE, MMM d')}
            </span>

            {/* Right: Staff names (click-to-edit) */}
            {isEditingStaffName ?
            <Input
              ref={staffNameInputRef}
              value={formData.staffName}
              onChange={(e) => {
                updateFormField('staffName', e.target.value);
                setStaffNameWasAutoPopulated(false);
              }}
              onBlur={() => setIsEditingStaffName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingStaffName(false);
                }
              }}
              disabled={isSubmitted}
              placeholder="Staff names"
              className="w-48 text-sm text-right"
              autoFocus /> :


            <button
              type="button"
              onClick={() => {
                if (!isSubmitted) {
                  setIsEditingStaffName(true);
                  // Focus input after render
                  setTimeout(() => staffNameInputRef.current?.focus(), 0);
                }
              }}
              className="text-sm font-medium tracking-wider hover:opacity-70 transition-opacity cursor-text"
              title="Click to edit staff names">

                {formData.staffName ?
              formData.staffName.toUpperCase() :
              'No staff scheduled'}
              </button>
            }
          </div>

          {/* Secondary toolbar: History, Save indicator, Auto-submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setHistoryOpen(true);
                  supabase.
                  from('daily_report_history').
                  select('report_date, shift_type, staff_name, status, submitted_at').
                  order('report_date', { ascending: false }).
                  order('shift_type', { ascending: false }).
                  limit(30).
                  then(({ data, error }) => {
                    if (error) {
                      console.error('[ConciergeForm] Failed to load report history:', error);
                      toast({
                        title: 'Could not load history',
                        description: 'Please try again.',
                        variant: 'destructive'
                      });
                      setReportHistory([]);
                      return;
                    }
                    setReportHistory(data ?? []);
                  });
                }}>

                <History className="h-3 w-3 mr-1" />
                History
              </Button>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Cloud className="h-3 w-3" />
                <RefreshCw className="h-3 w-3" />
              </div>
              <AutoSaveIndicator
                isSaving={isSaving}
                lastSaved={lastSaved}
                isDirty={isDirty}
                isOnline={isOnline}
                queueSize={queueSize} />

            </div>
            {willAutoSubmit && timeUntilSubmitFormatted &&
            <Badge variant="secondary" className="gap-1 text-[10px]">
                <Clock className="h-3 w-3" />
                Auto-submit in {timeUntilSubmitFormatted}
              </Badge>
            }
          </div>
        </div>

        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report History</DialogTitle>
              <DialogDescription>View past shift reports</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-2">
                {reportHistory.map((r, i) =>
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, reportDate: r.report_date, shiftTime: normalizeShiftType(r.shift_type) }));
                    setStaffNameWasAutoPopulated(false); // Past date: use saved name
                    setHistoryOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{format(new Date(r.report_date), 'EEE, MMM d, yyyy')}</span>
                      <Badge variant="outline">{normalizeShiftType(r.shift_type)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.staff_name ?? '—'} •{' '}
                      <Badge variant={r.status === 'submitted' ? 'default' : 'secondary'} className="text-[10px]">
                        {r.status ?? 'draft'}
                      </Badge>
                    </p>
                  </button>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        <CardContent className="space-y-6 pt-4">

          {/* Notes for this shift (alert banners) */}
          {notesForShift.length > 0 &&
          <div className="space-y-2">
              <Label className="text-sm">Notes for this shift:</Label>
              {notesForShift.map((note) =>
            <div
              key={note.id}
              className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">

                  <span className="font-medium shrink-0">From {note.from}:</span>
                  <span className="flex-1">{note.text}</span>
                  <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setNotesForShift((prev) => prev.filter((n) => n.id !== note.id))}>

                    <X className="h-4 w-4" />
                  </Button>
                </div>
            )}
            </div>
          }

          <Separator />
        
          {/* Arketa Check-ins Summary (Read-only info) */}
          {arketaCheckIns.length > 0 &&
          <>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Shift Check-ins from Arketa
                  </span>
                  <Badge variant="secondary">{arketaCheckIns.length} total</Badge>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Real-time data showing member check-ins during this shift
                </p>
              </div>
              <Separator />
            </>
          }
          
          {/* MEMBERS — Feedback */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Members</h3>
            <p className="text-sm text-muted-foreground">
              Please report any feedback or issues from members or staff/ general shift notes. For general notes, please select neutral:
            </p>
            {formData.memberFeedback.map((feedback, i) =>
            <div key={feedback.id ?? i} className="flex gap-2">
                <Select
                value={feedback.sentiment}
                onValueChange={(v) => {
                  const updated = [...formData.memberFeedback];
                  updated[i].sentiment = v as any;
                  updateFormField('memberFeedback', updated);
                }}
                disabled={isSubmitted}>

                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Positive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                value={feedback.text}
                onChange={(e) => {
                  const updated = [...formData.memberFeedback];
                  updated[i].text = e.target.value;
                  updateFormField('memberFeedback', updated);
                }}
                disabled={isSubmitted}
                placeholder="Enter feedback or issue"
                className="flex-1" />

                {!isSubmitted &&
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  updateFormField('memberFeedback', formData.memberFeedback.filter((_, idx) => idx !== i));
                }}>

                    <Trash2 className="h-4 w-4" />
                  </Button>
              }
              </div>
            )}
            {!isSubmitted &&
            <Button variant="ghost" size="sm" onClick={addMemberFeedback}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>

          {/* MEMBERS — Cancel/Pause requests */}
          <div className="space-y-3">
            <Label className="text-sm">Were there any requests to cancel or pause membership?</Label>
            {formData.membershipCancelRequests.map((request, i) =>
            <div key={request.id ?? i} className="space-y-2 p-3 border rounded-lg">
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                  value={request.requestType}
                  onValueChange={(v) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].requestType = v as any;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}>

                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Cancel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cancel">Cancel</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                      <SelectItem value="pause">Pause</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                  value={request.name}
                  onChange={(e) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].name = e.target.value;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Name"
                  className="w-40" />

                  <Input
                  value={request.email || ''}
                  onChange={(e) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].email = e.target.value;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Email (optional)"
                  className="w-44" />

                  <Select
                  value={request.reason ?? ''}
                  onValueChange={(v) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].reason = v as any;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}>

                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving">Moving</SelectItem>
                      <SelectItem value="commute">Commute</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="illness">Illness</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                  type="date"
                  value={request.endDate || (request.requestType === 'pause' ? request.pauseEndDate ?? '' : request.endDate ?? '')}
                  onChange={(e) => {
                    const updated = [...formData.membershipCancelRequests];
                    if (updated[i].requestType === 'pause') updated[i].pauseEndDate = e.target.value;else
                    updated[i].endDate = e.target.value;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="End date"
                  className="w-36" />

                  {!isSubmitted &&
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateFormField('membershipCancelRequests', formData.membershipCancelRequests.filter((_, idx) => idx !== i))}>

                      <Trash2 className="h-4 w-4" />
                    </Button>
                }
                </div>
                {request.reason === 'other' &&
              <Input
                value={request.otherReasonText ?? ''}
                onChange={(e) => {
                  const updated = [...formData.membershipCancelRequests];
                  updated[i].otherReasonText = e.target.value;
                  updateFormField('membershipCancelRequests', updated);
                }}
                disabled={isSubmitted}
                placeholder="Specify reason"
                className="max-w-xs" />

              }
                {request.requestType === 'pause' &&
              <div className="flex items-center gap-2">
                    <Checkbox
                  checked={request.paidPause ?? false}
                  onCheckedChange={(c) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].paidPause = !!c;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted} />

                    <span className="text-sm text-muted-foreground">Paid pause</span>
                  </div>
              }
              </div>
            )}
            {!isSubmitted &&
            <Button variant="ghost" size="sm" onClick={addCancelRequest}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>
          
          <Separator />
          
          {/* MEMBERS — Celebratory Events */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Did any members share any celebratory events?</Label>
              <Checkbox
                checked={formData.celebratoryEventsNA}
                onCheckedChange={(checked) => updateFormField('celebratoryEventsNA', !!checked)}
                disabled={isSubmitted} />

              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            <p className="text-xs text-muted-foreground">Add any special/giftable events to tracker.</p>
            {!formData.celebratoryEventsNA && formData.celebratoryEvents.map((event, i) =>
            <div key={event.id ?? i} className="flex flex-wrap gap-2">
                <Input
                value={event.memberName}
                onChange={(e) => {
                  const updated = [...formData.celebratoryEvents];
                  updated[i].memberName = e.target.value;
                  updateFormField('celebratoryEvents', updated);
                }}
                disabled={isSubmitted}
                placeholder="Member name"
                className="w-44" />

                <Select
                value={event.eventType}
                onValueChange={(v) => {
                  const updated = [...formData.celebratoryEvents];
                  updated[i].eventType = v as any;
                  updateFormField('celebratoryEvents', updated);
                }}
                disabled={isSubmitted}>

                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_baby">New Baby</SelectItem>
                    <SelectItem value="new_job">New Job</SelectItem>
                    <SelectItem value="new_house">New House</SelectItem>
                    <SelectItem value="marriage_engagement">Marriage/Engagement</SelectItem>
                    <SelectItem value="personal_accomplishment">Personal Accomplishment</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                value={event.timing ?? ''}
                onValueChange={(v) => {
                  const updated = [...formData.celebratoryEvents];
                  updated[i].timing = v;
                  updateFormField('celebratoryEvents', updated);
                }}
                disabled={isSubmitted}>

                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Upcoming" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                type="date"
                value={event.date || ''}
                onChange={(e) => {
                  const updated = [...formData.celebratoryEvents];
                  updated[i].date = e.target.value;
                  updateFormField('celebratoryEvents', updated);
                }}
                disabled={isSubmitted}
                className="w-36" />

                {!isSubmitted &&
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateFormField('celebratoryEvents', formData.celebratoryEvents.filter((_, idx) => idx !== i))}>

                    <Trash2 className="h-4 w-4" />
                  </Button>
              }
              </div>
            )}
            {!isSubmitted && !formData.celebratoryEventsNA &&
            <Button variant="ghost" size="sm" onClick={addCelebratoryEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>
          
          <Separator />
          
          {/* TOURS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Tours</h3>
            <ScheduledToursDisplay reportDate={reportDate} disabled={isSubmitted} />
            <div className="space-y-3">
              <Label className="text-sm">Did you tour anyone? (Add notes)</Label>
              {formData.tours.map((tour, i) =>
              <div key={tour.id ?? i} className="flex flex-wrap gap-2 items-center">
                  <Input
                  value={tour.name}
                  onChange={(e) => {
                    const updated = [...formData.tours];
                    updated[i].name = e.target.value;
                    updateFormField('tours', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Name"
                  className="w-48" />

                  <div className="flex items-center gap-2">
                    <Checkbox
                    checked={tour.followupCompleted}
                    onCheckedChange={(checked) => {
                      const updated = [...formData.tours];
                      updated[i].followupCompleted = !!checked;
                      updateFormField('tours', updated);
                    }}
                    disabled={isSubmitted} />

                    <span className="text-sm text-muted-foreground whitespace-nowrap">Notes filled out & follow up email sent</span>
                  </div>
                  {!isSubmitted &&
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateFormField('tours', formData.tours.filter((_, idx) => idx !== i))}>

                      <Trash2 className="h-4 w-4" />
                    </Button>
                }
                </div>
              )}
              {!isSubmitted &&
              <Button variant="ghost" size="sm" onClick={addTour}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              }
            </div>
          </div>
          
          <Separator />
          
          {/* FACILITIES */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Facilities</h3>
            <Label className="text-sm">Any facility issues? (maintenance, equipment, etc.)</Label>
            {formData.facilityIssues.map((issue, i) =>
            <div key={issue.id ?? i} className="flex gap-2 items-start">
                <Textarea
                value={issue.description}
                onChange={(e) => {
                  const updated = [...formData.facilityIssues];
                  updated[i].description = e.target.value;
                  updateFormField('facilityIssues', updated);
                }}
                disabled={isSubmitted}
                placeholder="Describe the facility issue"
                rows={2}
                className="flex-1 min-w-0" />

                {!isSubmitted &&
              <>
                    <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhotoUploadOpen({ type: 'facility', index: i })}
                  className="shrink-0 gap-1">

                      <Upload className="h-4 w-4" />
                      Photo
                    </Button>
                    <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateFormField('facilityIssues', formData.facilityIssues.filter((_, idx) => idx !== i))}>

                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
              }
              </div>
            )}
            {!isSubmitted &&
            <Button variant="ghost" size="sm" onClick={addFacilityIssue}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>
          
          <Separator />
          
          {/* Crowd/Space — busiest areas (required) */}
          <div className="space-y-2">
            <Label className="text-sm">What areas of the gym were busiest and when?</Label>
            <Textarea
              value={formData.busiestAreas}
              onChange={(e) => updateFormField('busiestAreas', e.target.value)}
              disabled={isSubmitted}
              placeholder="Describe busy areas and times..."
              rows={3} />

          </div>
          
          <Separator />
          
          {/* System Issues & Questions for Management */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Any issues with Arketa, Jolt, Database, or questions for management</Label>
              <Checkbox
                checked={formData.systemIssuesNA}
                onCheckedChange={(checked) => updateFormField('systemIssuesNA', !!checked)}
                disabled={isSubmitted} />

              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {!formData.systemIssuesNA && formData.systemIssues.map((issue, i) =>
            <div key={issue.id ?? i} className="flex flex-wrap gap-2 items-start">
                <Select
                value={issue.issueType}
                onValueChange={(v) => {
                  const updated = [...formData.systemIssues];
                  updated[i].issueType = v as any;
                  updateFormField('systemIssues', updated);
                }}
                disabled={isSubmitted}>

                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arketa">Arketa</SelectItem>
                    <SelectItem value="jolt">Jolt</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                value={issue.description}
                onChange={(e) => {
                  const updated = [...formData.systemIssues];
                  updated[i].description = e.target.value;
                  updateFormField('systemIssues', updated);
                }}
                disabled={isSubmitted}
                placeholder="Describe the issue..."
                className="flex-1 min-w-[200px]" />

                {!isSubmitted &&
              <>
                    <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhotoUploadOpen({ type: 'system', index: i })}
                  className="shrink-0 gap-1">

                      <Upload className="h-4 w-4" />
                      Photo
                    </Button>
                    <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateFormField('systemIssues', formData.systemIssues.filter((_, idx) => idx !== i))}>

                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
              }
              </div>
            )}
            {!isSubmitted && !formData.systemIssuesNA &&
            <Button variant="ghost" size="sm" onClick={addSystemIssue}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>
          
          <Separator />
          
          {/* Management Notes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Management Notes</h3>
            <Label className="text-sm sr-only">Notes for management eyes only</Label>
            <Textarea
              value={formData.managementNotes}
              onChange={(e) => updateFormField('managementNotes', e.target.value)}
              disabled={isSubmitted}
              placeholder="Notes for management eyes only..."
              rows={4}
              className="resize-y" />

          </div>
          
          <Separator />
          
          {/* Notes for Future Shift */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Notes for Future Shift</h3>
            <p className="text-xs text-muted-foreground">Unfinished tasks, emails etc.</p>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Target shift notes</Label>
              <Checkbox
                checked={formData.futureShiftNotesNA}
                onCheckedChange={(checked) => updateFormField('futureShiftNotesNA', !!checked)}
                disabled={isSubmitted} />

              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {!formData.futureShiftNotesNA && formData.futureNotes.map((note, i) =>
            <div key={note.id ?? i} className="flex flex-wrap gap-2 items-center">
                <Input
                type="date"
                value={note.targetDate}
                onChange={(e) => {
                  const updated = [...formData.futureNotes];
                  updated[i].targetDate = e.target.value;
                  updateFormField('futureNotes', updated);
                }}
                disabled={isSubmitted}
                className="w-36" />

                <Select
                value={note.targetShift}
                onValueChange={(v) => {
                  const updated = [...formData.futureNotes];
                  updated[i].targetShift = v as any;
                  updateFormField('futureNotes', updated);
                }}
                disabled={isSubmitted}>

                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                value={note.note}
                onChange={(e) => {
                  const updated = [...formData.futureNotes];
                  updated[i].note = e.target.value;
                  updateFormField('futureNotes', updated);
                }}
                disabled={isSubmitted}
                placeholder="Enter notes for future shift"
                className="flex-1 min-w-[200px]" />

                {!isSubmitted &&
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateFormField('futureNotes', formData.futureNotes.filter((_, idx) => idx !== i))}>

                    <Trash2 className="h-4 w-4" />
                  </Button>
              }
              </div>
            )}
            {!isSubmitted && !formData.futureShiftNotesNA &&
            <Button variant="ghost" size="sm" onClick={addFutureNote}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            }
          </div>

        </CardContent>
        
        <CardFooter className="flex gap-3 border-t pt-4">
          {!isSubmitted &&
          <>
              <Button
              variant="outline"
              onClick={() => saveDraft()}
              disabled={isSaving || !isDirty}
              className="flex-1">

                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1">

                <Send className="h-4 w-4 mr-2" />
                Submit Shift Report
              </Button>
            </>
          }
        </CardFooter>
      </Card>

      {photoUploadOpen &&
      <PhotoUpload
        isOpen={!!photoUploadOpen}
        onSave={(url) => {
          if (photoUploadOpen.type === 'facility') {
            const updated = [...formData.facilityIssues];
            updated[photoUploadOpen.index] = { ...updated[photoUploadOpen.index], photoUrl: url };
            updateFormField('facilityIssues', updated);
          } else {
            const updated = [...formData.systemIssues];
            updated[photoUploadOpen.index] = { ...updated[photoUploadOpen.index], photoUrl: url };
            updateFormField('systemIssues', updated);
          }
          setPhotoUploadOpen(null);
        }}
        onCancel={() => setPhotoUploadOpen(null)}
        storageBucket="checklist-photos"
        storagePath="concierge-report"
        title={photoUploadOpen.type === 'facility' ? 'Facility issue photo' : 'System issue photo'} />

      }
    </>);

}
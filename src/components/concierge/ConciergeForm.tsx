import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, Send, Save, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEditorPresence } from '@/hooks/useEditorPresence';
import { useBroadcastSync } from '@/hooks/useBroadcastSync';
import { useAutoSubmitConcierge } from '@/hooks/useAutoSubmitConcierge';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { ActiveEditorsBar } from './ActiveEditorsBar';
import { ConflictModal } from './ConflictModal';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { OfflineBanner } from './OfflineBanner';
import type { FormDataType, ConciergeDraft } from '@/types/concierge-form';
import { INITIAL_FORM_DATA, hasMeaningfulContent } from '@/types/concierge-form';

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
  
  const reportDate = formData.reportDate;
  const shiftType = formData.shiftTime;
  
  // Custom hooks
  const { activeEditors, typingFields, broadcastTyping, sessionId } = useEditorPresence(reportDate, shiftType);
  const { broadcastUpdate, broadcastSaved } = useBroadcastSync({
    reportDate,
    shiftType,
    sessionId,
    onRemoteUpdate: handleRemoteUpdate,
  });
  const { isOnline, queueSize, addToQueue, processQueue } = useOfflineQueue();
  
  // Debounced form data for auto-save
  const [debouncedFormData] = useDebounce(formData, 1500);
  
  // Fetch user's shift from staff_shifts on mount
  useEffect(() => {
    fetchUserShift();
  }, [user?.email]);
  
  // Load existing draft or report
  useEffect(() => {
    loadDraft();
  }, [reportDate, shiftType]);
  
  // Auto-save when form changes
  useEffect(() => {
    if (isDirty && !isSubmitted) {
      saveDraft();
    }
  }, [debouncedFormData]);
  
  // Supabase Realtime subscription for database changes
  useEffect(() => {
    const channel = supabase
      .channel(`draft-${reportDate}-${shiftType}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'concierge_drafts',
        filter: `report_date=eq.${reportDate},shift_time=eq.${shiftType}`,
      }, handleDatabaseChange)
      .subscribe();
    
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
      const { data: report } = await supabase
        .from('daily_report_history')
        .select('*')
        .eq('report_date', reportDate)
        .eq('shift_type', shiftType)
        .maybeSingle();
      
      if (report && report.status === 'submitted') {
        setIsSubmitted(true);
        // Load read-only data from report
        return;
      }
      
      // Load draft
      const { data: draft } = await supabase
        .from('concierge_drafts')
        .select('*')
        .eq('report_date', reportDate)
        .eq('shift_time', shiftType)
        .maybeSingle();
      
      if (draft) {
        setFormData({ ...draft.form_data, _sessionId: sessionId });
        setLocalVersion(draft.version);
        setLastSaved(new Date(draft.updated_at));
      } else {
        // Auto-populate staff name from Sling
        fetchStaffName();
        // Load Arketa check-ins
        fetchArketaCheckIns();
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to load draft:', error);
      toast({
        title: 'Error loading draft',
        description: 'Please refresh the page',
        variant: 'destructive',
      });
    }
  }
  
  async function fetchUserShift() {
    try {
      if (!user?.email) return;
      
      // Get sling_user_id for current user
      const { data: slingUser } = await supabase
        .from('sling_users')
        .select('sling_user_id')
        .eq('email', user.email)
        .maybeSingle();
      
      if (!slingUser) return;
      
      // Get today's shift for this user
      const today = new Date().toISOString().split('T')[0];
      const { data: shift } = await supabase
        .from('staff_shifts')
        .select('shift_start, position')
        .eq('sling_user_id', slingUser.sling_user_id)
        .eq('schedule_date', today)
        .maybeSingle();
      
      if (shift?.shift_start) {
        // Determine shift type based on start time
        const startHour = new Date(shift.shift_start).getHours();
        let shiftType = 'morning';
        if (startHour >= 12 && startHour < 17) {
          shiftType = 'afternoon';
        } else if (startHour >= 17) {
          shiftType = 'evening';
        }
        
        setFormData(prev => ({
          ...prev,
          shiftTime: shiftType,
        }));
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to fetch user shift:', error);
    }
  }
  
  async function fetchStaffName() {
    try {
      const { data } = await supabase.functions.invoke('sling-api', {
        body: {
          action: 'get-foh-shift-staff',
          date: reportDate,
          shiftType: shiftType,
        },
      });
      
      if (data?.staffNames && data.staffNames.length > 0) {
        setFormData(prev => ({
          ...prev,
          staffName: data.staffNames[0],
        }));
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to fetch staff name:', error);
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
      
      const { data, error } = await supabase
        .from('arketa_reservations')
        .select('*')
        .eq('status', 'checked_in')
        .gte('class_time', shiftStart.toISOString())
        .lte('class_time', shiftEnd.toISOString())
        .order('class_time', { ascending: true });
      
      if (error) throw error;
      
      setArketaCheckIns(data || []);
      console.log('[ConciergeForm] Loaded', data?.length || 0, 'check-ins from Arketa');
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
        form_data: formData,
        last_updated_by: user?.email || null,
        last_updated_by_session: sessionId,
      };
      
      if (isOnline) {
        const { data, error } = await supabase
          .from('concierge_drafts')
          .upsert(draftData, {
            onConflict: 'report_date,shift_time',
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setLocalVersion(data.version);
        setLastSaved(new Date());
        setIsDirty(false);
        
        // Broadcast update to other clients
        await broadcastUpdate(formData);
        await broadcastSaved();
      } else {
        // Queue for offline sync
        await addToQueue('save_draft', draftData);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('[ConciergeForm] Failed to save draft:', error);
      toast({
        title: 'Failed to save',
        description: 'Your changes will be saved when you reconnect',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  async function handleSubmit() {
    if (!hasMeaningfulContent(formData)) {
      toast({
        title: 'Cannot submit empty report',
        description: 'Please add some content before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('submit-concierge-report', {
        body: {
          reportDate,
          shiftTime: shiftType,
          formData,
        },
      });
      
      if (error) throw error;
      
      setIsSubmitted(true);
      toast({
        title: 'Report submitted',
        description: 'Your shift report has been submitted successfully',
      });
    } catch (error) {
      console.error('[ConciergeForm] Failed to submit:', error);
      toast({
        title: 'Submission failed',
        description: 'Please try again',
        variant: 'destructive',
      });
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
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    broadcastTyping(field as string);
  }
  
  // Array field handlers
  const addMemberFeedback = () => {
    updateFormField('memberFeedback', [...formData.memberFeedback, { sentiment: 'neutral', text: '' }]);
  };
  
  const addFacilityIssue = () => {
    updateFormField('facilityIssues', [...formData.facilityIssues, { description: '', photoUrl: null }]);
  };
  
  const addSystemIssue = () => {
    updateFormField('systemIssues', [...formData.systemIssues, { issueType: '', description: '', photoUrl: null }]);
  };
  
  const addCelebratoryEvent = () => {
    updateFormField('celebratoryEvents', [...formData.celebratoryEvents, { memberName: '', eventType: 'birthday', date: '' }]);
  };
  
  const addTour = () => {
    updateFormField('tours', [...formData.tours, { name: '', followupCompleted: false }]);
  };
  
  const addCancelRequest = () => {
    updateFormField('membershipCancelRequests', [...formData.membershipCancelRequests, { 
      name: '', 
      email: '', 
      membershipType: '', 
      requestType: 'cancel',
      endDate: ''
    }]);
  };
  
  const addFutureNote = () => {
    updateFormField('futureNotes', [...formData.futureNotes, { 
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
        onKeepLocal={handleKeepLocal}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {shiftType} Shift Report
              <Badge variant="outline">{format(new Date(reportDate), 'EEE, MMM d')}</Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {willAutoSubmit && timeUntilSubmitFormatted && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Auto-submit in {timeUntilSubmitFormatted}
                </Badge>
              )}
              {isSubmitted && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Submitted
                </Badge>
              )}
              <AutoSaveIndicator
                isSaving={isSaving}
                lastSaved={lastSaved}
                isDirty={isDirty}
                isOnline={isOnline}
                queueSize={queueSize}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Arketa Check-ins Summary (Read-only info) */}
          {arketaCheckIns.length > 0 && (
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
          )}
          
          {/* Staff Name */}
          <div className="space-y-2">
            <Label>Staff Name</Label>
            <Input
              value={formData.staffName}
              onChange={(e) => updateFormField('staffName', e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your name"
            />
          </div>
          
          <Separator />
          
          {/* Member Feedback */}
          <div className="space-y-3">
            <Label>Member Feedback & General Notes</Label>
            {formData.memberFeedback.map((feedback, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={feedback.sentiment}
                  onValueChange={(v) => {
                    const updated = [...formData.memberFeedback];
                    updated[i].sentiment = v as any;
                    updateFormField('memberFeedback', updated);
                  }}
                  disabled={isSubmitted}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
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
                  placeholder="Enter feedback"
                  className="flex-1"
                />
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('memberFeedback', formData.memberFeedback.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && (
              <Button variant="ghost" size="sm" onClick={addMemberFeedback}>
                <Plus className="h-4 w-4 mr-1" />
                Add Feedback
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Celebratory Events */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Celebratory Events (Birthdays, Anniversaries, etc.)</Label>
              <Checkbox
                checked={formData.celebratoryEventsNA}
                onCheckedChange={(checked) => updateFormField('celebratoryEventsNA', !!checked)}
                disabled={isSubmitted}
              />
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {!formData.celebratoryEventsNA && formData.celebratoryEvents.map((event, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={event.memberName}
                  onChange={(e) => {
                    const updated = [...formData.celebratoryEvents];
                    updated[i].memberName = e.target.value;
                    updateFormField('celebratoryEvents', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Member name"
                  className="flex-1"
                />
                <Select
                  value={event.eventType}
                  onValueChange={(v) => {
                    const updated = [...formData.celebratoryEvents];
                    updated[i].eventType = v as any;
                    updateFormField('celebratoryEvents', updated);
                  }}
                  disabled={isSubmitted}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  className="w-40"
                />
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('celebratoryEvents', formData.celebratoryEvents.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && !formData.celebratoryEventsNA && (
              <Button variant="ghost" size="sm" onClick={addCelebratoryEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Tours */}
          <div className="space-y-3">
            <Label>Tours Given</Label>
            {formData.tours.map((tour, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={tour.name}
                  onChange={(e) => {
                    const updated = [...formData.tours];
                    updated[i].name = e.target.value;
                    updateFormField('tours', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Prospective member name"
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tour.followupCompleted}
                    onCheckedChange={(checked) => {
                      const updated = [...formData.tours];
                      updated[i].followupCompleted = !!checked;
                      updateFormField('tours', updated);
                    }}
                    disabled={isSubmitted}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Follow-up done</span>
                </div>
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('tours', formData.tours.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && (
              <Button variant="ghost" size="sm" onClick={addTour}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tour
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Membership Cancel/Pause Requests */}
          <div className="space-y-3">
            <Label>Membership Cancel/Pause Requests</Label>
            {formData.membershipCancelRequests.map((request, i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <div className="flex gap-2">
                  <Input
                    value={request.name}
                    onChange={(e) => {
                      const updated = [...formData.membershipCancelRequests];
                      updated[i].name = e.target.value;
                      updateFormField('membershipCancelRequests', updated);
                    }}
                    disabled={isSubmitted}
                    placeholder="Member name"
                    className="flex-1"
                  />
                  <Select
                    value={request.requestType}
                    onValueChange={(v) => {
                      const updated = [...formData.membershipCancelRequests];
                      updated[i].requestType = v as any;
                      updateFormField('membershipCancelRequests', updated);
                    }}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cancel">Cancel</SelectItem>
                      <SelectItem value="pause">Pause</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isSubmitted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        updateFormField('membershipCancelRequests', formData.membershipCancelRequests.filter((_, idx) => idx !== i));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={request.email || ''}
                    onChange={(e) => {
                      const updated = [...formData.membershipCancelRequests];
                      updated[i].email = e.target.value;
                      updateFormField('membershipCancelRequests', updated);
                    }}
                    disabled={isSubmitted}
                    placeholder="Email (optional)"
                  />
                  <Input
                    value={request.membershipType || ''}
                    onChange={(e) => {
                      const updated = [...formData.membershipCancelRequests];
                      updated[i].membershipType = e.target.value;
                      updateFormField('membershipCancelRequests', updated);
                    }}
                    disabled={isSubmitted}
                    placeholder="Membership type (optional)"
                  />
                </div>
                <Input
                  type="date"
                  value={request.endDate || ''}
                  onChange={(e) => {
                    const updated = [...formData.membershipCancelRequests];
                    updated[i].endDate = e.target.value;
                    updateFormField('membershipCancelRequests', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Desired end date"
                />
              </div>
            ))}
            {!isSubmitted && (
              <Button variant="ghost" size="sm" onClick={addCancelRequest}>
                <Plus className="h-4 w-4 mr-1" />
                Add Request
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Facility Issues */}
          <div className="space-y-3">
            <Label>Facility Issues</Label>
            {formData.facilityIssues.map((issue, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={issue.description}
                  onChange={(e) => {
                    const updated = [...formData.facilityIssues];
                    updated[i].description = e.target.value;
                    updateFormField('facilityIssues', updated);
                  }}
                  disabled={isSubmitted}
                  placeholder="Describe facility issue"
                  className="flex-1"
                />
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('facilityIssues', formData.facilityIssues.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && (
              <Button variant="ghost" size="sm" onClick={addFacilityIssue}>
                <Plus className="h-4 w-4 mr-1" />
                Add Issue
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Busiest Areas */}
          <div className="space-y-2">
            <Label>What areas were busiest and when?</Label>
            <Textarea
              value={formData.busiestAreas}
              onChange={(e) => updateFormField('busiestAreas', e.target.value)}
              disabled={isSubmitted}
              placeholder="Describe busy areas and times..."
              rows={3}
            />
          </div>
          
          <Separator />
          
          {/* System Issues */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>System Issues & Questions</Label>
              <Checkbox
                checked={formData.systemIssuesNA}
                onCheckedChange={(checked) => updateFormField('systemIssuesNA', !!checked)}
                disabled={isSubmitted}
              />
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {!formData.systemIssuesNA && formData.systemIssues.map((issue, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={issue.issueType}
                  onValueChange={(v) => {
                    const updated = [...formData.systemIssues];
                    updated[i].issueType = v as any;
                    updateFormField('systemIssues', updated);
                  }}
                  disabled={isSubmitted}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type..." />
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
                  placeholder="Describe issue..."
                  className="flex-1"
                />
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('systemIssues', formData.systemIssues.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && !formData.systemIssuesNA && (
              <Button variant="ghost" size="sm" onClick={addSystemIssue}>
                <Plus className="h-4 w-4 mr-1" />
                Add Issue
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Management Notes */}
          <div className="space-y-2">
            <Label>Management Notes</Label>
            <Textarea
              value={formData.managementNotes}
              onChange={(e) => updateFormField('managementNotes', e.target.value)}
              disabled={isSubmitted}
              placeholder="Additional notes for management..."
              rows={4}
            />
          </div>
          
          <Separator />
          
          {/* Future Shift Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Notes for Future Shifts</Label>
              <Checkbox
                checked={formData.futureShiftNotesNA}
                onCheckedChange={(checked) => updateFormField('futureShiftNotesNA', !!checked)}
                disabled={isSubmitted}
              />
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {!formData.futureShiftNotesNA && formData.futureNotes.map((note, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="date"
                  value={note.targetDate}
                  onChange={(e) => {
                    const updated = [...formData.futureNotes];
                    updated[i].targetDate = e.target.value;
                    updateFormField('futureNotes', updated);
                  }}
                  disabled={isSubmitted}
                  className="w-40"
                />
                <Select
                  value={note.targetShift}
                  onValueChange={(v) => {
                    const updated = [...formData.futureNotes];
                    updated[i].targetShift = v as any;
                    updateFormField('futureNotes', updated);
                  }}
                  disabled={isSubmitted}
                >
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
                  placeholder="Note for future shift..."
                  className="flex-1"
                />
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateFormField('futureNotes', formData.futureNotes.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isSubmitted && !formData.futureShiftNotesNA && (
              <Button variant="ghost" size="sm" onClick={addFutureNote}>
                <Plus className="h-4 w-4 mr-1" />
                Add Future Note
              </Button>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-3 border-t pt-4">
          {!isSubmitted && (
            <>
              <Button
                variant="outline"
                onClick={() => saveDraft()}
                disabled={isSaving || !isDirty}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </>
  );
}

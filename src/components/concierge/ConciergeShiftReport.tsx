import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileText, Save, Send, Clock, CheckCircle2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useCurrentShift } from '@/hooks/useCurrentShift';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useShiftReport, useSaveShiftReport, ShiftReportData } from '@/hooks/useShiftReports';

interface ShiftReportFormData {
  weather: string;
  summary: string;
  tour_notes: string;
  member_feedback: string;
  facility_issues: string;
  incidents: string;
  handoff_notes: string;
  cafe_notes: string;
  other_notes: string;
}

const defaultFormData: ShiftReportFormData = {
  weather: '',
  summary: '',
  tour_notes: '',
  member_feedback: '',
  facility_issues: '',
  incidents: '',
  handoff_notes: '',
  cafe_notes: '',
  other_notes: '',
};

export function ConciergeShiftReport() {
  const { currentShift } = useCurrentShift();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState<ShiftReportFormData>(defaultFormData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const { data: existingReport, isLoading } = useShiftReport(today, currentShift);
  const saveReportMutation = useSaveShiftReport();

  // Load existing data into form
  useEffect(() => {
    if (existingReport) {
      setFormData({
        weather: existingReport.busiest_areas || '',
        summary: existingReport.management_notes || '',
        tour_notes: JSON.stringify(existingReport.tour_notes || []),
        member_feedback: JSON.stringify(existingReport.member_feedback || []),
        facility_issues: JSON.stringify(existingReport.facility_issues || []),
        incidents: JSON.stringify(existingReport.system_issues || []),
        handoff_notes: JSON.stringify(existingReport.future_shift_notes || []),
        cafe_notes: '',
        other_notes: '',
      });
      if (existingReport.submitted_at) {
        setLastSaved(new Date(existingReport.submitted_at));
      }
    }
  }, [existingReport]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000);
    return () => clearTimeout(timer);
  }, [isDirty, formData]);

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    
    const reportData: ShiftReportData = {
      id: existingReport?.id,
      report_date: today,
      shift_type: currentShift,
      staff_user_id: user.id,
      staff_name: user.user_metadata?.full_name || user.email || 'Unknown',
      member_feedback: [],
      membership_requests: [],
      celebratory_events: [],
      scheduled_tours: [],
      tour_notes: [],
      facility_issues: [],
      busiest_areas: formData.weather,
      system_issues: [],
      management_notes: formData.summary,
      future_shift_notes: [],
      status: 'draft',
    };

    saveReportMutation.mutate(reportData, {
      onSuccess: () => {
        setLastSaved(new Date());
        setIsDirty(false);
      },
    });
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    const reportData: ShiftReportData = {
      id: existingReport?.id,
      report_date: today,
      shift_type: currentShift,
      staff_user_id: user.id,
      staff_name: user.user_metadata?.full_name || user.email || 'Unknown',
      member_feedback: [],
      membership_requests: [],
      celebratory_events: [],
      scheduled_tours: [],
      tour_notes: [],
      facility_issues: [],
      busiest_areas: formData.weather,
      system_issues: [],
      management_notes: formData.summary,
      future_shift_notes: [],
      status: 'submitted',
    };

    saveReportMutation.mutate(reportData);
  };

  const handleChange = (field: keyof ShiftReportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const isSubmitted = existingReport?.status === 'submitted';

  const formFields: { key: keyof ShiftReportFormData; label: string; placeholder: string; rows?: number }[] = [
    { key: 'weather', label: 'Weather / Busiest Areas', placeholder: 'e.g., Sunny, 72°F - Gym floor was busiest', rows: 1 },
    { key: 'summary', label: 'Shift Summary', placeholder: 'Overall summary of the shift...', rows: 3 },
    { key: 'tour_notes', label: 'Tour Notes', placeholder: 'Any tours conducted, guest feedback...', rows: 2 },
    { key: 'member_feedback', label: 'Member Feedback', placeholder: 'Compliments, complaints, requests...', rows: 2 },
    { key: 'facility_issues', label: 'Facility Issues', placeholder: 'Equipment problems, maintenance needed...', rows: 2 },
    { key: 'incidents', label: 'Incidents', placeholder: 'Any incidents or unusual occurrences...', rows: 2 },
    { key: 'cafe_notes', label: 'Cafe Notes', placeholder: 'Cafe activity, inventory notes...', rows: 2 },
    { key: 'handoff_notes', label: 'Handoff Notes', placeholder: 'Important information for next shift...', rows: 3 },
    { key: 'other_notes', label: 'Other Notes', placeholder: 'Any other relevant information...', rows: 2 },
  ];

  return (
    <Card className="rounded-none border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
            <FileText className="h-4 w-4" />
            {currentShift} Shift Report
            <Badge variant="outline" className="rounded-none text-[10px]">
              {format(new Date(), 'EEE, MMM d')}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isSubmitted && (
              <Badge variant="default" className="gap-1 rounded-none">
                <CheckCircle2 className="h-3 w-3" />
                Submitted
              </Badge>
            )}
            {lastSaved && !isSubmitted && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved {format(lastSaved, 'h:mm a')}
              </span>
            )}
            {isDirty && (
              <Badge variant="secondary" className="text-[10px] rounded-none">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse" />
                <div className="h-20 w-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          formFields.map(({ key, label, placeholder, rows }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-[10px] font-medium uppercase tracking-wider">
                {label}
              </Label>
              {rows === 1 ? (
                <Input
                  id={key}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  disabled={isSubmitted}
                  className="rounded-none"
                />
              ) : (
                <Textarea
                  id={key}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  disabled={isSubmitted}
                  className="resize-none rounded-none"
                />
              )}
            </div>
          ))
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={!isDirty || saveReportMutation.isPending || isSubmitted}
          className="rounded-none"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saveReportMutation.isPending || isSubmitted}
          className="rounded-none"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitted ? 'Submitted' : 'Submit Report'}
        </Button>
      </CardFooter>
    </Card>
  );
}

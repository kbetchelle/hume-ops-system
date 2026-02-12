export interface FeedbackItem {
  id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  text: string;
}

export interface FacilityIssue {
  id: string;
  description: string;
  photoUrl: string | null;
}

export interface SystemIssue {
  id: string;
  issueType: string;
  description: string;
  photoUrl: string | null;
}

export type CelebratoryEventType =
  | 'new_baby'
  | 'new_job'
  | 'new_house'
  | 'marriage_engagement'
  | 'personal_accomplishment'
  | 'birthday'
  | 'anniversary'
  | 'other';

export interface CelebratoryEvent {
  id: string;
  memberName: string;
  eventType: CelebratoryEventType;
  date: string;
  timing?: string; // e.g. "Upcoming"
  accomplishmentDetails?: string;
}

export interface Tour {
  id: string;
  name: string;
  followupCompleted: boolean;
}

export type CancelPauseReason =
  | 'moving'
  | 'commute'
  | 'financial'
  | 'travel'
  | 'illness'
  | 'other';

export interface MembershipCancelRequest {
  id: string;
  name: string;
  email: string;
  membershipType: string;
  requestType: 'cancel' | 'hold' | 'pause';
  endDate: string;
  reason?: CancelPauseReason;
  otherReasonText?: string;
  paidPause?: boolean; // for pause: paid vs non-paid
  pauseStartDate?: string;
  pauseEndDate?: string;
}

export interface FutureNote {
  id: string;
  targetDate: string;
  targetShift: string;
  note: string;
}

export interface FormDataType {
  reportDate: string;
  shiftTime: string;
  staffName: string;
  memberFeedback: FeedbackItem[];
  celebratoryEventsNA: boolean;
  celebratoryEvents: CelebratoryEvent[];
  tours: Tour[];
  membershipCancelRequests: MembershipCancelRequest[];
  facilityIssues: FacilityIssue[];
  busiestAreas: string;
  systemIssuesNA: boolean;
  systemIssues: SystemIssue[];
  managementNotes: string;
  futureShiftNotesNA: boolean;
  futureNotes: FutureNote[];
  _sessionId?: string; // Optional session tracking ID
}

export interface ConciergeDraft {
  id: string;
  report_date: string;
  shift_time: string;
  form_data: FormDataType;
  version: number;
  last_updated_by: string;
  last_updated_by_session: string;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

export const INITIAL_FORM_DATA: FormDataType = {
  reportDate: new Date().toISOString().split('T')[0],
  shiftTime: 'AM',
  staffName: '',
  memberFeedback: [],
  celebratoryEventsNA: false,
  celebratoryEvents: [],
  tours: [],
  membershipCancelRequests: [],
  facilityIssues: [],
  busiestAreas: '',
  systemIssuesNA: false,
  systemIssues: [],
  managementNotes: '',
  futureShiftNotesNA: false,
  futureNotes: [],
};

export function hasMeaningfulContent(formData: FormDataType): boolean {
  const hasArrayContent = (arr: any[]) => arr.length > 0;
  const hasStringContent = (str: string) => str.trim().length > 0;

  return (
    hasStringContent(formData.staffName) ||
    hasArrayContent(formData.memberFeedback) ||
    hasArrayContent(formData.celebratoryEvents) ||
    hasArrayContent(formData.tours) ||
    hasArrayContent(formData.membershipCancelRequests) ||
    hasArrayContent(formData.facilityIssues) ||
    hasStringContent(formData.busiestAreas) ||
    hasArrayContent(formData.systemIssues) ||
    hasStringContent(formData.managementNotes) ||
    hasArrayContent(formData.futureNotes)
  );
}

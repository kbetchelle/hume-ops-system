// Type definitions for Concierge Shift Report System

export interface FutureNoteEntry {
  targetDate: string; // YYYY-MM-DD
  targetShift: 'AM' | 'PM';
  note: string;
}

export interface MemberFeedbackEntry {
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
}

export interface CancelRequestEntry {
  name: string;
  email?: string;
  membershipType?: string;
  requestType: 'cancel' | 'pause';
  endDate?: string;
}

export interface CelebratoryEventEntry {
  memberName: string;
  eventType: 'birthday' | 'anniversary' | 'wedding' | 'promotion' | 'other';
  date?: string;
}

export interface TourEntry {
  name: string;
  followupCompleted: boolean;
}

export interface FacilityIssueEntry {
  description: string;
  photoUrl: string | null;
}

export interface SystemIssueEntry {
  issueType: 'arketa' | 'jolt' | 'database' | 'question' | '';
  description: string;
  photoUrl: string | null;
}

export interface FormDataType {
  reportDate: string; // YYYY-MM-DD (PST timezone)
  shiftTime: 'AM' | 'PM';
  staffName: string;
  
  // Arrays with structured entries
  futureNotes: FutureNoteEntry[];
  memberFeedback: MemberFeedbackEntry[];
  membershipCancelRequests: CancelRequestEntry[];
  celebratoryEvents: CelebratoryEventEntry[];
  tours: TourEntry[];
  facilityIssues: FacilityIssueEntry[];
  systemIssues: SystemIssueEntry[];
  
  // Freeform text
  busiestAreas: string;
  managementNotes: string;
  
  // N/A checkboxes
  celebratoryEventsNA: boolean;
  systemIssuesNA: boolean;
  futureShiftNotesNA: boolean;
  
  // Meta fields
  _sessionId?: string; // For tracking multi-device same-user edits
}

export interface EditorInfo {
  userId: string;
  userName: string;
  sessionId: string;
  focusedField?: string;
  lastActivity: number; // timestamp
}

export interface ConciergeDraft {
  id: string;
  report_date: string;
  shift_time: 'AM' | 'PM';
  form_data: FormDataType;
  last_updated_by: string | null;
  last_updated_by_session: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastMessage {
  type: 'data_updated' | 'user_typing' | 'user_saved' | 'request_sync';
  sessionId: string;
  userId: string;
  userName: string;
  data?: Partial<FormDataType>;
  field?: string;
  timestamp: number;
}

export const INITIAL_FORM_DATA: FormDataType = {
  reportDate: new Date().toISOString().split('T')[0],
  shiftTime: new Date().getHours() < 14 ? 'AM' : 'PM',
  staffName: '',
  futureNotes: [],
  memberFeedback: [],
  membershipCancelRequests: [],
  celebratoryEvents: [],
  tours: [],
  facilityIssues: [],
  systemIssues: [],
  busiestAreas: '',
  managementNotes: '',
  celebratoryEventsNA: false,
  systemIssuesNA: false,
  futureShiftNotesNA: false,
};

// Helper to generate unique session ID
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to check if form has meaningful content
export function hasMeaningfulContent(formData: FormDataType): boolean {
  return (
    formData.memberFeedback.length > 0 ||
    formData.membershipCancelRequests.length > 0 ||
    formData.celebratoryEvents.length > 0 ||
    formData.tours.length > 0 ||
    formData.facilityIssues.length > 0 ||
    formData.systemIssues.length > 0 ||
    formData.futureNotes.length > 0 ||
    formData.busiestAreas.trim().length > 0 ||
    formData.managementNotes.trim().length > 0 ||
    formData.celebratoryEventsNA ||
    formData.systemIssuesNA ||
    formData.futureShiftNotesNA
  );
}

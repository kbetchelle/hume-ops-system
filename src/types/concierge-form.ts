// Type definitions for Concierge Shift Report System
import { z } from 'zod';
import { getPSTToday, getPSTHour } from "@/lib/dateUtils";

// ---------------------------------------------------------------------------
// Zod schemas — used to safely validate draft data loaded from the database
// ---------------------------------------------------------------------------

const FutureNoteSchema = z.object({
  id: z.string().optional(),
  targetDate: z.string(),
  targetShift: z.enum(['AM', 'PM']),
  note: z.string(),
});

const MemberFeedbackSchema = z.object({
  id: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  text: z.string(),
});

const CancelRequestSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().optional(),
  membershipType: z.string().optional(),
  requestType: z.enum(['cancel', 'pause', 'hold']),
  endDate: z.string().optional(),
  reason: z.enum(['moving', 'commute', 'financial', 'travel', 'illness', 'other']).optional(),
  otherReasonText: z.string().optional(),
  paidPause: z.boolean().optional(),
  pauseStartDate: z.string().optional(),
  pauseEndDate: z.string().optional(),
});

const CelebratoryEventSchema = z.object({
  id: z.string().optional(),
  memberName: z.string(),
  eventType: z.enum([
    'new_baby', 'new_job', 'new_house', 'marriage_engagement',
    'personal_accomplishment', 'birthday', 'anniversary',
    'wedding', 'promotion', 'other',
  ]),
  date: z.string().optional(),
  timing: z.string().optional(),
  accomplishmentDetails: z.string().optional(),
});

const TourSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  followupCompleted: z.boolean(),
});

const FacilityIssueSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  photoUrl: z.string().nullable(),
});

const SystemIssueSchema = z.object({
  id: z.string().optional(),
  issueType: z.enum(['arketa', 'jolt', 'database', 'question', '']),
  description: z.string(),
  photoUrl: z.string().nullable(),
});

export const FormDataSchema = z.object({
  reportDate: z.string().optional(),
  shiftTime: z.enum(['AM', 'PM']).optional(),
  staffName: z.string().optional(),
  futureNotes: z.array(FutureNoteSchema).optional(),
  memberFeedback: z.array(MemberFeedbackSchema).optional(),
  membershipCancelRequests: z.array(CancelRequestSchema).optional(),
  celebratoryEvents: z.array(CelebratoryEventSchema).optional(),
  tours: z.array(TourSchema).optional(),
  facilityIssues: z.array(FacilityIssueSchema).optional(),
  systemIssues: z.array(SystemIssueSchema).optional(),
  busiestAreas: z.string().optional(),
  managementNotes: z.string().optional(),
  cafeNotes: z.string().optional(),
  celebratoryEventsNA: z.boolean().optional(),
  systemIssuesNA: z.boolean().optional(),
  futureShiftNotesNA: z.boolean().optional(),
  _sessionId: z.string().optional(),
});
export interface FutureNoteEntry {
  id?: string;
  targetDate: string; // YYYY-MM-DD
  targetShift: 'AM' | 'PM';
  note: string;
}

export interface MemberFeedbackEntry {
  id?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
}

export interface CancelRequestEntry {
  id?: string;
  name: string;
  email?: string;
  membershipType?: string;
  requestType: 'cancel' | 'pause' | 'hold';
  endDate?: string;
  reason?: CancelPauseReason;
  otherReasonText?: string;
  paidPause?: boolean;
  pauseStartDate?: string;
  pauseEndDate?: string;
}

export type CelebratoryEventType =
  | 'new_baby'
  | 'new_job'
  | 'new_house'
  | 'marriage_engagement'
  | 'personal_accomplishment'
  | 'birthday'
  | 'anniversary'
  | 'wedding'
  | 'promotion'
  | 'other';

export type CancelPauseReason = 'moving' | 'commute' | 'financial' | 'travel' | 'illness' | 'other';

export interface CelebratoryEventEntry {
  id?: string;
  memberName: string;
  eventType: CelebratoryEventType;
  date?: string;
  timing?: string;
  accomplishmentDetails?: string;
}

export interface TourEntry {
  id?: string;
  name: string;
  followupCompleted: boolean;
}

export interface FacilityIssueEntry {
  id?: string;
  description: string;
  photoUrl: string | null;
}

export interface SystemIssueEntry {
  id?: string;
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
  cafeNotes?: string;

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
  reportDate: getPSTToday(),
  shiftTime: getPSTHour() < 14 ? 'AM' : 'PM',
  staffName: '',
  futureNotes: [{ id: crypto.randomUUID(), targetDate: '', targetShift: 'AM' as const, note: '' }],
  memberFeedback: [{ id: crypto.randomUUID(), sentiment: 'neutral' as const, text: '' }],
  membershipCancelRequests: [{ id: crypto.randomUUID(), name: '', requestType: 'cancel' as const }],
  celebratoryEvents: [{ id: crypto.randomUUID(), memberName: '', eventType: 'birthday' as CelebratoryEventType, date: '' }],
  tours: [{ id: crypto.randomUUID(), name: '', followupCompleted: false }],
  facilityIssues: [{ id: crypto.randomUUID(), description: '', photoUrl: null }],
  systemIssues: [{ id: crypto.randomUUID(), issueType: '', description: '', photoUrl: null }],
  busiestAreas: '',
  managementNotes: '',
  cafeNotes: '',
  celebratoryEventsNA: false,
  systemIssuesNA: false,
  futureShiftNotesNA: false,
};

// Helper to generate unique session ID
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to check if form has meaningful content
export function hasMeaningfulContent(formData: FormDataType | null | undefined): boolean {
  if (!formData) return false;
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
    (formData.cafeNotes?.trim().length ?? 0) > 0 ||
    formData.celebratoryEventsNA ||
    formData.systemIssuesNA ||
    formData.futureShiftNotesNA
  );
}

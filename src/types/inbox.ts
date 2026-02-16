export type InboxItemType = "qa" | "flag" | "shift_note" | "sick_day";

export interface QAInboxData {
  type: "qa";
  question: string;
  context: string | null;
  askedByName: string;
  askedById: string | null;
  isResolved: boolean;
  answer: string | null;
  answerType: "policy_link" | "direct_answer" | null;
  linkedPolicyId: string | null;
  answeredByName: string | null;
  isPublic: boolean;
}

export interface FlagInboxData {
  type: "flag";
  resourceType:
    | "quick_link_group"
    | "quick_link_item"
    | "resource_page"
    | "club_policy";
  resourceId: string;
  resourceLabel: string;
  note: string;
  flaggedByName: string;
  flaggedById: string;
  status: "pending" | "dismissed" | "resolved";
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  // Page-specific flagging fields (for PDFs)
  flaggedPageNumber?: number | null;
  flaggedPageContext?: string | null;
}

export interface ShiftNoteInboxData {
  type: "shift_note";
  reportId: string;
  reportDate: string;
  shiftType: string;
  staffName: string;
  managementNotes: string;
  status: string;
}

export interface SickDayInboxData {
  type: "sick_day";
  userId: string;
  userName: string;
  requestedDates: string[]; // ISO date strings
  notes: string;
  status: "pending" | "approved" | "rejected";
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export type InboxItemData = QAInboxData | FlagInboxData | ShiftNoteInboxData | SickDayInboxData;

export interface InboxItem {
  id: string;
  type: InboxItemType;
  createdAt: string; // ISO date string for sorting
  isRead: boolean;
  data: InboxItemData;
}

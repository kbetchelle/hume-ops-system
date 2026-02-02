export interface FormDataType {
  reportDate: string;
  shiftTime: string;
  teamMembers: string[];
  arketaCheckIns: string;
  anticipatedCheckIns: string;
  specialRequests: string[];
  maintenanceIssues: string[];
  lostAndFound: string[];
  securityIncidents: string[];
  guestFeedback: string[];
  notes: string;
}

export interface ConciergeDraft {
  id: string;
  report_date: string;
  shift_type: string;
  form_data: FormDataType;
  version: number;
  last_edited_by: string;
  last_edited_at: string;
  created_at: string;
  updated_at: string;
}

export const INITIAL_FORM_DATA: FormDataType = {
  reportDate: new Date().toISOString().split('T')[0],
  shiftTime: 'morning',
  teamMembers: [],
  arketaCheckIns: '',
  anticipatedCheckIns: '',
  specialRequests: [],
  maintenanceIssues: [],
  lostAndFound: [],
  securityIncidents: [],
  guestFeedback: [],
  notes: '',
};

export function hasMeaningfulContent(formData: FormDataType): boolean {
  const hasArrayContent = (arr: string[]) => arr.length > 0 && arr.some(item => item.trim().length > 0);
  const hasStringContent = (str: string) => str.trim().length > 0;

  return (
    hasArrayContent(formData.teamMembers) ||
    hasStringContent(formData.arketaCheckIns) ||
    hasStringContent(formData.anticipatedCheckIns) ||
    hasArrayContent(formData.specialRequests) ||
    hasArrayContent(formData.maintenanceIssues) ||
    hasArrayContent(formData.lostAndFound) ||
    hasArrayContent(formData.securityIncidents) ||
    hasArrayContent(formData.guestFeedback) ||
    hasStringContent(formData.notes)
  );
}

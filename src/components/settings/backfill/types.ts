export interface SyncResult {
  date: string;
  existingBefore: number;
  newRecords: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

export interface SyncProgress {
  isRunning: boolean;
  currentDate: string | null;
  totalDates: number;
  completedDates: number;
  totalRecords: number;
  results: SyncResult[];
  startTime: number | null;
}

export type BackfillJobType = "arketa_reservations" | "arketa_payments";

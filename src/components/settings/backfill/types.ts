export interface SyncResult {
  date: string;
  existingBefore: number;
  newRecords: number;
  recordCount: number;
  success: boolean;
  error?: string;
  hitPageLimit?: boolean;
}

export interface SyncProgress {
  isRunning: boolean;
  currentDate: string | null;
  totalDates: number;
  completedDates: number;
  totalRecords: number;
  results: SyncResult[];
  startTime: number | null;
  syncPhase: string | null;
  currentBatchCount: number;
  recordsInCurrentBatch: number;
  cumulativeInserted: number;
  cumulativeUpdated: number;
}

export type BackfillJobType = "arketa_reservations" | "arketa_payments" | "arketa_classes" | "arketa_classes_and_reservations" | "toast_orders";

import { useEffect, useState, useCallback, useRef } from 'react';
import { addMinutes, isAfter, differenceInMinutes, differenceInSeconds } from 'date-fns';

/**
 * Shift end times configuration by day type and checklist type
 */
interface ShiftEndConfig {
  [dayType: string]: {
    [shiftTime: string]: { hour: number; minute: number };
  };
}

const CONCIERGE_SHIFT_ENDS: ShiftEndConfig = {
  weekday: { AM: { hour: 13, minute: 30 }, PM: { hour: 22, minute: 15 } },
  saturday: { AM: { hour: 13, minute: 30 }, PM: { hour: 21, minute: 15 } },
  sunday: { AM: { hour: 13, minute: 30 }, PM: { hour: 20, minute: 15 } },
};

const BOH_SHIFT_ENDS: ShiftEndConfig = {
  weekday: { AM: { hour: 14, minute: 0 }, PM: { hour: 22, minute: 30 } },
  saturday: { AM: { hour: 14, minute: 0 }, PM: { hour: 21, minute: 30 } },
  sunday: { AM: { hour: 14, minute: 0 }, PM: { hour: 20, minute: 30 } },
};

const CAFE_SHIFT_ENDS: ShiftEndConfig = {
  weekday: { AM: { hour: 14, minute: 0 }, PM: { hour: 21, minute: 0 } },
  saturday: { AM: { hour: 14, minute: 0 }, PM: { hour: 20, minute: 0 } },
  sunday: { AM: { hour: 14, minute: 0 }, PM: { hour: 19, minute: 0 } },
};

const SHIFT_CONFIGS: Record<string, ShiftEndConfig> = {
  concierge: CONCIERGE_SHIFT_ENDS,
  boh: BOH_SHIFT_ENDS,
  cafe: CAFE_SHIFT_ENDS,
};

const AUTO_SUBMIT_DELAY_MINUTES = 15;
const CHECK_INTERVAL_MS = 60000; // 1 minute

export type ChecklistType = 'concierge' | 'boh' | 'cafe';

interface UseAutoSubmitOptions {
  checklistType: ChecklistType;
  shiftTime: 'AM' | 'PM';
  completionDate: string;
  isAlreadySubmitted: boolean;
  onAutoSubmit: () => Promise<void> | void;
  enabled?: boolean;
}

interface UseAutoSubmitReturn {
  /** Whether auto-submit is enabled and counting down */
  isCountingDown: boolean;
  /** Whether auto-submit has been triggered */
  hasAutoSubmitted: boolean;
  /** Time remaining until auto-submit (in minutes) */
  minutesRemaining: number | null;
  /** Formatted time remaining (e.g., "5:30") */
  timeRemainingFormatted: string | null;
  /** Cancel the auto-submit countdown */
  cancelAutoSubmit: () => void;
  /** Manually trigger auto-submit */
  triggerSubmit: () => void;
  /** The target auto-submit time */
  autoSubmitTime: Date | null;
}

/**
 * Hook for automatic shift submission
 * 
 * Automatically submits the checklist 15 minutes after the shift ends.
 * This prevents incomplete shift submissions and ensures all data is captured.
 * 
 * @example
 * ```tsx
 * const { isCountingDown, timeRemainingFormatted, cancelAutoSubmit } = useAutoSubmit({
 *   checklistType: 'concierge',
 *   shiftTime: 'AM',
 *   completionDate: '2025-02-03',
 *   isAlreadySubmitted: false,
 *   onAutoSubmit: handleSubmit,
 * });
 * ```
 */
export function useAutoSubmit(options: UseAutoSubmitOptions): UseAutoSubmitReturn {
  const {
    checklistType,
    shiftTime,
    completionDate,
    isAlreadySubmitted,
    onAutoSubmit,
    enabled = true,
  } = options;

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [autoSubmitTime, setAutoSubmitTime] = useState<Date | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get shift end time for today
  const getShiftEndTime = useCallback((): Date | null => {
    const config = SHIFT_CONFIGS[checklistType];
    if (!config) return null;

    const now = new Date();
    const dayOfWeek = now.getDay();
    
    let dayType = 'weekday';
    if (dayOfWeek === 0) dayType = 'sunday';
    else if (dayOfWeek === 6) dayType = 'saturday';
    
    const shiftEnd = config[dayType]?.[shiftTime];
    if (!shiftEnd) return null;
    
    const shiftEndTime = new Date();
    shiftEndTime.setHours(shiftEnd.hour, shiftEnd.minute, 0, 0);
    
    return shiftEndTime;
  }, [checklistType, shiftTime]);

  // Calculate auto-submit time
  const calculateAutoSubmitTime = useCallback((): Date | null => {
    const shiftEndTime = getShiftEndTime();
    if (!shiftEndTime) return null;
    return addMinutes(shiftEndTime, AUTO_SUBMIT_DELAY_MINUTES);
  }, [getShiftEndTime]);

  // Check if we should auto-submit
  const checkAndSubmit = useCallback(() => {
    if (isCancelled || isAlreadySubmitted || hasAutoSubmitted || !enabled) {
      return;
    }

    const submitTime = calculateAutoSubmitTime();
    if (!submitTime) return;

    setAutoSubmitTime(submitTime);
    const now = new Date();

    if (isAfter(now, submitTime)) {
      // Time has passed, submit immediately
      setHasAutoSubmitted(true);
      setIsCountingDown(false);
      setMinutesRemaining(0);
      onAutoSubmit();
    } else {
      // Calculate remaining time
      const remaining = differenceInMinutes(submitTime, now);
      setMinutesRemaining(remaining);
      setIsCountingDown(true);
    }
  }, [isCancelled, isAlreadySubmitted, hasAutoSubmitted, enabled, calculateAutoSubmitTime, onAutoSubmit]);

  // Format time remaining
  const timeRemainingFormatted = useCallback((): string | null => {
    if (minutesRemaining === null || !autoSubmitTime) return null;
    
    const now = new Date();
    const totalSeconds = differenceInSeconds(autoSubmitTime, now);
    
    if (totalSeconds <= 0) return '0:00';
    
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [minutesRemaining, autoSubmitTime]);

  // Cancel auto-submit
  const cancelAutoSubmit = useCallback(() => {
    setIsCancelled(true);
    setIsCountingDown(false);
    setMinutesRemaining(null);
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
  }, []);

  // Manually trigger submit
  const triggerSubmit = useCallback(() => {
    if (!isAlreadySubmitted && !hasAutoSubmitted) {
      setHasAutoSubmitted(true);
      setIsCountingDown(false);
      onAutoSubmit();
    }
  }, [isAlreadySubmitted, hasAutoSubmitted, onAutoSubmit]);

  // Set up the check interval
  useEffect(() => {
    if (!enabled || isAlreadySubmitted || isCancelled) {
      return;
    }

    // Check immediately
    checkAndSubmit();

    // Check every minute
    checkIntervalRef.current = setInterval(checkAndSubmit, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, [enabled, isAlreadySubmitted, isCancelled, checkAndSubmit, completionDate, shiftTime]);

  // Reset cancelled state when shift changes
  useEffect(() => {
    setIsCancelled(false);
    setHasAutoSubmitted(false);
  }, [completionDate, shiftTime]);

  return {
    isCountingDown,
    hasAutoSubmitted,
    minutesRemaining,
    timeRemainingFormatted: timeRemainingFormatted(),
    cancelAutoSubmit,
    triggerSubmit,
    autoSubmitTime,
  };
}

/**
 * Utility function to get the auto-submit time for display purposes
 */
export function getAutoSubmitTime(
  checklistType: ChecklistType,
  shiftTime: 'AM' | 'PM'
): Date | null {
  const config = SHIFT_CONFIGS[checklistType];
  if (!config) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  
  let dayType = 'weekday';
  if (dayOfWeek === 0) dayType = 'sunday';
  else if (dayOfWeek === 6) dayType = 'saturday';
  
  const shiftEnd = config[dayType]?.[shiftTime];
  if (!shiftEnd) return null;
  
  const shiftEndTime = new Date();
  shiftEndTime.setHours(shiftEnd.hour, shiftEnd.minute, 0, 0);
  
  return addMinutes(shiftEndTime, AUTO_SUBMIT_DELAY_MINUTES);
}

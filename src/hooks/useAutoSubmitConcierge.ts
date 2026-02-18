import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import type { FormDataType } from '@/types/concierge-form';
import { hasMeaningfulContent } from '@/types/concierge-form';

interface ShiftEndTimes {
  weekday: { AM: string; PM: string };
  weekend: { AM: string; PM: string };
}

// PST shift end times
const SHIFT_END_TIMES: ShiftEndTimes = {
  weekday: {
    AM: '13:30', // 1:30 PM
    PM: '21:05', // 9:05 PM
  },
  weekend: {
    AM: '13:00', // 1:00 PM
    PM: '19:00', // 7:00 PM
  },
};

const AUTO_SUBMIT_DELAY_MINUTES = 15;

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function getPSTDate(): Date {
  // Convert current time to PST (UTC-8 or UTC-7 during DST)
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  const pstOffset = -480; // PST is UTC-8 (480 minutes behind)
  const offsetDiff = utcOffset - pstOffset;
  return new Date(now.getTime() + offsetDiff * 60 * 1000);
}

function getShiftEndTime(reportDate: string, shiftType: 'AM' | 'PM'): Date {
  const date = new Date(reportDate);
  const weekend = isWeekend(date);
  const times = weekend ? SHIFT_END_TIMES.weekend : SHIFT_END_TIMES.weekday;
  const [hours, minutes] = times[shiftType].split(':').map(Number);

  const endTime = new Date(reportDate);
  endTime.setHours(hours, minutes, 0, 0);

  // Add auto-submit delay
  endTime.setMinutes(endTime.getMinutes() + AUTO_SUBMIT_DELAY_MINUTES);

  return endTime;
}

export function useAutoSubmitConcierge(
  reportDate: string,
  shiftType: 'AM' | 'PM',
  formData: FormDataType,
  onAutoSubmit: () => Promise<void>,
  isSubmitted: boolean
) {
  const { toast } = useToast();
  const [willAutoSubmit, setWillAutoSubmit] = useState(false);
  const [timeUntilSubmit, setTimeUntilSubmit] = useState<number | null>(null);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

  const checkAutoSubmit = useCallback(() => {
    if (isSubmitted || autoSubmitTriggered) {
      setWillAutoSubmit(false);
      setTimeUntilSubmit(null);
      return;
    }

    const now = getPSTDate();
    const shiftEnd = getShiftEndTime(reportDate, shiftType);
    const timeDiff = shiftEnd.getTime() - now.getTime();

    // Only auto-submit if:
    // 1. We're past the shift end time (timeDiff < 0)
    // 2. Form has meaningful content
    // 3. Not already submitted
    if (timeDiff < 0 && hasMeaningfulContent(formData)) {
      setWillAutoSubmit(true);
      setTimeUntilSubmit(0);
    } else if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
      // Within 30 minutes of auto-submit time
      setWillAutoSubmit(true);
      setTimeUntilSubmit(Math.ceil(timeDiff / 1000)); // seconds
    } else {
      setWillAutoSubmit(false);
      setTimeUntilSubmit(null);
    }
  }, [reportDate, shiftType, formData, isSubmitted, autoSubmitTriggered]);

  // Check every minute
  useEffect(() => {
    checkAutoSubmit();
    const interval = setInterval(checkAutoSubmit, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAutoSubmit]);

  // Trigger auto-submit
  useEffect(() => {
    if (willAutoSubmit && timeUntilSubmit === 0 && !isSubmitted && !autoSubmitTriggered) {
      console.log('[Auto-Submit] Triggering auto-submit for shift:', reportDate, shiftType);

      setAutoSubmitTriggered(true);

      toast({
        title: 'Auto-submitting shift report',
        description: `Your ${shiftType} shift report is being automatically submitted.`,
      });

      onAutoSubmit().catch((error) => {
        console.error('[Auto-Submit] Failed:', error);
        toast({
          title: 'Auto-submit failed',
          description: 'Please manually submit your report.',
          variant: 'destructive',
        });
        setAutoSubmitTriggered(false);
      });
    }
  }, [willAutoSubmit, timeUntilSubmit, isSubmitted, autoSubmitTriggered, reportDate, shiftType, onAutoSubmit, toast]);

  // Format time until submit for display
  const timeUntilSubmitFormatted = timeUntilSubmit !== null && timeUntilSubmit > 0
    ? `${Math.floor(timeUntilSubmit / 60)} minutes`
    : null;

  return {
    willAutoSubmit,
    timeUntilSubmit,
    timeUntilSubmitFormatted,
    shiftEndTime: getShiftEndTime(reportDate, shiftType),
  };
}

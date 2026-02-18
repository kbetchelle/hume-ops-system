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

/** Returns the current moment. Used for comparison with shift end (both are UTC timestamps). */
function getNow(): Date {
  return new Date();
}

/**
 * US Pacific: DST is 2nd Sunday March (02:00) through 1st Sunday November (02:00).
 * Returns ISO offset for the given date: '-07:00' (PDT) or '-08:00' (PST).
 */
function getPacificOffsetForDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const year = y!;
  const month = m!;
  const day = d!;

  const secondSundayMarch = (() => {
    const first = new Date(year, 2, 1); // March 1 (month 0-indexed)
    const firstSunday = 1 + ((7 - first.getDay()) % 7) || 7;
    return firstSunday + 7; // 2nd Sunday
  })();
  const firstSundayNovember = (() => {
    const first = new Date(year, 10, 1); // November 1 (month 0-indexed)
    const firstSunday = 1 + ((7 - first.getDay()) % 7) || 7;
    return firstSunday;
  })();

  // dateStr is YYYY-MM-DD so month is 1-12 (March=3, November=11)
  if (month < 3 || (month === 3 && day < secondSundayMarch)) return '-08:00';
  if (month > 11 || (month === 11 && day >= firstSundayNovember)) return '-08:00';
  return '-07:00';
}

/**
 * Returns the shift end time (plus auto-submit delay) as a Date (UTC timestamp).
 * reportDate is YYYY-MM-DD in Pacific; we parse it with the correct PST/PDT offset.
 */
function getShiftEndTime(reportDate: string, shiftType: 'AM' | 'PM'): Date {
  const offset = getPacificOffsetForDate(reportDate);
  const dateAtNoon = new Date(`${reportDate}T12:00:00${offset}`);
  const weekend = isWeekend(dateAtNoon);
  const times = weekend ? SHIFT_END_TIMES.weekend : SHIFT_END_TIMES.weekday;
  const [hours, minutes] = times[shiftType].split(':').map(Number);
  const timePart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  const endTime = new Date(`${reportDate}T${timePart}${offset}`);
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

    const now = getNow();
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

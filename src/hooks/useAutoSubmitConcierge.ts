import { useEffect, useState } from 'react';
import { addMinutes, isAfter } from 'date-fns';

const SHIFT_END_TIMES = {
  weekday: { AM: { hour: 13, minute: 30 }, PM: { hour: 22, minute: 15 } },
  saturday: { AM: { hour: 13, minute: 30 }, PM: { hour: 21, minute: 15 } },
  sunday: { AM: { hour: 13, minute: 30 }, PM: { hour: 20, minute: 15 } },
};

const AUTO_SUBMIT_DELAY_MINUTES = 15;

export function useAutoSubmitConcierge(
  reportDate: string,
  shiftType: string,
  formData: any,
  handleSubmit: () => void,
  isSubmitted: boolean
) {
  const [willAutoSubmit, setWillAutoSubmit] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Delay auto-submit checks to let the draft/form data load first
  useEffect(() => {
    const readyTimer = setTimeout(() => setIsReady(true), 5000);
    return () => clearTimeout(readyTimer);
  }, [reportDate, shiftType]);

  useEffect(() => {
    if (isSubmitted || !isReady) return;

    const checkAutoSubmit = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      
      let dayType: 'weekday' | 'saturday' | 'sunday' = 'weekday';
      if (dayOfWeek === 0) dayType = 'sunday';
      else if (dayOfWeek === 6) dayType = 'saturday';
      
      const shiftEnd = SHIFT_END_TIMES[dayType][shiftType as 'AM' | 'PM'];
      if (!shiftEnd) return;
      
      const shiftEndTime = new Date();
      shiftEndTime.setHours(shiftEnd.hour, shiftEnd.minute, 0, 0);
      
      const autoSubmitTime = addMinutes(shiftEndTime, AUTO_SUBMIT_DELAY_MINUTES);
      
      if (isAfter(now, autoSubmitTime)) {
        setWillAutoSubmit(true);
        handleSubmit();
      }
    };

    // Check every minute
    const interval = setInterval(checkAutoSubmit, 60000);
    checkAutoSubmit();

    return () => clearInterval(interval);
  }, [reportDate, shiftType, isSubmitted, isReady, handleSubmit]);

  return { 
    willAutoSubmit,
    timeUntilSubmitFormatted: null as string | null,
    cancelAutoSubmit: () => setWillAutoSubmit(false),
  };
}

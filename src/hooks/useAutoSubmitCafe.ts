import { useEffect, useState } from 'react';
import { addMinutes, isAfter } from 'date-fns';

// Cafe shift end times - slightly different from Concierge/BoH
const SHIFT_END_TIMES = {
  weekday: { AM: { hour: 14, minute: 0 }, PM: { hour: 21, minute: 0 } },
  saturday: { AM: { hour: 14, minute: 0 }, PM: { hour: 21, minute: 0 } },
  sunday: { AM: { hour: 14, minute: 0 }, PM: { hour: 20, minute: 0 } },
};

const AUTO_SUBMIT_DELAY_MINUTES = 15;

export function useAutoSubmitCafe(
  reportDate: string,
  shiftType: string,
  formData: any,
  handleSubmit: () => void,
  isSubmitted: boolean
) {
  const [willAutoSubmit, setWillAutoSubmit] = useState(false);

  useEffect(() => {
    if (isSubmitted) return;

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
    checkAutoSubmit(); // Check immediately

    return () => clearInterval(interval);
  }, [reportDate, shiftType, isSubmitted, handleSubmit]);

  return { 
    willAutoSubmit,
    timeUntilSubmitFormatted: null as string | null,
    cancelAutoSubmit: () => setWillAutoSubmit(false),
  };
}

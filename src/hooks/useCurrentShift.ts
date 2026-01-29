import { useState, useEffect, useCallback } from 'react';

type ShiftType = 'AM' | 'PM';

interface UseCurrentShiftReturn {
  currentShift: ShiftType;
  isManualOverride: boolean;
  toggleShift: () => void;
  resetToAuto: () => void;
  shiftStartTime: string;
  shiftEndTime: string;
}

const STORAGE_KEY = 'concierge-manual-shift';
const PM_BOUNDARY_MINUTES = 13 * 60 + 35; // 1:35 PM = 815 minutes

const getAutoShift = (): ShiftType => {
  const pacificTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  const date = new Date(pacificTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  
  return totalMinutes >= PM_BOUNDARY_MINUTES ? 'PM' : 'AM';
};

const getShiftTimes = (shift: ShiftType): { start: string; end: string } => {
  if (shift === 'AM') {
    return { start: '6:00 AM', end: '1:35 PM' };
  }
  return { start: '1:35 PM', end: '9:00 PM' };
};

export function useCurrentShift(): UseCurrentShiftReturn {
  const [manualShift, setManualShift] = useState<ShiftType | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'AM' || stored === 'PM' ? stored : null;
  });
  
  const [autoShift, setAutoShift] = useState<ShiftType>(getAutoShift);

  // Update auto-shift every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoShift(getAutoShift());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentShift = manualShift ?? autoShift;
  const isManualOverride = manualShift !== null;
  const { start, end } = getShiftTimes(currentShift);

  const toggleShift = useCallback(() => {
    const newShift: ShiftType = currentShift === 'AM' ? 'PM' : 'AM';
    setManualShift(newShift);
    localStorage.setItem(STORAGE_KEY, newShift);
  }, [currentShift]);

  const resetToAuto = useCallback(() => {
    setManualShift(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentShift,
    isManualOverride,
    toggleShift,
    resetToAuto,
    shiftStartTime: start,
    shiftEndTime: end,
  };
}

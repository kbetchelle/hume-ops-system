import { useState, useEffect, useCallback } from 'react';

type ShiftType = 'AM' | 'PM';

interface UseCurrentShiftOptions {
  /** Dynamic AM/PM boundary in minutes from midnight, derived from Sling shift data */
  dynamicBoundaryMinutes?: number | null;
}

interface UseCurrentShiftReturn {
  currentShift: ShiftType;
  isManualOverride: boolean;
  setShift: (shift: ShiftType) => void;
  toggleShift: () => void;
  resetToAuto: () => void;
  shiftStartTime: string;
  shiftEndTime: string;
}

const STORAGE_KEY = 'concierge-manual-shift';
const DEFAULT_PM_BOUNDARY_MINUTES = 13 * 60 + 35; // 1:35 PM = 815 minutes

const getAutoShift = (boundaryMinutes: number): ShiftType => {
  const pacificTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  const date = new Date(pacificTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  
  return totalMinutes >= boundaryMinutes ? 'PM' : 'AM';
};

const getShiftTimes = (shift: ShiftType): { start: string; end: string } => {
  if (shift === 'AM') {
    return { start: '6:00 AM', end: '1:35 PM' };
  }
  return { start: '1:35 PM', end: '9:00 PM' };
};

export function useCurrentShift(options?: UseCurrentShiftOptions): UseCurrentShiftReturn {
  const boundaryMinutes = options?.dynamicBoundaryMinutes ?? DEFAULT_PM_BOUNDARY_MINUTES;

  const [manualShift, setManualShift] = useState<ShiftType | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'AM' || stored === 'PM' ? stored : null;
  });
  
  const [autoShift, setAutoShift] = useState<ShiftType>(() => getAutoShift(boundaryMinutes));

  // Update auto-shift every 60 seconds or when boundary changes
  useEffect(() => {
    setAutoShift(getAutoShift(boundaryMinutes));
    const interval = setInterval(() => {
      setAutoShift(getAutoShift(boundaryMinutes));
    }, 60000);

    return () => clearInterval(interval);
  }, [boundaryMinutes]);

  const currentShift = manualShift ?? autoShift;
  const isManualOverride = manualShift !== null;
  const { start, end } = getShiftTimes(currentShift);

  const setShift = useCallback((shift: ShiftType) => {
    setManualShift(shift);
    localStorage.setItem(STORAGE_KEY, shift);
  }, []);

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
    setShift,
    toggleShift,
    resetToAuto,
    shiftStartTime: start,
    shiftEndTime: end,
  };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ShiftType = 'AM' | 'PM';

interface ConciergeShiftStaffResult {
  /** First names of concierge staff for the requested shift */
  staffNames: string[];
  /** First names of AM concierge staff (always fetched) */
  amStaffNames: string[];
  /** First names of PM concierge staff (always fetched) */
  pmStaffNames: string[];
  /** The dynamic AM/PM boundary in minutes from midnight, derived from actual shift data */
  shiftBoundaryMinutes: number | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch concierge staff first names from staff_shifts + sling_users
 * for a given date. Returns both AM and PM staff so toggling is instant.
 */
export function useConciergeShiftStaff(
  date: string,
  shiftType: ShiftType,
): ConciergeShiftStaffResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['concierge-shift-staff', date],
    queryFn: async () => {
      // 1. Fetch all concierge shifts for the given date
      const { data: shifts, error: shiftsError } = await supabase
        .from('staff_shifts' as any)
        .select('sling_user_id, shift_start, shift_end, position, staff_name, user_name')
        .eq('shift_date', date)
        .ilike('position', '%concierge%') as any;

      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) {
        return { amStaff: [] as string[], pmStaff: [] as string[], boundaryMinutes: null as number | null };
      }

      // 2. Collect sling_user_ids to look up first_name
      const slingUserIds = shifts
        .map((s: any) => s.sling_user_id)
        .filter((id: any) => id != null);

      let userNameMap = new Map<number, string>();

      if (slingUserIds.length > 0) {
        const { data: slingUsers, error: usersError } = await supabase
          .from('sling_users')
          .select('sling_user_id, first_name')
          .in('sling_user_id', slingUserIds);

        if (!usersError && slingUsers) {
          for (const u of slingUsers) {
            if (u.first_name) {
              userNameMap.set(u.sling_user_id, u.first_name);
            }
          }
        }
      }

      // 3. Split into AM/PM based on shift_start hour
      const amStaff: string[] = [];
      const pmStaff: string[] = [];
      let latestAmEnd: number | null = null;
      let earliestPmStart: number | null = null;

      for (const shift of shifts) {
        const startHour = new Date(shift.shift_start).getHours();
        const isAm = startHour < 12;

        // Get name: prefer sling_users.first_name, fall back to staff_name/user_name
        let name = shift.sling_user_id
          ? userNameMap.get(shift.sling_user_id)
          : undefined;

        if (!name) {
          // Fallback: extract first name from staff_name or user_name
          const fullName = shift.user_name || shift.staff_name || '';
          name = fullName.split(' ')[0] || '';
        }

        if (name) {
          if (isAm) {
            amStaff.push(name);
          } else {
            pmStaff.push(name);
          }
        }

        // Track boundary times
        if (isAm && shift.shift_end) {
          const endDate = new Date(shift.shift_end);
          const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
          if (latestAmEnd === null || endMinutes > latestAmEnd) {
            latestAmEnd = endMinutes;
          }
        }
        if (!isAm && shift.shift_start) {
          const startDate = new Date(shift.shift_start);
          const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
          if (earliestPmStart === null || startMinutes < earliestPmStart) {
            earliestPmStart = startMinutes;
          }
        }
      }

      // Boundary: use the midpoint between latest AM end and earliest PM start
      // or fall back to either one
      let boundaryMinutes: number | null = null;
      if (latestAmEnd !== null && earliestPmStart !== null) {
        boundaryMinutes = Math.round((latestAmEnd + earliestPmStart) / 2);
      } else if (earliestPmStart !== null) {
        boundaryMinutes = earliestPmStart;
      } else if (latestAmEnd !== null) {
        boundaryMinutes = latestAmEnd;
      }

      return { amStaff, pmStaff, boundaryMinutes };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!date,
  });

  const staffNames = shiftType === 'AM'
    ? (data?.amStaff ?? [])
    : (data?.pmStaff ?? []);

  return {
    staffNames,
    amStaffNames: data?.amStaff ?? [],
    pmStaffNames: data?.pmStaff ?? [],
    shiftBoundaryMinutes: data?.boundaryMinutes ?? null,
    isLoading,
    error: error as Error | null,
  };
}

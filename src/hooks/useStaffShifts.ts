import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek } from "date-fns";

export interface StaffShift {
  id: string;
  external_id: string;
  user_name: string | null;
  user_email: string | null;
  position: string | null;
  shift_start: string;
  shift_end: string;
  shift_date: string;
  location: string | null;
  status: string | null;
  synced_at: string;
}

export function useStaffShifts(date?: Date) {
  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["staff-shifts", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .eq("shift_date", dateStr)
        .order("shift_start", { ascending: true });

      if (error) throw error;
      return data as StaffShift[];
    },
  });
}

export function useWeeklyStaffShifts(date?: Date) {
  const targetDate = date || new Date();
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });

  return useQuery({
    queryKey: ["staff-shifts-weekly", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .gte("shift_date", format(weekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(weekEnd, "yyyy-MM-dd"))
        .order("shift_date", { ascending: true })
        .order("shift_start", { ascending: true });

      if (error) throw error;
      return data as StaffShift[];
    },
  });
}

export function useSyncSlingShifts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-sling-shifts");
      
      if (error) throw error;
      if (!data.success && data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["staff-shifts-weekly"] });
    },
  });
}

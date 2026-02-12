import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ShiftScheduleItem {
  slingUserId: number;
  staffId: string;
  name: string;
  position: string | null;
  location: string | null;
  shiftStart: string;
  shiftEnd: string;
  isCurrentlyWorking: boolean;
}

export interface CurrentWorkerDetail {
  slingUserId: number;
  staffId: string;
  name: string;
  position: string | null;
  shiftStart: string;
  shiftEnd: string;
}

/**
 * Shape of a user returned by the Sling API (camelCase fields).
 * Not to be confused with `SlingUser` in `src/types/roles.ts` which
 * represents the DB row shape (snake_case fields from the sling_users table).
 */
export interface SlingApiUser {
  slingUserId: number;
  name: string;
  email: string | null;
  isActive: boolean;
}

async function callSlingApi(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("sling-api", {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

// Get today's schedule
export function useTodaysSchedule(date?: string) {
  return useQuery({
    queryKey: ["sling", "schedule", date || "today"],
    queryFn: async () => {
      const result = await callSlingApi("get-todays-schedule", { date });
      return result as { success: boolean; schedule: ShiftScheduleItem[]; date: string };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get current workers
export function useCurrentWorkers() {
  return useQuery({
    queryKey: ["sling", "current-workers"],
    queryFn: async () => {
      const result = await callSlingApi("get-current-workers");
      return result as {
        success: boolean;
        currentlyWorking: string[];
        details: CurrentWorkerDetail[];
        totalShiftsToday: number;
        currentTime: string;
      };
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

// Get FOH shift staff
export function useFohShiftStaff(shiftType: "AM" | "PM") {
  return useQuery({
    queryKey: ["sling", "foh-staff", shiftType],
    queryFn: async () => {
      const result = await callSlingApi("get-foh-shift-staff", { shiftType });
      return result as { success: boolean; staffNames: string[]; shiftType: string; count: number };
    },
  });
}

// Sync users mutation
export function useSyncSlingUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const result = await callSlingApi("sync-users");
      return result as {
        success: boolean;
        users: SlingApiUser[];
        matchedCount: number;
        totalSlingUsers: number;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sling"] });
      queryClient.invalidateQueries({ queryKey: ["slingUsers"] });
      toast({
        title: "Sync Complete",
        description: `Synced ${data.totalSlingUsers} users, matched ${data.matchedCount} to profiles.`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync Sling users:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync users from Sling.",
        variant: "destructive",
      });
    },
  });
}

// Sync shifts mutation
export function useSyncSlingShifts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (date?: string) => {
      const result = await callSlingApi("sync-shifts", { date });
      return result as {
        success: boolean;
        shifts: unknown[];
        totalShifts: number;
        syncedCount: number;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sling"] });
      queryClient.invalidateQueries({ queryKey: ["staffShifts"] });
      toast({
        title: "Shifts Synced",
        description: `Synced ${data.syncedCount} shifts from Sling.`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync Sling shifts:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync shifts from Sling.",
        variant: "destructive",
      });
    },
  });
}

// Get groups (positions)
export function useSlingGroups() {
  return useQuery({
    queryKey: ["sling", "groups"],
    queryFn: async () => {
      const result = await callSlingApi("get-groups");
      return result as { success: boolean; groups: { id: number; name: string }[] };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Get sling users from database
export function useSlingUsers() {
  return useQuery({
    queryKey: ["slingUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sling_users")
        .select("*")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Get staff shifts from database
export function useStaffShifts(date?: string) {
  const targetDate = date || new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["staffShifts", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .eq("shift_date", targetDate)
        .order("shift_start", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Get sync status
export function useSyncStatus() {
  return useQuery({
    queryKey: ["slingSync", "status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_sync_status")
        .select("*")
        .eq("api_name", "sling")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

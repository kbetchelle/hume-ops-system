import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SyncSchedule {
  id: string;
  sync_type: string;
  display_name: string;
  function_name: string;
  interval_minutes: number;
  last_run_at: string | null;
  next_run_at: string | null;
  is_enabled: boolean;
  last_status: string | null;
  last_error: string | null;
  records_synced: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// Fetch all sync schedules
export function useSyncSchedules() {
  return useQuery({
    queryKey: ["syncSchedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_schedule")
        .select("*")
        .order("sync_type", { ascending: true });

      if (error) throw error;
      return data as SyncSchedule[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Update sync schedule
export function useUpdateSyncSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      interval_minutes?: number;
      is_enabled?: boolean;
    }) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase
        .from("sync_schedule")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syncSchedules"] });
      toast({
        title: "Schedule Updated",
        description: "Sync schedule has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update sync schedule:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update sync schedule.",
        variant: "destructive",
      });
    },
  });
}

// Run a specific sync manually
export function useRunSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (syncType: string) => {
      const { data, error } = await supabase.functions.invoke("scheduled-sync-runner", {
        body: { sync_type: syncType },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, syncType) => {
      queryClient.invalidateQueries({ queryKey: ["syncSchedules"] });
      const result = data.results?.[0]?.result;
      toast({
        title: result?.success ? "Sync Completed" : "Sync Failed",
        description: result?.success
          ? `${syncType} synced ${result.syncedCount || 0} records.`
          : `${syncType} sync failed: ${result?.error || "Unknown error"}`,
        variant: result?.success ? "default" : "destructive",
      });
    },
    onError: (error, syncType) => {
      console.error(`Failed to run ${syncType} sync:`, error);
      const message =
        (error as { message?: string })?.message ||
        (error as { error?: string })?.error ||
        `Failed to trigger ${syncType} sync.`;
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

// Helper to get interval options
export function getIntervalOptions() {
  return [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 240, label: "4 hours" },
    { value: 1440, label: "Daily" },
  ];
}

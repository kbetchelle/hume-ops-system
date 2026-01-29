import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface BackfillJob {
  id: string;
  api_source: string;
  data_type: string;
  start_date: string;
  end_date: string;
  processing_date: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
  total_days: number;
  days_processed: number;
  records_processed: number;
  errors: any[];
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export function useBackfillJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all backfill jobs
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["backfill-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backfill_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BackfillJob[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("backfill-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "backfill_jobs",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create new backfill job
  const createJob = useMutation({
    mutationFn: async (params: {
      api_source: "arketa" | "sling";
      data_type: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("backfill-historical", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Backfill started",
        description: `Job ${data.job_id} is now running.`,
      });
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start backfill",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pause job
  const pauseJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke("backfill-historical", {
        body: { job_id: jobId, action: "pause" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Job paused" });
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to pause job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resume job
  const resumeJob = useMutation({
    mutationFn: async (job: BackfillJob) => {
      const { data, error } = await supabase.functions.invoke("backfill-historical", {
        body: {
          api_source: job.api_source,
          data_type: job.data_type,
          start_date: job.start_date,
          end_date: job.end_date,
          job_id: job.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Job resumed" });
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resume job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel job
  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke("backfill-historical", {
        body: { job_id: jobId, action: "cancel" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Job cancelled" });
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("backfill_jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Job deleted" });
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to get active jobs
  const activeJobs = jobs?.filter((j) => j.status === "running" || j.status === "pending") || [];
  const completedJobs = jobs?.filter((j) => j.status === "completed" || j.status === "failed" || j.status === "cancelled") || [];

  return {
    jobs,
    activeJobs,
    completedJobs,
    isLoading,
    error,
    refetch,
    createJob,
    pauseJob,
    resumeJob,
    cancelJob,
    deleteJob,
  };
}

// Data type options by API source
export const DATA_TYPES_BY_SOURCE = {
  arketa: [
    { value: "classes", label: "Classes" },
    { value: "reservations", label: "Reservations" },
    { value: "payments", label: "Payments" },
  ],
  sling: [
    { value: "shifts", label: "Shifts" },
  ],
};

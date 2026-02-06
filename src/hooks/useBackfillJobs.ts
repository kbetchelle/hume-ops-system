import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useCallback } from "react";

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
  last_cursor: string | null;
  batch_cursor: string | null;
  sync_phase: string | null;
  total_records_expected: number | null;
  retry_scheduled_at: string | null;
  staging_synced: boolean | null;
  total_batches_completed: number | null;
  records_in_current_batch: number | null;
  no_more_records: boolean | null;
  last_batch_synced_at: string | null;
  current_batch_count: number | null;
  // Per-batch new vs updated tracking
  records_inserted: number | null;
  records_updated: number | null;
  // Cumulative totals across all batches
  cumulative_inserted: number | null;
  cumulative_updated: number | null;
}

/** Jobs that use per-date backfill (backfill-historical); others use unified-backfill-sync. */
function getBackfillInvokeTarget(job: { api_source: string; data_type: string }): "backfill-historical" | "unified-backfill-sync" {
  if (job.api_source === "arketa" && (job.data_type === "reservations" || job.data_type === "payments")) {
    return "backfill-historical";
  }
  return "unified-backfill-sync";
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Human-readable labels for sync phases
export function getSyncPhaseLabel(phase: string | null): string {
  switch (phase) {
    case 'idle':
      return 'Starting...';
    case 'fetching_api':
      return 'Fetching from API...';
    case 'staging':
      return 'Writing to staging...';
    case 'transforming':
      return 'Transforming data...';
    case 'upserting':
      return 'Syncing to database...';
    case 'clearing_staging':
      return 'Cleaning up...';
    case 'batch_complete':
      return 'Batch complete';
    case 'complete':
      return 'Completed';
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
    default:
      return phase || 'Initializing...';
  }
}

export function useBackfillJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const continuationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    refetchInterval: 2000, // Poll every 2 seconds for live updates
  });

  // Continue a job that's waiting for retry
  const continueJob = useMutation({
    mutationFn: async (job: BackfillJob) => {
      const target = getBackfillInvokeTarget(job);
      const { data, error } = await supabase.functions.invoke(target, {
        body: { job_id: job.id, action: "continue" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      console.error("Failed to continue job:", error);
    },
  });

  // Track which jobs are currently being continued to prevent duplicate calls
  const continuingJobsRef = useRef<Set<string>>(new Set());

  // Check for jobs that need to be continued after their retry_scheduled_at time
  const checkAndContinueJobs = useCallback(() => {
    if (!jobs) return;

    const now = new Date();
    const jobsToRetry = jobs.filter(
      (job) =>
        job.status === "running" &&
        job.retry_scheduled_at &&
        new Date(job.retry_scheduled_at) <= now &&
        !job.no_more_records && // Continue if there's more data to fetch
        job.sync_phase !== 'processing' && // Don't continue if already processing
        !continuingJobsRef.current.has(job.id) // Don't continue if we're already continuing this job
    );

    for (const job of jobsToRetry) {
      // Mark this job as being continued
      continuingJobsRef.current.add(job.id);
      console.log(`[useBackfillJobs] Auto-continuing job ${job.id}`);
      
      continueJob.mutate(job, {
        onSettled: () => {
          // Remove from continuing set when done (success or error)
          continuingJobsRef.current.delete(job.id);
        }
      });
    }
  }, [jobs, continueJob]);

  // Set up auto-continuation timer - check every 3 seconds to reduce race conditions
  useEffect(() => {
    continuationTimerRef.current = setInterval(checkAndContinueJobs, 3000);
    
    // Also check immediately when jobs change (but with a small delay)
    const timeoutId = setTimeout(checkAndContinueJobs, 500);

    return () => {
      if (continuationTimerRef.current) {
        clearInterval(continuationTimerRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [checkAndContinueJobs]);

  // Set up realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("backfill-jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "backfill_jobs",
        },
        (payload) => {
          console.log("[useBackfillJobs] Realtime update:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
        }
      )
      .subscribe((status) => {
        console.log("[useBackfillJobs] Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create new backfill job - uses backfill-historical for arketa reservations/payments, else unified-backfill-sync
  const createJob = useMutation({
    mutationFn: async (params: {
      api_source: "arketa" | "sling";
      data_type: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const useHistorical =
        params.api_source === "arketa" &&
        (params.data_type === "reservations" || params.data_type === "payments");
      const totalDays = daysBetween(params.start_date, params.end_date);

      const insertPayload = {
        api_source: params.api_source,
        data_type: params.data_type,
        start_date: params.start_date,
        end_date: params.end_date,
        status: "pending",
        records_processed: 0,
        total_days: totalDays,
        days_processed: 0,
        created_by: user?.user?.id || null,
        ...(useHistorical
          ? {}
          : {
              sync_phase: "idle",
              total_batches_completed: 0,
              records_in_current_batch: 0,
              no_more_records: false,
            }),
      };

      const { data: newJob, error: insertError } = await supabase
        .from("backfill_jobs")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      const target = useHistorical ? "backfill-historical" : "unified-backfill-sync";
      const body = useHistorical
        ? {
            job_id: newJob.id,
            start_date: newJob.start_date,
            end_date: newJob.end_date,
            api_source: newJob.api_source,
            data_type: newJob.data_type,
            action: "continue",
          }
        : { job_id: newJob.id, action: "continue" };

      const { data, error } = await supabase.functions.invoke(target, { body });

      if (error) throw error;
      return { ...data, job_id: newJob.id };
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

  // Pause job - uses backfill-historical for arketa reservations/payments, else unified-backfill-sync
  const pauseJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data: job, error: fetchError } = await supabase
        .from("backfill_jobs")
        .select("api_source, data_type")
        .eq("id", jobId)
        .single();
      if (fetchError || !job) throw new Error("Job not found");
      const target = getBackfillInvokeTarget(job);
      const { data, error } = await supabase.functions.invoke(target, {
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

  // Resume job - uses backfill-historical for arketa reservations/payments, else unified-backfill-sync
  const resumeJob = useMutation({
    mutationFn: async (job: BackfillJob) => {
      const target = getBackfillInvokeTarget(job);
      const { data, error } = await supabase.functions.invoke(target, {
        body: { job_id: job.id, action: "continue" },
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

  // Cancel job - uses backfill-historical for arketa reservations/payments, else unified-backfill-sync
  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data: job, error: fetchError } = await supabase
        .from("backfill_jobs")
        .select("api_source, data_type")
        .eq("id", jobId)
        .single();
      if (fetchError || !job) throw new Error("Job not found");
      const target = getBackfillInvokeTarget(job);
      const { data, error } = await supabase.functions.invoke(target, {
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

  // Helper to get active jobs (includes jobs waiting for retry)
  const activeJobs = jobs?.filter(
    (j) => j.status === "running" || j.status === "pending" || j.status === "paused"
  ) || [];
  
  const completedJobs = jobs?.filter(
    (j) => j.status === "completed" || j.status === "failed" || j.status === "cancelled"
  ) || [];

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
    continueJob,
    getSyncPhaseLabel,
  };
}

// Data type options by API source (Arketa: reservations, subscriptions, payments only)
export const DATA_TYPES_BY_SOURCE = {
  arketa: [
    { value: "reservations", label: "Reservations" },
    { value: "subscriptions", label: "Subscriptions" },
    { value: "payments", label: "Payments" },
  ],
  sling: [
    { value: "shifts", label: "Shifts" },
  ],
};

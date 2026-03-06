import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("[useBackfillJobs]");

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

/** Backfill jobs use run-backfill-job (arketa-gym-flow style). */
function getBackfillInvokeTarget(job: { api_source: string; data_type: string }): "run-backfill-job" {
  return "run-backfill-job";
}

/** Build a user-facing message from an edge function invoke error (e.g. 404 with error_message in body). */
async function getInvokeErrorMessage(
  error: unknown,
  /** Function name used for deploy hint when 404 (function not found). */
  functionName?: string
): Promise<string> {
  const fallback = error instanceof Error ? error.message : String(error);
  try {
    const ctx = (error as { context?: Response })?.context;
    if (!ctx || typeof (ctx as Response).json !== "function") return fallback;

    const res = ctx as Response;
    const status = res.status;

    let body: Record<string, unknown> | null = null;
    try {
      const parsed = await res.json().catch(() => null);
      if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
    } catch {
      // ignore
    }

    if (body?.error != null || body?.error_message != null) {
      const parts = [String(body.error ?? "Request failed")];
      if (body.error_message) parts.push(String(body.error_message));
      if (body.job_id) parts.push(`(job_id: ${body.job_id})`);
      return parts.join(" — ");
    }

    if (status === 404 && functionName) {
      const deployHint = `Deploy: supabase functions deploy run-backfill-job sync-arketa-reservations sync-arketa-payments sync-from-staging`;
      return `Edge function "${functionName}" not found (404). ${deployHint}`;
    }

    if (status === 404) {
      return `Not found (404). Deploy: supabase functions deploy run-backfill-job sync-arketa-reservations sync-from-staging`;
    }
  } catch {
    // ignore
  }
  return fallback;
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
    // Realtime subscription (below) handles live updates; no polling needed.
  });

  // Continue a job (run-backfill-job self-continues; this is for backwards compat only)
  const continueJob = useMutation({
    mutationFn: async (_job: BackfillJob) => {
      // run-backfill-job self-invokes for next batch - no manual continue needed
      return { success: true, skipped: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
    },
    onError: (error: Error) => {
      logger.error("Failed to continue job:", error);
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
      logger.log(`Auto-continuing job ${job.id}`);
      
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
          logger.log("Realtime update:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["backfill-jobs"] });
        }
      )
      .subscribe((status) => {
        logger.log("Realtime subscription status:", status);
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
      const totalDays = daysBetween(params.start_date, params.end_date);

      const jobType = `${params.api_source}_${params.data_type}`;
      const insertPayload = {
        api_source: params.api_source,
        data_type: params.data_type,
        job_type: jobType,
        start_date: params.start_date,
        end_date: params.end_date,
        status: "pending",
        records_processed: 0,
        total_days: totalDays,
        days_processed: 0,
        created_by: user?.user?.id || null,
        total_dates: totalDays,
        completed_dates: 0,
        total_records: 0,
        total_new_records: 0,
        results: [],
      };

      const { data: newJob, error: insertError } = await supabase
        .from("backfill_jobs")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      const target = getBackfillInvokeTarget(params);
      const body = { jobId: newJob.id, action: "start" };

      const { data, error } = await supabase.functions.invoke(target, { body });

      if (error) {
        const message = await getInvokeErrorMessage(error, target);
        throw new Error(message);
      }
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

  // Cancel job - uses run-backfill-job
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
        body: { jobId, action: "cancel" },
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

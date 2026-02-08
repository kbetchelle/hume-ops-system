import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Pause,
  AlertTriangle,
  Activity,
  Timer,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface SyncScheduleRow {
  id: string;
  sync_type: string;
  display_name: string;
  function_name: string;
  interval_minutes: number;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  records_synced: number | null;
  failure_count: number | null;
}

interface BackfillJobRow {
  id: string;
  api_source: string;
  data_type: string;
  status: string;
  start_date: string;
  end_date: string;
  total_days: number;
  days_processed: number;
  records_processed: number;
  total_records: number | null;
  total_new_records: number | null;
  completed_dates: number | null;
  sync_phase: string | null;
  processing_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  results: any[] | null;
  cumulative_inserted: number | null;
  cumulative_updated: number | null;
}

function StatusBadge({ status, isEnabled }: { status: string | null; isEnabled: boolean }) {
  if (!isEnabled) return <Badge variant="secondary" className="gap-1"><Pause className="h-3 w-3" />Disabled</Badge>;
  if (!status) return <Badge variant="outline">Never run</Badge>;
  switch (status) {
    case "success":
      return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
    case "failed":
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    case "timeout":
      return <Badge variant="destructive" className="gap-1"><Timer className="h-3 w-3" />Timeout</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function CronStatusCard({ schedule }: { schedule: SyncScheduleRow }) {
  const isOverdue = schedule.is_enabled && schedule.next_run_at && new Date(schedule.next_run_at) < new Date();
  const isWaiting = schedule.is_enabled && schedule.last_status === "success" && !isOverdue;

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${isOverdue ? "border-yellow-500/50 bg-yellow-500/5" : "border-border bg-muted/30"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {isOverdue && <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />}
          {isWaiting && <Clock className="h-4 w-4 text-muted-foreground shrink-0 animate-pulse" />}
          <span className="font-medium text-sm truncate">{schedule.display_name}</span>
        </div>
        <StatusBadge status={schedule.last_status} isEnabled={schedule.is_enabled} />
        {(schedule.failure_count ?? 0) >= 3 && (
          <Badge variant="destructive" className="text-xs">
            {schedule.failure_count} failures
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        {schedule.records_synced != null && schedule.records_synced > 0 && (
          <span>{schedule.records_synced} synced</span>
        )}
        <span className="font-mono">every {schedule.interval_minutes}m</span>
        {schedule.next_run_at && schedule.is_enabled && (
          <span className={isOverdue ? "text-yellow-600 font-medium" : ""}>
            {isOverdue ? "overdue " : "next "}
            {formatDistanceToNow(new Date(schedule.next_run_at), { addSuffix: !isOverdue })}
          </span>
        )}
        {schedule.last_run_at && (
          <span>ran {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true })}</span>
        )}
      </div>
    </div>
  );
}

function BackfillJobCard({ job }: { job: BackfillJobRow }) {
  const isActive = job.status === "running" || job.status === "pending";
  const resultEntries = (job.results ?? []) as Array<{
    date: string;
    recordCount: number;
    newRecords: number;
    existingBefore: number;
    success: boolean;
    error?: string;
  }>;
  const totalPulled = resultEntries.reduce((s, r) => s + (r.recordCount || 0), 0);
  const totalNew = resultEntries.reduce((s, r) => s + (r.newRecords || 0), 0);
  const failedDates = resultEntries.filter((r) => !r.success).length;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isActive ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <span className="font-medium text-sm capitalize">
            {job.api_source} {job.data_type}
          </span>
          <Badge variant={job.status === "completed" ? "default" : job.status === "failed" || job.status === "cancelled" ? "destructive" : "outline"}>
            {job.status}
          </Badge>
          {job.sync_phase && job.sync_phase !== "idle" && (
            <Badge variant="outline" className="text-xs capitalize">{job.sync_phase}</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {format(new Date(job.created_at), "MMM d, HH:mm")}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-mono">{job.start_date}</span>
        <span>→</span>
        <span className="font-mono">{job.end_date}</span>
        <span className="text-muted-foreground ml-2">({job.total_days}d)</span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">Pulled</Badge>
          <span className="font-semibold">{(job.total_records ?? totalPulled).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-green-600">New</Badge>
          <span className="font-semibold">{(job.total_new_records ?? totalNew).toLocaleString()}</span>
        </div>
        {(job.cumulative_inserted ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">Inserted</Badge>
            <span className="font-semibold">{(job.cumulative_inserted ?? 0).toLocaleString()}</span>
          </div>
        )}
        {(job.cumulative_updated ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">Updated</Badge>
            <span className="font-semibold">{(job.cumulative_updated ?? 0).toLocaleString()}</span>
          </div>
        )}
        {failedDates > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="destructive">Failed dates</Badge>
            <span className="font-semibold">{failedDates}</span>
          </div>
        )}
      </div>

      {isActive && job.processing_date && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing {job.processing_date}
          <span>({job.completed_dates ?? 0}/{job.total_days} dates)</span>
        </div>
      )}

      {/* Per-date result log */}
      {resultEntries.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1 pt-1 border-t border-border/50">
          {resultEntries.map((r, i) => (
            <div key={r.date + i} className="flex items-center justify-between text-xs px-1.5 py-1 rounded bg-muted/40">
              <div className="flex items-center gap-1.5">
                {r.success ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="font-mono">{r.date}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <span>{r.recordCount} pulled</span>
                <span className="text-green-600">+{r.newRecords} new</span>
                <span>{r.existingBefore} existed</span>
                {r.error && (
                  <span className="text-destructive truncate max-w-[120px]" title={r.error}>{r.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SyncMonitorTab() {
  // Live cron schedules
  const { data: schedules } = useQuery({
    queryKey: ["sync-monitor-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_schedule")
        .select("*")
        .order("next_run_at", { ascending: true });
      if (error) throw error;
      return data as unknown as SyncScheduleRow[];
    },
    refetchInterval: 5000,
  });

  // Active backfill jobs
  const { data: activeJobs } = useQuery({
    queryKey: ["sync-monitor-active-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backfill_jobs")
        .select("*")
        .in("status", ["pending", "running"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BackfillJobRow[];
    },
    refetchInterval: 2000,
  });

  // Completed backfill history
  const { data: jobHistory } = useQuery({
    queryKey: ["sync-monitor-job-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backfill_jobs")
        .select("*")
        .in("status", ["completed", "failed", "cancelled"])
        .order("completed_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as BackfillJobRow[];
    },
    refetchInterval: 10000,
  });

  const enabledSchedules = (schedules ?? []).filter((s) => s.is_enabled);
  const disabledSchedules = (schedules ?? []).filter((s) => !s.is_enabled);
  const overdueCount = enabledSchedules.filter(
    (s) => s.next_run_at && new Date(s.next_run_at) < new Date()
  ).length;
  const failingCount = enabledSchedules.filter(
    (s) => s.last_status === "failed" || s.last_status === "timeout"
  ).length;

  return (
    <div className="space-y-6">
      {/* Active Backfill Jobs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Active Syncs
            {(activeJobs?.length ?? 0) > 0 && (
              <Badge className="bg-primary">{activeJobs?.length} running</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(activeJobs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No active backfill jobs running.</p>
          ) : (
            <div className="space-y-3">
              {activeJobs!.map((job) => (
                <BackfillJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cron / Scheduled Syncs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Syncs (Cron)
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdueCount} overdue
              </Badge>
            )}
            {failingCount > 0 && overdueCount === 0 && (
              <Badge variant="destructive">{failingCount} failing</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Live status of recurring sync cycles. Overdue jobs are waiting to start their next cycle.
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {enabledSchedules.map((s) => (
            <CronStatusCard key={s.id} schedule={s} />
          ))}
          {disabledSchedules.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2">Disabled</p>
              {disabledSchedules.map((s) => (
                <CronStatusCard key={s.id} schedule={s} />
              ))}
            </>
          )}
          {(schedules?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No scheduled syncs configured.</p>
          )}
        </CardContent>
      </Card>

      {/* Sync Log History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sync Log History</CardTitle>
          <p className="text-xs text-muted-foreground">
            Past backfill jobs with records pulled and successfully added.
          </p>
        </CardHeader>
        <CardContent>
          {(jobHistory?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No completed sync jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {jobHistory!.map((job) => (
                <BackfillJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

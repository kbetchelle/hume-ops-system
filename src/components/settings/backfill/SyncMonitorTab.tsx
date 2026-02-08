import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

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

function statusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "completed": return "default";
    case "failed":
    case "cancelled": return "destructive";
    case "running":
    case "pending": return "outline";
    default: return "secondary";
  }
}

function JobRow({ job }: { job: BackfillJobRow }) {
  const isActive = job.status === "running" || job.status === "pending";
  const pulled = job.total_records ?? 0;
  const newRec = job.total_new_records ?? 0;
  const inserted = job.cumulative_inserted ?? 0;
  const updated = job.cumulative_updated ?? 0;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${isActive ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
      {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}

      {/* Name */}
      <span className="font-medium capitalize whitespace-nowrap">
        {job.api_source} {job.data_type}
      </span>

      {/* Status */}
      <Badge variant={statusVariant(job.status)} className="text-xs uppercase">
        {job.status}
      </Badge>

      {job.sync_phase && job.sync_phase !== "idle" && (
        <Badge variant="secondary" className="text-xs capitalize">{job.sync_phase}</Badge>
      )}

      {/* Date range */}
      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
        {job.start_date} → {job.end_date}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-2 ml-auto text-xs whitespace-nowrap">
        {pulled > 0 && <span><span className="text-muted-foreground">Pulled</span> <strong>{pulled.toLocaleString()}</strong></span>}
        {newRec > 0 && <span className="text-green-600">+{newRec.toLocaleString()} new</span>}
        {inserted > 0 && <span><span className="text-muted-foreground">Ins</span> {inserted.toLocaleString()}</span>}
        {updated > 0 && <span><span className="text-muted-foreground">Upd</span> {updated.toLocaleString()}</span>}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
        {format(new Date(job.completed_at || job.created_at), "MMM d, HH:mm")}
      </span>
    </div>
  );
}

export default function SyncMonitorTab() {
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

  const { data: jobHistory } = useQuery({
    queryKey: ["sync-monitor-job-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backfill_jobs")
        .select("*")
        .in("status", ["completed", "failed", "cancelled"])
        .order("completed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as BackfillJobRow[];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 max-w-none">
      {/* Active */}
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
            <div className="space-y-1.5">
              {activeJobs!.map((job) => <JobRow key={job.id} job={job} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sync Log</CardTitle>
        </CardHeader>
        <CardContent>
          {(jobHistory?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No completed sync jobs yet.</p>
          ) : (
            <div className="space-y-1.5">
              {jobHistory!.map((job) => <JobRow key={job.id} job={job} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Activity } from "lucide-react";
import { format } from "date-fns";

interface BackfillJobRow {
  id: string;
  api_source: string;
  data_type: string;
  status: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_records: number | null;
  total_new_records: number | null;
  sync_phase: string | null;
  completed_at: string | null;
  created_at: string;
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

function JobTableRow({ job }: { job: BackfillJobRow }) {
  const isActive = job.status === "running" || job.status === "pending";
  return (
    <TableRow>
      <TableCell className="font-medium capitalize whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          {isActive && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
          {job.api_source} {job.data_type}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariant(job.status)} className="text-[11px] uppercase">{job.status}</Badge>
          {job.sync_phase && job.sync_phase !== "idle" && (
            <Badge variant="secondary" className="text-[11px] capitalize">{job.sync_phase}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs whitespace-nowrap">{job.start_date} → {job.end_date}</TableCell>
      <TableCell className="text-right tabular-nums">{(job.total_records ?? 0).toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums text-green-600">{(job.total_new_records ?? 0).toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{(job.cumulative_inserted ?? 0).toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{(job.cumulative_updated ?? 0).toLocaleString()}</TableCell>
      <TableCell className="text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(job.completed_at || job.created_at), "MMM d, HH:mm")}
      </TableCell>
    </TableRow>
  );
}

function JobTable({ jobs }: { jobs: BackfillJobRow[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Range</TableHead>
            <TableHead className="text-right">Pulled</TableHead>
            <TableHead className="text-right">New</TableHead>
            <TableHead className="text-right">Inserted</TableHead>
            <TableHead className="text-right">Updated</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => <JobTableRow key={job.id} job={job} />)}
        </TableBody>
      </Table>
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
    <div className="space-y-6 min-w-0">
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
        <CardContent className="p-0">
          {(activeJobs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-4">No active backfill jobs running.</p>
          ) : (
            <JobTable jobs={activeJobs!} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sync Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(jobHistory?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-4">No completed sync jobs yet.</p>
          ) : (
            <JobTable jobs={jobHistory!} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

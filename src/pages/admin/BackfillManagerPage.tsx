import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useBackfillJobs, DATA_TYPES_BY_SOURCE, BackfillJob } from "@/hooks/useBackfillJobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  Play, 
  Pause, 
  X, 
  ChevronDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Database,
  Trash2,
  RefreshCw
} from "lucide-react";
import { format, differenceInSeconds, differenceInMinutes, differenceInHours, formatDistanceToNow } from "date-fns";

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "-";
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  
  const hours = differenceInHours(end, start);
  const minutes = differenceInMinutes(end, start) % 60;
  const seconds = differenceInSeconds(end, start) % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getStatusBadge(status: string, retryScheduledAt: string | null) {
  const isWaitingForRetry = status === "running" && retryScheduledAt && new Date(retryScheduledAt) > new Date();
  
  if (isWaitingForRetry) {
    return (
      <Badge className="bg-warning/20 text-warning-foreground border-warning/50">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Waiting...
      </Badge>
    );
  }
  
  switch (status) {
    case "running":
      return <Badge className="bg-primary/20 text-primary border-primary/50">Running</Badge>;
    case "completed":
      return <Badge className="bg-accent/20 text-accent-foreground border-accent/50">Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelled</Badge>;
    case "paused":
      return <Badge className="bg-muted text-muted-foreground border-border">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ActiveJobCard({
  job,
  onPause, 
  onResume, 
  onCancel,
  onContinue
}: { 
  job: BackfillJob; 
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  // For clients, show records-based progress instead of days
  const isClientSync = job.data_type === "clients";
  const isWaitingForRetry = job.status === "running" && job.retry_scheduled_at && new Date(job.retry_scheduled_at) > new Date();
  
  // For clients, estimate progress based on records (assume ~5000 total if unknown)
  const estimatedTotal = job.total_records_expected || 5000;
  const progress = isClientSync 
    ? Math.min((job.records_processed / estimatedTotal) * 100, 99) // Cap at 99% until complete
    : job.total_days > 0 ? (job.days_processed / job.total_days) * 100 : 0;
    
  const isPaused = job.status === "paused";
  const isRunning = job.status === "running" && !isWaitingForRetry;

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {job.api_source.toUpperCase()} - {job.data_type}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(job.start_date), "MMM d, yyyy")} → {format(new Date(job.end_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {getStatusBadge(job.status, job.retry_scheduled_at)}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              {isClientSync ? (
                <>
                  <span>Records synced: {job.records_processed.toLocaleString()}</span>
                  <span>{job.last_cursor ? "In progress..." : "Starting..."}</span>
                </>
              ) : (
                <>
                  <span>Progress: {job.days_processed} / {job.total_days} days</span>
                  <span>{Math.round(progress)}%</span>
                </>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {isWaitingForRetry && job.retry_scheduled_at && (
            <div className="bg-warning/10 border border-warning/30 rounded p-3">
              <p className="text-xs text-warning-foreground flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                Continuing {formatDistanceToNow(new Date(job.retry_scheduled_at), { addSuffix: true })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-medium">{job.records_processed.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Records</p>
            </div>
            <div>
              <p className="text-lg font-medium">
                {isClientSync 
                  ? (job.last_cursor ? "Paginating" : "Starting")
                  : (job.processing_date ? format(new Date(job.processing_date), "MMM d") : "-")
                }
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {isClientSync ? "Status" : "Current Date"}
              </p>
            </div>
            <div>
              <p className="text-lg font-medium">{formatDuration(job.started_at, null)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Elapsed</p>
            </div>
          </div>

          <div className="flex gap-2">
            {isRunning && (
              <Button variant="outline" size="sm" onClick={onPause} className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button variant="outline" size="sm" onClick={onResume} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            {isWaitingForRetry && (
              <Button variant="outline" size="sm" onClick={onContinue} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Continue Now
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={onCancel} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletedJobRow({ 
  job, 
  onDelete 
}: { 
  job: BackfillJob; 
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasErrors = job.errors && job.errors.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {job.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : job.status === "failed" ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {job.api_source.toUpperCase()} - {job.data_type}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(job.start_date), "MMM d")} - {format(new Date(job.end_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm">{job.records_processed.toLocaleString()} records</p>
              <p className="text-xs text-muted-foreground">{formatDuration(job.started_at, job.completed_at)}</p>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(job.status, null)}
              {hasErrors && (
                <Badge variant="destructive" className="text-[10px]">
                  {job.errors.length} errors
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasErrors && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="mt-4 p-4 bg-secondary/30 rounded">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Error Log</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {job.errors.map((err, idx) => (
                <div key={idx} className="text-xs font-mono">
                  <span className="text-muted-foreground">{err.date || err.timestamp}:</span>{" "}
                  <span className="text-destructive">{err.error}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function BackfillManagerPage() {
  const { 
    activeJobs, 
    completedJobs, 
    isLoading, 
    createJob, 
    pauseJob, 
    resumeJob, 
    cancelJob,
    deleteJob,
    continueJob
  } = useBackfillJobs();

  const [apiSource, setApiSource] = useState<"arketa" | "sling">("arketa");
  const [dataType, setDataType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dataTypes = DATA_TYPES_BY_SOURCE[apiSource];

  const handleCreateJob = () => {
    if (!dataType || !startDate || !endDate) return;
    createJob.mutate({
      api_source: apiSource,
      data_type: dataType,
      start_date: startDate,
      end_date: endDate,
    });
    // Reset form
    setDataType("");
    setStartDate("");
    setEndDate("");
  };

  const estimatedRecords = () => {
    if (!startDate || !endDate) return null;
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    // Rough estimates - clients is not date-based
    if (dataType === "clients") return "All clients (unlimited)";
    const avgPerDay = dataType === "classes" ? 20 : dataType === "reservations" ? 100 : 50;
    return days * avgPerDay;
  };

  return (
    <DashboardLayout title="Backfill Manager">
      <div className="space-y-8">
        {/* Create New Backfill */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Create New Backfill</CardTitle>
            <CardDescription>Import historical data from external APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>API Source</Label>
                <Select value={apiSource} onValueChange={(v) => { setApiSource(v as "arketa" | "sling"); setDataType(""); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arketa">Arketa</SelectItem>
                    <SelectItem value="sling">Sling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleCreateJob}
                  disabled={!dataType || !startDate || !endDate || createJob.isPending}
                  className="w-full md:min-w-[160px]"
                >
                  {createJob.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Backfill
                </Button>
              </div>
            </div>

            {dataType && startDate && endDate && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {dataType === "clients" 
                    ? "Will sync all clients (cursor-based pagination, auto-resumes)"
                    : `Estimated ~${typeof estimatedRecords() === 'number' ? estimatedRecords()?.toLocaleString() : estimatedRecords()} records`
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Backfills */}
        {activeJobs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Active Backfills</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeJobs.map((job) => (
                <ActiveJobCard
                  key={job.id}
                  job={job}
                  onPause={() => pauseJob.mutate(job.id)}
                  onResume={() => resumeJob.mutate(job)}
                  onCancel={() => cancelJob.mutate(job.id)}
                  onContinue={() => continueJob.mutate(job)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Backfills */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Backfill History</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : completedJobs.length > 0 ? (
            <Card className="border-border">
              <CardContent className="pt-6">
                {completedJobs.map((job) => (
                  <CompletedJobRow
                    key={job.id}
                    job={job}
                    onDelete={() => deleteJob.mutate(job.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-sm">No completed backfills yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

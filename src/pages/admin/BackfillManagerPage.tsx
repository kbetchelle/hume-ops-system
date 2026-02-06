import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useBackfillJobs, DATA_TYPES_BY_SOURCE, BackfillJob, getSyncPhaseLabel } from "@/hooks/useBackfillJobs";
import { useCSVImport } from "@/hooks/useCSVImport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SyncPhaseIndicator } from "@/components/backfill/SyncPhaseIndicator";
import { CSVImportMapper } from "@/components/backfill/CSVImportMapper";
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
  RefreshCw,
  ChevronRight,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { format, differenceInSeconds, differenceInMinutes, differenceInHours, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

function getStatusBadge(status: string, syncPhase: string | null) {
  const isActivePhase = syncPhase && !["idle", "complete", "paused", "cancelled"].includes(syncPhase);
  
  if (status === "running" && isActivePhase) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/50">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Processing
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
    case "pending":
      return <Badge variant="outline">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function truncateCursor(cursor: string | null, maxLength: number = 20): string {
  if (!cursor) return "-";
  if (cursor.length <= maxLength) return cursor;
  return `${cursor.slice(0, maxLength)}...`;
}

// Countdown timer for next batch
function NextBatchCountdown({ targetTime }: { targetTime: string }) {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const target = new Date(targetTime);
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const diffSecs = Math.ceil(diffMs / 1000);
  
  if (diffSecs <= 0) {
    return (
      <span className="text-sm font-medium text-primary flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Starting...
      </span>
    );
  }
  
  return (
    <span className="text-sm font-mono font-medium">{diffSecs}s</span>
  );
}

// Visual sync cycle progress indicator
function SyncCycleProgress({ phase }: { phase: string | null }) {
  const phases = [
    { key: 'fetching_api', label: 'Fetch', short: 'F' },
    { key: 'staging', label: 'Stage', short: 'S' },
    { key: 'transforming', label: 'Transform', short: 'T' },
    { key: 'upserting', label: 'Upsert', short: 'U' },
    { key: 'clearing_staging', label: 'Clear', short: 'C' },
  ];

  const currentIndex = phases.findIndex(p => p.key === phase);
  const isComplete = phase === 'batch_complete' || phase === 'complete';

  return (
    <div className="flex items-center gap-1">
      {phases.map((p, idx) => {
        const isActive = p.key === phase;
        const isPast = currentIndex > idx || isComplete;
        
        return (
          <div key={p.key} className="flex items-center">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                isPast && !isActive && "bg-primary/20 text-primary",
                !isActive && !isPast && "bg-muted text-muted-foreground"
              )}
              title={p.label}
            >
              {isPast && !isActive ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                p.short
              )}
            </div>
            {idx < phases.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 mx-0.5",
                (isPast || isComplete) ? "bg-primary/50" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
      {isComplete && (
        <div className="ml-2 flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Done
        </div>
      )}
    </div>
  );
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [, setTick] = useState(0);
  
  // Force re-render every second for live elapsed time updates
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Debug: Log when component mounts to verify code is running
  useEffect(() => {
    console.log('[ActiveJobCard] Component mounted for job:', job.id, 'status:', job.status);
  }, [job.id, job.status]);

  const isPaused = job.status === "paused";
  const isRunning = job.status === "running";
  const isWaitingForRetry = isRunning && job.retry_scheduled_at && new Date(job.retry_scheduled_at) > new Date();
  const isActivelyProcessing = isRunning && !isWaitingForRetry && job.sync_phase && 
    !["idle", "complete", "batch_complete"].includes(job.sync_phase);
  
  // Button handlers with logging
  const handlePause = () => {
    console.log('[ActiveJobCard] Pause clicked for job:', job.id);
    onPause();
  };
  
  const handleResume = () => {
    console.log('[ActiveJobCard] Resume clicked for job:', job.id);
    onResume();
  };
  
  const handleCancel = () => {
    console.log('[ActiveJobCard] Cancel clicked for job:', job.id);
    onCancel();
  };
  
  const handleContinue = () => {
    console.log('[ActiveJobCard] Continue clicked for job:', job.id);
    onContinue();
  };
  
  const handleViewDetails = () => {
    console.log('[ActiveJobCard] View Details clicked, current state:', isDetailsOpen);
    setIsDetailsOpen(!isDetailsOpen);
  };

  // Calculate progress
  const hasKnownTotal = Boolean(job.total_records_expected && job.total_records_expected > 0);
  const progress = hasKnownTotal 
    ? Math.min((job.records_processed / job.total_records_expected) * 100, 100)
    : null;

  // Get batch status text
  const getBatchStatusText = () => {
    const batchNum = (job.total_batches_completed || 0) + 1;
    switch (job.sync_phase) {
      case "fetching_api":
        return `Fetching batch ${batchNum}...`;
      case "staging":
        return `Staging batch ${batchNum}...`;
      case "transforming":
        return `Transforming batch ${batchNum}...`;
      case "upserting":
        return `Syncing batch ${batchNum}...`;
      case "clearing_staging":
        return `Cleaning batch ${batchNum}...`;
      case "batch_complete":
        return `Batch ${batchNum - 1} complete`;
      default:
        return getSyncPhaseLabel(job.sync_phase);
    }
  };

  const hasErrors = job.errors && job.errors.length > 0;

  return (
    <Card 
      className={cn(
        "border-border transition-all w-full",
        isActivelyProcessing && "ring-1 ring-primary/30"
      )}
      onClick={(e) => {
        console.log('[ActiveJobCard] Card clicked, target:', (e.target as HTMLElement).tagName, (e.target as HTMLElement).className);
      }}
    >
      <CardContent className="pt-6">
        {/* Main horizontal layout */}
        <div className="flex flex-col gap-4">
          {/* Top row: Header and stats */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            {/* Left: Header and Phase Indicator */}
            <div className="lg:w-[300px] lg:shrink-0 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className={cn(
                    "h-5 w-5",
                    isActivelyProcessing ? "text-primary animate-pulse" : "text-muted-foreground"
                  )} />
                  <div>
                    <h4 className="text-sm font-medium">
                      {job.api_source.toUpperCase()} - {job.data_type}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.start_date), "MMM d, yyyy")} → {format(new Date(job.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {getStatusBadge(job.status, job.sync_phase)}
              </div>

              {/* Sync Phase Indicator */}
              <SyncPhaseIndicator phase={job.sync_phase} />

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{getBatchStatusText()}</span>
                  {progress !== null && <span>{Math.round(progress)}%</span>}
                </div>
                {progress !== null ? (
                  <Progress value={progress} className="h-2" />
                ) : (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-primary/50 rounded-full",
                        isActivelyProcessing && "animate-pulse"
                      )}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
                {job.records_in_current_batch > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Current batch: {job.records_in_current_batch.toLocaleString()} records
                  </p>
                )}
              </div>

              {/* Waiting for retry notice */}
              {isWaitingForRetry && job.retry_scheduled_at && (
                <div className="bg-warning/10 border border-warning/30 rounded p-3">
                  <p className="text-xs text-warning-foreground flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Continuing {formatDistanceToNow(new Date(job.retry_scheduled_at), { addSuffix: true })}
                  </p>
                </div>
              )}
              
              {/* Error notice - especially for duplicate batches */}
              {hasErrors && (
                <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
                  <p className="text-xs text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {job.errors?.[0]?.error || 'An error occurred during sync'}
                  </p>
                </div>
              )}
              
              {/* Warning if inserted count seems wrong */}
              {job.records_processed > 0 && (job.cumulative_inserted || 0) === 0 && (job.cumulative_updated || 0) === job.records_processed && (
                <div className="bg-warning/10 border border-warning/30 rounded p-3">
                  <p className="text-xs text-warning-foreground flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    All records appear to be updates - API may be returning duplicate data
                  </p>
                </div>
              )}
            </div>

            {/* Bottom row: Stats and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch flex-1">
              {/* Center: Stats */}
              <div className="flex items-center justify-around gap-2 sm:gap-4 flex-1 px-2 sm:px-4 py-2 bg-muted/30 rounded-lg overflow-x-auto">
                <div className="text-center min-w-[60px] flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold">{job.records_processed.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fetched</p>
                </div>
                <div className="text-center min-w-[60px] flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-primary">{(job.cumulative_inserted || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inserted</p>
                </div>
                <div className="text-center min-w-[60px] flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold">{(job.cumulative_updated || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Updated</p>
                </div>
                <div className="text-center min-w-[55px] flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold">{job.total_batches_completed || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Batches</p>
                </div>
                <div className="text-center min-w-[60px] flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-accent-foreground">{formatDuration(job.started_at, null)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Elapsed</p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="sm:shrink-0 sm:w-[240px] space-y-2 relative z-50">
                {/* Action buttons in fixed grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Pause/Resume Button */}
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={handleResume}
                      className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer relative z-50"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePause}
                      className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer relative z-50"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </button>
                  )}
                  
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md cursor-pointer relative z-50"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
                
                {/* Continue Now Button - Only when waiting for retry */}
                {isWaitingForRetry && (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer relative z-50"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Now
                  </button>
                )}
                
                {/* Empty spacer when Continue button is hidden to maintain layout */}
                {!isWaitingForRetry && <div className="h-9" />}
                
                {/* View Details Toggle */}
                <button
                  type="button"
                  onClick={handleViewDetails}
                  className="w-full inline-flex items-center justify-start h-9 px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer relative z-50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <ChevronRight className={cn(
                    "h-4 w-4 mr-2 transition-transform",
                    isDetailsOpen && "rotate-90"
                  )} />
                  View Details
                </button>
              </div>
            </div>
          </div>

          {/* Estimated remaining */}
          {hasKnownTotal && job.total_records_expected > job.records_processed && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              ~{(job.total_records_expected - job.records_processed).toLocaleString()} records remaining
            </p>
          )}

          {/* Expandable Details Section */}
          {isDetailsOpen && (
            <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-4 text-sm">
              {/* Next Batch Countdown */}
              {isWaitingForRetry && job.retry_scheduled_at && (
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Next Batch</span>
                  </div>
                  <NextBatchCountdown targetTime={job.retry_scheduled_at} />
                </div>
              )}

              {/* Records Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{job.records_processed.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Synced</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center border-l-2 border-primary/30">
                  <p className="text-2xl font-bold text-primary">{(job.cumulative_inserted || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">New Records</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center border-l-2 border-accent/30">
                  <p className="text-2xl font-bold text-accent-foreground">{(job.cumulative_updated || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Updated</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{job.records_in_current_batch || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Last Batch</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{job.total_batches_completed || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Batches</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{formatDuration(job.started_at, null)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Elapsed</p>
                </div>
              </div>

              {/* Last Batch Breakdown */}
              {(job.records_inserted > 0 || job.records_updated > 0) && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Last Batch Breakdown</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      <span className="text-primary font-medium">{job.records_inserted || 0}</span> new
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">
                      <span className="font-medium">{job.records_updated || 0}</span> updated
                    </span>
                  </div>
                </div>
              )}

              {/* Sync Cycle Progress */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current Sync Cycle</p>
                <SyncCycleProgress phase={job.sync_phase} />
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date Range</p>
                  <p className="font-mono text-xs">{job.start_date} → {job.end_date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Batch Synced</p>
                  <p className="font-mono text-xs">
                    {job.last_batch_synced_at 
                      ? formatDistanceToNow(new Date(job.last_batch_synced_at), { addSuffix: true })
                      : "-"
                    }
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Cursor Position</p>
                <p className="font-mono text-xs" title={job.batch_cursor || job.last_cursor || undefined}>
                  {truncateCursor(job.batch_cursor || job.last_cursor, 60)}
                </p>
              </div>

              {hasErrors && (
                <div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                  <div className="mt-1 max-h-24 overflow-y-auto space-y-1">
                    {job.errors.slice(0, 5).map((err: any, idx: number) => (
                      <p key={idx} className="text-xs text-destructive font-mono">
                        {err.error || err.message || JSON.stringify(err)}
                      </p>
                    ))}
                    {job.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{job.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
              <p className="text-sm">
                {job.records_processed.toLocaleString()} records
                {job.total_batches_completed > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({job.total_batches_completed} batches)
                  </span>
                )}
              </p>
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
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="mt-4 p-4 bg-secondary/30 rounded space-y-4">
            {/* Record Breakdown - New Feature */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{job.records_processed.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Synced</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center border-l-2 border-primary/30">
                <p className="text-xl font-bold text-primary">{(job.cumulative_inserted || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">New Records</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center border-l-2 border-accent/30">
                <p className="text-xl font-bold text-accent-foreground">{(job.cumulative_updated || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Updated</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date Range</p>
                <p className="font-mono text-xs">{job.start_date} → {job.end_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Batches</p>
                <p className="font-mono text-xs">{job.total_batches_completed || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Records Per Batch</p>
                <p className="font-mono text-xs">
                  {job.total_batches_completed > 0 
                    ? Math.round(job.records_processed / job.total_batches_completed)
                    : "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final Cursor</p>
                <p className="font-mono text-xs" title={job.batch_cursor || job.last_cursor || undefined}>
                  {truncateCursor(job.batch_cursor || job.last_cursor, 20)}
                </p>
              </div>
            </div>
            
            {hasErrors && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Error Log</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {job.errors.map((err: any, idx: number) => (
                    <div key={idx} className="text-xs font-mono">
                      <span className="text-muted-foreground">{err.date || err.timestamp}:</span>{" "}
                      <span className="text-destructive">{err.error || err.message || JSON.stringify(err)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

  const { importCSV, isImporting, progress: importProgress, result: importResult } = useCSVImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiSource, setApiSource] = useState<"arketa" | "sling">("arketa");
  const [dataType, setDataType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importCSV(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const dataTypes = DATA_TYPES_BY_SOURCE[apiSource];

  // All Arketa types (reservations, subscriptions, payments) require date filtering; Sling shifts do too
  const requiresDateFiltering = true;

  const handleCreateJob = () => {
    if (!dataType) {
      toast.error("Please select a data type");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after start date");
      return;
    }
    createJob.mutate({
      api_source: apiSource,
      data_type: dataType,
      start_date: startDate,
      end_date: endDate,
    });
    setDataType("");
    setStartDate("");
    setEndDate("");
  };

  const estimatedRecords = () => {
    if (!startDate || !endDate) return null;
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const avgPerDay = dataType === "reservations" ? 100 : dataType === "subscriptions" ? 20 : 50;
    return days * avgPerDay;
  };

  return (
    <DashboardLayout title="Backfill & Import Manager">
      <div className="space-y-8 min-w-0 overflow-hidden px-4 md:px-8 py-4">
        {/* Create New Backfill */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 flex-shrink-0" />
              Create New Backfill
            </CardTitle>
            <CardDescription>
              Fetch and sync historical data from external APIs. Arketa: Reservations, Subscriptions, Payments. Sling: Shifts.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 min-w-[140px] flex-1">
                <Label>API Source</Label>
                <Select value={apiSource} onValueChange={(v) => { setApiSource(v as "arketa" | "sling"); setDataType(""); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arketa">Arketa</SelectItem>
                    <SelectItem value="sling">Sling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[140px] flex-1">
                <Label>Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger className="w-full">
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

              {requiresDateFiltering && (
                <>
                  <div className="space-y-2 min-w-[140px]">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full min-w-0"
                    />
                  </div>

                  <div className="space-y-2 min-w-[140px]">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full min-w-0"
                    />
                  </div>
                </>
              )}

              <div className="flex items-end min-w-[140px] flex-shrink-0">
                <Button 
                  onClick={handleCreateJob}
                  disabled={!dataType || (requiresDateFiltering && (!startDate || !endDate)) || createJob.isPending}
                  className="w-full sm:w-auto"
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
                  Estimated ~{typeof estimatedRecords() === "number" ? estimatedRecords()?.toLocaleString() : estimatedRecords()} records
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CSV Import Section */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import from CSV
            </CardTitle>
            <CardDescription>
              Import data from CSV files with flexible field mapping and table selection. 
              Supports Arketa Reservations, Subscriptions, Payments and custom tables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* CSV Import with Advanced Mapping */}
              <div className="flex flex-col gap-3">
                <CSVImportMapper />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Upload any CSV file and map fields to your database tables</span>
                  </p>
                  <p className="flex items-center gap-2 ml-5">
                    <span>• Choose existing tables or create new ones</span>
                  </p>
                  <p className="flex items-center gap-2 ml-5">
                    <span>• Control field mappings, data types, and unique keys</span>
                  </p>
                  <p className="flex items-center gap-2 ml-5">
                    <span>• View detailed error logs for any skipped records</span>
                  </p>
                </div>
              </div>
              
              {/* Skipped Records Log */}
              {importResult && importResult.skippedRecords && importResult.skippedRecords.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        View {importResult.skippedRecords.length} skipped records
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 border rounded-lg overflow-hidden bg-background">
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium">Row</th>
                              <th className="text-left px-3 py-2 font-medium">Reason</th>
                              <th className="text-left px-3 py-2 font-medium">Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {importResult.skippedRecords.map((record, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-mono">{record.row}</td>
                                <td className="px-3 py-2 text-destructive">{record.reason}</td>
                                <td className="px-3 py-2 text-muted-foreground truncate max-w-[300px]" title={record.data}>
                                  {record.data || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Backfills */}
        {activeJobs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Active Backfills</h2>
              <Badge variant="outline" className="ml-2">{activeJobs.length}</Badge>
            </div>
            <div className="grid gap-4 grid-cols-1">
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

        {/* Completed Backfills & Import History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Sync & Import History</h2>
            {completedJobs.length > 0 && (
              <Badge variant="outline" className="ml-2">{completedJobs.length}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            View completed API backfills and CSV imports. Note: CSV import history currently tracked through backfill jobs.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : completedJobs.length > 0 ? (
            <Card className="border-border">
              <CardContent className="pt-0">
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
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sync history yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a backfill job or import CSV data to see history
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

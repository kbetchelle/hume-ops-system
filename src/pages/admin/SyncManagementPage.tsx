import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSyncSchedules,
  useUpdateSyncSchedule,
  useRunSync,
  useRunAllSyncs,
  formatSyncType,
  getIntervalOptions,
  type SyncSchedule,
} from "@/hooks/useSyncSchedule";

function StatusBadge({ status, failureCount }: { status: string | null; failureCount: number }) {
  if (status === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  }

  if (status === "success") {
    return (
      <Badge variant="outline" className="gap-1 border-primary text-primary">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed{failureCount > 1 && ` (${failureCount}x)`}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}

function SyncRow({ sync }: { sync: SyncSchedule }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const updateSchedule = useUpdateSyncSchedule();
  const runSync = useRunSync();
  const intervalOptions = getIntervalOptions();

  const handleToggleEnabled = () => {
    updateSchedule.mutate({
      id: sync.id,
      is_enabled: !sync.is_enabled,
    });
  };

  const handleIntervalChange = (value: string) => {
    updateSchedule.mutate({
      id: sync.id,
      interval_minutes: parseInt(value),
    });
  };

  const handleRunNow = () => {
    runSync.mutate(sync.sync_type);
  };

  const isRunning = sync.last_status === "running" || runSync.isPending;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className={!sync.is_enabled ? "opacity-50" : ""}>
        <TableCell>
          {sync.last_error && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          <span className="font-medium">{formatSyncType(sync.sync_type)}</span>
        </TableCell>
        <TableCell>
          <StatusBadge status={sync.last_status} failureCount={sync.failure_count} />
        </TableCell>
        <TableCell>
          {sync.last_run_at ? (
            <div className="text-xs">
              <div>{format(new Date(sync.last_run_at), "MMM d, h:mm a")}</div>
              <div className="text-muted-foreground">
                {formatDistanceToNow(new Date(sync.last_run_at), { addSuffix: true })}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Never</span>
          )}
        </TableCell>
        <TableCell>
          {sync.next_run_at ? (
            <div className="text-xs">
              <div>{format(new Date(sync.next_run_at), "MMM d, h:mm a")}</div>
              <div className="text-muted-foreground">
                {formatDistanceToNow(new Date(sync.next_run_at), { addSuffix: true })}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {sync.records_synced}
        </TableCell>
        <TableCell>
          <Select
            value={String(sync.interval_minutes)}
            onValueChange={handleIntervalChange}
            disabled={updateSchedule.isPending}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Switch
            checked={sync.is_enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={updateSchedule.isPending}
          />
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunNow}
            disabled={isRunning || !sync.is_enabled}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {sync.last_error && (
        <CollapsibleContent asChild>
          <TableRow>
            <TableCell colSpan={8} className="bg-destructive/5 border-l-2 border-destructive">
              <div className="flex items-start gap-2 py-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Last Error</p>
                  <p className="text-xs text-muted-foreground mt-1">{sync.last_error}</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export default function SyncManagementPage() {
  const { data: schedules, isLoading, error, refetch } = useSyncSchedules();
  const runAllSyncs = useRunAllSyncs();

  const handleRunAll = () => {
    runAllSyncs.mutate();
  };

  const enabledCount = schedules?.filter(s => s.is_enabled).length || 0;
  const failedCount = schedules?.filter(s => s.last_status === "failed").length || 0;
  const successCount = schedules?.filter(s => s.last_status === "success").length || 0;

  return (
    <DashboardLayout title="Sync Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
              Data Synchronization
            </h2>
            <p className="text-xs text-muted-foreground tracking-wide">
              Manage automated syncs with external APIs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleRunAll}
              disabled={runAllSyncs.isPending || enabledCount === 0}
            >
              {runAllSyncs.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Syncs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{schedules?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{enabledCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal text-primary">{successCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal text-destructive">{failedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Table */}
        <Card className="border border-border rounded-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-destructive text-sm">Failed to load sync schedules</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sync Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="text-center">Records</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((sync) => (
                    <SyncRow key={sync.id} sync={sync} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

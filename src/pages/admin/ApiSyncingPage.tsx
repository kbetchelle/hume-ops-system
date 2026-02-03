import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  BellOff,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSyncSchedules,
  useUpdateSyncSchedule,
  useRunSync,
  getIntervalOptions,
  type SyncSchedule,
} from "@/hooks/useSyncSchedule";
import { useApiLogs, useApiNames } from "@/hooks/useApiLogs";

// API sync configuration - maps sync types to their staging/target tables
const API_CONFIG: Record<string, { stagingTable: string | null; targetTable: string }> = {
  arketa_clients: { stagingTable: "arketa_clients_staging", targetTable: "arketa_clients" },
  arketa_reservations: { stagingTable: "arketa_reservations_staging", targetTable: "arketa_reservations" },
  arketa_payments: { stagingTable: "arketa_payments_staging", targetTable: "arketa_payments" },
  arketa_instructors: { stagingTable: "arketa_instructors_staging", targetTable: "arketa_instructors" },
  arketa_subscriptions: { stagingTable: "arketa_subscriptions_staging", targetTable: "arketa_subscriptions" },
  sling_users: { stagingTable: "sling_users_staging", targetTable: "sling_users" },
  sling_shifts: { stagingTable: "sling_shifts_staging", targetTable: "staff_shifts" },
  toast: { stagingTable: "toast_staging", targetTable: "daily_reports" },
};

function StatusBadge({ status, isHealthy }: { status: string | boolean | null; isHealthy?: boolean }) {
  if (isHealthy !== undefined) {
    // For overview table - HEALTHY/ERROR badges
    return isHealthy ? (
      <Badge className="gap-1 bg-primary hover:bg-primary text-primary-foreground">
        <CheckCircle2 className="h-3 w-3" />
        HEALTHY
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        ERROR
      </Badge>
    );
  }

  // For log table - SUCCESS/FAILED badges
  if (status === "success" || status === true) {
    return (
      <Badge className="gap-1 bg-primary hover:bg-primary text-primary-foreground">
        <CheckCircle2 className="h-3 w-3" />
        SUCCESS
      </Badge>
    );
  }

  if (status === "failed" || status === false) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        FAILED
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

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return "Hourly";
  if (minutes < 1440) return `${minutes / 60} hours`;
  if (minutes === 1440) return "Daily";
  return `${minutes / 1440} days`;
}

function formatNextSync(nextRunAt: string | null, intervalMinutes: number): string {
  if (!nextRunAt) return "—";
  try {
    const date = new Date(nextRunAt);
    return format(date, "h:mm a");
  } catch {
    return "—";
  }
}

// API Sync Overview Table Component
function SyncOverviewTable({ manualSyncEnabled }: { manualSyncEnabled: boolean }) {
  const { data: schedules, isLoading, error, refetch } = useSyncSchedules();
  const updateSchedule = useUpdateSyncSchedule();
  const runSync = useRunSync();
  const intervalOptions = getIntervalOptions();

  const handleIntervalChange = (id: string, value: string) => {
    updateSchedule.mutate({
      id,
      interval_minutes: parseInt(value),
    });
  };

  const handleRunNow = (syncType: string) => {
    runSync.mutate(syncType);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive text-sm">Failed to load sync schedules</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-medium">API</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">Last Sync</TableHead>
            <TableHead className="font-medium">Sync Interval</TableHead>
            <TableHead className="font-medium">Next Sync</TableHead>
            <TableHead className="font-medium">Staging Table</TableHead>
            <TableHead className="font-medium">Target Table</TableHead>
            <TableHead className="font-medium">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules?.map((sync) => {
            const config = API_CONFIG[sync.sync_type] || { stagingTable: null, targetTable: "—" };
            const isHealthy = sync.last_status === "success" || sync.failure_count === 0;

            return (
              <TableRow key={sync.id} className={sync.last_status === "failed" ? "bg-destructive/5" : ""}>
                <TableCell className="font-medium">
                  {sync.display_name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={null} isHealthy={isHealthy} />
                </TableCell>
                <TableCell>
                  {sync.last_run_at ? (
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(sync.last_run_at), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={String(sync.interval_minutes)}
                    onValueChange={(value) => handleIntervalChange(sync.id, value)}
                    disabled={updateSchedule.isPending}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Manual</SelectItem>
                      {intervalOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm">
                  {sync.interval_minutes === 0 ? "—" : formatNextSync(sync.next_run_at, sync.interval_minutes)}
                </TableCell>
                <TableCell>
                  {config.stagingTable ? (
                    <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                      {config.stagingTable}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                    {config.targetTable}
                  </Badge>
                </TableCell>
                <TableCell>
                  {manualSyncEnabled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunNow(sync.sync_type)}
                      disabled={runSync.isPending}
                    >
                      {runSync.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Sync Log History Table Component
function SyncLogHistoryTable() {
  const [page, setPage] = useState(1);
  const [apiFilter, setApiFilter] = useState<string>("all");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  
  const { data, isLoading, error, refetch } = useApiLogs({
    page,
    pageSize: 15,
    apiFilter: apiFilter === "all" ? undefined : apiFilter,
    showErrorsOnly,
  });
  const { data: apiNames } = useApiNames();

  const formatDuration = (ms: number | null): string => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading && !data) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive text-sm">Failed to load sync logs</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-4">
          <Select value={apiFilter} onValueChange={setApiFilter}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Filter by API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All APIs</SelectItem>
              {apiNames?.map((name) => (
                <SelectItem key={name} value={name}>
                  {name.toUpperCase().replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <BellOff className="h-4 w-4 text-muted-foreground" />
          <Switch
            id="error-filter"
            checked={showErrorsOnly}
            onCheckedChange={setShowErrorsOnly}
          />
          <Label htmlFor="error-filter" className="text-sm">
            Error alerts
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-medium">API</TableHead>
              <TableHead className="font-medium">Synced At</TableHead>
              <TableHead className="font-medium">Endpoint</TableHead>
              <TableHead className="font-medium text-center">Records</TableHead>
              <TableHead className="font-medium text-center">New</TableHead>
              <TableHead className="font-medium">Duration</TableHead>
              <TableHead className="font-medium">Triggered By</TableHead>
              <TableHead className="font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No sync logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.logs?.map((log) => (
                <TableRow 
                  key={log.id} 
                  className={!log.sync_success ? "bg-destructive/5" : ""}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.api_name.toUpperCase().replace(/_/g, "_")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.created_at ? (
                      <div>
                        <div>{format(new Date(log.created_at), "MMM d,")}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm" title={log.endpoint}>
                    {log.endpoint}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.records_processed ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.records_inserted && log.records_inserted > 0 ? (
                      <span className="text-primary font-medium">{log.records_inserted}</span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDuration(log.duration_ms)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.triggered_by || "manual"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={log.sync_success ? "success" : "failed"} />
                      {log.error_message && (
                        <p className="text-xs text-destructive max-w-[200px] truncate" title={log.error_message}>
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Page {data.currentPage} of {data.totalPages} · {data.totalCount} total logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiSyncingPage() {
  const { data: schedules, isLoading, refetch } = useSyncSchedules();
  const [manualSyncEnabled, setManualSyncEnabled] = useState(false);
  const healthyCount = schedules?.filter(s => s.last_status === "success").length || 0;
  const errorCount = schedules?.filter(s => s.last_status === "failed").length || 0;

  return (
    <DashboardLayout title="API Syncing">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
              API Sync Management
            </h2>
            <p className="text-xs text-muted-foreground tracking-wide">
              Monitor and manage API data synchronization
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="manual-sync"
                checked={manualSyncEnabled}
                onCheckedChange={setManualSyncEnabled}
              />
              <Label htmlFor="manual-sync" className="text-sm">
                Manual Sync
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{schedules?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Healthy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal text-primary">{healthyCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal text-destructive">{errorCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Overview and History */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview" className="gap-2">
              <Clock className="h-4 w-4" />
              API Sync Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="h-4 w-4" />
              Sync Log History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border border-border rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  API Sync Overview
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Frequency changes are automatically applied to background cron jobs
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <SyncOverviewTable manualSyncEnabled={manualSyncEnabled} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border border-border rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Sync Log History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SyncLogHistoryTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

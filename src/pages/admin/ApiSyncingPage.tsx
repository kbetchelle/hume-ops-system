import { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  ChevronRight,
  Activity,
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
import { useSyncArketaClassesAndReservations } from "@/hooks/useArketaApi";
import { useApiLogs, useApiNames } from "@/hooks/useApiLogs";
import { supabase } from "@/integrations/supabase/client";

// API sync configuration - maps sync types to their staging/target tables and parameters
const API_CONFIG: Record<string, {
  stagingTable: string | null;
  targetTable: string;
  parameters: { name: string; value: string; description?: string }[];
}> = {
  arketa_classes: {
    stagingTable: "arketa_classes_staging + arketa_reservations_staging",
    targetTable: "arketa_classes + arketa_reservations_history",
    parameters: [
      { name: "limit", value: "500", description: "Records per page" },
      { name: "date_range", value: "-7 to +7 days", description: "Default date window" },
      { name: "strategy", value: "3-tier (Reverse Sort → Cursor Skip → Plain)", description: "Fetch strategy" },
      { name: "MAX_PAGES", value: "30", description: "Pagination safety cap" },
      { name: "local_filter", value: "true", description: "Date filtering in edge function" },
    ],
  },
  arketa_clients: {
    stagingTable: "arketa_clients_staging",
    targetTable: "arketa_clients",
    parameters: [
      { name: "limit", value: "100", description: "Records per page" },
      { name: "dedup", value: "external_id", description: "Dedup key before upsert" },
      { name: "batch_size", value: "100", description: "Upsert batch size" },
    ],
  },
  arketa_reservations: {
    stagingTable: "arketa_reservations_staging",
    targetTable: "arketa_reservations",
    parameters: [
      { name: "source", value: "DB-driven (arketa_classes)", description: "Iterates local class IDs" },
      { name: "date_range", value: "-7 to +7 days", description: "Default date window" },
      { name: "fallback", value: "API Discovery (3-tier)", description: "When DB is empty" },
    ],
  },
  arketa_payments: {
    stagingTable: "arketa_payments_staging",
    targetTable: "arketa_payments",
    parameters: [
      { name: "limit", value: "100", description: "Records per cursor page" },
      { name: "cursor", value: "start_after (ID-based)", description: "Pagination method" },
      { name: "MAX_PAGES", value: "30", description: "Pages per invocation" },
    ],
  },
  arketa_instructors: {
    stagingTable: "arketa_instructors_staging",
    targetTable: "arketa_instructors",
    parameters: [
      { name: "endpoint", value: "/staff", description: "API path" },
    ],
  },
  arketa_subscriptions: {
    stagingTable: "arketa_subscriptions_staging",
    targetTable: "arketa_subscriptions",
    parameters: [
      { name: "limit", value: "100", description: "Records per page" },
      { name: "cursor", value: "start_after", description: "Pagination method" },
      { name: "MAX_PAGES", value: "30", description: "Pages per invocation" },
    ],
  },
  sling_users: {
    stagingTable: "sling_users_staging",
    targetTable: "sling_users",
    parameters: [
      { name: "endpoint", value: "/users", description: "Sling API path" },
      { name: "org_id", value: "SLING_ORG_ID", description: "Organization filter" },
    ],
  },
  sling_shifts: {
    stagingTable: "sling_shifts_staging",
    targetTable: "staff_shifts",
    parameters: [
      { name: "endpoint", value: "/reports/roster", description: "Sling API path" },
      { name: "date_range", value: "-7 to +14 days", description: "Roster window" },
      { name: "org_id", value: "SLING_ORG_ID", description: "Organization filter" },
    ],
  },
  toast_sales: {
    stagingTable: "toast_staging",
    targetTable: "toast_sales",
    parameters: [
      { name: "endpoint", value: "/orders/v2/orders", description: "Toast API path" },
      { name: "date_range", value: "yesterday → today", description: "Default business date range" },
      { name: "pageSize", value: "100", description: "Records per page" },
      { name: "restaurant_guid", value: "TOAST_RESTAURANT_GUID", description: "Restaurant ID" },
    ],
  },
  toast_backfill: {
    stagingTable: "toast_staging",
    targetTable: "toast_sales",
    parameters: [
      { name: "job_type", value: "backfill", description: "Historical data load" },
    ],
  },
  calendly_events: {
    stagingTable: "scheduled_tours_staging",
    targetTable: "scheduled_tours",
    parameters: [
      { name: "endpoint", value: "/scheduled_events", description: "Calendly API path" },
      { name: "date_range", value: "-7 to +30 days", description: "Event window" },
      { name: "status", value: "active", description: "Event status filter" },
      { name: "org_uri", value: "CALENDLY_ORGANIZATION_URI", description: "Organization filter" },
    ],
  },
  daily_report_aggregation: {
    stagingTable: null,
    targetTable: "daily_reports",
    parameters: [
      { name: "sources", value: "arketa_reservations_history, arketa_payments, toast_sales, scheduled_tours, daily_report_history, arketa_classes, Open-Meteo", description: "Input data sources" },
      { name: "date", value: "today (default)", description: "Aggregation date" },
      { name: "sync_source", value: "auto | manual", description: "Trigger source" },
      { name: "conflict", value: "report_date (upsert)", description: "Dedup strategy" },
    ],
  },
  daily_schedule: {
    stagingTable: null,
    targetTable: "daily_schedule",
    parameters: [
      { name: "sources", value: "arketa_classes + arketa_reservations_history", description: "Input data" },
      { name: "window", value: "today → today+7", description: "Operational window" },
      { name: "method", value: "refresh_daily_schedule RPC", description: "Delete + re-insert per date" },
    ],
  },
};

function StatusBadge({ status, isHealthy }: { status: string | boolean | null; isHealthy?: boolean }) {
  if (isHealthy !== undefined) {
    return isHealthy ? (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white text-[8px]">
        <CheckCircle2 className="h-2 w-2" />
        HEALTHY
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1 text-[8px]">
        <XCircle className="h-2 w-2" />
        ERROR
      </Badge>
    );
  }

  if (status === "success" || status === true) {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
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

// Expandable detail panel for a sync row — shows parameters and recent logs
function SyncDetailPanel({ syncType, isRunning }: { syncType: string; isRunning: boolean }) {
  const config = API_CONFIG[syncType] || { parameters: [] };
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("api_logs")
      .select("id, sync_success, records_processed, records_inserted, duration_ms, error_message, created_at, triggered_by, endpoint")
      .eq("api_name", syncType)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentLogs(data ?? []);
    setLoading(false);
  }, [syncType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Poll faster when a sync is running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [isRunning, fetchLogs]);

  const formatDuration = (ms: number | null): string => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-muted/20 border-t border-border px-6 py-4 space-y-4">
      {/* Parameters */}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          Sync Parameters
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {config.parameters.map((p) => (
            <div key={p.name} className="bg-background border border-border rounded-sm px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.name}</div>
              <div className="text-xs font-mono mt-0.5">{p.value}</div>
              {p.description && (
                <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          {isRunning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          Recent Sync History
          {isRunning && <span className="text-[10px] text-primary font-medium ml-1">LIVE</span>}
        </h4>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sync logs found for this endpoint</p>
        ) : (
          <div className="space-y-1.5">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs border ${
                  !log.sync_success ? "bg-destructive/5 border-destructive/20" : "bg-background border-border"
                }`}
              >
                <StatusBadge status={log.sync_success ? "success" : "failed"} />
                <span className="text-muted-foreground">
                  {log.created_at ? format(new Date(log.created_at), "MMM d, h:mm:ss a") : "—"}
                </span>
                <span className="font-mono">
                  {log.records_processed ?? 0} processed
                  {log.records_inserted > 0 && (
                    <span className="text-primary ml-1">(+{log.records_inserted} new)</span>
                  )}
                </span>
                <span className="text-muted-foreground">{formatDuration(log.duration_ms)}</span>
                <span className="text-muted-foreground">{log.triggered_by || "manual"}</span>
                {log.error_message && (
                  <span className="text-destructive truncate max-w-[200px]" title={log.error_message}>
                    {log.error_message}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// API Sync Overview Table Component
function SyncOverviewTable() {
  const { data: schedules, isLoading, error, refetch } = useSyncSchedules();
  const updateSchedule = useUpdateSyncSchedule();
  const runSync = useRunSync();
  const syncArketaClassesAndReservations = useSyncArketaClassesAndReservations();
  const intervalOptions = getIntervalOptions();
  const [runningSyncType, setRunningSyncType] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleIntervalChange = (id: string, value: string) => {
    updateSchedule.mutate({
      id,
      interval_minutes: parseInt(value),
    });
  };

  const handleRunNow = async (syncType: string) => {
    setRunningSyncType(syncType);
    setExpandedRow(syncType);
    try {
      if (syncType === "arketa_classes") {
        await syncArketaClassesAndReservations.mutateAsync(undefined);
        refetch();
        return;
      }
      await runSync.mutateAsync(syncType);
    } finally {
      setRunningSyncType(null);
    }
  };

  const toggleExpand = (syncType: string) => {
    setExpandedRow((prev) => (prev === syncType ? null : syncType));
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
            <TableHead className="font-medium w-8"></TableHead>
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
          {schedules
            ?.filter((sync) => sync.is_enabled)
            .map((sync) => {
            const config = API_CONFIG[sync.sync_type] || { stagingTable: null, targetTable: "—", parameters: [] };
            const isHealthy = sync.last_status === "success" || sync.failure_count === 0;
            const isExpanded = expandedRow === sync.sync_type;
            const isThisRunning = runningSyncType === sync.sync_type;

            return (
              <>
                <TableRow
                  key={sync.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                    sync.last_status === "failed" ? "bg-destructive/10" : ""
                  } ${isExpanded ? "bg-muted/30" : ""}`}
                  onClick={() => toggleExpand(sync.sync_type)}
                >
                  <TableCell className="w-8 px-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {sync.display_name}
                      {isThisRunning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={null} isHealthy={isHealthy} />
                      {!isHealthy && sync.last_error && (
                        <p className="text-xs text-destructive max-w-[220px] truncate" title={sync.last_error}>
                          {sync.last_error}
                        </p>
                      )}
                    </div>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                      {config.targetTable}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunNow(sync.sync_type)}
                      disabled={runningSyncType !== null}
                      className="gap-1"
                    >
                      {isThisRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-[8px]">Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-2 w-2" />
                          <span className="text-[8px]">Sync Now</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${sync.id}-detail`}>
                    <TableCell colSpan={9} className="p-0">
                      <SyncDetailPanel syncType={sync.sync_type} isRunning={isThisRunning} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Sync Log History Table Component
function SyncLogHistoryTable({
  apiFilter: controlledApiFilter,
  setApiFilter: setControlledApiFilter,
}: {
  apiFilter?: string;
  setApiFilter?: (v: string) => void;
} = {}) {
  const [internalFilter, setInternalFilter] = useState<string>("all");
  const apiFilter = controlledApiFilter ?? internalFilter;
  const setApiFilter = setControlledApiFilter ?? setInternalFilter;
  const [page, setPage] = useState(1);
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
                <TableHead className="font-medium min-w-[200px]">Error</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {data?.logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                          {format(new Date(log.created_at), "h:mm:ss a")}
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
                    <div className="space-y-0.5">
                      <StatusBadge status={log.sync_success ? "success" : "failed"} />
                      {!log.sync_success && (log.records_processed ?? 0) > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Partial: data fetched; a later step failed. See Error.
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    {log.error_message ? (
                      <p
                        className="text-xs text-destructive break-words whitespace-pre-wrap"
                        title={log.error_message}
                      >
                        {log.error_message}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
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
  const { isLoading, refetch } = useSyncSchedules();
  const [syncTab, setSyncTab] = useState("overview");
  const [historyApiFilter, setHistoryApiFilter] = useState("all");

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

        {/* Tabs for Overview and History */}
        <Tabs value={syncTab} onValueChange={setSyncTab} className="space-y-4">
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
                  Click any row to expand parameters and recent sync history. Frequency changes are automatically applied to background cron jobs.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <SyncOverviewTable />
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
                <SyncLogHistoryTable
                  apiFilter={historyApiFilter}
                  setApiFilter={setHistoryApiFilter}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

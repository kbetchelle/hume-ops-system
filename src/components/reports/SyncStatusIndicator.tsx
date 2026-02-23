import { CheckCircle2, AlertCircle, XCircle, Loader2, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SyncRow {
  sync_type: string;
  display_name: string | null;
  last_run_at: string | null;
  last_status: string | null;
  records_synced: number | null;
  last_error: string | null;
  interval_minutes: number | null;
}

// Sync types that only need to run once per day
const DAILY_SYNC_TYPES = new Set(["toast_sales", "sling_users"]);

function getThresholds(syncType: string): { healthyHours: number; staleHours: number } {
  if (DAILY_SYNC_TYPES.has(syncType)) return { healthyHours: 24, staleHours: 48 };
  return { healthyHours: 1, staleHours: 6 };
}

function statusIcon(status: string | null, lastRun: string | null, syncType = "") {
  if (status === "running") return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  if (!lastRun) return <XCircle className="h-3 w-3 text-muted-foreground" />;
  const hours = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  const { healthyHours, staleHours } = getThresholds(syncType);
  if (hours < healthyHours) return <CheckCircle2 className="h-3 w-3 text-green-600" />;
  if (hours < staleHours) return <AlertCircle className="h-3 w-3 text-amber-600" />;
  return <XCircle className="h-3 w-3 text-red-600" />;
}

function statusLabel(status: string | null, lastRun: string | null, syncType = ""): { label: string; color: string } {
  if (status === "running") return { label: "Running", color: "text-muted-foreground" };
  if (!lastRun) return { label: "Never", color: "text-muted-foreground" };
  const hours = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  const { healthyHours, staleHours } = getThresholds(syncType);
  if (hours < healthyHours) return { label: "Healthy", color: "text-green-600" };
  if (hours < staleHours) return { label: "Stale", color: "text-amber-600" };
  return { label: "Outdated", color: "text-red-600" };
}

function formatLastRun(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

function overallStatus(rows: SyncRow[]): "healthy" | "stale" | "error" | "idle" {
  if (!rows.length) return "idle";
  let hasError = false;
  let hasStale = false;
  for (const row of rows) {
    if (row.last_status === "running") continue;
    if (!row.last_run_at) { hasError = true; continue; }
    const hours = (Date.now() - new Date(row.last_run_at).getTime()) / (1000 * 60 * 60);
    const { healthyHours, staleHours } = getThresholds(row.sync_type);
    if (hours >= staleHours) hasError = true;
    else if (hours >= healthyHours) hasStale = true;
  }
  if (hasError) return "error";
  if (hasStale) return "stale";
  return "healthy";
}

function overallIcon(status: "healthy" | "stale" | "error" | "idle") {
  switch (status) {
    case "healthy": return <Database className="h-4 w-4 text-green-600" />;
    case "stale": return <Database className="h-4 w-4 text-amber-600" />;
    case "error": return <Database className="h-4 w-4 text-red-600" />;
    default: return <Database className="h-4 w-4 text-muted-foreground" />;
  }
}

export function SyncStatusIndicator() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["sync_schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_schedule")
        .select("sync_type, display_name, last_run_at, last_status, records_synced, last_error, interval_minutes")
        .eq("is_enabled", true)
        .order("sync_type");
      if (error) throw error;
      return (data ?? []) as SyncRow[];
    },
  });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  const status = overallStatus(rows ?? []);

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button className="shrink-0 cursor-default p-1">
          {overallIcon(status)}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" className="w-72 p-3 text-xs space-y-1.5">
        <div className="font-medium text-sm pb-1 border-b border-border mb-1.5 uppercase tracking-widest text-[11px]">Data Sources</div>
        {(rows ?? []).map((row) => {
          const sl = statusLabel(row.last_status, row.last_run_at, row.sync_type);
          return (
            <div key={row.sync_type} className="flex items-center gap-2">
              {statusIcon(row.last_status, row.last_run_at, row.sync_type)}
              <span className="flex-1 truncate">{row.display_name ?? row.sync_type}</span>
              <span className="text-muted-foreground text-[11px] shrink-0">{formatLastRun(row.last_run_at)}</span>
            </div>
          );
        })}
      </HoverCardContent>
    </HoverCard>
  );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
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

function statusIcon(status: string | null, lastRun: string | null) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!lastRun) return <XCircle className="h-4 w-4 text-muted-foreground" />;
  const hours = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (hours < 6) return <AlertCircle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function statusLabel(status: string | null, lastRun: string | null): { label: string; color: string } {
  if (status === "running") return { label: "Running", color: "text-muted-foreground" };
  if (!lastRun) return { label: "Never synced", color: "text-muted-foreground" };
  const hours = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return { label: "Healthy", color: "text-green-600" };
  if (hours < 6) return { label: "Stale", color: "text-amber-600" };
  return { label: "Outdated", color: "text-red-600" };
}

function formatLastRun(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

  if (isLoading) return <Card><CardContent className="py-4"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="py-3">
        <span className="text-sm font-medium">Data Sources</span>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {(rows ?? []).map((row) => {
            const sl = statusLabel(row.last_status, row.last_run_at);
            return (
              <li key={row.sync_type} className="flex items-center gap-2">
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button className="shrink-0 cursor-default">
                      {statusIcon(row.last_status, row.last_run_at)}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-64 text-xs space-y-2 p-3">
                    <div className="font-medium text-sm">{row.display_name ?? row.sync_type}</div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                      <span className="text-muted-foreground">Status</span>
                      <span className={sl.color + " font-medium"}>{sl.label}</span>

                      <span className="text-muted-foreground">Last Run</span>
                      <span>{formatFullDate(row.last_run_at)}</span>

                      <span className="text-muted-foreground">Records</span>
                      <span>{row.records_synced != null ? row.records_synced.toLocaleString() : "—"}</span>

                      <span className="text-muted-foreground">Interval</span>
                      <span>{row.interval_minutes ? `${row.interval_minutes} min` : "Manual"}</span>
                    </div>
                    {row.last_error && (
                      <div className="mt-1 rounded bg-destructive/10 p-1.5 text-destructive text-[11px] leading-tight line-clamp-3">
                        {row.last_error}
                      </div>
                    )}
                  </HoverCardContent>
                </HoverCard>
                <span className="flex-1">{row.display_name ?? row.sync_type}</span>
                <span className="text-muted-foreground text-xs">{formatLastRun(row.last_run_at)}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

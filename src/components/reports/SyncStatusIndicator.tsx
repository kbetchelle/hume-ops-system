import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SyncRow {
  sync_type: string;
  display_name: string | null;
  last_run_at: string | null;
  last_status: string | null;
}

function statusIcon(status: string | null, lastRun: string | null) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!lastRun) return <XCircle className="h-4 w-4 text-muted-foreground" />;
  const age = Date.now() - new Date(lastRun).getTime();
  const hours = age / (1000 * 60 * 60);
  if (hours < 1) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (hours < 6) return <AlertCircle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
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

export function SyncStatusIndicator() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["sync_schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_schedule")
        .select("sync_type, display_name, last_run_at, last_status")
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
          {(rows ?? []).map((row) => (
            <li key={row.sync_type} className="flex items-center gap-2">
              {statusIcon(row.last_status, row.last_run_at)}
              <span className="flex-1">{row.display_name ?? row.sync_type}</span>
              <span className="text-muted-foreground text-xs">{formatLastRun(row.last_run_at)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

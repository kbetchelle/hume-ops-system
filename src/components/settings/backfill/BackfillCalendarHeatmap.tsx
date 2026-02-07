import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isBefore,
  isAfter,
  parseISO,
} from "date-fns";

const HEATMAP_START = parseISO("2024-08-01");

export type BackfillCalendarType = "reservations" | "payments" | "classes" | "toast";

type DayStatus = "synced" | "partial" | "not_pulled";

interface BackfillCalendarHeatmapProps {
  type: BackfillCalendarType;
  /** Optional: refetch when this changes (e.g. sync running) */
  refetchTrigger?: boolean;
}

const RPC_MAP: Record<BackfillCalendarType, string> = {
  reservations: "get_backfill_reservations_calendar",
  payments: "get_backfill_payments_calendar",
  classes: "get_backfill_classes_calendar",
  toast: "get_backfill_toast_calendar",
};

function getStatus(
  type: BackfillCalendarType,
  recordCount: number,
  checkedInCount?: number
): DayStatus {
  if (recordCount === 0) return "not_pulled";
  if (type === "reservations" && typeof checkedInCount === "number" && checkedInCount === 0)
    return "partial";
  return "synced";
}

export default function BackfillCalendarHeatmap({ type, refetchTrigger }: BackfillCalendarHeatmapProps) {
  const rpc = RPC_MAP[type];

  const prevTriggerRef = useRef(refetchTrigger);

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ["backfill-calendar", type, rpc],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(rpc);
      if (error) throw error;
      return (data ?? []) as Array<
        { d: string; record_count: number; checked_in_count?: number } | { d: string; record_count: number }
      >;
    },
    refetchInterval: refetchTrigger ? 2_000 : 60_000,
    refetchIntervalInBackground: !!refetchTrigger,
  });

  useEffect(() => {
    if (prevTriggerRef.current === true && refetchTrigger === false) {
      refetch();
    }
    prevTriggerRef.current = refetchTrigger;
  }, [refetchTrigger, refetch]);

  const dateMap = new Map<string, DayStatus>();
  if (rows) {
    for (const row of rows) {
      const d = typeof row.d === "string" ? row.d.slice(0, 10) : format(new Date(row.d), "yyyy-MM-dd");
      const recordCount = Number((row as { record_count?: number }).record_count ?? 0);
      const checkedInCount = "checked_in_count" in row ? Number((row as { checked_in_count?: number }).checked_in_count ?? 0) : undefined;
      dateMap.set(d, getStatus(type, recordCount, checkedInCount));
    }
  }

  const months: Date[] = [];
  let cursor = startOfMonth(HEATMAP_START);
  const today = new Date();
  while (cursor <= today) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  if (months.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sync coverage by day</CardTitle>
        <CardDescription>
          From Aug 1, 2024. Green = synced, {type === "reservations" ? "Amber = partial (no check-ins), " : ""}Gray = not pulled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-emerald-500/80" aria-hidden /> Synced
          </span>
          {type === "reservations" && (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-amber-500/80" aria-hidden /> Partial (no check-ins)
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-muted" aria-hidden /> Not pulled
          </span>
        </div>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="space-y-3 overflow-x-auto">
            {months.map((monthStart) => {
              const monthEnd = endOfMonth(monthStart);
              const rangeStart = isBefore(monthStart, HEATMAP_START) ? HEATMAP_START : monthStart;
              const rangeEnd = isAfter(monthEnd, today) ? today : monthEnd;
              const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
              return (
                <div key={format(monthStart, "yyyy-MM")} className="flex items-center gap-1 min-w-0">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">
                    {format(monthStart, "MMM yyyy")}
                  </span>
                  <div className="flex gap-0.5 flex-wrap">
                    {days.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const status = dateMap.get(key) ?? "not_pulled";
                      const color =
                        status === "synced"
                          ? "bg-emerald-500/80"
                          : status === "partial"
                            ? "bg-amber-500/80"
                            : "bg-muted";
                      return (
                        <span
                          key={key}
                          className={`h-4 w-4 shrink-0 rounded-sm ${color}`}
                          title={`${key}: ${status}`}
                          aria-label={`${key} ${status}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

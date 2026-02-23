import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { selectFrom } from "@/lib/dataApi";
import { add_color } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface DailyScheduleClass {
  id: string;
  class_name: string;
  instructor: string | null;
  start_time: string;
  end_time: string | null;
  total_booked: number | null;
  max_capacity: number | null;
  canceled: boolean | null;
}

export function DashboardEventsWidget() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: classes, isLoading } = useQuery({
    queryKey: ["dashboard-events-today", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<DailyScheduleClass>(
        "daily_schedule",
        {
          filters: [{ type: "eq", column: "schedule_date", value: today }],
          order: { column: "start_time", ascending: true },
        }
      );
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 120000, // 2 minutes
  });

  const activeClasses = (classes ?? []).filter((c) => !c.canceled);

  const formatTime = (iso: string) => {
    try {
      return format(parseISO(iso), "h:mm a");
    } catch {
      return iso;
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Today's Schedule
        </h3>
        <Link
          to="/dashboard/master-calendar"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Full Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : activeClasses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No classes scheduled for today
        </div>
      ) : (
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-1">
            {activeClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center gap-3 rounded px-3 py-2 hover:bg-muted/50 transition-colors text-sm"
              >
                <div
                  className="h-7 w-7 rounded-none flex items-center justify-center shrink-0"
                  style={{ backgroundColor: add_color.blue, color: "#fff" }}
                >
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {cls.class_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(cls.start_time)}
                    {cls.instructor && ` · ${cls.instructor}`}
                  </p>
                </div>
                {cls.max_capacity != null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Users className="h-3 w-3" />
                    {cls.total_booked ?? 0}/{cls.max_capacity}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

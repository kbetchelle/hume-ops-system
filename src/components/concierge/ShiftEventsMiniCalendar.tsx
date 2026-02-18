import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { selectFrom } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";

interface DailyScheduleClass {
  id: string;
  class_name: string;
  start_time: string;
  total_booked: number | null;
  max_capacity: number | null;
  canceled: boolean | null;
}

interface ScheduledTour {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_time: string;
  status: string;
}

interface ScheduleEvent {
  id: string;
  type: "class" | "tour";
  title: string;
  time: string;
  details?: string;
  sortTime: Date;
}

const PM_BOUNDARY_HOUR = 13.5; // 1:30 PM as decimal hours

export function ShiftEventsMiniCalendar() {
  const { currentShift } = useCurrentShift();
  const today = format(new Date(), "yyyy-MM-dd");
  const formattedDate = format(new Date(), "EEE, MMM d");

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["daily-schedule", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<DailyScheduleClass>("daily_schedule", {
        filters: [{ type: "eq", column: "schedule_date", value: today }],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const { data: tours, isLoading: toursLoading } = useQuery({
    queryKey: ["scheduled-tours", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<ScheduledTour>("scheduled_tours", {
        filters: [
          { type: "eq", column: "tour_date", value: today },
          { type: "eq", column: "status", value: "active" },
        ],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const isLoading = classesLoading || toursLoading;

  const filterByShift = useCallback((startTime: string): boolean => {
    try {
      const eventDate = parseISO(startTime);
      const eventHour = eventDate.getHours() + eventDate.getMinutes() / 60;
      if (currentShift === "AM") return eventHour < PM_BOUNDARY_HOUR;
      return eventHour >= PM_BOUNDARY_HOUR;
    } catch {
      return true;
    }
  }, [currentShift]);

  const events: ScheduleEvent[] = useMemo(() => {
    const classEvents: ScheduleEvent[] = (classes || [])
      .filter((c) => filterByShift(c.start_time))
      .map((c) => ({
        id: c.id,
        type: "class" as const,
        title: c.canceled ? `${c.class_name || "Unnamed Class"} (Canceled)` : (c.class_name || "Unnamed Class"),
        time: format(parseISO(c.start_time), "h:mm a"),
        details:
          c.total_booked !== null && c.max_capacity !== null
            ? `${c.total_booked}/${c.max_capacity} signed up`
            : undefined,
        sortTime: parseISO(c.start_time),
      }));

    const tourEvents: ScheduleEvent[] = (tours || [])
      .filter((t) => filterByShift(t.start_time))
      .map((t) => ({
        id: t.id,
        type: "tour" as const,
        title: `Tour: ${t.guest_name || "Guest"}`,
        time: format(parseISO(t.start_time), "h:mm a"),
        details: t.guest_email || undefined,
        sortTime: parseISO(t.start_time),
      }));

    return [...classEvents, ...tourEvents].sort(
      (a, b) => a.sortTime.getTime() - b.sortTime.getTime()
    );
  }, [classes, tours, filterByShift]);

  return (
    <Card className="rounded-none border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-normal tracking-wide">
            <Calendar className="h-4 w-4" />
            {currentShift} Shift Events
          </CardTitle>
          <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-widest">
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-4 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No events scheduled for {currentShift} shift
          </p>
        ) : (
          events.map((event) => (
            <div
              key={`${event.type}-${event.id}`}
              className="flex items-center gap-3 p-3 border border-border hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-center gap-1.5 min-w-[60px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wide">{event.time}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-normal truncate">{event.title}</p>
                {event.details && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {event.details}
                  </p>
                )}
              </div>

              <Badge
                variant={event.type === "tour" ? "default" : "secondary"}
                className="rounded-none text-[9px] uppercase tracking-widest"
              >
                {event.type}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { Calendar, Clock, Users, Dumbbell, Briefcase, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { selectFrom } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";

interface ClassSchedule {
  id: string;
  class_name: string;
  instructor_name: string | null;
  start_time: string;
  end_time: string | null;
  signups: number | null;
  capacity: number | null;
}

interface ScheduledTour {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string | null;
  status: string;
}

interface DailySchedule {
  id: string;
  staff_name: string | null;
  position: string | null;
  shift_start: string;
  shift_end: string;
  location: string | null;
}

interface UnifiedEvent {
  id: string;
  type: "tour" | "class" | "shift";
  title: string;
  subtitle?: string;
  time: string;
  endTime?: string;
  details?: string;
  icon: React.ReactNode;
  sortTime: Date;
  color: string;
}

const PM_BOUNDARY_HOUR = 13.5; // 1:30 PM as decimal hours

export function UpcomingTodayCard() {
  const { currentShift } = useCurrentShift();
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();

  // Fetch tours
  const { data: tours, isLoading: toursLoading } = useQuery({
    queryKey: ["scheduled-tours-upcoming", today],
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
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["class-schedule-upcoming", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<ClassSchedule>("class_schedule", {
        filters: [{ type: "eq", column: "class_date", value: today }],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch staff shifts
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["daily-schedules-upcoming", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<DailySchedule>("daily_schedules", {
        filters: [{ type: "eq", column: "schedule_date", value: today }],
        order: { column: "shift_start", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const isLoading = toursLoading || classesLoading || shiftsLoading;

  const filterByShift = (startTime: string): boolean => {
    try {
      const eventDate = parseISO(startTime);
      const eventHour = eventDate.getHours() + eventDate.getMinutes() / 60;
      if (currentShift === "AM") return eventHour < PM_BOUNDARY_HOUR;
      return eventHour >= PM_BOUNDARY_HOUR;
    } catch {
      return true;
    }
  };

  const unifiedEvents: UnifiedEvent[] = useMemo(() => {
    const tourEvents: UnifiedEvent[] = (tours || [])
      .filter((t) => filterByShift(t.start_time))
      .map((t) => {
        const startTime = parseISO(t.start_time);
        return {
          id: t.id,
          type: "tour" as const,
          title: t.guest_name || "Guest Tour",
          subtitle: t.event_type || "Tour",
          time: format(startTime, "h:mm a"),
          endTime: t.end_time ? format(parseISO(t.end_time), "h:mm a") : undefined,
          details: t.guest_email || undefined,
          icon: <Users className="h-4 w-4" />,
          sortTime: startTime,
          color: "text-blue-500",
        };
      });

    const classEvents: UnifiedEvent[] = (classes || [])
      .filter((c) => filterByShift(c.start_time))
      .map((c) => {
        const startTime = parseISO(c.start_time);
        return {
          id: c.id,
          type: "class" as const,
          title: c.class_name || "Unnamed Class",
          subtitle: c.instructor_name || undefined,
          time: format(startTime, "h:mm a"),
          endTime: c.end_time ? format(parseISO(c.end_time), "h:mm a") : undefined,
          details:
            c.signups !== null && c.capacity !== null
              ? `${c.signups}/${c.capacity} signed up`
              : undefined,
          icon: <Dumbbell className="h-4 w-4" />,
          sortTime: startTime,
          color: "text-green-500",
        };
      });

    const shiftEvents: UnifiedEvent[] = (shifts || [])
      .filter((s) => filterByShift(s.shift_start))
      .map((s) => {
        const startTime = parseISO(s.shift_start);
        return {
          id: s.id,
          type: "shift" as const,
          title: s.staff_name || "Staff Member",
          subtitle: s.position || undefined,
          time: format(startTime, "h:mm a"),
          endTime: format(parseISO(s.shift_end), "h:mm a"),
          details: s.location || undefined,
          icon: <Briefcase className="h-4 w-4" />,
          sortTime: startTime,
          color: "text-purple-500",
        };
      });

    // Combine and sort all events
    return [...tourEvents, ...classEvents, ...shiftEvents].sort(
      (a, b) => a.sortTime.getTime() - b.sortTime.getTime()
    );
  }, [tours, classes, shifts, currentShift]);

  // Filter to only show upcoming events (future or within last 30 minutes)
  const upcomingEvents = unifiedEvents.filter((event) => {
    const eventTime = event.sortTime;
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    return isAfter(eventTime, thirtyMinutesAgo);
  });

  // Find next event
  const nextEvent = upcomingEvents.find((event) => isAfter(event.sortTime, now));
  const minutesToNext = nextEvent ? differenceInMinutes(nextEvent.sortTime, now) : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No upcoming events for your shift
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Today
          </CardTitle>
          {minutesToNext !== null && minutesToNext >= 0 && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {minutesToNext === 0
                ? "Now"
                : minutesToNext < 60
                ? `${minutesToNext}m`
                : `${Math.floor(minutesToNext / 60)}h ${minutesToNext % 60}m`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 10).map((event) => {
            const isPast = isBefore(event.sortTime, now);
            const isNext = event.id === nextEvent?.id;

            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isNext
                    ? "bg-accent border-accent-foreground/20"
                    : isPast
                    ? "opacity-60"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className={`mt-0.5 ${event.color}`}>{event.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      {event.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </div>
                  </div>
                  {event.details && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {event.details}
                      </p>
                    </div>
                  )}
                  {isNext && (
                    <Badge variant="default" className="mt-2 text-xs">
                      Next Up
                    </Badge>
                  )}
                  {isPast && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

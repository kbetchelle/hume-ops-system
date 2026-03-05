import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseISO, differenceInMinutes, isAfter, isBefore, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar, Clock, Users, MapPin, CreditCard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { selectFrom } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { add_color } from "@/lib/constants";

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

interface ScheduledTour {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string | null;
  status: string;
}

interface MastercardVisit {
  id: string;
  client_name: string | null;
  client_email: string | null;
  mastercard_tier: string | null;
  start_time: string;
  end_time: string | null;
  number_of_guests: number | null;
  visit_purpose: string | null;
  status: string;
}

interface NonClassEvent {
  id: string;
  type: "tour" | "mastercard";
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

// Same color logic as DashboardEventsWidget
const getEventColor = (className: string) => {
  const name = className.toLowerCase();
  if (name.includes("personal training") || name.includes("pt session")) return add_color.green;
  if (name.includes("private") || name.includes("appointment")) return add_color.blue;
  if (
    name.includes("pilates") || name.includes("yoga") || name.includes("barre") ||
    name.includes("cycle") || name.includes("hiit") || name.includes("stretch") ||
    name.includes("meditation") || name.includes("reformer") || name.includes("class")
  ) return add_color.purple;
  return add_color.orange;
};

// Format PST timestamps stored with +00 offset
const formatTime = (iso: string) => {
  try {
    return formatInTimeZone(parseISO(iso), "UTC", "h:mm a");
  } catch {
    return iso;
  }
};

interface UpcomingTodayCardProps {
  maxItems?: number;
}

export function UpcomingTodayCard({ maxItems }: UpcomingTodayCardProps = {}) {
  const { currentShift } = useCurrentShift();
  const today = (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const d = parts.find((p) => p.type === "day")!.value;
    return `${y}-${m}-${d}`;
  })();
  const now = new Date();
  const nowPst = formatInTimeZone(new Date(), "America/Los_Angeles", "HH:mm");

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
    refetchInterval: 60000,
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["daily-schedule-upcoming", today],
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

  const { data: mastercardVisits, isLoading: mastercardLoading } = useQuery({
    queryKey: ["mastercard-visits-upcoming", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<MastercardVisit>("mastercard_visits", {
        filters: [
          { type: "eq", column: "visit_date", value: today },
          { type: "eq", column: "status", value: "scheduled" },
        ],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const isLoading = toursLoading || classesLoading || mastercardLoading;

  const filterByShift = useCallback((startTime: string): boolean => {
    try {
      // Timestamps are fake-UTC (PST stored with +00), so format in UTC to get raw PST hours
      const hh = parseInt(formatInTimeZone(parseISO(startTime), "UTC", "H"), 10);
      const mm = parseInt(formatInTimeZone(parseISO(startTime), "UTC", "m"), 10);
      const eventHour = hh + mm / 60;
      if (currentShift === "AM") return eventHour < PM_BOUNDARY_HOUR;
      return eventHour >= PM_BOUNDARY_HOUR;
    } catch {
      return true;
    }
  }, [currentShift]);

  // Check if a class end time has passed (PST comparison)
  const isClassPast = useCallback((cls: DailyScheduleClass) => {
    if (!cls.end_time) return false;
    try {
      const endHHmm = formatInTimeZone(parseISO(cls.end_time), "UTC", "HH:mm");
      return endHHmm <= nowPst;
    } catch {
      return false;
    }
  }, [nowPst]);

  // Filter and sort classes: active, shift-filtered, upcoming first then past
  const sortedClasses = useMemo(() => {
    const filtered = (classes ?? [])
      .filter((c) => !c.canceled && c.class_name && c.class_name !== "Unknown")
      .filter((c) => filterByShift(c.start_time));
    return [...filtered].sort((a, b) => {
      const aPast = isClassPast(a);
      const bPast = isClassPast(b);
      if (aPast !== bPast) return aPast ? 1 : -1;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [classes, filterByShift, isClassPast]);

  // Non-class events (tours, mastercard)
  const nonClassEvents: NonClassEvent[] = useMemo(() => {
    const tourEvents: NonClassEvent[] = (tours || [])
      .filter((t) => filterByShift(t.start_time))
      .map((t) => {
        const startTime = parseISO(t.start_time);
        return {
          id: t.id,
          type: "tour" as const,
          title: t.guest_name || "Guest Tour",
          subtitle: t.event_type || "Tour",
          time: formatInTimeZone(startTime, "UTC", "h:mm a"),
          endTime: t.end_time ? formatInTimeZone(parseISO(t.end_time), "UTC", "h:mm a") : undefined,
          details: t.guest_email || undefined,
          icon: <Users className="h-4 w-4" />,
          sortTime: startTime,
          color: "text-blue-500",
        };
      });

    const mastercardEvents: NonClassEvent[] = (mastercardVisits || [])
      .filter((m) => filterByShift(m.start_time))
      .map((m) => {
        const startTime = parseISO(m.start_time);
        return {
          id: `mc-${m.id}`,
          type: "mastercard" as const,
          title: m.client_name || "Mastercard Client",
          subtitle: m.mastercard_tier || "Mastercard",
          time: formatInTimeZone(startTime, "UTC", "h:mm a"),
          endTime: m.end_time ? formatInTimeZone(parseISO(m.end_time), "UTC", "h:mm a") : undefined,
          details: m.visit_purpose || undefined,
          icon: <CreditCard className="h-4 w-4" />,
          sortTime: startTime,
          color: "text-amber-500",
        };
      });

    return [...tourEvents, ...mastercardEvents].sort(
      (a, b) => a.sortTime.getTime() - b.sortTime.getTime()
    );
  }, [tours, mastercardVisits, filterByShift]);

  // Filter non-class events to upcoming only
  const upcomingNonClassEvents = nonClassEvents.filter((event) => {
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    return isAfter(event.sortTime, thirtyMinutesAgo);
  });

  const nextNonClassEvent = upcomingNonClassEvents.find((event) => isAfter(event.sortTime, now));

  const hasContent = sortedClasses.length > 0 || upcomingNonClassEvents.length > 0;

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
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Today
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Non-class events (tours, mastercard) */}
        {upcomingNonClassEvents.length > 0 && (
          <div className="px-4 py-2 space-y-2">
            {upcomingNonClassEvents.slice(0, maxItems ?? 5).map((event) => {
              const isPast = isBefore(event.sortTime, now);
              const isNext = event.id === nextNonClassEvent?.id;
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isNext ? "bg-accent border-accent-foreground/20" : isPast ? "opacity-60" : "hover:bg-accent/50"
                  }`}
                >
                  <div className={`mt-0.5 ${event.color}`}>{event.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {event.time}{event.endTime && ` - ${event.endTime}`}
                      </div>
                    </div>
                    {event.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                    )}
                    {event.details && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{event.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Classes — same format as Dashboard Events Widget */}
        {sortedClasses.length > 0 && (
          <ScrollArea className="max-h-[400px]">
            <div>
              {sortedClasses.slice(0, maxItems ?? 50).map((cls) => {
                const color = getEventColor(cls.class_name);
                const past = isClassPast(cls);
                return (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-0 rounded-none px-3 py-2 transition-colors text-sm ${past ? 'opacity-50' : ''}`}
                    style={{
                      backgroundColor: past ? 'hsl(var(--muted))' : `${color}1A`,
                      ...(past ? {} : { borderLeft: `4px solid ${color}`, borderBottom: `1.5px solid ${color}40` }),
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {cls.class_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(cls.start_time)}
                        {cls.end_time && ` – ${formatTime(cls.end_time)}`}
                        {cls.instructor && ` · ${cls.instructor}`}
                      </p>
                    </div>
                    {cls.max_capacity != null && (
                      <div className="flex items-center gap-1 text-xs shrink-0 px-1.5 py-0.5 rounded-sm text-white" style={{ backgroundColor: '#009ddc' }}>
                        <Users className="h-3 w-3" />
                        {cls.total_booked ?? 0}/{cls.max_capacity}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

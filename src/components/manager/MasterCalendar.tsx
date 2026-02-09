import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Dumbbell,
  Briefcase,
  MapPin,
  Clock,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectFrom } from "@/lib/dataApi";

interface DailyScheduleClass {
  id: string;
  schedule_date: string;
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
  tour_date: string;
  guest_name: string | null;
  guest_email: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string | null;
  status: string;
}

interface StaffShift {
  id: string;
  shift_date: string | null;
  user_name: string | null;
  position: string | null;
  shift_start: string;
  shift_end: string;
}

interface CalendarEvent {
  id: string;
  type: "tour" | "class" | "shift";
  title: string;
  subtitle?: string;
  startTime: Date;
  endTime?: Date;
  details?: string;
  date: string;
  color: string;
  icon: React.ReactNode;
}

type ViewMode = "week" | "day";
type FilterType = "all" | "tour" | "class" | "shift";

export function MasterCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Calculate date range based on view mode
  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "week") {
      return {
        startDate: startOfWeek(currentDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      return {
        startDate: startOfDay(currentDate),
        endDate: endOfDay(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  // Fetch tours
  const { data: tours, isLoading: toursLoading } = useQuery({
    queryKey: ["scheduled-tours-calendar", startDateStr, endDateStr],
    queryFn: async () => {
      const { data, error } = await selectFrom<ScheduledTour>("scheduled_tours", {
        filters: [
          { type: "gte", column: "tour_date", value: startDateStr },
          { type: "lte", column: "tour_date", value: endDateStr },
          { type: "eq", column: "status", value: "active" },
        ],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch classes (from daily_schedule: arketa classes + reservations)
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["daily-schedule-calendar", startDateStr, endDateStr],
    queryFn: async () => {
      const { data, error } = await selectFrom<DailyScheduleClass>("daily_schedule", {
        filters: [
          { type: "gte", column: "schedule_date", value: startDateStr },
          { type: "lte", column: "schedule_date", value: endDateStr },
        ],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch staff shifts (from staff_shifts: Sling)
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["staff-shifts-calendar", startDateStr, endDateStr],
    queryFn: async () => {
      const { data, error } = await selectFrom<StaffShift>("staff_shifts", {
        filters: [
          { type: "gte", column: "shift_date", value: startDateStr },
          { type: "lte", column: "shift_date", value: endDateStr },
        ],
        order: { column: "shift_start", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const isLoading = toursLoading || classesLoading || shiftsLoading;

  // Convert all events to unified format
  const allEvents: CalendarEvent[] = useMemo(() => {
    const tourEvents: CalendarEvent[] = (tours || []).map((t) => ({
      id: `tour-${t.id}`,
      type: "tour" as const,
      title: t.guest_name || "Guest Tour",
      subtitle: t.event_type || "Tour",
      startTime: parseISO(t.start_time),
      endTime: t.end_time ? parseISO(t.end_time) : undefined,
      details: t.guest_email || undefined,
      date: t.tour_date,
      color: "bg-blue-100 border-blue-300 text-blue-900",
      icon: <Users className="h-3 w-3" />,
    }));

    const classEvents: CalendarEvent[] = (classes || []).map((c) => ({
      id: `class-${c.id}`,
      type: "class" as const,
      title: c.canceled ? `${c.class_name || "Unnamed Class"} (Canceled)` : (c.class_name || "Unnamed Class"),
      subtitle: c.instructor || undefined,
      startTime: parseISO(c.start_time),
      endTime: c.end_time ? parseISO(c.end_time) : undefined,
      details:
        c.total_booked !== null && c.max_capacity !== null
          ? `${c.total_booked}/${c.max_capacity} signed up`
          : undefined,
      date: c.schedule_date,
      color: c.canceled ? "bg-muted border-muted-foreground/30 text-muted-foreground" : "bg-green-100 border-green-300 text-green-900",
      icon: <Dumbbell className="h-3 w-3" />,
    }));

    const shiftEvents: CalendarEvent[] = (shifts || []).map((s) => ({
      id: `shift-${s.id}`,
      type: "shift" as const,
      title: s.user_name || "Staff Member",
      subtitle: s.position || undefined,
      startTime: parseISO(s.shift_start),
      endTime: parseISO(s.shift_end),
      details: undefined,
      date: s.shift_date || "",
      color: "bg-purple-100 border-purple-300 text-purple-900",
      icon: <Briefcase className="h-3 w-3" />,
    }));

    return [...tourEvents, ...classEvents, ...shiftEvents];
  }, [tours, classes, shifts]);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return allEvents;
    return allEvents.filter((event) => event.type === filterType);
  }, [allEvents, filterType]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    // Sort events within each day by start time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });
    return grouped;
  }, [filteredEvents]);

  // Get days to display
  const daysToDisplay = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    } else {
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  }, [viewMode, currentDate, startDate, endDate]);

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Export to CSV
  const handleExport = () => {
    const csvRows = [
      ["Type", "Title", "Subtitle", "Date", "Start Time", "End Time", "Details"],
      ...filteredEvents.map((event) => [
        event.type,
        event.title,
        event.subtitle || "",
        format(event.startTime, "yyyy-MM-dd"),
        format(event.startTime, "h:mm a"),
        event.endTime ? format(event.endTime, "h:mm a") : "",
        event.details || "",
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-calendar-${format(startDate, "yyyy-MM-dd")}-to-${format(
      endDate,
      "yyyy-MM-dd"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Master Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Master Calendar
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="tour">Tours</SelectItem>
                <SelectItem value="class">Classes</SelectItem>
                <SelectItem value="shift">Shifts</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-lg font-semibold">
            {viewMode === "week"
              ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
              : format(currentDate, "EEEE, MMMM d, yyyy")}
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {daysToDisplay.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateStr] || [];
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateStr}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isTodayDate ? "bg-accent border-accent-foreground/20" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{format(day, "EEE")}</p>
                    <p className={`text-2xl font-bold ${isTodayDate ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </p>
                  </div>
                  {dayEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No events</p>
                  ) : (
                    dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded border text-xs ${event.color}`}
                      >
                        <div className="flex items-start gap-1">
                          {event.icon}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            {event.subtitle && (
                              <p className="text-[10px] opacity-80 truncate">{event.subtitle}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1 opacity-80">
                              <Clock className="h-2.5 w-2.5" />
                              <span className="text-[10px]">
                                {format(event.startTime, "h:mm a")}
                                {event.endTime && ` - ${format(event.endTime, "h:mm a")}`}
                              </span>
                            </div>
                            {event.details && (
                              <div className="flex items-center gap-1 mt-1 opacity-80">
                                <MapPin className="h-2.5 w-2.5" />
                                <p className="text-[10px] truncate">{event.details}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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

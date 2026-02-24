import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { add_color } from "@/lib/constants";
import { RefreshCw, Calendar, Users, Clock, User, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTodaysClasses, useSyncArketaClasses } from "@/hooks/useArketaApi";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function ClassScheduleView({ filterClassesOnly = false }: {filterClassesOnly?: boolean;} = {}) {
  // Use PST date for "today"
  const today = (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const d = parts.find((p) => p.type === "day")!.value;
    return `${y}-${m}-${d}`;
  })();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { data: classes, isLoading, error, refetch } = useTodaysClasses(isMobile ? selectedDate : today, filterClassesOnly);
  const syncClasses = useSyncArketaClasses();

  const handleSync = async () => {
    const date = isMobile ? selectedDate : today;
    await syncClasses.mutateAsync({ start_date: date, end_date: date });
    refetch();
  };

  const formatTime = (dateString: string) => {
    const match = dateString.match(/(\d{2}):(\d{2})/);
    if (!match) return dateString;
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${minutes} ${period}`;
  };

  const getEndTime = (startTime: string, durationMinutes: number | null) => {
    if (!durationMinutes) return null;
    const match = startTime.match(/(\d{2}):(\d{2})/);
    if (!match) return null;
    const totalMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + durationMinutes;
    const h = Math.floor(totalMin / 60) % 24;
    const m = String(totalMin % 60).padStart(2, "0");
    const period = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m} ${period}`;
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    if (capacity === 0) return "bg-muted";
    const percentage = booked / capacity * 100;
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  if (isLoading) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) =>
            <Skeleton key={i} className="h-20 w-full" />
            )}
          </div>
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Unable to load classes. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}>

            Retry
          </Button>
        </CardContent>
      </Card>);

  }

  const activeClasses = classes?.filter((c) => !c.is_cancelled) || [];
  const totalBooked = activeClasses.reduce((sum, c) => sum + (c.booked_count || 0), 0);
  const totalCapacity = activeClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);

  if (isMobile) {
    const isToday = selectedDate === today;
    const now = new Date();
    // Current PST time as HH:MM for comparison against stored PST times
    const pstNow = (() => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(now);
      const h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
      const m = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
      return h * 60 + m; // minutes since midnight PST
    })();

    const isClassPast = (startTime: string, durationMinutes: number | null) => {
      if (!isToday) return false;
      const match = startTime.match(/(\d{2}):(\d{2})/);
      if (!match) return false;
      const startMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      const endMin = startMin + (durationMinutes || 50);
      return pstNow >= endMin;
    };
    return (
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-2 p-3 border-b bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}>

            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-medium min-w-[120px] text-center">
            {isToday ? "Today" : format(new Date(selectedDate), "EEE, MMM d")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}>

            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto scroll-smooth relative">
          {activeClasses.length === 0 ?
          <p className="p-4 text-sm text-muted-foreground">No classes scheduled for this day.</p> :

          <div className="space-y-2 p-3 pb-6">
              {activeClasses.map((cls) => {
              const booked = cls.booked_count || 0;
              const capacity = cls.capacity || 0;
              const isPast = isClassPast(cls.start_time, cls.duration_minutes);
              const isExpanded = expandedClassId === cls.id;
              return (
                <div key={cls.id} className="space-y-0">
                    {isToday && activeClasses[0]?.id === cls.id &&
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                        <div className="h-px flex-1 bg-primary/50" />
                        <span>Now</span>
                        <div className="h-px flex-1 bg-primary/50" />
                      </div>
                  }
                    <button
                    type="button"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border shadow-sm transition-all duration-200 min-h-[44px]",
                      isPast && "opacity-60",
                      cls.is_cancelled ? "border-destructive bg-destructive/5" : "border-border bg-card"
                    )}>

                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          {formatTime(cls.start_time)}{getEndTime(cls.start_time, cls.duration_minutes) ? ` – ${getEndTime(cls.start_time, cls.duration_minutes)}` : ""}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium truncate">{cls.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {[cls.instructor_name, cls.room_name].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        {(cls.is_cancelled || isPast && !cls.is_cancelled) &&
                      <Badge variant={cls.is_cancelled ? "destructive" : "secondary"} className="text-[10px] shrink-0 rounded-none border-none text-white" style={cls.is_cancelled ? {} : { backgroundColor: '#009ddc', paddingTop: '2.25px', paddingBottom: '2.25px', paddingLeft: '6.75px', paddingRight: '6.75px' }}>
                            {cls.is_cancelled ? "Cancelled" : "Done"}
                          </Badge>
                      }
                      </div>
                      {isExpanded &&
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{booked} / {capacity} enrolled</span>
                          </div>
                          {cls.duration_minutes &&
                      <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{cls.duration_minutes} min</span>
                            </div>
                      }
                        </div>
                    }
                    </button>
                  </div>);

            })}
            </div>
          }
        </div>
      </div>);

  }

  return (
    <Card className="border border-border rounded-none flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-normal tracking-wide">
            Today's Classes
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncClasses.isPending}
          className="h-7 px-2">

          <RefreshCw className={`h-3 w-3 ${syncClasses.isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col">
          {activeClasses.length === 0 ?
        <p className="text-xs text-muted-foreground">No classes scheduled for today.</p> :

        <ScrollArea className="flex-1 pr-2">
            <div className="space-y-0">
              {(() => {
              const pstNowMin = (() => {
                const parts = new Intl.DateTimeFormat("en-GB", {
                  timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false
                }).formatToParts(new Date());
                return parseInt(parts.find((p) => p.type === "hour")!.value, 10) * 60 +
                parseInt(parts.find((p) => p.type === "minute")!.value, 10);
              })();
              const getEndMin = (cls: typeof activeClasses[0]) => {
                const match = cls.start_time.match(/(\d{2}):(\d{2})/);
                if (!match) return 0;
                return parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + (cls.duration_minutes || 50);
              };
              const upcoming = activeClasses.filter((c) => pstNowMin < getEndMin(c));
              const completed = activeClasses.filter((c) => pstNowMin >= getEndMin(c)).reverse();
              return [...upcoming, ...completed];
            })().map((cls) => {
              const booked = cls.booked_count || 0;
              const capacity = cls.capacity || 0;
              const percentage = capacity > 0 ? booked / capacity * 100 : 0;
              const isPast = (() => {
                const match = cls.start_time.match(/(\d{2}):(\d{2})/);
                if (!match) return false;
                const startMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
                const endMin = startMin + (cls.duration_minutes || 50);
                const nowParts = new Intl.DateTimeFormat("en-GB", {
                  timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false
                }).formatToParts(new Date());
                const nowMin = parseInt(nowParts.find((p) => p.type === "hour")!.value, 10) * 60 +
                parseInt(nowParts.find((p) => p.type === "minute")!.value, 10);
                return nowMin >= endMin;
              })();

              return (
                <div
                  key={cls.id}
                  className={`p-3 border-b border-border transition-colors ${
                  isPast ? "opacity-60" : ""} ${
                  cls.is_cancelled ? "border-l-4 border-l-destructive bg-destructive/5" : ""}`}
                  style={{
                    ...(!cls.is_cancelled ? { backgroundColor: `${add_color.blue}1A` } : {}),
                    ...(!isPast && !cls.is_cancelled ? { borderLeft: `4px solid ${add_color.blue}` } : {})
                  }}>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {cls.name}
                            {cls.room_name &&
                          <span className="text-muted-foreground font-normal"> ({cls.room_name})</span>
                          }
                          </span>
                          {cls.is_cancelled &&
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-none">
                              Cancelled
                            </Badge>
                        }
                          {isPast && !cls.is_cancelled &&
                        <Badge variant="secondary" className="text-[10px] rounded-none border-none text-white" style={{ backgroundColor: '#fcb827', paddingTop: '2.25px', paddingBottom: '2.25px', paddingLeft: '6.75px', paddingRight: '6.75px' }}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                        }
                          <span className="ml-auto text-xs whitespace-nowrap font-bold text-secondary-foreground">
                            {formatTime(cls.start_time)}
                            {getEndTime(cls.start_time, cls.duration_minutes) && ` – ${getEndTime(cls.start_time, cls.duration_minutes)}`}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {cls.instructor_name &&
                          <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {cls.instructor_name}
                              </span>
                          }
                            {cls.waitlist_count > 0 &&
                          <span className="ml-auto text-xs text-black">
                                +{cls.waitlist_count} waitlist
                              </span>
                          }
                            <span className={`${cls.waitlist_count > 0 ? '' : 'ml-auto '}text-xs font-bold text-muted-foreground`}>
                              {booked}{capacity ? `/${capacity}` : ''}
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  </div>);

            })}
            </div>
          </ScrollArea>
        }
      </CardContent>
    </Card>);

}
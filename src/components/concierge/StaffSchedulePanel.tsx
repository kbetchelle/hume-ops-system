import { format } from "date-fns";
import { Clock, MapPin, User, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodaysSchedule, useSyncSlingShifts } from "@/hooks/useSlingApi";
import { getPSTToday } from "@/lib/dateUtils";

export function StaffSchedulePanel() {
  const today = getPSTToday();
  const { data, isLoading, error, refetch } = useTodaysSchedule(today);
  const syncShifts = useSyncSlingShifts();
  // Shift times are PST values stored with +00 offset — format in UTC to preserve raw PST
  const formatTime = (dateString: string) => {
    try {
      const { formatInTimeZone } = require("date-fns-tz");
      return formatInTimeZone(new Date(dateString), "UTC", "h:mm a");
    } catch {
      return format(new Date(dateString), "h:mm a");
    }
  };

  const handleSync = async () => {
    await syncShifts.mutateAsync(today);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Unable to load schedule. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const schedule = data?.schedule || [];

  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
          <Users className="h-4 w-4" />
          Today's Schedule
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncShifts.isPending}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${syncShifts.isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <p className="text-xs text-muted-foreground">No shifts scheduled for today.</p>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-3">
              {schedule.map((shift, index) => (
                <div
                  key={shift.staffId || index}
                  className={`p-3 border rounded-none transition-colors ${
                    shift.isCurrentlyWorking
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{shift.name}</span>
                    </div>
                    {shift.isCurrentlyWorking && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 rounded-none">
                        Working
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {shift.position && (
                      <p className="text-xs text-muted-foreground">{shift.position}</p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(shift.shiftStart)} - {formatTime(shift.shiftEnd)}
                      </span>
                      {shift.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shift.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

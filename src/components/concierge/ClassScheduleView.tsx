import { format } from "date-fns";
import { RefreshCw, Calendar, Users, Clock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTodaysClasses, useSyncArketaClasses } from "@/hooks/useArketaApi";

export function ClassScheduleView() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: classes, isLoading, error, refetch } = useTodaysClasses(today);
  const syncClasses = useSyncArketaClasses();

  const handleSync = async () => {
    await syncClasses.mutateAsync({ start_date: today, end_date: today });
    refetch();
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    if (capacity === 0) return "bg-muted";
    const percentage = (booked / capacity) * 100;
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
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
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeClasses = classes?.filter(c => !c.is_cancelled) || [];
  const totalBooked = activeClasses.reduce((sum, c) => sum + (c.booked_count || 0), 0);
  const totalCapacity = activeClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);

  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Classes
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-1">
            {activeClasses.length} classes • {totalBooked}/{totalCapacity} booked
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncClasses.isPending}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${syncClasses.isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {activeClasses.length === 0 ? (
          <p className="text-xs text-muted-foreground">No classes scheduled for today.</p>
        ) : (
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-3">
              {activeClasses.map((cls) => {
                const booked = cls.booked_count || 0;
                const capacity = cls.capacity || 0;
                const percentage = capacity > 0 ? (booked / capacity) * 100 : 0;
                const isPast = new Date(cls.start_time) < new Date();

                return (
                  <div
                    key={cls.id}
                    className={`p-3 border rounded-none transition-colors ${
                      isPast ? "opacity-60" : ""
                    } ${cls.is_cancelled ? "border-destructive bg-destructive/5" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cls.name}</span>
                          {cls.is_cancelled && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-none">
                              Cancelled
                            </Badge>
                          )}
                          {isPast && !cls.is_cancelled && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-none">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(cls.start_time)}
                              {cls.duration_minutes && ` (${cls.duration_minutes}m)`}
                            </span>
                            {cls.instructor_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {cls.instructor_name}
                              </span>
                            )}
                          </div>
                          
                          {/* Capacity bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{booked}</span>
                              <span className="text-muted-foreground">/ {capacity}</span>
                            </div>
                            <div className="flex-1">
                              <Progress 
                                value={percentage} 
                                className="h-1.5"
                              />
                            </div>
                            {cls.waitlist_count > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 rounded-none">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {cls.waitlist_count} waitlist
                              </Badge>
                            )}
                          </div>
                          
                          {cls.room_name && (
                            <p className="text-[10px] text-muted-foreground">
                              {cls.room_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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

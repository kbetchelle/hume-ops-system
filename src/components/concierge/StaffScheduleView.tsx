import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStaffShifts, useWeeklyStaffShifts, useSyncSlingShifts, StaffShift } from "@/hooks/useStaffShifts";
import { usePermissions } from "@/hooks/usePermissions";
import { format, parseISO, isToday, addDays, startOfWeek } from "date-fns";
import { RefreshCw, User, Clock, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StaffScheduleViewProps {
  compact?: boolean;
}

export function StaffScheduleView({ compact = false }: StaffScheduleViewProps) {
  const [viewDate] = useState(new Date());
  const { data: todayShifts, isLoading: todayLoading } = useStaffShifts(viewDate);
  const { data: weeklyShifts, isLoading: weeklyLoading } = useWeeklyStaffShifts(viewDate);
  const syncMutation = useSyncSlingShifts();
  const { isManagerOrAdmin } = usePermissions();
  const canSync = isManagerOrAdmin();

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(`Synced ${result.synced} shifts from GetSling`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync shifts");
    }
  };

  const formatShiftTime = (start: string, end: string) => {
    return `${format(parseISO(start), "h:mm a")} - ${format(parseISO(end), "h:mm a")}`;
  };

  const groupShiftsByDate = (shifts: StaffShift[]) => {
    const grouped: Record<string, StaffShift[]> = {};
    for (const shift of shifts || []) {
      if (!grouped[shift.shift_date]) {
        grouped[shift.shift_date] = [];
      }
      grouped[shift.shift_date].push(shift);
    }
    return grouped;
  };

  const renderShiftCard = (shift: StaffShift) => (
    <div
      key={shift.id}
      className="flex items-start justify-between py-3 border-b border-border last:border-0"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium tracking-wide">
            {shift.user_name || "Unassigned"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] tracking-wide">
            {formatShiftTime(shift.shift_start, shift.shift_end)}
          </span>
        </div>
        {shift.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-[10px] tracking-wide">{shift.location}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {shift.position && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest">
            {shift.position}
          </Badge>
        )}
        <Badge
          variant={shift.status === "scheduled" ? "secondary" : "outline"}
          className="text-[9px] uppercase tracking-widest"
        >
          {shift.status || "Scheduled"}
        </Badge>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Today's Staff
            </CardTitle>
            {canSync && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="h-6 px-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {todayLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !todayShifts?.length ? (
            <p className="text-xs text-muted-foreground py-4">No shifts scheduled</p>
          ) : (
            <div className="space-y-0 max-h-48 overflow-y-auto">
              {todayShifts.map(renderShiftCard)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const groupedShifts = groupShiftsByDate(weeklyShifts || []);

  return (
    <Card className="border border-border rounded-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            Staff Schedule
          </CardTitle>
          {canSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="text-[10px] uppercase tracking-widest"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Syncing
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Sync from Sling
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="today" className="text-[10px] uppercase tracking-widest rounded-none">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="text-[10px] uppercase tracking-widest rounded-none">
              This Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            {todayLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !todayShifts?.length ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No shifts scheduled for today
              </p>
            ) : (
              <div className="space-y-0">
                {todayShifts.map(renderShiftCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            {weeklyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const shifts = groupedShifts[dateStr] || [];
                  const dayIsToday = isToday(day);

                  return (
                    <div key={dateStr} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {format(day, "EEEE, MMM d")}
                        </h4>
                        {dayIsToday && (
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-widest">
                            Today
                          </Badge>
                        )}
                      </div>
                      {shifts.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground pl-2">
                          No shifts scheduled
                        </p>
                      ) : (
                        <div className="border-l border-border pl-4">
                          {shifts.map(renderShiftCard)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

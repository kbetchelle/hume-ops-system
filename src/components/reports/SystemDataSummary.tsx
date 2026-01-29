import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  CalendarCheck,
  DollarSign,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ShiftSystemData } from "@/hooks/useShiftSystemData";
import { format } from "date-fns";

interface SystemDataSummaryProps {
  data: ShiftSystemData | undefined;
  isLoading: boolean;
  shiftType: "AM" | "PM";
}

export function SystemDataSummary({ data, isLoading, shiftType }: SystemDataSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Unable to load system data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          System Data Summary
        </h3>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Updated {format(new Date(data.lastUpdated), "h:mm a")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Check-ins Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.checkIns.total}</div>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span>Gym: {data.checkIns.gym}</span>
              <span>Class: {data.checkIns.class}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reservations.total}</div>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span className="text-green-600">{data.reservations.checkedIn} in</span>
              <span className="text-yellow-600">{data.reservations.pending} pending</span>
            </div>
          </CardContent>
        </Card>

        {/* Sales Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Café Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sales.totalRevenue > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  ${data.sales.totalRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.sales.orderCount} orders
                </div>
              </>
            ) : (
              <>
                <div className="text-lg text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    Pending Integration
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Staff on {shiftType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.staff.totalStaff > 0 ? (
              <>
                <div className="text-2xl font-bold">{data.staff.totalStaff}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.staff.onShift.slice(0, 2).map(s => s.name).join(", ")}
                  {data.staff.onShift.length > 2 && ` +${data.staff.onShift.length - 2}`}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    Pending Integration
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classes Today */}
        {data.reservations.classes.length > 0 && (
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Classes ({data.reservations.classes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {data.reservations.classes.map((cls, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <span className="font-medium">{cls.className}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {cls.time}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cls.signups}/{cls.capacity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Recent Check-ins */}
        {data.checkIns.recentCheckIns.length > 0 && (
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {data.checkIns.recentCheckIns.map((checkin, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="truncate max-w-[180px]">{checkin.memberName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {checkin.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {checkin.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Staff on Shift */}
        {data.staff.onShift.length > 0 && (
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {data.staff.onShift.map((staff, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {staff.position}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {staff.shiftStart} - {staff.shiftEnd}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

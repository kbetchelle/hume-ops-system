import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { selectFrom } from "@/lib/dataApi";

interface StaffOnShift {
  id: string;
  staff_name: string;
  position: string;
  shift_start: string;
  shift_end: string;
  is_currently_working: boolean;
}

const POSITION_ORDER = ["Concierge", "Trainer", "Spa", "Cafe", "Other"];

const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const normalizePosition = (position: string | null): string => {
  if (!position) return "Other";
  const lower = position.toLowerCase();
  if (lower.includes("concierge")) return "Concierge";
  if (lower.includes("trainer") || lower.includes("coach")) return "Trainer";
  if (lower.includes("spa") || lower.includes("attendant")) return "Spa";
  if (lower.includes("cafe") || lower.includes("barista")) return "Cafe";
  return "Other";
};

const groupByPosition = (staff: StaffOnShift[]): Record<string, StaffOnShift[]> => {
  const grouped: Record<string, StaffOnShift[]> = {};
  
  staff.forEach((person) => {
    const normalizedPosition = normalizePosition(person.position);
    if (!grouped[normalizedPosition]) {
      grouped[normalizedPosition] = [];
    }
    grouped[normalizedPosition].push(person);
  });

  return grouped;
};

const formatTimeRange = (start: string, end: string): string => {
  try {
    const startFormatted = format(parseISO(start), "h:mm a");
    const endFormatted = format(parseISO(end), "h:mm a");
    return `${startFormatted} - ${endFormatted}`;
  } catch {
    return "—";
  }
};

export function WhosWorkingView() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["daily-schedules", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<StaffOnShift>("daily_schedules", {
        filters: [{ type: "eq", column: "schedule_date", value: today }],
        order: { column: "shift_start", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const currentlyWorkingCount = staff?.filter((s) => s.is_currently_working).length || 0;
  const groupedStaff = staff ? groupByPosition(staff) : {};

  return (
    <Card className="rounded-none border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-normal tracking-wide">
            <Users className="h-4 w-4" />
            Who's Working Today
          </CardTitle>
          <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-widest">
            {currentlyWorkingCount} on shift
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-none" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !staff || staff.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No staff scheduled for today
          </p>
        ) : (
          POSITION_ORDER.map((position) => {
            const positionStaff = groupedStaff[position];
            if (!positionStaff || positionStaff.length === 0) return null;

            return (
              <div key={position} className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {position}
                </h4>
                <div className="space-y-2">
                  {positionStaff.map((person) => (
                    <div
                      key={person.id}
                      className={`
                        flex items-center gap-3 p-3 border transition-colors duration-200
                        ${
                          person.is_currently_working
                            ? "bg-primary/5 border-primary/20"
                            : "border-border hover:bg-muted/50"
                        }
                      `}
                    >
                      <Avatar className="h-8 w-8 rounded-none">
                        <AvatarFallback className="rounded-none text-[10px] bg-muted">
                          {getInitials(person.staff_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-normal truncate">
                          {person.staff_name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px]">
                            {formatTimeRange(person.shift_start, person.shift_end)}
                          </span>
                        </div>
                      </div>

                      {person.is_currently_working && (
                        <Badge className="rounded-none text-[10px] uppercase tracking-widest bg-primary text-primary-foreground">
                          On Shift
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

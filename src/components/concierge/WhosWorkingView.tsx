import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface StaffOnShift {
  id: string;
  user_name: string;
  position: string;
  shift_start: string;
  shift_end: string;
}

interface StaffWithStatus extends StaffOnShift {
  is_currently_working: boolean;
}

const POSITION_ORDER = ["Concierge", "Trainer", "Spa", "Cafe", "Other"];
const LA_TIMEZONE = "America/Los_Angeles";

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

const groupByPosition = (staff: StaffWithStatus[]): Record<string, StaffWithStatus[]> => {
  const grouped: Record<string, StaffWithStatus[]> = {};
  
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
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    // Convert to LA timezone for display
    const startLA = toZonedTime(startDate, LA_TIMEZONE);
    const endLA = toZonedTime(endDate, LA_TIMEZONE);
    const startFormatted = format(startLA, "h:mm a");
    const endFormatted = format(endLA, "h:mm a");
    return `${startFormatted} - ${endFormatted}`;
  } catch {
    return "—";
  }
};

const isCurrentlyWorking = (shiftStart: string, shiftEnd: string): boolean => {
  try {
    const now = new Date();
    const start = parseISO(shiftStart);
    const end = parseISO(shiftEnd);
    return now >= start && now <= end;
  } catch {
    return false;
  }
};

export function WhosWorkingView() {
  // Get today's date in LA timezone
  const nowLA = toZonedTime(new Date(), LA_TIMEZONE);
  const todayLA = format(nowLA, "yyyy-MM-dd");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-shifts-today", todayLA],
    queryFn: async () => {
      // First fetch shifts for today
      const { data: shiftsData, error: shiftsError } = await (supabase
        .from("staff_shifts") as any)
        .select("id, staff_name, position, shift_start, shift_end, sling_user_id")
        .eq("shift_date", todayLA)
        .order("shift_start", { ascending: true });

      if (shiftsError) throw shiftsError;
      const shifts = (shiftsData ?? []) as any[];
      if (shifts.length === 0) return [];

      // Get unique sling_user_ids to fetch names
      const slingUserIds = shifts
        .map((s: any) => s.sling_user_id)
        .filter(id => id != null)
        .map(id => String(id));
      const uniqueSlingUserIds = [...new Set(slingUserIds)];
      
      // Fetch sling_users separately if we have IDs
      let slingUsersMap: Record<string, { first_name: string; last_name: string }> = {};
      if (uniqueSlingUserIds.length > 0) {
        const { data: slingUsers } = await (supabase
          .from("sling_users") as any)
          .select("sling_user_id, first_name, last_name")
          .in("sling_user_id", uniqueSlingUserIds.map(id => parseInt(id, 10)));
        
        if (slingUsers) {
          slingUsersMap = Object.fromEntries(
            slingUsers.map(u => [String(u.sling_user_id), { first_name: u.first_name || '', last_name: u.last_name || '' }])
          );
        }
      }

      // Map shifts with full names from sling_users
      return shifts.map((shift: any) => {
        const slingUser = shift.sling_user_id ? slingUsersMap[String(shift.sling_user_id)] : null;
        const fullName = slingUser 
          ? [slingUser.first_name, slingUser.last_name].filter(Boolean).join(' ') 
          : shift.staff_name || 'Unknown';

        return {
          id: shift.id,
          user_name: fullName,
          position: shift.position,
          shift_start: shift.shift_start,
          shift_end: shift.shift_end,
        } as StaffOnShift;
      });
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Compute currently working status dynamically
  const staffWithStatus = staff?.map((s) => ({
    ...s,
    is_currently_working: isCurrentlyWorking(s.shift_start, s.shift_end),
  })) || [];

  const currentlyWorkingCount = staffWithStatus.filter((s) => s.is_currently_working).length;
  const groupedStaff = groupByPosition(staffWithStatus);

  return (
    <Card className="rounded-none border border-border flex-1 w-full">
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
                          {getInitials(person.user_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-normal truncate">
                          {person.user_name || "Unknown"}
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

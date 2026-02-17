import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBoHChecklists, BoHChecklist } from "@/hooks/checklists/useBoHChecklists";
import { useConciergeChecklists, ConciergeChecklist } from "@/hooks/checklists/useConciergeChecklists";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Map checklist titles to their visible hours on the role page
const BOH_VISIBLE_HOURS: Record<string, string> = {
  "Floater - Weekday AM": "Before 2:00 PM",
  "Floater - Weekday PM": "2:00 PM onwards",
  "Floater - Weekend AM": "Before 1:00 PM",
  "Floater - Weekend PM (sun only)": "1:00 PM onwards",
  "Male Spa Attendant - Weekday AM": "Before 2:00 PM",
  "Male Spa Attendant - Weekday PM": "2:00 PM onwards",
  "Male Spa Attendant - Weekend AM": "Before 1:00 PM",
  "Male Spa Attendant - Weekend AM (2)": "Before 1:00 PM",
  "Male Spa Attendant - Weekend PM": "1:00 PM onwards",
  "Female Spa Attendant - Weekday AM": "Before 2:00 PM",
  "Female Spa Attendant - Weekday PM": "2:00 PM onwards",
  "Female Spa Attendant - Weekend PM": "1:00 PM onwards",
};

function getDefaultVisibleHours(shiftTime: "AM" | "PM"): string {
  return shiftTime === "AM" ? "Before 2:00 PM" : "2:00 PM onwards";
}

interface ScheduleSlot {
  checklistId: string;
  title: string;
  shiftTime: "AM" | "PM";
  isWeekend: boolean;
  roleType?: string;
}

function detectConflicts(checklists: ScheduleSlot[]): Map<string, boolean> {
  const conflicts = new Map<string, boolean>();
  const slotMap = new Map<string, string[]>();

  checklists.forEach((cl) => {
    // Generate keys for each applicable day
    const applicableDays = cl.isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const roleKey = cl.roleType || "concierge";
    
    applicableDays.forEach((day) => {
      const key = `${roleKey}-${day}-${cl.shiftTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, []);
      }
      slotMap.get(key)!.push(cl.checklistId);
    });
  });

  // Mark conflicts where more than one checklist occupies the same slot
  slotMap.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => conflicts.set(id, true));
    }
  });

  return conflicts;
}

function ScheduleGrid({ shiftTime, isWeekend }: { shiftTime: "AM" | "PM"; isWeekend: boolean }) {
  return (
    <div className="flex gap-1">
      {DAYS.map((day) => {
        const isWeekendDay = day === "Sat" || day === "Sun";
        const isActive = isWeekend ? isWeekendDay : !isWeekendDay;
        
        return (
          <div
            key={day}
            className={cn(
              "w-8 h-6 flex items-center justify-center text-[10px] rounded",
              isActive
                ? shiftTime === "AM"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "bg-muted/30 text-muted-foreground/50"
            )}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

function BoHChecklistTable({ checklists, conflicts }: { checklists: BoHChecklist[]; conflicts: Map<string, boolean> }) {
  const roleLabels: Record<string, string> = {
    floater: "Floater",
    male_spa_attendant: "Male Spa",
    female_spa_attendant: "Female Spa",
  };

  return (
    <Card className="border rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-widest">
          Back of House Checklists
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-xs uppercase tracking-wider">Checklist</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Shift</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Visible Hours</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No BoH checklists found
                </TableCell>
              </TableRow>
            ) : (
              checklists.map((cl) => {
                const hasConflict = conflicts.get(cl.id);
                return (
                  <TableRow
                    key={cl.id}
                    className={cn(
                      hasConflict && "bg-destructive/10 hover:bg-destructive/15"
                    )}
                  >
                    <TableCell className={cn("font-medium", hasConflict && "text-destructive")}>
                      {cl.title}
                      {hasConflict && (
                        <span className="ml-2 text-[10px] uppercase text-destructive">Conflict</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {roleLabels[cl.role_type] || cl.role_type}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          cl.shift_time === "AM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                        )}
                      >
                        {cl.shift_time}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {BOH_VISIBLE_HOURS[cl.title] || getDefaultVisibleHours(cl.shift_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScheduleGrid shiftTime={cl.shift_time} isWeekend={cl.is_weekend} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Map checklist titles to their specific time ranges
const CONCIERGE_TIME_RANGES: Record<string, string> = {
  "Concierge - Weekday AM": "6am - 1:30pm",
  "Concierge - Weekday PM": "1:30pm - 8pm",
  "Concierge - Weekday Opening Checklist": "5am - 6am",
  "Concierge - Weekday Closing Checklist": "8pm - 9pm",
  "Concierge - Weekend AM": "7am - 1pm",
  "Concierge - Weekend PM": "1pm - 6pm",
  "Concierge - Weekend Opening Checklist": "6am - 7am",
  "Concierge - Weekend Closing Checklist": "6pm - 7pm",
};

function ConciergeChecklistTable({ checklists, conflicts }: { checklists: ConciergeChecklist[]; conflicts: Map<string, boolean> }) {
  return (
    <Card className="border rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-widest">
          Concierge Checklists
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-xs uppercase tracking-wider">Checklist</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Visible Hours</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No Concierge checklists found
                </TableCell>
              </TableRow>
            ) : (
              checklists.map((cl) => {
                const hasConflict = conflicts.get(cl.id);
                const timeRange = CONCIERGE_TIME_RANGES[cl.title] || cl.shift_time;
                return (
                  <TableRow
                    key={cl.id}
                    className={cn(
                      hasConflict && "bg-destructive/10 hover:bg-destructive/15"
                    )}
                  >
                    <TableCell className={cn("font-medium", hasConflict && "text-destructive")}>
                      {cl.title}
                      {hasConflict && (
                        <span className="ml-2 text-[10px] uppercase text-destructive">Conflict</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          cl.shift_time === "AM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                        )}
                      >
                        {timeRange}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScheduleGrid shiftTime={cl.shift_time} isWeekend={cl.is_weekend} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AssignChecklistsTab() {
  const { data: bohChecklists = [], isLoading: bohLoading } = useBoHChecklists();
  const { data: conciergeChecklists = [], isLoading: conciergeLoading } = useConciergeChecklists();

  const bohConflicts = useMemo(() => {
    const slots: ScheduleSlot[] = bohChecklists.map((cl) => ({
      checklistId: cl.id,
      title: cl.title,
      shiftTime: cl.shift_time,
      isWeekend: cl.is_weekend,
      roleType: cl.role_type,
    }));
    return detectConflicts(slots);
  }, [bohChecklists]);

  const conciergeConflicts = useMemo(() => {
    const slots: ScheduleSlot[] = conciergeChecklists.map((cl) => ({
      checklistId: cl.id,
      title: cl.title,
      shiftTime: cl.shift_time,
      isWeekend: cl.is_weekend,
    }));
    return detectConflicts(slots);
  }, [conciergeChecklists]);

  if (bohLoading || conciergeLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading checklists...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BoHChecklistTable checklists={bohChecklists} conflicts={bohConflicts} />
      <ConciergeChecklistTable checklists={conciergeChecklists} conflicts={conciergeConflicts} />
    </div>
  );
}

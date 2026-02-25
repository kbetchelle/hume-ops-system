import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyReportRow } from "@/hooks/useReports";

interface ClassScheduleTableProps {
  report: DailyReportRow | null;
}

type ClassDetail = {
  time: string;
  end_time?: string;
  name: string;
  instructor: string;
  signups: number;
  waitlist: number;
  reservation_type?: string;
};

/** Parse "h:mm AM/PM" into minutes since midnight for chronological sorting. */
function timeToMinutes(t: string): number {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "AM" && hours === 12) hours = 0;
  if (period === "PM" && hours !== 12) hours += 12;
  return hours * 60 + minutes;
}

export function ClassScheduleTable({ report }: ClassScheduleTableProps) {
  const details = (report?.class_details as ClassDetail[] | null) ?? [];
  const classesOnly = details.filter((d) => d.reservation_type === "Classes" || !d.reservation_type);
  const sorted = [...classesOnly].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No class schedule data for this date.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Sign-ups</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead>Class Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row, i) => (
          <TableRow key={i}>
            <TableCell>{row.time}{row.end_time ? ` – ${row.end_time}` : ""}</TableCell>
            <TableCell>{row.signups}</TableCell>
            <TableCell>{row.instructor ?? "—"}</TableCell>
            <TableCell>{row.name ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

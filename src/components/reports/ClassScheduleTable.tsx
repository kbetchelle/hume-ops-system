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

export function ClassScheduleTable({ report }: ClassScheduleTableProps) {
  const details = (report?.class_details as ClassDetail[] | null) ?? [];
  const classesOnly = details.filter((d) => d.reservation_type === "Classes" || !d.reservation_type);
  const sorted = [...classesOnly].sort((a, b) => a.time.localeCompare(b.time));

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

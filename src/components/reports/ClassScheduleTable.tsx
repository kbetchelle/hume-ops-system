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
  name: string;
  instructor: string;
  signups: number;
  waitlist: number;
};

export function ClassScheduleTable({ report }: ClassScheduleTableProps) {
  const details = (report?.class_details as ClassDetail[] | null) ?? [];
  const sorted = [...details].sort((a, b) => a.time.localeCompare(b.time));

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
            <TableCell>{row.time}</TableCell>
            <TableCell>{row.signups}</TableCell>
            <TableCell>{row.instructor ?? "—"}</TableCell>
            <TableCell>{row.name ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

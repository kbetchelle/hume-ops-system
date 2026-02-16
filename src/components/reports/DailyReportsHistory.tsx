import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { DailyReportView } from "./DailyReportView";
import { useWeeklyReports, getWeekStart, getWeekEnd } from "@/hooks/useReports";

export function DailyReportsHistory() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = getWeekStart(new Date());
    return d;
  });

  const startStr = format(weekStart, "yyyy-MM-dd");
  const weekEnd = getWeekEnd(weekStart);
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const { data: reports, isLoading } = useWeeklyReports(startStr, endStr);

  const goPrev = () => setWeekStart((d) => subDays(d, 7));
  const goNext = () => setWeekStart((d) => addDays(d, 7));

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {reports && reports.length > 0 && <WeeklySummaryCard reports={reports} />}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4">Loading…</p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {reports?.map((report) => (
            <AccordionItem key={report.report_date} value={report.report_date}>
              <AccordionTrigger>
                {format(new Date(report.report_date + "T12:00:00"), "EEE, MMM d, yyyy")} —{" "}
                {report.total_sales != null ? `$${Number(report.total_sales).toFixed(2)}` : "—"}
              </AccordionTrigger>
              <AccordionContent>
                <DailyReportView report={report} reportDate={report.report_date} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {!isLoading && reports?.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No reports for this week. Run aggregation for individual dates.
        </p>
      )}
    </div>
  );
}

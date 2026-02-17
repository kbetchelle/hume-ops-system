import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Download, FileText, CalendarIcon } from "lucide-react";
import {
  useReport,
  useAggregateReport,
  useExportPDF,
  useUpdateReport,
  getWeekStart,
  getWeekEnd,
} from "@/hooks/useReports";
import {
  ReportPreviewDialog,
  SyncStatusIndicator,
  DailyReportView,
  DailyReportsHistory,
} from "@/components/reports";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  // Export tab state
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"single" | "weekly">("single");
  const [previewDate, setPreviewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Report History tab state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const historyDateStr = format(selectedDate, "yyyy-MM-dd");

  const singleDateStr = format(singleDate, "yyyy-MM-dd");
  const startStr = format(weekStart, "yyyy-MM-dd");
  const weekEnd = getWeekEnd(weekStart);
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useReport(previewDate);
  const { data: historyReport, isLoading: historyLoading } = useReport(historyDateStr);
  const aggregate = useAggregateReport();
  const exportPdf = useExportPDF();
  const updateReport = useUpdateReport(previewDate);

  const handleAggregateSingle = () => {
    aggregate.mutate({ date: singleDateStr, sync_source: "manual" });
    toast.info("Aggregating report data…");
  };
  const handleAggregateWeek = () => {
    aggregate.mutate({ start_date: startStr, end_date: endStr, sync_source: "manual" });
    toast.info("Aggregating weekly data…");
  };

  const handlePreviewSingle = () => {
    setPreviewDate(singleDateStr);
    setPreviewMode("single");
    setPreviewOpen(true);
  };

  const handlePreviewWeekly = () => {
    setPreviewDate(startStr);
    setPreviewMode("weekly");
    setPreviewOpen(true);
  };

  const handleExportSingle = async () => {
    try {
      await exportPdf.mutateAsync({ report_date: singleDateStr, format: "single" });
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportWeekly = async () => {
    try {
      await exportPdf.mutateAsync({ start_date: startStr, end_date: endStr, format: "weekly" });
    } catch {
      toast.error("Export failed");
    }
  };

  const handleSavePreview = async (
    updates: Parameters<Parameters<typeof updateReport.mutateAsync>[0]>[0]
  ) => {
    try {
      await updateReport.mutateAsync(updates);
      refetchReport();
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6 overflow-hidden">
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium">Single-Day Export</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(singleDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={singleDate}
                        onSelect={(d) => d && setSingleDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAggregateSingle}
                      disabled={aggregate.isPending}
                    >
                      {aggregate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Refresh data
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePreviewSingle}>
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleExportSingle}
                      disabled={exportPdf.isPending}
                    >
                      {exportPdf.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium">Weekly Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Week: {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeekStart(subDays(weekStart, 7))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeekStart(addDays(weekStart, 7))}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAggregateWeek}
                      disabled={aggregate.isPending}
                    >
                      {aggregate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Refresh data
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePreviewWeekly}>
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleExportWeekly}
                      disabled={exportPdf.isPending}
                    >
                      {exportPdf.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <SyncStatusIndicator />
            </div>

            <ReportPreviewDialog
              open={previewOpen}
              onOpenChange={setPreviewOpen}
              report={report ?? null}
              reportDate={previewDate}
              onSave={handleSavePreview}
              isSaving={updateReport.isPending}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Tabs defaultValue="single" className="space-y-4">
              <TabsList>
                <TabsTrigger value="single">Single Day</TabsTrigger>
                <TabsTrigger value="weekly">Weekly History</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-[200px] justify-start")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(selectedDate, "MMM d, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
                <DailyReportView
                  report={historyReport ?? null}
                  reportDate={historyDateStr}
                  isLoading={historyLoading}
                />
              </TabsContent>

              <TabsContent value="weekly" className="mt-4">
                <DailyReportsHistory />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

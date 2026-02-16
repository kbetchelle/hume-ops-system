import { useState } from "react";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { useReport } from "@/hooks/useReports";
import { DailyReportView, DailyReportsHistory } from "@/components/reports";
import { cn } from "@/lib/utils";

export default function DailyReportsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: report, isLoading } = useReport(dateStr);

  return (
    <DashboardLayout title="Daily Reports">
      <div className="space-y-6 overflow-hidden">
        <Tabs defaultValue="single">
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
            <DailyReportView report={report ?? null} reportDate={dateStr} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="weekly" className="mt-4">
            <DailyReportsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

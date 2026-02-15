import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  FileText,
  Loader2,
  Users,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import {
  useActivityLogs,
  useMemberActivitySummary,
  useNewSignups,
  useMemberRetention,
} from "@/hooks/useActivityReports";
import { cn } from "@/lib/utils";

const stageColors: Record<string, string> = {
  lead: "bg-zinc-100 text-zinc-800",
  prospect: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  churned: "bg-red-100 text-red-800",
};

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [activityType, setActivityType] = useState("all");
  const [reportTemplate, setReportTemplate] = useState("activity");

  const dateFilters = {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };

  const { data: activitySummary, isLoading: summaryLoading } =
    useMemberActivitySummary(dateFilters);
  const { data: newSignups, isLoading: signupsLoading } = useNewSignups(dateFilters);
  const { data: retentionData, isLoading: retentionLoading } =
    useMemberRetention(dateFilters);
  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs({
    ...dateFilters,
    activityType,
  });

  const exportToCSV = (data: unknown[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0] as object);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const value = (row as Record<string, unknown>)[h];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickDateRanges = [
    { label: "Last 7 days", start: subDays(new Date(), 7), end: new Date() },
    { label: "Last 30 days", start: subDays(new Date(), 30), end: new Date() },
    { label: "This month", start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    {
      label: "Last month",
      start: startOfMonth(subDays(startOfMonth(new Date()), 1)),
      end: endOfMonth(subDays(startOfMonth(new Date()), 1)),
    },
  ];

  return (
    <DashboardLayout title="Manager Reports">
      <div className="space-y-6 overflow-hidden">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => d && setStartDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="self-center text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => d && setEndDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2">
                {quickDateRanges.map((range) => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate(range.start);
                      setEndDate(range.end);
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Members</CardDescription>
              <CardTitle className="text-2xl">
                {retentionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  retentionData?.totalMembers || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <Users className="h-3 w-3 inline mr-1" />
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Members</CardDescription>
              <CardTitle className="text-2xl">
                {retentionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  retentionData?.activeMembers || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {retentionData?.retentionRate}% retention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New Signups</CardDescription>
              <CardTitle className="text-2xl">
                {signupsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  newSignups?.length || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <UserPlus className="h-3 w-3 inline mr-1" />
                In date range
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Activities</CardDescription>
              <CardTitle className="text-2xl">
                {logsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  activityLogs?.length || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <FileText className="h-3 w-3 inline mr-1" />
                Visits & classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="activity">Member Activity</TabsTrigger>
              <TabsTrigger value="signups">New Signups</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (reportTemplate === "activity" && activitySummary) {
                    exportToCSV(activitySummary, "member-activity");
                  } else if (reportTemplate === "signups" && newSignups) {
                    exportToCSV(newSignups, "new-signups");
                  } else if (reportTemplate === "retention" && retentionData) {
                    exportToCSV(
                      retentionData.activeMembersList || [],
                      "active-members"
                    );
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Member Activity Summary</CardTitle>
                <CardDescription>
                  Visits and class attendance by member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
              <div className="overflow-x-auto">
              <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right">Classes</TableHead>
                        <TableHead>Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activitySummary?.slice(0, 50).map((member) => (
                        <TableRow key={member.member_id}>
                          <TableCell className="max-w-[200px]">
                            <div className="overflow-hidden">
                              <p className="font-medium truncate">{member.member_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.member_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.lifecycle_stage && (
                              <Badge
                                variant="secondary"
                                className={stageColors[member.lifecycle_stage] || ""}
                              >
                                {member.lifecycle_stage}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.total_visits}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.total_classes}
                          </TableCell>
                          <TableCell>
                            {member.last_visit
                              ? format(new Date(member.last_visit), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>New Signups</CardTitle>
                <CardDescription>
                  Members who joined during the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : newSignups?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No new signups in this period
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newSignups?.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="max-w-[200px]">
                            <div className="overflow-hidden">
                              <p className="font-medium truncate">{member.client_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.client_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.lifecycle_stage && (
                              <Badge
                                variant="secondary"
                                className={stageColors[member.lifecycle_stage] || ""}
                              >
                                {member.lifecycle_stage}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {member.created_at
                              ? format(new Date(member.created_at), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Retention Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {retentionLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Total Members</span>
                        <span className="font-bold">
                          {retentionData?.totalMembers}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active Members</span>
                        <span className="font-bold text-green-600">
                          {retentionData?.activeMembers}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Inactive Members</span>
                        <span className="font-bold text-amber-600">
                          {retentionData?.inactiveMembers}
                        </span>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Retention Rate</span>
                          <span className="text-2xl font-bold">
                            {retentionData?.retentionRate}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inactive Members</CardTitle>
                  <CardDescription>
                    Members with no activity in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {retentionData?.inactiveMembersList
                        ?.slice(0, 20)
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/50"
                          >
                            <div className="overflow-hidden min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.client_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.client_email}
                              </p>
                            </div>
                            {member.lifecycle_stage && (
                              <Badge
                                variant="secondary"
                                className={stageColors[member.lifecycle_stage] || ""}
                              >
                                {member.lifecycle_stage}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

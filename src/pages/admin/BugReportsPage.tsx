import { useState } from "react";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBugReportsWithReporter,
  useUpdateBugReportStatus,
  useMarkBugReportRead,
  type BugReportWithReporter,
  type BugReport,
} from "@/hooks/useBugReports";
import {
  Bug,
  ExternalLink,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig: Record<
  BugReport["severity"],
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700 border-amber-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
};

const categoryConfig: Record<BugReport["category"], { label: string }> = {
  bug: { label: "Bug" },
  feature: { label: "Feature Request" },
  ui: { label: "UI/UX" },
  performance: { label: "Performance" },
  general: { label: "General" },
};

const statusConfig: Record<
  BugReport["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  open: { label: "Open", icon: Circle, className: "text-blue-600" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-amber-600" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "text-green-600" },
  closed: { label: "Closed", icon: XCircle, className: "text-slate-400" },
};

function BugDetailDialog({
  bug,
  open,
  onOpenChange,
}: {
  bug: BugReportWithReporter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!bug) return null;

  const severity = severityConfig[bug.severity];
  const category = categoryConfig[bug.category];
  const status = statusConfig[bug.status];
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-normal">
            <Bug className="h-4 w-4" />
            {bug.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Bug report details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata row */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("rounded-none text-[10px]", severity.className)}
            >
              {severity.label}
            </Badge>
            <Badge variant="outline" className="rounded-none text-[10px]">
              {category.label}
            </Badge>
            <Badge variant="outline" className={cn("rounded-none text-[10px] flex items-center gap-1", status.className)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Reporter & date */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Reporter
              </p>
              <p>{bug.reporter_name || "Unknown"}</p>
              {bug.reporter_email && (
                <p className="text-muted-foreground">{bug.reporter_email}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Submitted
              </p>
              <p>{format(parseISO(bug.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Description
            </p>
            <div className="text-xs whitespace-pre-wrap bg-muted/50 p-3 border border-border max-h-[200px] overflow-y-auto">
              {bug.description}
            </div>
          </div>

          {/* Page URL */}
          {bug.page_url && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Page URL
              </p>
              <a
                href={bug.page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {bug.page_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* User Agent */}
          {bug.user_agent && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Browser / User Agent
              </p>
              <p className="text-[10px] text-muted-foreground break-all">
                {bug.user_agent}
              </p>
            </div>
          )}

          {/* Screenshot */}
          {bug.screenshot_url && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Screenshot
              </p>
              <a
                href={bug.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View Screenshot
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BugReportsPage() {
  const { data: bugs, isLoading } = useBugReportsWithReporter();
  const updateStatus = useUpdateBugReportStatus();
  const markAsRead = useMarkBugReportRead();

  const [selectedBug, setSelectedBug] = useState<BugReportWithReporter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const handleViewBug = (bug: BugReportWithReporter) => {
    setSelectedBug(bug);
    setDetailOpen(true);
    // Mark as read
    markAsRead.mutate(bug.id);
  };

  const handleStatusChange = (bugId: string, newStatus: BugReport["status"]) => {
    updateStatus.mutate({ id: bugId, status: newStatus });
  };

  // Apply filters
  const filteredBugs = (bugs || []).filter((bug) => {
    if (statusFilter !== "all" && bug.status !== statusFilter) return false;
    if (categoryFilter !== "all" && bug.category !== categoryFilter) return false;
    if (severityFilter !== "all" && bug.severity !== severityFilter) return false;
    return true;
  });

  // Stats
  const openCount = (bugs || []).filter((b) => b.status === "open").length;
  const inProgressCount = (bugs || []).filter((b) => b.status === "in_progress").length;
  const resolvedCount = (bugs || []).filter((b) => b.status === "resolved").length;
  const totalCount = (bugs || []).length;

  return (
    <DashboardLayout title="Bug Reports">
      <div className="p-4 md:p-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Total
              </p>
              <p className="text-2xl font-light mt-1">{totalCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-blue-600">
                Open
              </p>
              <p className="text-2xl font-light mt-1">{openCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-amber-600">
                In Progress
              </p>
              <p className="text-2xl font-light mt-1">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-green-600">
                Resolved
              </p>
              <p className="text-2xl font-light mt-1">{resolvedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="ui">UI/UX</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bug reports table */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Bug Reports
              {filteredBugs.length !== totalCount && (
                <span className="text-muted-foreground">
                  ({filteredBugs.length} of {totalCount})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-none" />
                ))}
              </div>
            ) : filteredBugs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {totalCount === 0
                  ? "No bug reports yet. Reports will appear here when users submit them."
                  : "No bug reports match the current filters."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Title
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Category
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Severity
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Status
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Reporter
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Submitted
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest w-[140px]">
                        Change Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBugs.map((bug) => {
                      const severity = severityConfig[bug.severity];
                      const category = categoryConfig[bug.category];
                      const status = statusConfig[bug.status];
                      const StatusIcon = status.icon;

                      return (
                        <TableRow
                          key={bug.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewBug(bug)}
                        >
                          <TableCell className="text-xs font-medium max-w-[200px] truncate">
                            {bug.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="rounded-none text-[10px]"
                            >
                              {category.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-none text-[10px]",
                                severity.className
                              )}
                            >
                              {bug.severity === "critical" && (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {severity.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "flex items-center gap-1 text-[10px] uppercase tracking-widest",
                                status.className
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {bug.reporter_name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(parseISO(bug.created_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={bug.status}
                              onValueChange={(val) =>
                                handleStatusChange(
                                  bug.id,
                                  val as BugReport["status"]
                                )
                              }
                            >
                              <SelectTrigger className="h-7 text-[10px] rounded-none w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-none">
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BugDetailDialog
        bug={selectedBug}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </DashboardLayout>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Download, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReportDataSection } from "./ReportDataSection";
import { ReportNotesSection } from "./ReportNotesSection";
import { ClassScheduleTable } from "./ClassScheduleTable";
import type { DailyReportRow } from "@/hooks/useReports";
import { useUpdateReport, useExportPDF } from "@/hooks/useReports";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DailyReportViewProps {
  report: DailyReportRow | null;
  reportDate: string;
  isLoading?: boolean;
}

export function DailyReportView({ report, reportDate, isLoading }: DailyReportViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<DailyReportRow>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();
  const updateReport = useUpdateReport(reportDate);
  const exportPdf = useExportPDF();

  const displayReport = report ? { ...report, ...draft } : null;

  const handleFieldChange = (field: keyof DailyReportRow, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateReport.mutateAsync(draft);
      setDraft({});
      setEditing(false);
      toast.success("Report saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleCancel = () => {
    setDraft({});
    setEditing(false);
  };

  const handleExport = () => {
    exportPdf.mutate({ report_date: reportDate, format: "single" });
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("daily_reports").delete().eq("report_date", reportDate);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["daily-report", reportDate] });
    queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
    setShowDeleteConfirm(false);
    toast.success("Report deleted");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report && !isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No report for this date. Run aggregation or select another date.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={handleSave} disabled={updateReport.isPending}>
              {updateReport.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exportPdf.isPending || !report}>
          {exportPdf.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      <ReportDataSection
        report={displayReport}
        editable={editing}
        onFieldChange={handleFieldChange}
      />
      <ReportNotesSection
        report={displayReport}
        editable={editing}
        onFieldChange={handleFieldChange}
      />
      <div>
        <h4 className="text-sm font-medium mb-2">Class Schedule</h4>
        <ClassScheduleTable report={displayReport} />
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the daily report for {reportDate}. You can re-run aggregation to recreate it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

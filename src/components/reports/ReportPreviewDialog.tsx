import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ReportDataSection } from "./ReportDataSection";
import { ReportNotesSection } from "./ReportNotesSection";
import { ClassScheduleTable } from "./ClassScheduleTable";
import type { DailyReportRow } from "@/hooks/useReports";
import { useExportPDF } from "@/hooks/useReports";
import { useState } from "react";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyReportRow | null;
  reportDate: string;
  onSave?: (updates: Partial<DailyReportRow>) => void;
  isSaving?: boolean;
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  report,
  reportDate,
  onSave,
  isSaving,
}: ReportPreviewDialogProps) {
  const [editDraft, setEditDraft] = useState<Partial<DailyReportRow>>({});
  const exportPdf = useExportPDF();

  const displayReport = report
    ? { ...report, ...editDraft }
    : null;

  const handleFieldChange = (field: keyof DailyReportRow, value: unknown) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.keys(editDraft).length > 0 && onSave) {
      onSave(editDraft);
      setEditDraft({});
    }
  };

  const handleExport = () => {
    exportPdf.mutate({
      report_date: reportDate,
      format: "single",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report — {reportDate}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="space-y-4 mt-4">
            <ReportDataSection report={displayReport ?? report} editable={false} />
            <ReportNotesSection report={displayReport ?? report} editable={false} />
            <div>
              <h4 className="text-sm font-medium mb-2">Class Schedule</h4>
              <ClassScheduleTable report={displayReport ?? report} />
            </div>
            <Button
              onClick={handleExport}
              disabled={exportPdf.isPending || !report}
            >
              {exportPdf.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </TabsContent>
          <TabsContent value="edit" className="space-y-4 mt-4">
            <ReportDataSection
              report={displayReport ?? report}
              editable
              onFieldChange={handleFieldChange}
            />
            <ReportNotesSection
              report={displayReport ?? report}
              editable
              onFieldChange={handleFieldChange}
            />
            <Button onClick={handleSave} disabled={isSaving || Object.keys(editDraft).length === 0}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save changes
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

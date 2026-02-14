/**
 * PDF Replace Button Component
 * 
 * Allows managers to replace a PDF file while preserving metadata and read receipts.
 * Shows progress indicators during upload and text extraction.
 */

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { replacePdf, type PdfUploadResult } from "@/lib/replacePdf";
import { toast } from "sonner";

interface PdfReplaceButtonProps {
  currentFilePath: string;
  onReplace: (data: PdfUploadResult) => void;
  disabled?: boolean;
}

export function PdfReplaceButton({
  currentFilePath,
  onReplace,
  disabled,
}: PdfReplaceButtonProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        event.target.value = ""; // Reset input
        return;
      }

      // Validate file size (10 MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("PDF must be under 10 MB");
        event.target.value = ""; // Reset input
        return;
      }

      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmReplace = async () => {
    if (!selectedFile) return;

    setIsReplacing(true);
    setShowConfirmDialog(false);

    try {
      setProgress("Uploading new PDF...");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Brief delay to show progress

      const result = await replacePdf(selectedFile, currentFilePath);

      setProgress("Extracting text...");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Success!
      toast.success("PDF replaced successfully");
      onReplace(result);
    } catch (error: any) {
      console.error("PDF replace failed:", error);
      toast.error(error.message || "Failed to replace PDF");
    } finally {
      setIsReplacing(false);
      setProgress("");
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById(
        "pdf-replace-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleCancelReplace = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById(
      "pdf-replace-input"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="space-y-2">
        <Input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-replace-input"
          disabled={disabled || isReplacing}
        />
        <label htmlFor="pdf-replace-input">
          <Button
            variant="outline"
            className="rounded-none w-full"
            disabled={disabled || isReplacing}
            asChild
          >
            <span>
              {isReplacing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress || "Replacing..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Replace PDF File
                </>
              )}
            </span>
          </Button>
        </label>
        {isReplacing && progress && (
          <p className="text-xs text-muted-foreground text-center">
            {progress}
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace PDF File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current PDF file with the new one. All
              metadata (title, roles, folder, tags) and read receipts will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedFile && (
            <div className="rounded-lg border border-border p-3 my-2">
              <p className="text-sm font-medium mb-1">New file:</p>
              <p className="text-sm text-muted-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReplace}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Replace PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

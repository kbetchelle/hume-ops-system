/**
 * PDF Upload Dialog Component
 * 
 * Modal dialog for uploading PDF files as resource pages.
 * Includes file validation, progress indicators, and metadata form.
 */

import { useState } from "react";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleAssignmentCheckboxes } from "@/components/manager/staff-resources/RoleAssignmentCheckboxes";
import { TagInput } from "@/components/page-builder/TagInput";
import { useCreateResourcePage } from "@/hooks/useStaffResources";
import { uploadPdf } from "@/lib/uploadPdf";
import { AppRole } from "@/types/roles";
import { toast } from "sonner";

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (pageId: string) => void;
}

export function PdfUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: PdfUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<AppRole[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const createMutation = useCreateResourcePage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }

      // Validate file size (10 MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("PDF must be under 10 MB");
        return;
      }

      setSelectedFile(file);
      // Auto-populate title from filename (without extension)
      if (!title) {
        const filename = file.name.replace(/\.pdf$/i, "");
        setTitle(filename);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (assignedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload PDF and extract text
      setUploadProgress("Uploading PDF...");
      const uploadResult = await uploadPdf(selectedFile);

      setUploadProgress("Extracting text...");
      // (extraction happens in uploadPdf, just showing progress)

      // Step 2: Create resource page entry
      setUploadProgress("Creating page...");
      const page = await createMutation.mutateAsync({
        title: title.trim(),
        page_type: "pdf",
        assigned_roles: assignedRoles,
        is_published: true, // Auto-publish PDF uploads
        tags,
        pdf_file_url: uploadResult.fileUrl,
        pdf_file_path: uploadResult.filePath,
        pdf_file_size: uploadResult.fileSize,
        pdf_original_filename: uploadResult.originalFilename,
        pdf_page_count: uploadResult.pageCount,
        search_text: uploadResult.searchText,
      });

      // Success!
      toast.success("PDF uploaded successfully");
      onSuccess(page.id);
      handleClose();
    } catch (error: any) {
      console.error("PDF upload failed:", error);
      toast.error(error.message || "Failed to upload PDF");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setTitle("");
      setAssignedRoles([]);
      setTags([]);
      setUploadProgress("");
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload PDF Resource Page</DialogTitle>
          <DialogDescription>
            Upload a PDF file to create a new resource page. PDFs will be
            searchable by their text content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label>PDF File *</Label>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload-input"
                  disabled={isUploading}
                />
                <label
                  htmlFor="pdf-upload-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Choose a PDF file</p>
                  <p className="text-xs text-muted-foreground">
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum size: 10 MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="pdf-title">Title *</Label>
            <Input
              id="pdf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
              disabled={isUploading}
            />
          </div>

          {/* Assigned Roles */}
          <div className="space-y-2">
            <Label>Assigned Roles *</Label>
            <RoleAssignmentCheckboxes
              value={assignedRoles}
              onChange={setAssignedRoles}
              disabled={isUploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              disabled={isUploading}
              placeholder="Add tags..."
            />
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload PDF"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

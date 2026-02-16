import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PageEditor } from "@/components/page-builder/PageEditor";
import { PdfPreviewSection } from "@/components/page-builder/PdfPreviewSection";
import { PdfReplaceButton } from "@/components/page-builder/PdfReplaceButton";
import { TagInput } from "@/components/page-builder/TagInput";
import { RoleAssignmentCheckboxes } from "@/components/manager/staff-resources/RoleAssignmentCheckboxes";
import { ReadReceiptsDashboard } from "@/components/page-builder/ReadReceiptsDashboard";
import { DelegatedEditorsManager } from "@/components/page-builder/DelegatedEditorsManager";
import {
  useResourcePage,
  useCreateResourcePage,
  useUpdateResourcePage,
  useDeleteResourcePage,
  useDuplicateResourcePage,
} from "@/hooks/useStaffResources";
import { useCanEditPage } from "@/hooks/useCanEditPage";
import { uploadPageImage } from "@/lib/pageImageUpload";
import type { PdfUploadResult } from "@/lib/uploadPdf";
import type { JSONContent } from "@tiptap/react";
import { AppRole } from "@/types/roles";
import { toast } from "sonner";

export function ResourcePageEditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const isNew = !pageId || pageId === "new";

  const { data: existingPage, isLoading: pageLoading } = useResourcePage(
    isNew ? undefined : pageId
  );
  const editPermission = useCanEditPage(pageId);
  const canEdit = editPermission.data?.canEdit ?? false;
  const isManager = editPermission.data?.isManager ?? false;
  const isDelegatedEditor = editPermission.data?.isDelegatedEditor ?? false;
  const createMutation = useCreateResourcePage();
  const updateMutation = useUpdateResourcePage();
  const deleteMutation = useDeleteResourcePage();
  const duplicateMutation = useDuplicateResourcePage();

  // Form state
  const [title, setTitle] = useState("");
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState<AppRole[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // UI state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Redirect if no permission (except for new pages)
  useEffect(() => {
    if (!isNew && !editPermission.isLoading && !canEdit && pageId) {
      toast.error("You do not have permission to edit this page");
      navigate(`/dashboard/resources/pages/${pageId}`);
    }
  }, [canEdit, editPermission.isLoading, pageId, isNew, navigate]);

  // Load existing page data
  useEffect(() => {
    if (existingPage) {
      setTitle(existingPage.title);
      setContentJson(existingPage.content_json);
      setIsPublished(existingPage.is_published);
      setAssignedRoles(existingPage.assigned_roles);
      setTags(existingPage.tags);
      setCoverImageUrl(existingPage.cover_image_url);
      setHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    }
  }, [existingPage]);

  // Mark as having unsaved changes when content changes
  useEffect(() => {
    if (existingPage) {
      setHasUnsavedChanges(true);
    }
  }, [contentJson, title, isPublished, assignedRoles, tags, coverImageUrl]);

  const handleSave = async (publish: boolean) => {
    if (!(title ?? "").trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (assignedRoles.length === 0) {
      toast.error("Please assign at least one role");
      return;
    }

    try {
      if (isNew) {
        const result = await createMutation.mutateAsync({
          title: (title ?? "").trim(),
          content_json: contentJson,
          is_published: publish,
          assigned_roles: assignedRoles,
          tags,
          cover_image_url: coverImageUrl,
        });
        setIsPublished(publish);
        setHasUnsavedChanges(false);
        if (publish) {
          toast.success("Your document has been published");
          navigate("/dashboard/staff-resources", { replace: true });
          return;
        }
        toast.success("Draft saved");
        navigate(`/dashboard/staff-resources/pages/${result.id}/edit`, {
          replace: true,
        });
      } else if (pageId) {
        await updateMutation.mutateAsync({
          id: pageId,
          title: (title ?? "").trim(),
          content_json: contentJson,
          is_published: publish,
          assigned_roles: assignedRoles,
          tags,
          cover_image_url: coverImageUrl,
        });
        setIsPublished(publish);
        setHasUnsavedChanges(false);
        if (publish) {
          toast.success("Your document has been published");
          navigate("/dashboard/staff-resources", { replace: true });
          return;
        }
        toast.success("Draft saved");
      }
    } catch (error) {
      console.error("Failed to save page:", error);
    }
  };

  const handleDelete = async () => {
    if (!pageId || isNew) return;
    try {
      await deleteMutation.mutateAsync(pageId);
      navigate("/dashboard/staff-resources");
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  const handleDuplicate = async () => {
    if (!pageId || isNew) return;
    try {
      const result = await duplicateMutation.mutateAsync(pageId);
      navigate(`/dashboard/staff-resources/pages/${result.id}/edit`);
    } catch (error) {
      console.error("Failed to duplicate page:", error);
    }
  };

  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadPageImage(file);
      setCoverImageUrl(url);
      setHasUnsavedChanges(true);
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error("Failed to upload cover image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        navigate("/dashboard/staff-resources");
      }
    } else {
      navigate("/dashboard/staff-resources");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (pageLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title..."
            className="flex-1 max-w-xl text-lg font-medium border-0 focus-visible:ring-0 px-0"
          />

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || !(title ?? "").trim()}
              className="rounded-none"
            >
              {isSaving && !isPublished && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>

            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving || !(title ?? "").trim()}
              className="rounded-none"
            >
              {isSaving && isPublished && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Upload className="h-4 w-4 mr-2" />
              Publish
            </Button>

            {!isNew && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-none">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {existingPage?.page_type === 'pdf' ? (
              /* PDF Preview for PDF pages */
              <div className="space-y-6">
                <PdfPreviewSection
                  fileUrl={existingPage.pdf_file_url || ''}
                  pageCount={existingPage.pdf_page_count || 0}
                  fileSize={existingPage.pdf_file_size || 0}
                  originalFilename={existingPage.pdf_original_filename || 'document.pdf'}
                  onViewPdf={() => navigate(`/dashboard/resources/pages/${pageId}`)}
                />
                
                {isManager && (
                  <PdfReplaceButton
                    currentFilePath={existingPage.pdf_file_path || ''}
                    onReplace={async (data: PdfUploadResult) => {
                      if (pageId) {
                        await updateMutation.mutateAsync({
                          id: pageId,
                          pdf_file_url: data.fileUrl,
                          pdf_file_path: data.filePath,
                          pdf_file_size: data.fileSize,
                          pdf_original_filename: data.originalFilename,
                          pdf_page_count: data.pageCount,
                          search_text: data.searchText,
                        });
                        setHasUnsavedChanges(false);
                      }
                    }}
                    disabled={isSaving}
                  />
                )}
              </div>
            ) : (
              /* TipTap Editor for builder pages */
              <PageEditor
                initialContent={contentJson}
                onChange={setContentJson}
                onImageUpload={uploadPageImage}
                editable={true}
                placeholder="Start writing your page content..."
              />
            )}
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 border-l border-border bg-muted/20 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 uppercase tracking-wider">
                Settings
              </h3>
            </div>


            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>



            {/* Assigned Roles */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">
                Assign Roles
              </Label>
              {!isManager && isDelegatedEditor && (
                <p className="text-xs text-muted-foreground mb-2">
                  Only managers can change role assignments
                </p>
              )}
              <RoleAssignmentCheckboxes
                value={assignedRoles}
                onChange={setAssignedRoles}
                disabled={!isManager}
              />
            </div>

            {/* Delegated Editors - Only for managers */}
            {isManager && !isNew && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  Delegated Editors
                </Label>
                <DelegatedEditorsManager pageId={pageId} />
              </div>
            )}

            {/* Read Receipts - Only for published pages */}
            {!isNew && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  Read Receipts
                </Label>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Read Receipts
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[500px] sm:w-[600px] rounded-none overflow-y-auto"
                  >
                    <ReadReceiptsDashboard pageId={pageId} />
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this page. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground rounded-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

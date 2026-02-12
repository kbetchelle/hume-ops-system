import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { RoleAssignmentCheckboxes } from "./RoleAssignmentCheckboxes";
import {
  useResourcePages,
  useCreateResourcePage,
  useUpdateResourcePage,
  useDeleteResourcePage,
  type ResourcePage,
} from "@/hooks/useStaffResources";
import { AppRole } from "@/types/roles";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
  concierge: "Concierge",
  female_spa_attendant: "Female Spa",
  male_spa_attendant: "Male Spa",
  floater: "Floater",
  cafe: "Cafe",
  trainer: "Trainer",
};

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

// ---------------------------------------------------------------------------
// Resource Page Create / Edit Dialog
// ---------------------------------------------------------------------------
function PageDialog({
  open,
  onOpenChange,
  page,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: ResourcePage | null;
}) {
  const isEditing = !!page;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<AppRole[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const createMutation = useCreateResourcePage();
  const updateMutation = useUpdateResourcePage();

  useEffect(() => {
    if (open) {
      setTitle(page?.title ?? "");
      setContent(page?.content ?? "");
      setAssignedRoles(page?.assigned_roles ?? []);
      setIsPublished(page?.is_published ?? false);
    }
  }, [open, page]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const input = {
      title: title.trim(),
      content: content || null,
      assigned_roles: assignedRoles,
      is_published: isPublished,
    };
    if (isEditing && page) {
      await updateMutation.mutateAsync({ ...input, id: page.id });
    } else {
      await createMutation.mutateAsync(input);
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Resource Page" : "New Resource Page"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the resource page details."
              : "Create a new resource page for staff."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="page-title" className="text-xs uppercase tracking-wider">
              Title
            </Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider">Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write resource content..."
              minHeight="300px"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider">
              Assigned Roles
            </Label>
            <RoleAssignmentCheckboxes
              value={assignedRoles}
              onChange={setAssignedRoles}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="page-published"
              checked={isPublished}
              onCheckedChange={(checked) =>
                setIsPublished(checked === true)
              }
            />
            <Label
              htmlFor="page-published"
              className="text-xs uppercase tracking-wider cursor-pointer"
            >
              Published
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? "Update" : "Create"} Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ResourcePagesManagement
// ---------------------------------------------------------------------------
export function ResourcePagesManagement() {
  const { data: pages, isLoading } = useResourcePages(false);
  const deletePageMutation = useDeleteResourcePage();

  const [searchTerm, setSearchTerm] = useState("");
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ResourcePage | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  const filteredPages = useMemo(() => {
    let list = pages ?? [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(term));
    }
    return list;
  }, [pages, searchTerm]);

  const handleCreate = () => {
    setEditingPage(null);
    setPageDialogOpen(true);
  };

  const handleEdit = (page: ResourcePage) => {
    setEditingPage(page);
    setPageDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletePageId) {
      await deletePageMutation.mutateAsync(deletePageId);
      setDeletePageId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Resource Page
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No resource pages found.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-none"
              onClick={handleCreate}
            >
              Create your first resource page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPages.map((page) => (
            <Card key={page.id} className="rounded-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{page.title}</h3>
                      <Badge
                        variant={page.is_published ? "default" : "secondary"}
                        className="rounded-none text-[10px]"
                      >
                        {page.is_published ? "Published" : "Draft"}
                      </Badge>
                      {page.assigned_roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="rounded-none text-[10px]"
                        >
                          {ROLE_LABELS[role] ?? role}
                        </Badge>
                      ))}
                    </div>
                    {page.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stripHtml(page.content).slice(0, 100)}
                        {stripHtml(page.content).length > 100 ? "..." : ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created{" "}
                      {format(new Date(page.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(page)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePageId(page.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Page Dialog */}
      <PageDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        page={editingPage}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletePageId}
        onOpenChange={() => setDeletePageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resource page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource page. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

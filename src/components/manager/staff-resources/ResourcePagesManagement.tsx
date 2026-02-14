import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  Search,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Copy,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  useResourcePages,
  useDeleteResourcePage,
  useDuplicateResourcePage,
  type ResourcePage,
} from "@/hooks/useStaffResources";
import {
  useResourcePageFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  type ResourcePageFolder,
} from "@/hooks/useResourcePageFolders";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

// ---------------------------------------------------------------------------
// Folder Dialog
// ---------------------------------------------------------------------------
function FolderDialog({
  open,
  onOpenChange,
  folder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ResourcePageFolder | null;
}) {
  const isEditing = !!folder;
  const [name, setName] = useState(folder?.name ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");

  const createMutation = useCreateFolder();
  const updateMutation = useUpdateFolder();

  // Update form state when folder prop changes
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [folder]);

  const handleClose = () => {
    onOpenChange(false);
    setName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (isEditing && folder) {
      await updateMutation.mutateAsync({
        id: folder.id,
        name: name.trim(),
        description: description.trim() || null,
      });
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      });
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Folder" : "New Folder"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the folder name and description."
              : "Create a new folder to organize your pages."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-xs uppercase tracking-wider">
              Name
            </Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name..."
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-desc" className="text-xs uppercase tracking-wider">
              Description (optional)
            </Label>
            <Input
              id="folder-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Folder description..."
              className="rounded-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-none">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="rounded-none"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Folder Sidebar
// ---------------------------------------------------------------------------
function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  pageCountsByFolder,
}: {
  folders: ResourcePageFolder[];
  selectedFolderId: string | null | "all" | "unfiled";
  onSelectFolder: (folderId: string | null | "all" | "unfiled") => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: ResourcePageFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  pageCountsByFolder: Record<string, number>;
}) {
  return (
    <div className="w-64 border-r border-border bg-muted/20 p-4 space-y-2">
      <div className="space-y-1">
        <Button
          variant={selectedFolderId === "all" ? "secondary" : "ghost"}
          className="w-full justify-start rounded-none text-sm"
          onClick={() => onSelectFolder("all")}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          All Pages
        </Button>
        <Button
          variant={selectedFolderId === "unfiled" ? "secondary" : "ghost"}
          className="w-full justify-start rounded-none text-sm"
          onClick={() => onSelectFolder("unfiled")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Unfiled
          {pageCountsByFolder.unfiled > 0 && (
            <Badge variant="outline" className="ml-auto rounded-none text-xs">
              {pageCountsByFolder.unfiled}
            </Badge>
          )}
        </Button>
      </div>

      <div className="border-t border-border pt-2 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Folders
          </span>
        </div>
        <div className="space-y-1">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group flex items-center gap-1"
            >
              <Button
                variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                className="flex-1 justify-start rounded-none text-sm"
                onClick={() => onSelectFolder(folder.id)}
              >
                <FolderOpen className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{folder.name}</span>
                {pageCountsByFolder[folder.id] > 0 && (
                  <Badge variant="outline" className="ml-auto rounded-none text-xs shrink-0">
                    {pageCountsByFolder[folder.id]}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteFolder(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-none"
        onClick={onCreateFolder}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Card
// ---------------------------------------------------------------------------
function PageCard({
  page,
  onEdit,
  onDuplicate,
  onDelete,
  folderName,
}: {
  page: ResourcePage;
  onEdit: (page: ResourcePage) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  folderName?: string;
}) {
  return (
    <Card className="rounded-none overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {page.cover_image_url && (
          <div className="aspect-video bg-muted overflow-hidden">
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-medium line-clamp-2 mb-2">{page.title}</h3>
            <div className="flex flex-wrap gap-1">
              {folderName && (
                <Badge variant="secondary" className="rounded-none text-[10px]">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {folderName}
                </Badge>
              )}
              {page.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-none text-[10px]">
                  {tag}
                </Badge>
              ))}
              {page.tags.length > 2 && (
                <Badge variant="outline" className="rounded-none text-[10px]">
                  +{page.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={page.is_published ? "default" : "secondary"}
                className="rounded-none text-[10px]"
              >
                {page.is_published ? "Published" : "Draft"}
              </Badge>
              {page.assigned_roles.slice(0, 2).map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="rounded-none text-[10px]"
                >
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))}
              {page.assigned_roles.length > 2 && (
                <Badge variant="outline" className="rounded-none text-[10px]">
                  +{page.assigned_roles.length - 2}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {page.updated_at && format(new Date(page.updated_at), "MMM d, yyyy")}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(page)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDuplicate(page.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(page.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ResourcePagesManagement
// ---------------------------------------------------------------------------
export function ResourcePagesManagement() {
  const navigate = useNavigate();
  const { data: allPages, isLoading: pagesLoading } = useResourcePages();
  const { data: folders = [], isLoading: foldersLoading } = useResourcePageFolders();
  const deletePageMutation = useDeleteResourcePage();
  const duplicatePageMutation = useDuplicateResourcePage();
  const deleteFolderMutation = useDeleteFolder();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | "all" | "unfiled">("all");
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourcePageFolder | null>(null);

  // Calculate page counts by folder
  const pageCountsByFolder = useMemo(() => {
    const counts: Record<string, number> = { unfiled: 0 };
    allPages?.forEach((page) => {
      if (!page.folder_id) {
        counts.unfiled++;
      } else {
        counts[page.folder_id] = (counts[page.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [allPages]);

  // Filter pages based on selection and search
  const filteredPages = useMemo(() => {
    let list = allPages ?? [];

    // Filter by folder
    if (selectedFolderId === "unfiled") {
      list = list.filter((p) => !p.folder_id);
    } else if (selectedFolderId && selectedFolderId !== "all") {
      list = list.filter((p) => p.folder_id === selectedFolderId);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          (p.search_text && p.search_text.toLowerCase().includes(term)) ||
          p.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    return list;
  }, [allPages, selectedFolderId, searchTerm]);

  const handleCreatePage = () => {
    navigate("/dashboard/staff-resources/pages/new");
  };

  const handleEditPage = (page: ResourcePage) => {
    navigate(`/dashboard/staff-resources/pages/${page.id}/edit`);
  };

  const handleDuplicatePage = async (pageId: string) => {
    await duplicatePageMutation.mutateAsync(pageId);
  };

  const handleDeletePage = async () => {
    if (deletePageId) {
      await deletePageMutation.mutateAsync(deletePageId);
      setDeletePageId(null);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: ResourcePageFolder) => {
    setEditingFolder(folder);
    setFolderDialogOpen(true);
  };

  const handleDeleteFolder = async () => {
    if (deleteFolderId) {
      await deleteFolderMutation.mutateAsync(deleteFolderId);
      setDeleteFolderId(null);
      if (selectedFolderId === deleteFolderId) {
        setSelectedFolderId("all");
      }
    }
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return undefined;
    return folders.find((f) => f.id === folderId)?.name;
  };

  const isLoading = pagesLoading || foldersLoading;

  return (
    <div className="flex h-full">
      {/* Folder Sidebar */}
      <FolderSidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={setDeleteFolderId}
        pageCountsByFolder={pageCountsByFolder}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-none"
            />
          </div>
          <Button onClick={handleCreatePage} className="rounded-none">
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>

        {/* Pages Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPages.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No pages match your search."
                  : "No pages in this folder."}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-none"
                onClick={handleCreatePage}
              >
                Create your first page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                onEdit={handleEditPage}
                onDuplicate={handleDuplicatePage}
                onDelete={setDeletePageId}
                folderName={getFolderName(page.folder_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folder={editingFolder}
      />

      {/* Delete Page Confirmation */}
      <AlertDialog
        open={!!deletePageId}
        onOpenChange={() => setDeletePageId(null)}
      >
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
              onClick={handleDeletePage}
              className="bg-destructive text-destructive-foreground rounded-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog
        open={!!deleteFolderId}
        onOpenChange={() => setDeleteFolderId(null)}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder. Pages in this folder will be moved
              to "Unfiled". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
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

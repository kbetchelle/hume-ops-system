import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppRole } from "@/types/roles";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  Search,
  Copy,
  Pencil,
  Upload,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PdfUploadDialog } from "@/components/page-builder/PdfUploadDialog";
import {
  useResourcePages,
  useDeleteResourcePage,
  useDuplicateResourcePage,
  type ResourcePage,
} from "@/hooks/useStaffResources";
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

const ALL_ROLES = Object.keys(ROLE_LABELS);

// ---------------------------------------------------------------------------
// Page Row
// ---------------------------------------------------------------------------
function PageRow({
  page,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  page: ResourcePage;
  onEdit: (page: ResourcePage) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2 border-b border-border hover:bg-muted/40 transition-colors">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 min-w-0 text-xs truncate font-medium">{page.title}</span>

      <div className="hidden md:flex items-center gap-1 shrink-0">
        {page.page_type === 'pdf' && (
          <Badge variant="secondary" className="rounded-none text-[10px]">
            PDF
          </Badge>
        )}
        <Badge
          variant={page.is_published ? "default" : "secondary"}
          className="rounded-none text-[10px]"
        >
          {page.is_published ? "Published" : "Draft"}
        </Badge>
        {page.assigned_roles.slice(0, 2).map((role) => (
          <Badge key={role} variant="outline" className="rounded-none text-[10px]">
            {ROLE_LABELS[role] ?? role}
          </Badge>
        ))}
        {page.assigned_roles.length > 2 && (
          <Badge variant="outline" className="rounded-none text-[10px]">
            +{page.assigned_roles.length - 2}
          </Badge>
        )}
      </div>

      <span className="hidden sm:block text-[10px] text-muted-foreground shrink-0 w-20 text-right">
        {page.updated_at && format(new Date(page.updated_at), "MMM d, yyyy")}
      </span>

      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(page)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDuplicate(page.id)}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(page.id)}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResourcePagesManagement
// ---------------------------------------------------------------------------
export function ResourcePagesManagement() {
  const navigate = useNavigate();
  const { data: allPages, isLoading: pagesLoading } = useResourcePages();
  const deletePageMutation = useDeleteResourcePage();
  const duplicatePageMutation = useDuplicateResourcePage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "all">("all");
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [pdfUploadDialogOpen, setPdfUploadDialogOpen] = useState(false);

  // Filter pages based on role and search
  const filteredPages = useMemo(() => {
    let list = allPages ?? [];

    if (selectedRole !== "all") {
      list = list.filter((p) => p.assigned_roles.includes(selectedRole));
    }

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
  }, [allPages, selectedRole, searchTerm]);

  const handleCreatePage = () => {
    navigate("/dashboard/staff-resources/pages/new");
  };

  const handleUploadPdf = () => {
    setPdfUploadDialogOpen(true);
  };

  const handlePdfUploadSuccess = (pageId: string) => {
    navigate(`/dashboard/staff-resources/pages/${pageId}/edit`);
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

  return (
    <div className="space-y-6">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuItem onClick={handleCreatePage}>
              <BookOpen className="h-4 w-4 mr-2" />
              Block-Based Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUploadPdf}>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Role Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedRole === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-none text-xs uppercase tracking-widest"
          onClick={() => setSelectedRole("all")}
        >
          All Roles
        </Button>
        {ALL_ROLES.map((role) => (
          <Button
            key={role}
            variant={selectedRole === role ? "default" : "outline"}
            size="sm"
            className="rounded-none text-xs uppercase tracking-widest"
            onClick={() => setSelectedRole(role as AppRole)}
          >
            {ROLE_LABELS[role]}
          </Button>
        ))}
      </div>

      {/* Pages List */}
      {pagesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedRole !== "all"
                ? "No pages found"
                : "No pages yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || selectedRole !== "all"
                ? "Try adjusting your search or role filter."
                : "Create your first page to get started with organizing staff resources."}
            </p>
            {!searchTerm && selectedRole === "all" && (
              <Button
                variant="outline"
                className="rounded-none"
                onClick={handleCreatePage}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-none">
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="w-4 shrink-0" />
            <span className="flex-1 min-w-0">Name</span>
            <span className="hidden md:block w-48 shrink-0">Status / Roles</span>
            <span className="hidden sm:block w-20 shrink-0 text-right">Modified</span>
            <span className="w-20 shrink-0" />
          </div>
          {filteredPages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              onEdit={handleEditPage}
              onDuplicate={handleDuplicatePage}
              onDelete={setDeletePageId}
            />
          ))}
        </div>
      )}

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

      {/* PDF Upload Dialog */}
      <PdfUploadDialog
        open={pdfUploadDialogOpen}
        onOpenChange={setPdfUploadDialogOpen}
        onSuccess={handlePdfUploadSuccess}
      />
    </div>
  );
}

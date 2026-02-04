import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageStatus, useCreatePageStatus, useUpdatePageTitle, useDeletePageStatus } from "@/hooks/useDevDashboard";
import { Pencil, Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: {
  value: PageStatus;
  label: string;
}[] = [{
  value: "not_started",
  label: "Not Started"
}, {
  value: "in_progress",
  label: "In Progress"
}, {
  value: "finishing_touches",
  label: "Finishing Touches"
}, {
  value: "completed",
  label: "Completed"
}];

const getStatusColor = (status: PageStatus) => {
  switch (status) {
    case "not_started":
      return "text-muted-foreground";
    case "in_progress":
      return "text-yellow-600";
    case "finishing_touches":
      return "text-blue-600";
    case "completed":
      return "text-green-600";
    default:
      return "";
  }
};

interface PageData {
  id: string;
  page_title: string;
  page_path?: string;
  status: PageStatus;
  role_category: string | null;
}

interface ModalPageRowProps {
  page: PageData;
  isEditMode: boolean;
  onStatusChange: (pageId: string, status: PageStatus) => void;
  onRoleChange: (pageId: string, role: string) => void;
  onTitleChange: (pageId: string, title: string) => void;
  onDelete: (pageId: string) => void;
}

function ModalPageRow({
  page,
  isEditMode,
  onStatusChange,
  onRoleChange,
  onTitleChange,
  onDelete,
}: ModalPageRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [titleValue, setTitleValue] = useState(page.page_title);
  const [roleValue, setRoleValue] = useState(page.role_category || "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingRole && roleInputRef.current) {
      roleInputRef.current.focus();
    }
  }, [isEditingRole]);

  const handleTitleBlur = () => {
    if (titleValue !== page.page_title && titleValue.trim()) {
      onTitleChange(page.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setTitleValue(page.page_title);
      setIsEditingTitle(false);
    }
  };

  const handleRoleBlur = () => {
    if (roleValue !== page.role_category) {
      onRoleChange(page.id, roleValue);
    }
    setIsEditingRole(false);
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRoleBlur();
    } else if (e.key === "Escape") {
      setRoleValue(page.role_category || "");
      setIsEditingRole(false);
    }
  };

  return (
    <div className="flex items-center py-3 border-b border-border last:border-b-0 gap-4 group">
      {/* Delete button - only in edit mode */}
      {isEditMode && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={() => onDelete(page.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      {/* Page Title */}
      <div className="flex-1 text-[0.875em] min-w-0 truncate pl-2 text-primary mx-[20px]">
        {isEditMode && isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="h-7 text-[1em] px-1"
          />
        ) : (
          <span
            className={isEditMode ? "cursor-pointer hover:underline" : ""}
            onClick={() => isEditMode && setIsEditingTitle(true)}
          >
            {page.page_title}
          </span>
        )}
      </div>

      {/* Role Category - editable in edit mode */}
      {isEditMode && (
        <div className="w-32">
          {isEditingRole ? (
            <Input
              ref={roleInputRef}
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
              onBlur={handleRoleBlur}
              onKeyDown={handleRoleKeyDown}
              className="h-7 text-[0.75em] px-1"
              placeholder="Category"
            />
          ) : (
            <span
              className="text-[0.75em] text-muted-foreground cursor-pointer hover:underline"
              onClick={() => setIsEditingRole(true)}
            >
              {page.role_category || "—"}
            </span>
          )}
        </div>
      )}

      {/* Status Column */}
      <div className="w-36 flex justify-end">
        <Select value={page.status} onValueChange={(value: PageStatus) => onStatusChange(page.id, value)}>
          <SelectTrigger className={`h-8 text-[0.875em] border-0 bg-transparent shadow-none justify-end [&>svg]:hidden ${getStatusColor(page.status)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value} className={`text-[0.875em] ${getStatusColor(option.value)}`}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface AddPageRowProps {
  roleCategory: string;
  onAdd: (pageTitle: string, roleCategory: string) => void;
  onCancel: () => void;
}

function AddPageRow({ roleCategory, onAdd, onCancel }: AddPageRowProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim(), roleCategory);
      setTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center py-3 border-b border-border gap-4 bg-muted/30">
      <div className="w-6" /> {/* Spacer for delete button column */}
      <div className="flex-1 mx-[20px]">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New page title..."
          className="h-7 text-[0.875em]"
        />
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSubmit}>
          <Save className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface BuildStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PageData[] | undefined;
  onStatusChange: (pageId: string, status: PageStatus) => void;
  onRoleChange: (pageId: string, role: string) => void;
  isAdmin?: boolean;
}

export function BuildStatusModal({
  open,
  onOpenChange,
  pages,
  onStatusChange,
  onRoleChange,
  isAdmin = false,
}: BuildStatusModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  
  const createPageStatus = useCreatePageStatus();
  const updatePageTitle = useUpdatePageTitle();
  const deletePageStatus = useDeletePageStatus();

  const sortedPages = pages?.slice().sort((a, b) => {
    const roleA = a.role_category || "zzz";
    const roleB = b.role_category || "zzz";
    return roleA.localeCompare(roleB);
  }) || [];

  // Get unique categories
  const categories = [...new Set(sortedPages.map(p => p.role_category || "Uncategorized"))];

  const handleTitleChange = (pageId: string, title: string) => {
    updatePageTitle.mutate({ pageId, pageTitle: title }, {
      onSuccess: () => toast.success("Title updated"),
      onError: () => toast.error("Failed to update title"),
    });
  };

  const handleDelete = (pageId: string) => {
    deletePageStatus.mutate(pageId, {
      onSuccess: () => toast.success("Page removed"),
      onError: () => toast.error("Failed to remove page"),
    });
  };

  const handleAddPage = (pageTitle: string, roleCategory: string) => {
    createPageStatus.mutate({
      pageTitle,
      pagePath: `/${pageTitle.toLowerCase().replace(/\s+/g, '-')}`,
      status: "not_started",
      roleCategory: roleCategory === "Uncategorized" ? "" : roleCategory,
    }, {
      onSuccess: () => {
        toast.success("Page added");
        setAddingToCategory(null);
      },
      onError: () => toast.error("Failed to add page"),
    });
  };

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      setAddingToCategory(null);
    }
  }, [open]);

  let currentRole: string | null = null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 rounded-none animate-in fade-in-0 zoom-in-95 duration-200 text-[1.4em]">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-[0.875em]">BUILD STATUS</DialogTitle>
          {isAdmin && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-7 text-[0.625em]"
            >
              <Pencil className="h-3 w-3 mr-1" />
              {isEditMode ? "Done Editing" : "Edit"}
            </Button>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header row */}
          <div className="flex items-center py-2 border-b border-border gap-4 sticky top-0 bg-background z-10">
            {isEditMode && <div className="w-6" />}
            <div className="flex-1 text-[0.625em] uppercase tracking-widest text-muted-foreground font-medium pl-2">
              ​
            </div>
            {isEditMode && (
              <div className="w-32 text-[0.625em] uppercase tracking-widest text-muted-foreground font-medium">
                Category
              </div>
            )}
            <div className="w-36 text-[0.625em] uppercase tracking-widest text-muted-foreground font-medium">
            </div>
          </div>

          {/* Page rows - grouped by role */}
          {sortedPages.map(page => {
            const showDivider = page.role_category !== currentRole;
            const categoryName = page.role_category || "Uncategorized";
            currentRole = page.role_category;

            return (
              <div key={page.id}>
                {showDivider && (
                  <div className="flex items-center gap-3 pt-6 pb-2 first:pt-0">
                    <span className="text-[0.875em] uppercase tracking-widest text-muted-foreground font-bold">
                      {categoryName}
                    </span>
                    <div className="flex-1 h-[2px] bg-border/80" />
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[0.625em] px-2"
                        onClick={() => setAddingToCategory(categoryName)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                )}
                <ModalPageRow
                  page={page}
                  isEditMode={isEditMode}
                  onStatusChange={onStatusChange}
                  onRoleChange={onRoleChange}
                  onTitleChange={handleTitleChange}
                  onDelete={handleDelete}
                />
                {/* Show add row after the last item of this category if adding */}
                {addingToCategory === categoryName && 
                  sortedPages.findIndex(p => p.id === page.id) === 
                  sortedPages.filter(p => (p.role_category || "Uncategorized") === categoryName).length - 1 + 
                  sortedPages.findIndex(p => (p.role_category || "Uncategorized") === categoryName) && (
                  <AddPageRow
                    roleCategory={categoryName}
                    onAdd={handleAddPage}
                    onCancel={() => setAddingToCategory(null)}
                  />
                )}
              </div>
            );
          })}

          {/* Add row at the end of each category when adding */}
          {isEditMode && addingToCategory && (
            <div className="mt-2">
              <AddPageRow
                roleCategory={addingToCategory}
                onAdd={handleAddPage}
                onCancel={() => setAddingToCategory(null)}
              />
            </div>
          )}

          {/* Add new category option */}
          {isEditMode && (
            <div className="flex items-center gap-3 pt-6 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[0.625em]"
                onClick={() => setAddingToCategory("New Category")}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Category
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

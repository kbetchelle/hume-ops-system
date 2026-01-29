import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  useChecklists,
  useChecklistItems,
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useReorderItems,
  type Checklist,
  type ChecklistItem,
} from "@/hooks/useChecklists";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const CHECKLIST_ROLES: { value: AppRole; label: string }[] = [
  { value: "concierge", label: "Concierge" },
  { value: "female_spa_attendant", label: "Female Spa Attendant" },
  { value: "male_spa_attendant", label: "Male Spa Attendant" },
  { value: "floater", label: "Floater" },
];

function getRoleBadgeColor(role: AppRole): string {
  switch (role) {
    case "concierge": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "female_spa_attendant": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
    case "male_spa_attendant": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "floater": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default: return "";
  }
}

function getRoleLabel(role: AppRole): string {
  return CHECKLIST_ROLES.find(r => r.value === role)?.label || role;
}

export function ChecklistManager() {
  const { data: checklists, isLoading } = useChecklists();
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [deletingChecklist, setDeletingChecklist] = useState<Checklist | null>(null);

  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();

  const handleCreateChecklist = (data: { title: string; description: string; role: AppRole }) => {
    createChecklist.mutate(data, {
      onSuccess: () => setShowCreateDialog(false),
    });
  };

  const handleUpdateChecklist = (data: { title: string; description: string }) => {
    if (!editingChecklist) return;
    updateChecklist.mutate({ id: editingChecklist.id, ...data }, {
      onSuccess: () => setEditingChecklist(null),
    });
  };

  const handleDeleteChecklist = () => {
    if (!deletingChecklist) return;
    deleteChecklist.mutate(deletingChecklist.id, {
      onSuccess: () => setDeletingChecklist(null),
    });
  };

  const handleToggleActive = (checklist: Checklist) => {
    updateChecklist.mutate({ id: checklist.id, is_active: !checklist.is_active });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading checklists...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Checklists</h2>
          <p className="text-xs text-muted-foreground tracking-wide mt-1">
            Create and manage daily checklists for each role
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Checklist
        </Button>
      </div>

      <div className="space-y-4">
        {checklists?.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No checklists yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          checklists?.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              isExpanded={expandedChecklist === checklist.id}
              onToggleExpand={() => setExpandedChecklist(
                expandedChecklist === checklist.id ? null : checklist.id
              )}
              onEdit={() => setEditingChecklist(checklist)}
              onDelete={() => setDeletingChecklist(checklist)}
              onToggleActive={() => handleToggleActive(checklist)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <ChecklistFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateChecklist}
        isLoading={createChecklist.isPending}
      />

      {/* Edit Dialog */}
      <ChecklistFormDialog
        open={!!editingChecklist}
        onOpenChange={() => setEditingChecklist(null)}
        checklist={editingChecklist}
        onSubmit={handleUpdateChecklist}
        isLoading={updateChecklist.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingChecklist} onOpenChange={() => setDeletingChecklist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingChecklist?.title}"? This will also delete all tasks and completion history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChecklist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ChecklistCardProps {
  checklist: Checklist;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function ChecklistCard({ checklist, isExpanded, onToggleExpand, onEdit, onDelete, onToggleActive }: ChecklistCardProps) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onToggleExpand}>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="flex items-center gap-3">
                {checklist.title}
                <Badge variant="outline" className={getRoleBadgeColor(checklist.role)}>
                  {getRoleLabel(checklist.role)}
                </Badge>
                {!checklist.is_active && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </CardTitle>
              {checklist.description && (
                <CardDescription className="mt-1">{checklist.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Label htmlFor={`active-${checklist.id}`} className="text-xs">Active</Label>
              <Switch
                id={`active-${checklist.id}`}
                checked={checklist.is_active}
                onCheckedChange={onToggleActive}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <ChecklistItemsEditor checklistId={checklist.id} />
        </CardContent>
      )}
    </Card>
  );
}

interface ChecklistItemsEditorProps {
  checklistId: string;
}

function ChecklistItemsEditor({ checklistId }: ChecklistItemsEditorProps) {
  const { data: items, isLoading } = useChecklistItems(checklistId);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const reorderItems = useReorderItems();

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    addItem.mutate({
      checklist_id: checklistId,
      title: newItemTitle.trim(),
      sort_order: (items?.length || 0) * 10,
    }, {
      onSuccess: () => setNewItemTitle(""),
    });
  };

  const handleMoveItem = (itemId: string, direction: "up" | "down") => {
    if (!items) return;
    const index = items.findIndex(i => i.id === itemId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];

    reorderItems.mutate({
      checklist_id: checklistId,
      items: newItems.map((item, i) => ({ id: item.id, sort_order: i * 10 })),
    });
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground py-4">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="space-y-2">
        {items?.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No tasks yet. Add one below.</p>
        ) : (
          items?.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-secondary/30 rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                {editingItem?.id === item.id ? (
                  <Input
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    onBlur={() => {
                      if (editingItem.title.trim()) {
                        updateItem.mutate({
                          id: item.id,
                          checklist_id: checklistId,
                          title: editingItem.title.trim(),
                        });
                      }
                      setEditingItem(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm cursor-pointer hover:underline"
                    onClick={() => setEditingItem(item)}
                  >
                    {item.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveItem(item.id, "up")}
                  disabled={index === 0}
                >
                  <ChevronDown className="h-3 w-3 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveItem(item.id, "down")}
                  disabled={index === (items?.length || 0) - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteItem.mutate({ id: item.id, checklist_id: checklistId })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add new task..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddItem();
          }}
        />
        <Button onClick={handleAddItem} disabled={!newItemTitle.trim() || addItem.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface ChecklistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist?: Checklist | null;
  onSubmit: (data: { title: string; description: string; role?: AppRole }) => void;
  isLoading?: boolean;
}

function ChecklistFormDialog({ open, onOpenChange, checklist, onSubmit, isLoading }: ChecklistFormDialogProps) {
  const [title, setTitle] = useState(checklist?.title || "");
  const [description, setDescription] = useState(checklist?.description || "");
  const [role, setRole] = useState<AppRole>(checklist?.role || "concierge");

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTitle(checklist?.title || "");
      setDescription(checklist?.description || "");
      setRole(checklist?.role || "concierge");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), role });
  };

  const isEditing = !!checklist;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Checklist" : "Create Checklist"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Daily Opening Tasks"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="role">Assign to Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isEditing ? "Save Changes" : "Create Checklist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

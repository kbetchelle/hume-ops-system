import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Link2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  useQuickLinkGroupsWithItems,
  useCreateQuickLinkGroup,
  useUpdateQuickLinkGroup,
  useDeleteQuickLinkGroup,
  useCreateQuickLinkItem,
  useUpdateQuickLinkItem,
  useDeleteQuickLinkItem,
  type QuickLinkGroupWithItems,
  type QuickLinkItem,
} from "@/hooks/useStaffResources";
import { AppRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Role label helper
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
// Group Create / Edit Dialog
// ---------------------------------------------------------------------------
function GroupDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: QuickLinkGroupWithItems | null;
}) {
  const isEditing = !!group;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [assignedRoles, setAssignedRoles] = useState<AppRole[]>([]);

  const createMutation = useCreateQuickLinkGroup();
  const updateMutation = useUpdateQuickLinkGroup();

  useEffect(() => {
    if (open) {
      setTitle(group?.title ?? "");
      setDescription(group?.description ?? "");
      setDisplayOrder(String(group?.display_order ?? 0));
      setAssignedRoles(group?.assigned_roles ?? []);
    }
  }, [open, group]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const input = {
      title: title.trim(),
      description: description || null,
      display_order: parseInt(displayOrder, 10) || 0,
      assigned_roles: assignedRoles,
    };
    if (isEditing && group) {
      await updateMutation.mutateAsync({ ...input, id: group.id });
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
            {isEditing ? "Edit Group" : "Add Group"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the quick link group details."
              : "Create a new quick link group."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-title" className="text-xs uppercase tracking-wider">
              Title
            </Label>
            <Input
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Group title..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider">
              Description (optional)
            </Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Optional description..."
              minHeight="120px"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-order" className="text-xs uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="group-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
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
            {isEditing ? "Update" : "Create"} Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Link Create / Edit Dialog
// ---------------------------------------------------------------------------
function LinkDialog({
  open,
  onOpenChange,
  link,
  groupId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: QuickLinkItem | null;
  groupId: string;
}) {
  const isEditing = !!link;
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const createMutation = useCreateQuickLinkItem();
  const updateMutation = useUpdateQuickLinkItem();

  useEffect(() => {
    if (open) {
      setName(link?.name ?? "");
      setUrl(link?.url ?? "");
      setDisplayOrder(String(link?.display_order ?? 0));
    }
  }, [open, link]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) return;
    const input = {
      group_id: groupId,
      name: name.trim(),
      url: url.trim(),
      display_order: parseInt(displayOrder, 10) || 0,
    };
    if (isEditing && link) {
      await updateMutation.mutateAsync({ ...input, id: link.id });
    } else {
      await createMutation.mutateAsync(input);
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Link" : "Add Link"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the link details."
              : "Add a new link to this group."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-name" className="text-xs uppercase tracking-wider">
              Name
            </Label>
            <Input
              id="link-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Link name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url" className="text-xs uppercase tracking-wider">
              URL
            </Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-order" className="text-xs uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="link-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !url.trim() || isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? "Update" : "Add"} Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// QuickLinksManagement
// ---------------------------------------------------------------------------
export function QuickLinksManagement() {
  const { data: groups, isLoading } = useQuickLinkGroupsWithItems();
  const deleteGroupMutation = useDeleteQuickLinkGroup();
  const deleteLinkMutation = useDeleteQuickLinkItem();

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<QuickLinkGroupWithItems | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLinkItem | null>(null);
  const [activeLinkGroupId, setActiveLinkGroupId] = useState<string>("");
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: QuickLinkGroupWithItems) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (deleteGroupId) {
      await deleteGroupMutation.mutateAsync(deleteGroupId);
      setDeleteGroupId(null);
    }
  };

  const handleCreateLink = (groupId: string) => {
    setEditingLink(null);
    setActiveLinkGroupId(groupId);
    setLinkDialogOpen(true);
  };

  const handleEditLink = (link: QuickLinkItem, groupId: string) => {
    setEditingLink(link);
    setActiveLinkGroupId(groupId);
    setLinkDialogOpen(true);
  };

  const handleDeleteLink = async () => {
    if (deleteLinkId) {
      await deleteLinkMutation.mutateAsync(deleteLinkId);
      setDeleteLinkId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            Quick Link Groups
          </h2>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (groups ?? []).length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quick link groups yet.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-none"
              onClick={handleCreateGroup}
            >
              Create your first group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(groups ?? []).map((group) => (
            <Card key={group.id} className="rounded-none">
              <CardContent className="px-0 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground/80"
                        onClick={() => toggleExpand(group.id)}
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <h3 className="font-medium">{group.title}</h3>
                      </button>
                      <Badge variant="secondary" className="rounded-none text-[10px]">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "link" : "links"}
                      </Badge>
                      {group.assigned_roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="rounded-none text-[10px]"
                        >
                          {ROLE_LABELS[role] ?? role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteGroupId(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Expandable links section */}
                {expandedGroups.has(group.id) && (
                  <div className="mt-4 border-t pt-4 space-y-2">
                    {group.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No links in this group yet.
                      </p>
                    ) : (
                      group.items.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between gap-4 py-1.5 px-2 hover:bg-muted/50 rounded-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">
                              {link.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {link.url}
                            </span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditLink(link, group.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteLinkId(link.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none mt-2"
                      onClick={() => handleCreateLink(group.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Group Dialog */}
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
      />

      {/* Link Dialog */}
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        link={editingLink}
        groupId={activeLinkGroupId}
      />

      {/* Delete Group Confirmation */}
      <AlertDialog
        open={!!deleteGroupId}
        onOpenChange={() => setDeleteGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this group and all its links. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Confirmation */}
      <AlertDialog
        open={!!deleteLinkId}
        onOpenChange={() => setDeleteLinkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this link. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
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

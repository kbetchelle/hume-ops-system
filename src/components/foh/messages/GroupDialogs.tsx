import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStaffList } from '@/hooks/useMessaging';
import {
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from '@/hooks/useMessageGroups';
import type { StaffMessageGroup } from '@/types/messaging';

interface GroupDialogsProps {
  mode: 'create' | 'edit' | 'delete' | null;
  group?: StaffMessageGroup;
  onClose: () => void;
}

export function GroupDialogs({ mode, group, onClose }: GroupDialogsProps) {
  if (mode === 'delete' && group) {
    return <DeleteGroupDialog group={group} onClose={onClose} />;
  }

  if (mode === 'create' || (mode === 'edit' && group)) {
    return <CreateEditGroupDialog mode={mode} group={group} onClose={onClose} />;
  }

  return null;
}

// Create/Edit Dialog
function CreateEditGroupDialog({
  mode,
  group,
  onClose,
}: {
  mode: 'create' | 'edit';
  group?: StaffMessageGroup;
  onClose: () => void;
}) {
  const [name, setName] = useState(group?.name || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    group?.member_ids || []
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data: staffList = [] } = useStaffList();
  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();

  const isPending = isCreating || isUpdating;

  // Reset form when dialog opens
  useEffect(() => {
    if (group) {
      setName(group.name);
      setSelectedMemberIds(group.member_ids);
    } else {
      setName('');
      setSelectedMemberIds([]);
    }
    setSearchQuery('');
  }, [group]);

  const handleSubmit = () => {
    if (!name.trim() || selectedMemberIds.length < 2) return;

    if (mode === 'edit' && group) {
      updateGroup(
        {
          groupId: group.id,
          name: name.trim(),
          memberIds: selectedMemberIds,
        },
        {
          onSuccess: onClose,
        }
      );
    } else {
      createGroup(
        {
          name: name.trim(),
          memberIds: selectedMemberIds,
        },
        {
          onSuccess: onClose,
        }
      );
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setName('');
      setSelectedMemberIds([]);
      setSearchQuery('');
      onClose();
    }
  };

  const toggleMemberSelection = (staffId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const clearSelection = () => {
    setSelectedMemberIds([]);
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter((staff) =>
    (staff.full_name || staff.email)
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const isValid = name.trim().length > 0 && selectedMemberIds.length >= 2;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <Edit2 className="h-4 w-4" />
                Edit Group
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Group
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">
              Group Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend Shift Team"
              className="rounded-none"
              disabled={isPending}
            />
          </div>

          {/* Search Members */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">
              Search Members
            </Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="rounded-none"
              disabled={isPending}
            />
          </div>

          {/* Selected Count */}
          {selectedMemberIds.length > 0 && (
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="rounded-none">
                {selectedMemberIds.length} members
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="rounded-none text-xs"
                disabled={isPending}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Members List */}
          <ScrollArea className="h-[300px] border rounded-none p-2">
            <div className="space-y-2">
              {filteredStaff.map((staff) => {
                const isSelected = selectedMemberIds.includes(staff.user_id);
                return (
                  <div
                    key={staff.user_id}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-none cursor-pointer"
                    onClick={() => !isPending && toggleMemberSelection(staff.user_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMemberSelection(staff.user_id)}
                      className="rounded-none"
                      disabled={isPending}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {staff.full_name || staff.email}
                      </div>
                      {staff.full_name && (
                        <div className="text-xs text-muted-foreground">
                          {staff.email}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-none"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="rounded-none"
          >
            {mode === 'edit' ? 'Update' : 'Create'} Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteGroupDialog({
  group,
  onClose,
}: {
  group: StaffMessageGroup;
  onClose: () => void;
}) {
  const { mutate: deleteGroup, isPending } = useDeleteGroup();

  const handleDelete = () => {
    deleteGroup(group.id, {
      onSuccess: onClose,
    });
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Group
          </AlertDialogTitle>
          <AlertDialogDescription>
            Delete group &quot;{group.name}&quot;? Messages will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-none bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

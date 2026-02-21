import { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useCreateGroup, useUpdateGroup } from '@/hooks/useTargetGroups';
import type { TargetGroup } from '@/types/messaging';

interface TargetGroupDialogProps {
  mode: 'create' | 'edit';
  group?: TargetGroup;
  onClose: () => void;
}

export function TargetGroupDialog({ mode, group, onClose }: TargetGroupDialogProps) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    group?.member_ids || []
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [] } = useAdminUsers();
  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();

  const isPending = isCreating || isUpdating;

  // Filter out deactivated users
  const activeUsers = users.filter((u) => !u.deactivated);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setSelectedMemberIds(group.member_ids);
    } else {
      setName('');
      setDescription('');
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
          description: description.trim() || undefined,
        },
        { onSuccess: onClose }
      );
    } else {
      createGroup(
        {
          name: name.trim(),
          memberIds: selectedMemberIds,
          description: description.trim() || undefined,
        },
        { onSuccess: onClose }
      );
    }
  };

  const handleClose = () => {
    if (!isPending) onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = activeUsers.filter((u) =>
    (u.full_name || u.email)
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
                Edit Target Group
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Target Group
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

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this group's purpose..."
              className="rounded-none resize-none"
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* Search Members */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">
              Members
            </Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="rounded-none"
              disabled={isPending}
            />
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={selectedMemberIds.length >= 2 ? 'secondary' : 'destructive'}
                className="rounded-none text-[10px]"
              >
                {selectedMemberIds.length} selected
              </Badge>
              {selectedMemberIds.length < 2 && (
                <span className="text-[10px] text-muted-foreground">
                  Minimum 2 members required
                </span>
              )}
            </div>
            {selectedMemberIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMemberIds([])}
                className="rounded-none text-xs"
                disabled={isPending}
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Members List */}
          <ScrollArea className="h-[300px] border rounded-none p-2">
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.user_id);
                const checkboxId = `member-${user.user_id}`;
                return (
                  <label
                    key={user.user_id}
                    htmlFor={checkboxId}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-none cursor-pointer"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => toggleMember(user.user_id)}
                      className="rounded-none"
                      disabled={isPending}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {user.full_name || user.email}
                      </div>
                      {user.full_name && (
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No staff members found
                </div>
              )}
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

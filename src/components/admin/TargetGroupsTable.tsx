import { useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTargetGroups, useDeleteGroup } from '@/hooks/useTargetGroups';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { TargetGroupDialog } from './TargetGroupDialog';
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
import type { TargetGroup } from '@/types/messaging';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function TargetGroupsTable() {
  const { data: groups = [], isLoading } = useTargetGroups();
  const { data: users = [] } = useAdminUsers();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TargetGroup | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<TargetGroup | null>(null);

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user?.full_name || user?.email || 'Unknown';
  };

  const getMemberNames = (memberIds: string[], max = 3) => {
    const names = memberIds.map(getUserName);
    if (names.length <= max) return names.join(', ');
    return `${names.slice(0, max).join(', ')} +${names.length - max}`;
  };

  const handleEdit = (group: TargetGroup) => {
    setSelectedGroup(group);
    setDialogMode('edit');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGroup(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground tracking-wide">
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={() => {
            setSelectedGroup(undefined);
            setDialogMode('create');
          }}
          size="sm"
          className="rounded-none text-xs uppercase tracking-widest"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 border border-border">
          <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            No target groups yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create groups to target staff across messaging, announcements, and more.
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-widest">Group Name</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Members</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest hidden md:table-cell">Created By</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {group.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Badge variant="secondary" className="rounded-none text-[10px]">
                        {group.member_ids.length} members
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {getMemberNames(group.member_ids)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {group.created_by ? getUserName(group.created_by) : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {format(new Date(group.updated_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(group)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogMode && (
        <TargetGroupDialog
          mode={dialogMode}
          group={selectedGroup}
          onClose={() => {
            setDialogMode(null);
            setSelectedGroup(undefined);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Group
            </AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.name}&quot;? This group will be removed from all features that reference it. Existing messages will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-none bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

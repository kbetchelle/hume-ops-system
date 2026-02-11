import { useState } from 'react';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStaffList } from '@/hooks/useMessaging';
import { useMessageGroups, useRoleGroupMembers } from '@/hooks/useMessageGroups';
import { ROLE_GROUPS } from '@/types/messaging';
import type { StaffMessageGroup } from '@/types/messaging';

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (recipientIds: string[], groupId?: string) => void;
}

export function NewConversationDialog({
  isOpen,
  onClose,
  onStartConversation,
}: NewConversationDialogProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: staffList = [] } = useStaffList();
  const { data: customGroups = [] } = useMessageGroups();

  const handleClose = () => {
    setSelectedStaffIds([]);
    setSelectedGroupId(null);
    setSearchQuery('');
    onClose();
  };

  const handleStart = () => {
    if (selectedStaffIds.length > 0) {
      onStartConversation(selectedStaffIds, selectedGroupId || undefined);
      handleClose();
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const selectGroup = (group: StaffMessageGroup) => {
    setSelectedGroupId(group.id);
    setSelectedStaffIds(group.member_ids);
  };

  const selectRoleGroup = (roleGroupId: string, memberIds: string[]) => {
    setSelectedGroupId(null); // Role groups don't have custom IDs
    setSelectedStaffIds(memberIds);
  };

  const clearSelection = () => {
    setSelectedStaffIds([]);
    setSelectedGroupId(null);
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter((staff) =>
    (staff.full_name || staff.email)
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            New Conversation
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="staff" className="rounded-none text-xs uppercase tracking-wider">
              Staff
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-none text-xs uppercase tracking-wider">
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">
                Search Staff
              </Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="rounded-none"
              />
            </div>

            {/* Selected Count */}
            {selectedStaffIds.length > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="rounded-none">
                  {selectedStaffIds.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="rounded-none text-xs"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Staff List */}
            <ScrollArea className="h-[400px] border rounded-none p-2">
              <div className="space-y-2">
                {filteredStaff.map((staff) => {
                  const isSelected = selectedStaffIds.includes(staff.user_id);
                  return (
                    <div
                      key={staff.user_id}
                      className="flex items-center space-x-3 p-2 hover:bg-accent rounded-none cursor-pointer"
                      onClick={() => toggleStaffSelection(staff.user_id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStaffSelection(staff.user_id)}
                        className="rounded-none"
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
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-none p-2">
              <div className="space-y-4">
                {/* Role Groups */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">
                    Role Groups
                  </div>
                  <div className="space-y-1">
                    {ROLE_GROUPS.map((roleGroup) => (
                      <RoleGroupItem
                        key={roleGroup.id}
                        roleGroup={roleGroup}
                        onSelect={selectRoleGroup}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Groups */}
                {customGroups.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">
                      Custom Groups
                    </div>
                    <div className="space-y-1">
                      {customGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-none cursor-pointer"
                          onClick={() => selectGroup(group)}
                        >
                          <div>
                            <div className="text-sm font-medium">{group.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {group.member_ids.length} members
                            </div>
                          </div>
                          {selectedGroupId === group.id && (
                            <Badge variant="default" className="rounded-none text-[10px]">
                              Selected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {selectedStaffIds.length > 0 && (
              <Badge variant="secondary" className="rounded-none">
                {selectedStaffIds.length} members selected
              </Badge>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={selectedStaffIds.length === 0}
            className="rounded-none"
          >
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Role Group Item with member count fetching
function RoleGroupItem({
  roleGroup,
  onSelect,
}: {
  roleGroup: typeof ROLE_GROUPS[number];
  onSelect: (roleGroupId: string, memberIds: string[]) => void;
}) {
  const { data: memberIds = [] } = useRoleGroupMembers(roleGroup);

  return (
    <div
      className="flex items-center justify-between p-2 hover:bg-accent rounded-none cursor-pointer"
      onClick={() => onSelect(roleGroup.id, memberIds)}
    >
      <div>
        <div className="text-sm font-medium">{roleGroup.name}</div>
        <div className="text-xs text-muted-foreground">
          {roleGroup.description}
        </div>
      </div>
      <Badge variant="outline" className="rounded-none text-[10px]">
        {memberIds.length}
      </Badge>
    </div>
  );
}

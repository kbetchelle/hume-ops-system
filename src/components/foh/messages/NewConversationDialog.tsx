import { useState } from 'react';
import { Users, User } from 'lucide-react';
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
import { useTargetGroups, useRoleGroupMembers } from '@/hooks/useTargetGroups';
import { ROLE_GROUPS } from '@/types/messaging';
import type { TargetGroup } from '@/types/messaging';

export interface NewConversationSelection {
  type: 'private' | 'group';
  recipientIds: string[];
  groupId?: string;
  groupName?: string;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: NewConversationSelection) => void;
  /** 'single': click one staff/group = onSelect + close. 'multi': checkboxes + button to confirm. */
  mode?: 'single' | 'multi';
}

export function NewConversationDialog({
  isOpen,
  onClose,
  onSelect,
  mode = 'single',
}: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);

  const { data: staffList = [] } = useStaffList();
  const { data: customGroups = [] } = useTargetGroups();

  const handleClose = () => {
    setSearchQuery('');
    setSelectedStaffIds([]);
    setSelectedGroupId(null);
    setSelectedGroupName(null);
    onClose();
  };

  /** Individual tab: single-select — clicking a staff opens conversation with them */
  const handleSelectStaff = (staffId: string) => {
    if (mode === 'single') {
      onSelect({ type: 'private', recipientIds: [staffId] });
      handleClose();
    } else {
      setSelectedStaffIds((prev) =>
        prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
      );
      setSelectedGroupId(null);
      setSelectedGroupName(null);
    }
  };

  /** Groups tab: clicking a custom group starts group conversation (or selects in multi) */
  const handleSelectCustomGroup = (group: TargetGroup) => {
    if (mode === 'single') {
      onSelect({
        type: 'group',
        recipientIds: group.member_ids,
        groupId: group.id,
        groupName: group.name,
      });
      handleClose();
    } else {
      setSelectedStaffIds(group.member_ids);
      setSelectedGroupId(group.id);
      setSelectedGroupName(group.name);
    }
  };

  /** Groups tab: clicking a role group starts group conversation (or selects in multi) */
  const handleSelectRoleGroup = (memberIds: string[], groupName: string) => {
    if (mode === 'single') {
      onSelect({ type: 'group', recipientIds: memberIds, groupName });
      handleClose();
    } else {
      setSelectedStaffIds(memberIds);
      setSelectedGroupId(null);
      setSelectedGroupName(groupName);
    }
  };

  const handleConfirmMulti = () => {
    if (selectedStaffIds.length === 0) return;
    onSelect({
      type: selectedGroupId ? 'group' : 'private',
      recipientIds: selectedStaffIds,
      groupId: selectedGroupId || undefined,
      groupName: selectedGroupName || undefined,
    });
    handleClose();
  };

  // Filter staff by search (active only — exclude deactivated if we have that field)
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

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="individual" className="rounded-none text-xs uppercase tracking-widest">
              Individual
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-none text-xs uppercase tracking-widest">
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Individual tab: searchable list; single-select = click to open, multi = checkboxes + confirm */}
          <TabsContent value="individual" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Search Staff
              </Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="rounded-none text-xs"
              />
            </div>
            {mode === 'multi' && selectedStaffIds.length > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="rounded-none text-xs">
                  {selectedStaffIds.length} selected
                </Badge>
              </div>
            )}
            <ScrollArea className="h-[400px] border rounded-none p-2">
              <div className="space-y-1">
                {filteredStaff.map((staff) => {
                  const isSelected = selectedStaffIds.includes(staff.user_id);
                  return (
                    <div
                      key={staff.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-none cursor-pointer"
                      onClick={() => handleSelectStaff(staff.user_id)}
                    >
                      {mode === 'multi' ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectStaff(staff.user_id)}
                          className="rounded-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {staff.full_name || staff.email || 'Unknown'}
                        </div>
                        {staff.email && (
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
            {mode === 'multi' && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  onClick={handleConfirmMulti}
                  disabled={selectedStaffIds.length === 0}
                  className="rounded-none text-xs"
                >
                  Select {selectedStaffIds.length > 0 ? selectedStaffIds.length : ''} recipient{selectedStaffIds.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Groups tab: role groups + custom groups — click to start conversation */}
          <TabsContent value="groups" className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-none p-2">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-2">
                    Role Groups
                  </div>
                  <div className="space-y-1">
                    {ROLE_GROUPS.map((roleGroup) => (
                      <RoleGroupItem
                        key={roleGroup.id}
                        roleGroup={roleGroup}
                        onSelect={(memberIds) =>
                          handleSelectRoleGroup(memberIds, roleGroup.name)
                        }
                      />
                    ))}
                  </div>
                </div>
                {customGroups.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-2">
                      Custom Groups
                    </div>
                    <div className="space-y-1">
                      {customGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-none cursor-pointer"
                          onClick={() => handleSelectCustomGroup(group)}
                        >
                          <div>
                            <div className="text-sm font-medium">{group.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {group.member_ids.length} members
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            {mode === 'multi' && selectedStaffIds.length > 0 && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  onClick={handleConfirmMulti}
                  className="rounded-none text-xs"
                >
                  Select {selectedStaffIds.length} recipient{selectedStaffIds.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Role Group Item with member count fetching
function RoleGroupItem({
  roleGroup,
  onSelect,
}: {
  roleGroup: (typeof ROLE_GROUPS)[number];
  onSelect: (memberIds: string[]) => void;
}) {
  const { data: memberIds = [] } = useRoleGroupMembers(roleGroup);

  return (
    <div
      className="flex items-center justify-between p-2 hover:bg-accent rounded-none cursor-pointer"
      onClick={() => onSelect(memberIds)}
    >
      <div>
        <div className="text-sm font-medium">{roleGroup.name}</div>
        <div className="text-xs text-muted-foreground">
          {roleGroup.description}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{memberIds.length}</span>
    </div>
  );
}

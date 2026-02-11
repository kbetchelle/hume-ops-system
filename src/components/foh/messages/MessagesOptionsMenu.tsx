import { useState } from 'react';
import { MoreVertical, FileText, Clock, Archive, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDraftCount } from '@/hooks/useMessageDrafts';
import { useStaffMessages } from '@/hooks/useMessaging';
import { useMessageGroups } from '@/hooks/useMessageGroups';
import { useAuth } from '@/hooks/useAuth';

interface MessagesOptionsMenuProps {
  onViewChange: (view: 'drafts' | 'scheduled' | 'archived' | 'groups') => void;
}

export function MessagesOptionsMenu({ onViewChange }: MessagesOptionsMenuProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Get counts
  const draftCount = useDraftCount();
  const { data: customGroups = [] } = useMessageGroups();
  const { data: messages = [] } = useStaffMessages();

  // Calculate scheduled count
  const scheduledCount = messages.filter(
    (msg) => msg.scheduled_at && new Date(msg.scheduled_at) > new Date()
  ).length;

  // Calculate archived count (messages with archived reads for current user)
  // Note: This is a simplified count. For accurate count, we'd need to query reads
  // For now, we'll just show a badge if there are any archived conversations
  const archivedCount = 0; // Placeholder - would need reads query

  const handleSelect = (view: 'drafts' | 'scheduled' | 'archived' | 'groups') => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-none h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none w-56">
        <DropdownMenuItem
          onClick={() => handleSelect('drafts')}
          className="rounded-none cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span className="flex-1">Drafts</span>
          {draftCount > 0 && (
            <Badge variant="secondary" className="rounded-none text-[10px] ml-2">
              {draftCount}
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelect('scheduled')}
          className="rounded-none cursor-pointer"
        >
          <Clock className="h-4 w-4 mr-2" />
          <span className="flex-1">Scheduled</span>
          {scheduledCount > 0 && (
            <Badge variant="secondary" className="rounded-none text-[10px] ml-2">
              {scheduledCount}
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelect('archived')}
          className="rounded-none cursor-pointer"
        >
          <Archive className="h-4 w-4 mr-2" />
          <span className="flex-1">Archived</span>
          {archivedCount > 0 && (
            <Badge variant="secondary" className="rounded-none text-[10px] ml-2">
              {archivedCount}
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleSelect('groups')}
          className="rounded-none cursor-pointer"
        >
          <Users className="h-4 w-4 mr-2" />
          <span className="flex-1">Manage Groups</span>
          {customGroups.length > 0 && (
            <Badge variant="secondary" className="rounded-none text-[10px] ml-2">
              {customGroups.length}
            </Badge>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

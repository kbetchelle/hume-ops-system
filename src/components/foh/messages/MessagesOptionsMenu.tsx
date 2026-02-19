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
import { useMessageGroups } from '@/hooks/useMessageGroups';

interface MessagesOptionsMenuProps {
  onViewChange: (view: 'drafts' | 'scheduled' | 'archived' | 'groups') => void;
  archivedCount?: number;
  scheduledCount?: number;
}

export function MessagesOptionsMenu({
  onViewChange,
  archivedCount = 0,
  scheduledCount = 0,
}: MessagesOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const draftCount = useDraftCount();
  const { data: customGroups = [] } = useMessageGroups();

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

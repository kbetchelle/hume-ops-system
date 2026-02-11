import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { GroupedReaction } from '@/types/messaging';

interface ReactionPillsProps {
  reactions: GroupedReaction[];
  onToggle: (emoji: string) => void;
  currentUserId: string;
}

export function ReactionPills({
  reactions,
  onToggle,
  currentUserId,
}: ReactionPillsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <Popover key={reaction.emoji}>
          <PopoverTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                'rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-secondary/80 transition-colors',
                reaction.hasCurrentUser &&
                  'bg-primary/20 border border-primary hover:bg-primary/30'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(reaction.emoji);
              }}
            >
              <span>{reaction.emoji}</span>
              <span className="ml-1 text-[10px]">{reaction.count}</span>
            </Badge>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2 rounded-none"
            side="top"
            align="start"
          >
            <div className="text-[10px] space-y-0.5">
              {reaction.userNames.map((name, i) => (
                <div key={i}>
                  {name}
                  {reaction.userIds[i] === currentUserId && (
                    <span className="ml-1 text-muted-foreground">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

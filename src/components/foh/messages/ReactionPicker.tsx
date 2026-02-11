import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { REACTION_EMOJIS } from '@/types/messaging';
import type { ReactionEmoji } from '@/types/messaging';

interface ReactionPickerProps {
  onSelect: (emoji: ReactionEmoji) => void;
  trigger?: React.ReactNode;
}

export function ReactionPicker({ onSelect, trigger }: ReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none h-6 w-6 p-0"
          >
            <Smile className="h-3 w-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 rounded-none" align="start">
        <div className="flex gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => onSelect(emoji)}
              className="rounded-none h-8 w-8 p-0 text-base hover:scale-125 transition-transform"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

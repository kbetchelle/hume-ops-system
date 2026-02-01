import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EditorInfo } from '@/types/concierge-form';

interface ActiveEditorsBarProps {
  editors: EditorInfo[];
}

export function ActiveEditorsBar({ editors }: ActiveEditorsBarProps) {
  if (editors.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <span className="text-sm text-blue-900 dark:text-blue-100">
        {editors.length === 1 ? '1 other person is' : `${editors.length} others are`} editing this report:
      </span>
      <div className="flex items-center gap-2">
        {editors.map((editor) => (
          <Badge
            key={editor.sessionId}
            variant="secondary"
            className="text-xs"
          >
            {editor.userName}
            {editor.focusedField && (
              <span className="ml-1 text-muted-foreground">• {editor.focusedField}</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}

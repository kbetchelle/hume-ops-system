import { Check, Clock, Save, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  isOnline: boolean;
  queueSize?: number;
}

export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  isDirty,
  isOnline,
  queueSize = 0,
}: AutoSaveIndicatorProps) {
  if (!isOnline && queueSize > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Offline ({queueSize} queued)
      </Badge>
    );
  }

  if (isSaving) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Save className="h-3 w-3 animate-pulse" />
        Saving...
      </Badge>
    );
  }

  if (isDirty) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Unsaved changes
      </Badge>
    );
  }

  if (lastSaved) {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        <Check className="h-3 w-3" />
        Saved {format(lastSaved, 'h:mm a')}
      </Badge>
    );
  }

  return null;
}

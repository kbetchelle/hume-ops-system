import { Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Stub component for auto-save status
export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  isDirty,
}: {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}) {
  if (isSaving) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </Badge>
    );
  }

  if (lastSaved && !isDirty) {
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Saved
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

  return null;
}

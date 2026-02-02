import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Stub component for conflict resolution
export function ConflictModal({
  open,
  onOpenChange,
  conflictData,
  onUseLocal,
  onUseRemote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: any;
  onUseLocal: () => void;
  onUseRemote: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conflicting Changes Detected</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Another user has made changes to this form. Choose which version to keep.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onUseRemote}>
            Use Remote Version
          </Button>
          <Button onClick={onUseLocal}>
            Keep My Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

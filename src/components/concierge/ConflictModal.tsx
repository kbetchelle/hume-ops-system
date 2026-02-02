import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Stub component for conflict resolution
export function ConflictModal({
  isOpen,
  onClose,
  localData,
  remoteData,
  localVersion,
  remoteVersion,
  onAcceptRemote,
  onKeepLocal,
}: {
  isOpen: boolean;
  onClose: () => void;
  localData: any;
  remoteData: any;
  localVersion?: number;
  remoteVersion?: number;
  onAcceptRemote: () => void;
  onKeepLocal: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conflicting Changes Detected</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Another user has made changes to this form. Choose which version to keep.
          </p>
          {localVersion && remoteVersion && (
            <p className="text-xs text-muted-foreground mt-2">
              Local version: {localVersion} | Remote version: {remoteVersion}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onAcceptRemote}>
            Use Remote Version
          </Button>
          <Button onClick={onKeepLocal}>
            Keep My Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

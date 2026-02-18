import { AlertTriangle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormDataType } from '@/types/concierge-form';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  localData: FormDataType;
  remoteData: FormDataType;
  localVersion: number;
  remoteVersion: number;
  onAcceptRemote: () => void;
  onKeepLocal: () => void;
  isSameUser?: boolean;
}

export function ConflictModal({
  isOpen,
  onClose,
  localData,
  remoteData,
  localVersion,
  remoteVersion,
  onAcceptRemote,
  onKeepLocal,
  isSameUser = false,
}: ConflictModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>
              {isSameUser ? 'Multi-Device Edit Detected' : 'Conflicting Changes'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isSameUser
              ? 'You are editing this report from multiple devices or tabs.'
              : 'Someone else has updated this report while you were editing.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="text-sm font-medium">Your version</div>
              <Badge variant="outline" className="mt-1">
                Version {localVersion}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-right">Remote version</div>
              <Badge variant="default" className="mt-1">
                Version {remoteVersion}
              </Badge>
            </div>
          </div>

          {/* Summary of differences */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Differences detected:</div>
            <div className="text-sm text-muted-foreground space-y-1">
              {localData.memberFeedback.length !== remoteData.memberFeedback.length && (
                <div>• Member feedback count changed</div>
              )}
              {localData.facilityIssues.length !== remoteData.facilityIssues.length && (
                <div>• Facility issues count changed</div>
              )}
              {localData.busiestAreas !== remoteData.busiestAreas && (
                <div>• Busiest areas text modified</div>
              )}
              {localData.managementNotes !== remoteData.managementNotes && (
                <div>• Management notes modified</div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              Choose which version to keep. The other version will be discarded.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onAcceptRemote}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept Remote
            <span className="ml-1 text-xs text-muted-foreground">(discard local)</span>
          </Button>
          <Button
            onClick={onKeepLocal}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Keep Local
            <span className="ml-1 text-xs text-muted-foreground">(overwrite remote)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

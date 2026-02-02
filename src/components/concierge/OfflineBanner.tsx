import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Stub component for offline status banner
export function OfflineBanner({ 
  isOnline = false, 
  queueSize,
  onRetry 
}: { 
  isOnline?: boolean;
  queueSize: number;
  onRetry: () => void;
}) {
  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>You're offline. {queueSize > 0 && `${queueSize} changes queued.`}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

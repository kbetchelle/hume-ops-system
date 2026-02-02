import { AlertTriangle, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Stub component for offline status banner
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>You're offline. Changes will be saved locally and synced when you reconnect.</span>
          <Wifi className="h-4 w-4" />
        </div>
      </AlertDescription>
    </Alert>
  );
}

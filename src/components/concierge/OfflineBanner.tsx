import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineBannerProps {
  queueSize: number;
  onRetry?: () => void;
}

export function OfflineBanner({ queueSize, onRetry }: OfflineBannerProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-3">
        <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <div>
          <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
            You're offline
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300">
            {queueSize > 0 ? (
              <span>{queueSize} change{queueSize !== 1 ? 's' : ''} queued for sync</span>
            ) : (
              <span>Changes will be saved locally and synced when you reconnect</span>
            )}
          </div>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

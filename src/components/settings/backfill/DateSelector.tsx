import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, XCircle, RefreshCw } from "lucide-react";

interface DateSelectorProps {
  startDate: string;
  endDate: string;
  isRange: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onIsRangeChange: (value: boolean) => void;
  existingCounts?: Record<string, number>;
  isRunning: boolean;
  elapsedText: string;
  onSync: () => void;
  onCancel: () => void;
  dayCount: number;
}

export default function DateSelector({
  isRunning,
  elapsedText,
  onSync,
  onCancel,
}: DateSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={onSync} disabled={isRunning} className="flex-1 gap-2" size="lg">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing... {elapsedText}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
          {isRunning && (
            <Button onClick={onCancel} variant="outline" size="lg" className="gap-2">
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

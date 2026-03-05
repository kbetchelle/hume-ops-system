import { format } from "date-fns";
import { CalendarIcon, Loader2, Play, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PaymentsDateSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  isRunning: boolean;
  elapsedText: string;
  onSync: () => void;
  onCancel: () => void;
}

export default function PaymentsDateSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isRunning,
  elapsedText,
  onSync,
  onCancel,
}: PaymentsDateSelectorProps) {
  const startDateObj = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const endDateObj = endDate ? new Date(endDate + "T00:00:00") : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Payments Sync
        </CardTitle>
        <CardDescription>
          Fetches all records with <code className="text-xs">updated_at</code> in the selected range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">updated_at start</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-center text-center font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateObj ? format(startDateObj, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateObj}
                  onSelect={(d) => d && onStartDateChange(format(d, "yyyy-MM-dd"))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <span className="text-sm text-muted-foreground mt-5">→</span>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">updated_at end</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-center text-center font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDateObj ? format(endDateObj, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDateObj}
                  onSelect={(d) => d && onEndDateChange(format(d, "yyyy-MM-dd"))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

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
                Sync Payments
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

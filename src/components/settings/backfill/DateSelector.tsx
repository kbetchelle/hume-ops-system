import { format } from "date-fns";
import { CalendarIcon, Loader2, Play, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isRunning,
  elapsedText,
  onSync,
  onCancel,
  dayCount,
}: DateSelectorProps) {
  const startDateObj = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const endDateObj = endDate ? new Date(endDate + "T00:00:00") : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
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

          <span className="text-sm text-muted-foreground">→</span>

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

          {dayCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {dayCount} day{dayCount !== 1 ? "s" : ""}
            </span>
          )}
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

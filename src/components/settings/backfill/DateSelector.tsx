import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, Loader2, Play, XCircle } from "lucide-react";
import { format, subDays, parseISO, eachDayOfInterval } from "date-fns";

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
  isRange,
  onStartDateChange,
  onEndDateChange,
  onIsRangeChange,
  existingCounts,
  isRunning,
  elapsedText,
  onSync,
  onCancel,
  dayCount,
}: DateSelectorProps) {
  const setPreset = (preset: "today" | "yesterday" | "week" | "month") => {
    const now = new Date();
    switch (preset) {
      case "today":
        onStartDateChange(format(now, "yyyy-MM-dd"));
        onEndDateChange(format(now, "yyyy-MM-dd"));
        onIsRangeChange(false);
        break;
      case "yesterday":
        const yesterday = subDays(now, 1);
        onStartDateChange(format(yesterday, "yyyy-MM-dd"));
        onEndDateChange(format(yesterday, "yyyy-MM-dd"));
        onIsRangeChange(false);
        break;
      case "week":
        onStartDateChange(format(subDays(now, 6), "yyyy-MM-dd"));
        onEndDateChange(format(now, "yyyy-MM-dd"));
        onIsRangeChange(true);
        break;
      case "month":
        onStartDateChange(format(subDays(now, 29), "yyyy-MM-dd"));
        onEndDateChange(format(now, "yyyy-MM-dd"));
        onIsRangeChange(true);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Dates
        </CardTitle>
        <CardDescription>Choose a single date or date range to sync</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreset("today")}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("yesterday")}>Yesterday</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("week")}>Last 7 Days</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("month")}>Last 30 Days</Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="range-mode" checked={isRange} onCheckedChange={onIsRangeChange} />
          <Label htmlFor="range-mode" className="text-sm">Date range mode</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">{isRange ? "Start Date" : "Date"}</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className="mt-1" />
          </div>
          {isRange && (
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} min={startDate} className="mt-1" />
            </div>
          )}
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Days to sync:</span>
            <span className="font-medium">{dayCount}</span>
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
                Sync {dayCount} Day{dayCount !== 1 ? "s" : ""}
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

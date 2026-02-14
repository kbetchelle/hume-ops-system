import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateSickDayRequest } from "@/hooks/useSickDayRequests";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SickDayRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SickDayRequestDialog({
  open,
  onOpenChange,
}: SickDayRequestDialogProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [halfDay, setHalfDay] = useState<"AM" | "PM" | null>(null);
  const [notes, setNotes] = useState("");
  const createRequest = useCreateSickDayRequest();

  const isSingleDate = selectedDates.length === 1;

  const handleSubmit = () => {
    if (selectedDates.length === 0 || notes.trim().length === 0) return;
    if (isSingleDate && !halfDay) return;

    const dateStrings = selectedDates.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return isSingleDate && halfDay ? `${dateStr} ${halfDay}` : dateStr;
    });

    createRequest.mutate(
      { requestedDates: dateStrings, notes: notes.trim() },
      {
        onSuccess: () => {
          setSelectedDates([]);
          setHalfDay(null);
          setNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isSelected = selectedDates.some(
      (d) => format(d, "yyyy-MM-dd") === dateStr
    );

    if (isSelected) {
      setSelectedDates(selectedDates.filter(
        (d) => format(d, "yyyy-MM-dd") !== dateStr
      ));
    } else {
      setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
    // Reset half day when date selection changes
    setHalfDay(null);
  };

  const handleCancel = () => {
    setSelectedDates([]);
    setHalfDay(null);
    setNotes("");
    onOpenChange(false);
  };

  const isFormValid =
    selectedDates.length > 0 &&
    notes.trim().length >= 10 &&
    (!isSingleDate || halfDay !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base uppercase tracking-widest font-normal">
            Request Sick Day Pay
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select the date(s) you are requesting sick pay for and provide details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest">
              Date(s) Requesting Sick Pay
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-none",
                    selectedDates.length === 0 && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDates.length === 0
                    ? "Select date(s)"
                    : selectedDates.length === 1
                    ? format(selectedDates[0], "PPP")
                    : `${selectedDates.length} dates selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <CalendarComponent
                  mode="multiple"
                  selected={selectedDates}
                  onDayClick={handleDayClick}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Show selected dates as badges */}
            {selectedDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDates.map((date) => (
                  <Badge
                    key={format(date, "yyyy-MM-dd")}
                    variant="outline"
                    className="text-[10px] rounded-none cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDayClick(date)}
                  >
                    {format(date, "MMM d, yyyy")} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* AM/PM Toggle - only for single date */}
          {isSingleDate && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest">
                Shift <span className="text-destructive">*</span>
              </Label>
              <ToggleGroup
                type="single"
                value={halfDay || ""}
                onValueChange={(val) => setHalfDay(val as "AM" | "PM" | null)}
                className="justify-start"
              >
                <ToggleGroupItem
                  value="AM"
                  className="rounded-none text-[10px] uppercase tracking-widest px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  AM
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="PM"
                  className="rounded-none text-[10px] uppercase tracking-widest px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  PM
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs uppercase tracking-widest">
              Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Please provide details about your sick day (required, minimum 10 characters)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-none min-h-[100px]"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {notes.length}/10 characters minimum
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="rounded-none text-xs uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || createRequest.isPending}
            className="rounded-none text-xs uppercase tracking-widest"
          >
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

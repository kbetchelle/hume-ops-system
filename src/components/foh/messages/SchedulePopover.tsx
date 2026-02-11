import { useState } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SchedulePopoverProps {
  onSchedule: (scheduledAt: Date) => void;
  children?: React.ReactNode;
}

export function SchedulePopover({ onSchedule, children }: SchedulePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

  const handleSchedule = () => {
    if (!selectedDate) return;

    // Convert to 24-hour format
    let hour = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hour !== 12) {
      hour += 12;
    } else if (selectedPeriod === 'AM' && hour === 12) {
      hour = 0;
    }

    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hour);
    scheduledDateTime.setMinutes(parseInt(selectedMinute, 10));
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);

    onSchedule(scheduledDateTime);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedHour('12');
    setSelectedMinute('00');
    setSelectedPeriod('PM');
    setIsOpen(false);
  };

  // Build the full datetime with selected time to properly validate
  const getScheduledDateTime = () => {
    if (!selectedDate) return null;

    // Convert to 24-hour format
    let hour = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hour !== 12) {
      hour += 12;
    } else if (selectedPeriod === 'AM' && hour === 12) {
      hour = 0;
    }

    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hour);
    scheduledDateTime.setMinutes(parseInt(selectedMinute, 10));
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);

    return scheduledDateTime;
  };

  const scheduledDateTime = getScheduledDateTime();
  const isValidSchedule = scheduledDateTime && scheduledDateTime > new Date();

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString().padStart(2, '0');
  });

  // Generate minutes (00, 15, 30, 45)
  const minutes = ['00', '15', '30', '45'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="rounded-none">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="rounded-none w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div>
            <div className="text-sm font-medium uppercase tracking-wider">
              Schedule Message
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Select date and time
            </div>
          </div>

          {/* Calendar */}
          <div className="border rounded-none">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                // Get start of today (midnight)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Get start of selected date (midnight)
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);
                
                // Disable if the date is before today (at day boundary)
                return compareDate < today;
              }}
              initialFocus
              className="rounded-none"
            />
          </div>

          {/* Time Picker */}
          {selectedDate && (
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-wider">Time</Label>
              <div className="flex items-center gap-2">
                {/* Hour */}
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="rounded-none w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-lg font-medium">:</span>

                {/* Minute */}
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="rounded-none w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* AM/PM */}
                <Select
                  value={selectedPeriod}
                  onValueChange={(value) => setSelectedPeriod(value as 'AM' | 'PM')}
                >
                  <SelectTrigger className="rounded-none w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              {isValidSchedule && (
                <div className="text-xs text-muted-foreground bg-accent p-2 rounded-none">
                  Send on {format(selectedDate, 'MMM d, yyyy')} at {selectedHour}:
                  {selectedMinute} {selectedPeriod}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="rounded-none flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSchedule}
              disabled={!isValidSchedule}
              className="rounded-none flex-1"
            >
              <CalendarIcon className="h-3 w-3 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

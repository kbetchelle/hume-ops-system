import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventDrinkMutations } from "@/hooks/useEventDrinks";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { toast } from "sonner";

interface AddEventDrinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEventDrinkDialog({ open, onOpenChange }: AddEventDrinkDialogProps) {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { createEventDrink } = useEventDrinkMutations();

  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Saturday Social");
  const [drinkName, setDrinkName] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);

  const reset = () => {
    setEventName("");
    setEventType("Saturday Social");
    setDrinkName("");
    setEventDate(undefined);
  };

  const handleSubmit = () => {
    if (!drinkName.trim()) {
      toast.error("Drink name is required");
      return;
    }

    createEventDrink.mutate(
      {
        event_name: eventName.trim() || null,
        event_type: eventType,
        drink_name: drinkName.trim(),
        event_date: eventDate ? eventDate.toISOString().split("T")[0] : null,
        created_by: profile?.full_name ?? "Unknown",
      },
      {
        onSuccess: () => {
          toast.success("Event drink created");
          reset();
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create event drink");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">Add Event Drink</DialogTitle>
          <DialogDescription>
            Create a new drink entry for an upcoming event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Event Name */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Event Name</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Valentine's Day Social"
              className="rounded-none"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="Saturday Social">Saturday Social</SelectItem>
                <SelectItem value="Private Event">Private Event</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drink Name */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">
              Drink Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={drinkName}
              onChange={(e) => setDrinkName(e.target.value)}
              placeholder="e.g., Lavender Latte"
              className="rounded-none"
            />
          </div>

          {/* Event Date */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Event Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start rounded-none font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {eventDate
                    ? eventDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={(d) => {
                    setEventDate(d);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { reset(); onOpenChange(false); }}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createEventDrink.isPending || !drinkName.trim()}
            className="rounded-none"
          >
            {createEventDrink.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

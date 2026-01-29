import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";
import { TrainerWithWorkload } from "@/hooks/useTrainerAssignments";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface TrainerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  trainers: TrainerWithWorkload[];
  currentTrainerId?: string;
  onAssign: (trainerId: string, memberId: string, notes?: string) => Promise<void>;
  isAssigning?: boolean;
}

export function TrainerAssignmentDialog({
  open,
  onOpenChange,
  member,
  trainers,
  currentTrainerId,
  onAssign,
  isAssigning,
}: TrainerAssignmentDialogProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !selectedTrainerId) return;

    await onAssign(selectedTrainerId, member.id, notes || undefined);
    setSelectedTrainerId("");
    setNotes("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTrainerId("");
      setNotes("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign to Trainer</DialogTitle>
            <DialogDescription>
              Assign {member?.full_name || member?.email} to a trainer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Member Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  {member?.full_name || "No name"}
                </p>
                <p className="text-xs text-muted-foreground">{member?.email}</p>
              </div>
            </div>

            {/* Trainer Selection */}
            <div className="space-y-2">
              <Label htmlFor="trainer">Select Trainer *</Label>
              <Select
                value={selectedTrainerId}
                onValueChange={setSelectedTrainerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem
                      key={trainer.user_id}
                      value={trainer.user_id}
                      disabled={trainer.user_id === currentTrainerId}
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>
                          {trainer.full_name || trainer.email}
                          {trainer.user_id === currentTrainerId && " (current)"}
                        </span>
                        <Badge variant="secondary" className="ml-auto gap-1">
                          <Users className="h-3 w-3" />
                          {trainer.assignment_count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Number shows current client count for each trainer
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Assignment Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this assignment..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedTrainerId || isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

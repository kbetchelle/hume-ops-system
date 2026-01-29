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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell, Apple, Layers } from "lucide-react";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    member_id?: string | null;
    is_template?: boolean;
    plan_type?: "workout" | "nutrition" | "combined";
  }) => Promise<void>;
  members: Member[];
  isSubmitting?: boolean;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  onSubmit,
  members,
  isSubmitting,
}: CreatePlanDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState<string>("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [planType, setPlanType] = useState<"workout" | "nutrition" | "combined">("workout");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      title,
      description: description || undefined,
      member_id: isTemplate ? null : (memberId || null),
      is_template: isTemplate,
      plan_type: planType,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setMemberId("");
    setIsTemplate(false);
    setPlanType("workout");
    onOpenChange(false);
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="h-4 w-4" />;
      case "nutrition":
        return <Apple className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Training Plan</DialogTitle>
            <DialogDescription>
              Create a new workout or nutrition plan for your clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 12-Week Strength Building Program"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of this training plan..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Plan Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["workout", "nutrition", "combined"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPlanType(type)}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-md transition-colors ${
                      planType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    {getPlanTypeIcon(type)}
                    <span className="text-xs capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-template"
                checked={isTemplate}
                onCheckedChange={(checked) => setIsTemplate(checked === true)}
              />
              <Label htmlFor="is-template" className="text-sm font-normal">
                Save as template (not assigned to a specific member)
              </Label>
            </div>

            {!isTemplate && members.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="member">Assign to Member</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No member assigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

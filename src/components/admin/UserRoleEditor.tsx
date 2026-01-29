import { useState } from "react";
import { AppRole, ROLES } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface UserRoleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | null;
  userEmail: string;
  currentRoles: AppRole[];
  onSave: (roles: AppRole[]) => Promise<void>;
  isSaving: boolean;
}

export function UserRoleEditor({
  open,
  onOpenChange,
  userName,
  userEmail,
  currentRoles,
  onSave,
  isSaving,
}: UserRoleEditorProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(currentRoles);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    await onSave(selectedRoles);
  };

  // Reset selected roles when dialog opens with new user
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedRoles(currentRoles);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-none border-foreground bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            Edit Roles
          </DialogTitle>
          <DialogDescription className="text-xs tracking-wide">
            {userName || userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {ROLES.map((role) => (
            <div
              key={role.value}
              onClick={() => toggleRole(role.value)}
              className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:border-foreground transition-colors"
            >
              <Checkbox
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => toggleRole(role.value)}
              />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest">
                  {role.icon} {role.label}
                </p>
                <p className="text-[10px] text-muted-foreground tracking-wide mt-1">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selectedRoles.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving
              </>
            ) : (
              "Save Roles"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

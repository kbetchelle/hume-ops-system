import { useState } from "react";
import { AppRole, ROLES } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  currentUsername: string;
  currentRoles: AppRole[];
  onSave: (roles: AppRole[], username: string | null) => Promise<void>;
  isSaving: boolean;
}

export function UserRoleEditor({
  open,
  onOpenChange,
  userName,
  userEmail,
  currentUsername,
  currentRoles,
  onSave,
  isSaving,
}: UserRoleEditorProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(currentRoles);
  const [username, setUsername] = useState(currentUsername);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    const normalizedUsername = username?.trim() || null;
    await onSave(selectedRoles, normalizedUsername);
  };

  // Reset state when dialog opens with new user
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedRoles(currentRoles);
      setUsername(currentUsername);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-none border-foreground bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            Edit user
          </DialogTitle>
          <DialogDescription className="text-xs tracking-wide">
            {userName || userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest">Username (for login)</Label>
            <Input
              className="rounded-none border-foreground text-xs"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jane.doe"
            />
            <p className="text-[10px] text-muted-foreground tracking-wide">
              Letters, numbers, underscores only. Leave empty to clear.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest">Roles</Label>
            <div className="space-y-2">
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
                  {role.label}
                </p>
                <p className="text-[10px] text-muted-foreground tracking-wide mt-1">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
            </div>
          </div>
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
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

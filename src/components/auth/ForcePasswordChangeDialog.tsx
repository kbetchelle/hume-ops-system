import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForcePasswordChangeDialogProps {
  userId: string;
}

export function ForcePasswordChangeDialog({ userId }: ForcePasswordChangeDialogProps) {
  const { updatePassword } = useAuthContext();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (newPassword.length < 6) return "Password must be at least 6 characters";
    if (newPassword !== confirmPassword) return "Passwords don't match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const { error: pwError } = await updatePassword(newPassword);
      if (pwError) {
        setError(pwError.message);
        return;
      }

      // Clear the must_change_password flag
      const { error: flagError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", userId);

      if (flagError) {
        console.error("Failed to clear must_change_password flag:", flagError);
      }

      // Close the dialog immediately
      setOpen(false);

      // Invalidate the profile query so ProtectedRoute re-evaluates
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      toast.success("Password updated successfully");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-foreground bg-background p-6 shadow-lg duration-200 rounded-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-sm uppercase tracking-[0.15em] font-normal flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Create New Password
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-xs tracking-wide text-muted-foreground">
              Your password has been reset by an administrator. Please create a new password to continue.
            </DialogPrimitive.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="force-new-password" className="text-[10px] uppercase tracking-widest">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="force-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="rounded-none text-xs pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="force-confirm-password" className="text-[10px] uppercase tracking-widest">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="force-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="rounded-none text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[10px] text-destructive tracking-wide">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-none text-[10px] uppercase tracking-widest"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Updating Password
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

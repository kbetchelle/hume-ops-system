import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  useCreateResourceFlag,
  type ResourceType,
} from "@/hooks/useResourceFlags";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResourceFlagContextMenuProps {
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel: string;
  hasPendingFlag?: boolean;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResourceFlagContextMenu({
  resourceType,
  resourceId,
  resourceLabel,
  hasPendingFlag = false,
  children,
}: ResourceFlagContextMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  const createFlag = useCreateResourceFlag();

  const handleSubmit = async () => {
    try {
      await createFlag.mutateAsync({
        resourceType,
        resourceId,
        resourceLabel,
        note: note.trim(),
      });
      setNote("");
      setDialogOpen(false);
    } catch {
      // Error toast is handled by the mutation's onError
    }
  };

  const handleCancel = () => {
    setNote("");
    setDialogOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {hasPendingFlag ? (
            <ContextMenuItem disabled className="text-muted-foreground">
              <Check className="h-4 w-4 mr-2" />
              Already Under Review
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onSelect={() => setDialogOpen(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mark as Outdated
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Flag as Potentially Outdated
            </DialogTitle>
            <DialogDescription className="text-xs">
              Report that &lsquo;{resourceLabel}&rsquo; may contain outdated
              information. A note to management is required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label
                htmlFor="flag-note"
                className="text-xs uppercase tracking-wider"
              >
                What appears outdated?
              </Label>
              <Textarea
                id="flag-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What information appears outdated?"
                rows={4}
                className="rounded-none"
              />
              {note.trim().length > 0 && note.trim().length < 10 && (
                <p className="text-[10px] text-muted-foreground">
                  Please provide at least 10 characters.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={note.trim().length < 10 || createFlag.isPending}
              className="rounded-none"
            >
              {createFlag.isPending ? "Submitting…" : "Submit Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

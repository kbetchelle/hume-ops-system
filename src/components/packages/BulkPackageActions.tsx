import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBulkMarkPickedUp } from "@/hooks/usePackageMutations";

interface BulkPackageActionsProps {
  selectedCount: number;
  selectedPackageIds: string[];
  onClearSelection: () => void;
  onBulkMove: () => void;
}

export function BulkPackageActions({
  selectedCount,
  selectedPackageIds,
  onClearSelection,
  onBulkMove,
}: BulkPackageActionsProps) {
  const [showMarkPickedUpDialog, setShowMarkPickedUpDialog] = useState(false);
  const bulkMarkPickedUp = useBulkMarkPickedUp();

  const handleBulkMarkPickedUp = async () => {
    try {
      await bulkMarkPickedUp.mutateAsync({ packageIds: selectedPackageIds });
      setShowMarkPickedUpDialog(false);
      onClearSelection();
    } catch (error) {
      console.error("Error marking packages as picked up:", error);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background border shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {selectedCount} selected
          </Badge>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onBulkMove}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Move Selected
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowMarkPickedUpDialog(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Picked Up
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showMarkPickedUpDialog} onOpenChange={setShowMarkPickedUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {selectedCount} Package(s) as Picked Up?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status of {selectedCount} package(s) to "Picked Up" and record the pickup timestamp. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkMarkPickedUp}
              disabled={bulkMarkPickedUp.isPending}
            >
              {bulkMarkPickedUp.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

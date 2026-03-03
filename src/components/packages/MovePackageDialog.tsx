import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin } from "lucide-react";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { useMovePackage, useBulkMovePackages } from "@/hooks/usePackageMutations";
import { format } from "date-fns";

interface MovePackageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageIds: string[];
  currentLocation?: string;
}

export function MovePackageDialog({
  isOpen,
  onClose,
  packageIds,
  currentLocation,
}: MovePackageDialogProps) {
  const [newLocation, setNewLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const movePackage = useMovePackage();
  const bulkMovePackages = useBulkMovePackages();

  const isBulkMove = packageIds.length > 1;

  const handlePhotoSave = (url: string) => {
    setPhotoUrl(url);
    setShowPhotoUpload(false);
  };

  const handleSubmit = async () => {
    if (!newLocation.trim() || !photoUrl) {
      return;
    }

    try {
      if (isBulkMove) {
        await bulkMovePackages.mutateAsync({
          packageIds,
          newLocation: newLocation.trim(),
          photoUrl,
          notes: notes.trim() || undefined,
        });
      } else {
        await movePackage.mutateAsync({
          packageId: packageIds[0],
          newLocation: newLocation.trim(),
          photoUrl,
          notes: notes.trim() || undefined,
        });
      }
      handleClose();
    } catch (error) {
      console.error("Error moving package(s):", error);
    }
  };

  const handleClose = () => {
    setNewLocation("");
    setPhotoUrl("");
    setNotes("");
    setShowPhotoUpload(false);
    onClose();
  };

  const isPending = movePackage.isPending || bulkMovePackages.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Move Package{isBulkMove ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              {isBulkMove
                ? `Move ${packageIds.length} packages to a new location`
                : "Update the package location with a new photo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentLocation && !isBulkMove && (
              <div className="text-sm text-muted-foreground">
                <strong>Current Location:</strong> {currentLocation}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-location">New Location *</Label>
              <Input
                id="new-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g., Storage Room B, Shelf 3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Location Photo *</Label>
              {!photoUrl ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A photo of the new location is required
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setShowPhotoUpload(true)} className="w-full">
                    Take Photo
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <img src={photoUrl} alt="New location" loading="lazy" decoding="async" className="w-full rounded-lg" />
                  <Button
                    variant="outline"
                    onClick={() => setShowPhotoUpload(true)}
                    className="w-full"
                  >
                    Retake Photo
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="move-notes">Notes (Optional)</Label>
              <Textarea
                id="move-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this location change"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!newLocation.trim() || !photoUrl || isPending}
            >
              {isPending ? "Moving..." : isBulkMove ? "Move All" : "Move Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhotoUpload
        isOpen={showPhotoUpload}
        onSave={handlePhotoSave}
        onCancel={() => setShowPhotoUpload(false)}
        storageBucket="package-photos"
        storagePath={`packages/${format(new Date(), "yyyy/MM/dd")}`}
        title="Photo of New Location"
      />
    </>
  );
}

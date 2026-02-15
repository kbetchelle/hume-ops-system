import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  User,
  Package as PackageIcon,
  Edit,
  Check,
  History,
  Image as ImageIcon,
} from "lucide-react";
import { usePackage, usePackageLocationHistory } from "@/hooks/usePackages";
import { useUpdatePackage } from "@/hooks/usePackageMutations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string | null;
  onMove: () => void;
  onMarkPickedUp: () => void;
}

export function PackageDetailsDialog({
  isOpen,
  onClose,
  packageId,
  onMove,
  onMarkPickedUp,
}: PackageDetailsDialogProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [showFullImage, setShowFullImage] = useState<string | null>(null);

  const { data: packageData, isLoading } = usePackage(packageId || undefined);
  const { data: locationHistory = [] } = usePackageLocationHistory(packageId || undefined);
  const updatePackage = useUpdatePackage();

  const handleSaveNotes = async () => {
    if (!packageId) return;

    await updatePackage.mutateAsync({
      id: packageId,
      notes: notes.trim() || null,
    });
    setIsEditingNotes(false);
  };

  const handleEditNotes = () => {
    setNotes(packageData?.notes || "");
    setIsEditingNotes(true);
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_pickup":
        return <Badge variant="default">Pending Pickup</Badge>;
      case "picked_up":
        return <Badge variant="secondary">Picked Up</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              Package Details
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : packageData ? (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-mono text-lg font-semibold">
                      {packageData.tracking_code}
                    </div>
                    <div>{getStatusBadge(packageData.status)}</div>
                  </div>
                  {packageData.status === "pending_pickup" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={onMove}>
                        <MapPin className="mr-2 h-4 w-4" />
                        Move
                      </Button>
                      <Button size="sm" onClick={onMarkPickedUp}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark Picked Up
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recipient Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Recipient
                  </h3>
                  <div className="ml-6 space-y-1">
                    {packageData.recipient_profile ? (
                      <>
                        <div className="font-medium">
                          {packageData.recipient_profile.full_name || "No name"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {packageData.recipient_profile.email}
                        </div>
                      </>
                    ) : (
                      <div className="font-medium">
                        {packageData.recipient_name || "Unknown"}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Current Location */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Location
                  </h3>
                  <div className="ml-6 space-y-2">
                    <div className="font-medium">{packageData.current_location}</div>
                    {packageData.location_photo_url && (
                      <img
                        src={packageData.location_photo_url}
                        alt="Package location"
                        className="rounded-lg max-w-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowFullImage(packageData.location_photo_url)}
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Timestamps */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="ml-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrived:</span>
                      <span className="font-medium">
                        {format(new Date(packageData.arrived_at), "PPP 'at' p")}
                      </span>
                    </div>
                    {packageData.picked_up_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Picked Up:</span>
                        <span className="font-medium">
                          {format(new Date(packageData.picked_up_at), "PPP 'at' p")}
                        </span>
                      </div>
                    )}
                    {packageData.scanned_by_profile && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scanned By:</span>
                        <span className="font-medium">
                          {packageData.scanned_by_profile.full_name || packageData.scanned_by_profile.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notes</h3>
                    {!isEditingNotes && (
                      <Button variant="ghost" size="sm" onClick={handleEditNotes}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes} disabled={updatePackage.isPending}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-0 text-sm text-muted-foreground">
                      {packageData.notes || "No notes"}
                    </div>
                  )}
                </div>

                {/* Location History */}
                {locationHistory.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Location History
                      </h3>
                      <div className="ml-6 space-y-4">
                        {locationHistory.map((history, index) => (
                          <div key={history.id} className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                              <div className="flex-1 space-y-1">
                                <div className="font-medium">{history.location}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(history.created_at), "PPP 'at' p")}
                                  {history.moved_by_profile && (
                                    <> by {history.moved_by_profile.full_name || history.moved_by_profile.email}</>
                                  )}
                                </div>
                                {history.notes && (
                                  <div className="text-sm text-muted-foreground italic">
                                    {history.notes}
                                  </div>
                                )}
                                {history.location_photo_url && (
                                  <img
                                    src={history.location_photo_url}
                                    alt={`Location: ${history.location}`}
                                    className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity mt-2"
                                    onClick={() => setShowFullImage(history.location_photo_url)}
                                  />
                                )}
                              </div>
                            </div>
                            {index < locationHistory.length - 1 && (
                              <div className="ml-1 h-4 w-px bg-border" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Package not found
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image Dialog */}
      <Dialog open={!!showFullImage} onOpenChange={() => setShowFullImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Location Photo
            </DialogTitle>
          </DialogHeader>
          {showFullImage && (
            <img
              src={showFullImage}
              alt="Full size location"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

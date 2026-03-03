import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package as PackageIcon, Calendar, Check, Image as ImageIcon } from "lucide-react";
import { usePackages } from "@/hooks/usePackages";
import { useUpdatePackage } from "@/hooks/usePackageMutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";

export function MyPackagesView() {
  const [activeTab, setActiveTab] = useState<"pending" | "picked_up">("pending");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [packageToMarkPickedUp, setPackageToMarkPickedUp] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const updatePackage = useUpdatePackage();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const { data: pendingPackages = [], isLoading: loadingPending } = usePackages({
    status: "pending_pickup",
    recipientUserId: userId || undefined,
  });

  const { data: pickedUpPackages = [], isLoading: loadingPickedUp } = usePackages({
    status: "picked_up",
    recipientUserId: userId || undefined,
  });

  const handleMarkPickedUp = async () => {
    if (!packageToMarkPickedUp) return;

    await updatePackage.mutateAsync({
      id: packageToMarkPickedUp,
      status: "picked_up",
    });
    setPackageToMarkPickedUp(null);
  };

  const renderPackageCard = (pkg: any) => (
    <Card key={pkg.id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold">
                  {pkg.tracking_code}
                </span>
              </div>
              {pkg.status === "pending_pickup" && (
                <Badge variant="default">Awaiting Pickup</Badge>
              )}
              {pkg.status === "picked_up" && (
                <Badge variant="secondary">Picked Up</Badge>
              )}
            </div>
            {pkg.status === "pending_pickup" && (
              <Button
                size="sm"
                onClick={() => setPackageToMarkPickedUp(pkg.id)}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark Picked Up
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-muted-foreground">
                {pkg.current_location}
              </div>
            </div>
          </div>

          {/* Photo */}
          {pkg.location_photo_url && (
            <div>
              <div className="text-sm font-medium mb-2">Package Location Photo</div>
              <img
                src={pkg.location_photo_url}
                alt="Package location"
                loading="lazy"
                decoding="async"
                className="rounded-lg w-full max-w-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImageUrl(pkg.location_photo_url)}
              />
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Arrived {format(new Date(pkg.arrived_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {pkg.picked_up_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>
                Picked up {format(new Date(pkg.picked_up_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}

          {/* Notes */}
          {pkg.notes && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="text-sm text-muted-foreground">{pkg.notes}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (status: string) => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center text-muted-foreground">
          <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Packages</p>
          <p className="text-sm">
            {status === "pending"
              ? "You don't have any packages waiting for pickup"
              : "No picked up packages to display"}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Packages</h1>
        <p className="text-muted-foreground">
          View and manage your incoming packages
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            Awaiting Pickup
            {pendingPackages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingPackages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="picked_up">Picked Up</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loadingPending ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : pendingPackages.length === 0 ? (
            renderEmptyState("pending")
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPackages.map(renderPackageCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="picked_up" className="mt-6">
          {loadingPickedUp ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : pickedUpPackages.length === 0 ? (
            renderEmptyState("picked_up")
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pickedUpPackages.map(renderPackageCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Package Location
            </DialogTitle>
          </DialogHeader>
          {selectedImageUrl && (
            <img
              src={selectedImageUrl}
              alt="Package location full view"
              loading="lazy"
              decoding="async"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Picked Up Confirmation */}
      <AlertDialog
        open={!!packageToMarkPickedUp}
        onOpenChange={() => setPackageToMarkPickedUp(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Package as Picked Up?</AlertDialogTitle>
            <AlertDialogDescription>
              This will confirm that you have picked up this package. The package will be
              moved to your "Picked Up" list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkPickedUp}
              disabled={updatePackage.isPending}
            >
              {updatePackage.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

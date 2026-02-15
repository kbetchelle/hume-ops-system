import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSendNotification } from "./useNotifications";

interface CreatePackageInput {
  tracking_code: string;
  recipient_user_id: string | null;
  recipient_name: string | null;
  current_location: string;
  location_photo_url: string;
  notes?: string;
}

interface UpdatePackageInput {
  id: string;
  notes?: string;
  current_location?: string;
  location_photo_url?: string;
  status?: "pending_pickup" | "picked_up" | "archived";
}

interface MovePackageInput {
  packageId: string;
  newLocation: string;
  photoUrl: string;
  notes?: string;
}

interface BulkMovePackagesInput {
  packageIds: string[];
  newLocation: string;
  photoUrl: string;
  notes?: string;
}

interface BulkMarkPickedUpInput {
  packageIds: string[];
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { mutateAsync: sendNotification } = useSendNotification();

  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("packages")
        .insert({
          tracking_code: input.tracking_code,
          recipient_user_id: input.recipient_user_id,
          recipient_name: input.recipient_name,
          current_location: input.current_location,
          location_photo_url: input.location_photo_url,
          notes: input.notes,
          scanned_by_user_id: userData.user?.id,
          status: "pending_pickup",
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification if recipient is a user
      if (input.recipient_user_id) {
        try {
          await sendNotification({
            userId: input.recipient_user_id,
            type: "package_arrived",
            title: "Package Arrived",
            body: `A package with tracking code ${input.tracking_code} has arrived for you at ${input.current_location}`,
            data: { packageId: data.id },
          });
        } catch (notifError) {
          console.error("Failed to send notification:", notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-stats"] });
      toast.success("Package added successfully");
    },
    onError: (error) => {
      console.error("Error creating package:", error);
      toast.error("Failed to add package");
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePackageInput) => {
      const updateData: Record<string, any> = {};
      
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.current_location) updateData.current_location = input.current_location;
      if (input.location_photo_url) updateData.location_photo_url = input.location_photo_url;
      if (input.status) {
        updateData.status = input.status;
        if (input.status === "picked_up") {
          updateData.picked_up_at = new Date().toISOString();
          const { data: userData } = await supabase.auth.getUser();
          updateData.marked_opened_by_user_id = userData.user?.id;
        } else if (input.status === "archived") {
          updateData.archived_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from("packages")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", data.id] });
      queryClient.invalidateQueries({ queryKey: ["package-stats"] });
      toast.success("Package updated successfully");
    },
    onError: (error) => {
      console.error("Error updating package:", error);
      toast.error("Failed to update package");
    },
  });
}

export function useMovePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MovePackageInput) => {
      const { data: userData } = await supabase.auth.getUser();

      // Update package location
      const { data: packageData, error: packageError } = await supabase
        .from("packages")
        .update({
          current_location: input.newLocation,
          location_photo_url: input.photoUrl,
        })
        .eq("id", input.packageId)
        .select()
        .single();

      if (packageError) throw packageError;

      // Add to location history
      const { error: historyError } = await supabase
        .from("package_location_history")
        .insert({
          package_id: input.packageId,
          location: input.newLocation,
          location_photo_url: input.photoUrl,
          moved_by_user_id: userData.user?.id,
          notes: input.notes,
        });

      if (historyError) throw historyError;

      return packageData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", data.id] });
      queryClient.invalidateQueries({ queryKey: ["package-location-history"] });
      toast.success("Package location updated");
    },
    onError: (error) => {
      console.error("Error moving package:", error);
      toast.error("Failed to update package location");
    },
  });
}

export function useBulkMovePackages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkMovePackagesInput) => {
      const { data: userData } = await supabase.auth.getUser();

      // Update all packages
      const { error: updateError } = await supabase
        .from("packages")
        .update({
          current_location: input.newLocation,
          location_photo_url: input.photoUrl,
        })
        .in("id", input.packageIds);

      if (updateError) throw updateError;

      // Add history entries for all packages
      const historyEntries = input.packageIds.map((id) => ({
        package_id: id,
        location: input.newLocation,
        location_photo_url: input.photoUrl,
        moved_by_user_id: userData.user?.id,
        notes: input.notes,
      }));

      const { error: historyError } = await supabase
        .from("package_location_history")
        .insert(historyEntries);

      if (historyError) throw historyError;

      return input.packageIds;
    },
    onSuccess: (packageIds) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-location-history"] });
      packageIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ["package", id] });
      });
      toast.success(`${packageIds.length} package(s) moved successfully`);
    },
    onError: (error) => {
      console.error("Error moving packages:", error);
      toast.error("Failed to move packages");
    },
  });
}

export function useBulkMarkPickedUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkMarkPickedUpInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("packages")
        .update({
          status: "picked_up",
          picked_up_at: now,
          marked_opened_by_user_id: userData.user?.id,
        })
        .in("id", input.packageIds);

      if (error) throw error;

      return input.packageIds;
    },
    onSuccess: (packageIds) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-stats"] });
      packageIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ["package", id] });
      });
      toast.success(`${packageIds.length} package(s) marked as picked up`);
    },
    onError: (error) => {
      console.error("Error marking packages as picked up:", error);
      toast.error("Failed to mark packages as picked up");
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", packageId);

      if (error) throw error;
      return packageId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-stats"] });
      toast.success("Package deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    },
  });
}

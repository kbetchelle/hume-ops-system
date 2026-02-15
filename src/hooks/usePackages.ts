import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Package {
  id: string;
  tracking_code: string;
  recipient_user_id: string | null;
  recipient_name: string | null;
  status: "pending_pickup" | "picked_up" | "archived";
  arrived_at: string;
  picked_up_at: string | null;
  archived_at: string | null;
  current_location: string;
  location_photo_url: string;
  notes: string | null;
  scanned_by_user_id: string | null;
  marked_opened_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageWithRecipient extends Package {
  recipient_profile?: {
    full_name: string | null;
    email: string;
  } | null;
  scanned_by_profile?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface PackageLocationHistory {
  id: string;
  package_id: string;
  location: string;
  location_photo_url: string;
  moved_by_user_id: string | null;
  notes: string | null;
  created_at: string;
  moved_by_profile?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface UsePackagesOptions {
  status?: "pending_pickup" | "picked_up" | "archived";
  searchQuery?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  recipientUserId?: string; // For "My Packages" view
}

export function usePackages(options: UsePackagesOptions = {}) {
  return useQuery({
    queryKey: ["packages", options],
    queryFn: async () => {
      let query = supabase
        .from("packages")
        .select(`
          *,
          recipient_profile:profiles!recipient_user_id(full_name, email),
          scanned_by_profile:profiles!scanned_by_user_id(full_name, email)
        `)
        .order("arrived_at", { ascending: false });

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.searchQuery) {
        query = query.or(
          `tracking_code.ilike.%${options.searchQuery}%,recipient_name.ilike.%${options.searchQuery}%`
        );
      }

      if (options.location) {
        query = query.ilike("current_location", `%${options.location}%`);
      }

      if (options.dateFrom) {
        query = query.gte("arrived_at", options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte("arrived_at", options.dateTo);
      }

      if (options.recipientUserId) {
        query = query.eq("recipient_user_id", options.recipientUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PackageWithRecipient[];
    },
  });
}

export function usePackage(packageId: string | undefined) {
  return useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      if (!packageId) return null;

      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          recipient_profile:profiles!recipient_user_id(full_name, email),
          scanned_by_profile:profiles!scanned_by_user_id(full_name, email),
          marked_by_profile:profiles!marked_opened_by_user_id(full_name, email)
        `)
        .eq("id", packageId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!packageId,
  });
}

export function usePackageLocationHistory(packageId: string | undefined) {
  return useQuery({
    queryKey: ["package-location-history", packageId],
    queryFn: async () => {
      if (!packageId) return [];

      const { data, error } = await supabase
        .from("package_location_history")
        .select(`
          *,
          moved_by_profile:profiles!moved_by_user_id(full_name, email)
        `)
        .eq("package_id", packageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PackageLocationHistory[];
    },
    enabled: !!packageId,
  });
}

export function useCheckDuplicatePackage(trackingCode: string | undefined) {
  return useQuery({
    queryKey: ["duplicate-package", trackingCode],
    queryFn: async () => {
      if (!trackingCode) return null;

      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("tracking_code", trackingCode)
        .in("status", ["pending_pickup", "picked_up"])
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!trackingCode,
  });
}

export function usePackageStats() {
  return useQuery({
    queryKey: ["package-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("status");

      if (error) throw error;

      const stats = {
        pending: data.filter((p) => p.status === "pending_pickup").length,
        pickedUp: data.filter((p) => p.status === "picked_up").length,
        archived: data.filter((p) => p.status === "archived").length,
      };

      return stats;
    },
  });
}

// Search users for recipient selection
export function useSearchUsers(searchQuery: string) {
  return useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name")
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });
}

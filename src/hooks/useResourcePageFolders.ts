import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ResourcePageFolder {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  parent_folder_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderInput {
  name: string;
  description?: string | null;
  display_order?: number;
  parent_folder_id?: string | null;
}

export interface UpdateFolderInput {
  id: string;
  name?: string;
  description?: string | null;
  display_order?: number;
  parent_folder_id?: string | null;
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const RESOURCE_PAGE_FOLDERS_KEY = "resource-page-folders";

// ===========================================================================
// Queries
// ===========================================================================

/**
 * Fetch all resource page folders ordered by display_order.
 */
export function useResourcePageFolders() {
  return useQuery({
    queryKey: [RESOURCE_PAGE_FOLDERS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_page_folders")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResourcePageFolder[];
    },
  });
}

/**
 * Fetch a single folder by ID.
 */
export function useResourcePageFolder(folderId: string | undefined) {
  return useQuery({
    queryKey: [RESOURCE_PAGE_FOLDERS_KEY, folderId],
    queryFn: async () => {
      if (!folderId) return null;

      const { data, error } = await supabase
        .from("resource_page_folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (error) throw error;
      return data as ResourcePageFolder;
    },
    enabled: !!folderId,
  });
}

// ===========================================================================
// Mutations
// ===========================================================================

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      const { data, error } = await supabase
        .from("resource_page_folders")
        .insert({
          name: input.name,
          description: input.description ?? null,
          display_order: input.display_order ?? 0,
          parent_folder_id: input.parent_folder_id ?? null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePageFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGE_FOLDERS_KEY] });
      toast.success("Folder created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create folder: " + error.message);
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFolderInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("resource_page_folders")
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePageFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGE_FOLDERS_KEY] });
      toast.success("Folder updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update folder: " + error.message);
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resource_page_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGE_FOLDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["resource-pages"] }); // Invalidate pages too
      toast.success("Folder deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete folder: " + error.message);
    },
  });
}

/**
 * Batch update display_order for multiple folders.
 */
export function useReorderFolders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folders: { id: string; display_order: number }[]) => {
      // Update each folder's display_order
      const updates = folders.map((folder) =>
        supabase
          .from("resource_page_folders")
          .update({ display_order: folder.display_order })
          .eq("id", folder.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error("Failed to reorder some folders");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGE_FOLDERS_KEY] });
      toast.success("Folders reordered successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to reorder folders: " + error.message);
    },
  });
}

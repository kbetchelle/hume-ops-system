import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import { AppRole } from "@/types/roles";
import { extractSearchText } from "@/lib/extractSearchText";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ResourcePage {
  id: string;
  title: string;
  content: string | null; // Deprecated - kept for backward compatibility
  content_json: JSONContent | null;
  assigned_roles: AppRole[];
  is_published: boolean;
  folder_id: string | null;
  tags: string[];
  search_text: string | null;
  cover_image_url: string | null;
  display_order: number;
  last_edited_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // PDF-specific fields
  page_type: 'builder' | 'pdf';
  pdf_file_url: string | null;
  pdf_file_path: string | null;
  pdf_file_size: number | null;
  pdf_original_filename: string | null;
  pdf_page_count: number | null;
}

export interface CreateResourcePageInput {
  title: string;
  content_json?: JSONContent | null;
  assigned_roles: AppRole[];
  is_published?: boolean;
  folder_id?: string | null;
  tags?: string[];
  cover_image_url?: string | null;
  display_order?: number;
  // PDF-specific fields
  page_type?: 'builder' | 'pdf';
  pdf_file_url?: string | null;
  pdf_file_path?: string | null;
  pdf_file_size?: number | null;
  pdf_original_filename?: string | null;
  pdf_page_count?: number | null;
  search_text?: string | null; // Allow manual override for PDFs
}

export interface UpdateResourcePageInput {
  id: string;
  title?: string;
  content_json?: JSONContent | null;
  assigned_roles?: AppRole[];
  is_published?: boolean;
  folder_id?: string | null;
  tags?: string[];
  cover_image_url?: string | null;
  display_order?: number;
  // PDF-specific fields
  pdf_file_url?: string | null;
  pdf_file_path?: string | null;
  pdf_file_size?: number | null;
  pdf_original_filename?: string | null;
  pdf_page_count?: number | null;
  search_text?: string | null; // Allow manual override for PDFs
}

export interface ResourcePagesFilters {
  folderId?: string | null;
  tags?: string[];
  searchTerm?: string;
  publishedOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const RESOURCE_PAGES_KEY = "resource-pages";

// ===========================================================================
// Queries
// ===========================================================================

/**
 * Fetch all resource pages with optional filtering.
 */
export function useResourcePages(filters?: ResourcePagesFilters) {
  return useQuery({
    queryKey: [RESOURCE_PAGES_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from("resource_pages")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (filters?.publishedOnly) {
        query = query.eq("is_published", true);
      }

      if (filters?.folderId !== undefined) {
        if (filters.folderId === null) {
          query = query.is("folder_id", null);
        } else {
          query = query.eq("folder_id", filters.folderId);
        }
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data ?? []) as ResourcePage[];

      // Client-side search filtering if searchTerm provided
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(
          (page) =>
            page.title.toLowerCase().includes(term) ||
            (page.search_text && page.search_text.toLowerCase().includes(term))
        );
      }

      return results;
    },
  });
}

/**
 * Fetch a single resource page by ID.
 */
export function useResourcePage(pageId: string | undefined) {
  return useQuery({
    queryKey: [RESOURCE_PAGES_KEY, pageId],
    queryFn: async () => {
      if (!pageId) return null;

      const { data, error } = await supabase
        .from("resource_pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (error) throw error;
      return data as ResourcePage;
    },
    enabled: !!pageId,
  });
}

/**
 * Fetch published resource pages filtered by role.
 * Admin/manager see all published pages; other roles see only pages
 * whose assigned_roles contains their role.
 */
export function useResourcePagesByRole(role: AppRole) {
  return useQuery({
    queryKey: [RESOURCE_PAGES_KEY, "by-role", role],
    queryFn: async () => {
      const isPrivileged = role === "admin" || role === "manager";

      let query = supabase
        .from("resource_pages")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!isPrivileged) {
        query = query.contains("assigned_roles", [role]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ResourcePage[];
    },
  });
}

// ===========================================================================
// Mutations
// ===========================================================================

export function useCreateResourcePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateResourcePageInput) => {
      // Extract search text based on page type
      let searchText = input.search_text ?? "";
      if (!searchText && input.page_type !== 'pdf' && input.content_json) {
        searchText = extractSearchText(input.content_json);
      }

      const { data, error } = await supabase
        .from("resource_pages")
        .insert({
          title: input.title,
          page_type: input.page_type ?? 'builder',
          content_json: input.content_json ?? null,
          search_text: searchText,
          assigned_roles: input.assigned_roles,
          is_published: input.is_published ?? false,
          folder_id: input.folder_id ?? null,
          tags: input.tags ?? [],
          cover_image_url: input.cover_image_url ?? null,
          display_order: input.display_order ?? 0,
          created_by: user!.id,
          last_edited_by: user!.id,
          // PDF fields
          pdf_file_url: input.pdf_file_url ?? null,
          pdf_file_path: input.pdf_file_path ?? null,
          pdf_file_size: input.pdf_file_size ?? null,
          pdf_original_filename: input.pdf_original_filename ?? null,
          pdf_page_count: input.pdf_page_count ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create resource page: " + error.message);
    },
  });
}

export function useUpdateResourcePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: UpdateResourcePageInput) => {
      const { id, ...rest } = input;

      const updateData: any = {
        ...rest,
        last_edited_by: user!.id,
      };

      // Extract search text if content_json is being updated (for builder pages)
      if (input.content_json !== undefined && !input.search_text) {
        updateData.search_text = extractSearchText(input.content_json);
      }

      const { data, error } = await supabase
        .from("resource_pages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update resource page: " + error.message);
    },
  });
}

export function useDeleteResourcePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resource_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete resource page: " + error.message);
    },
  });
}

export function useDuplicateResourcePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (pageId: string) => {
      // Fetch the original page
      const { data: original, error: fetchError } = await supabase
        .from("resource_pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (fetchError) throw fetchError;

      const originalPage = original as ResourcePage;

      // Create duplicate with modified title
      const { data, error } = await supabase
        .from("resource_pages")
        .insert({
          title: `${originalPage.title} (Copy)`,
          page_type: originalPage.page_type,
          content_json: originalPage.content_json,
          search_text: originalPage.search_text,
          assigned_roles: originalPage.assigned_roles,
          is_published: false, // Always start as draft
          folder_id: originalPage.folder_id,
          tags: originalPage.tags,
          cover_image_url: originalPage.cover_image_url,
          display_order: 0,
          created_by: user!.id,
          last_edited_by: user!.id,
          // PDF fields (copy if it's a PDF page)
          pdf_file_url: originalPage.pdf_file_url,
          pdf_file_path: originalPage.pdf_file_path,
          pdf_file_size: originalPage.pdf_file_size,
          pdf_original_filename: originalPage.pdf_original_filename,
          pdf_page_count: originalPage.pdf_page_count,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page duplicated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to duplicate resource page: " + error.message);
    },
  });
}

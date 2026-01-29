import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import type { AppRole } from "@/types/roles";

export interface Document {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  target_roles: AppRole[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((d) => ({
        ...d,
        target_roles: d.target_roles as AppRole[],
      })) as Document[];
    },
    enabled: !!user,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      file: File;
      target_roles: AppRole[];
    }) => {
      // Upload file to storage
      const filePath = `${user!.id}/${Date.now()}-${data.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error } = await supabase.from("documents").insert({
        title: data.title,
        description: data.description || null,
        file_path: filePath,
        file_name: data.file.name,
        file_size: data.file.size,
        mime_type: data.file.type,
        target_roles: data.target_roles,
        created_by: user!.id,
      });

      if (error) {
        // Cleanup uploaded file if record creation fails
        await supabase.storage.from("documents").remove([filePath]);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      description?: string;
      target_roles: AppRole[];
    }) => {
      const { error } = await supabase
        .from("documents")
        .update({
          title: data.title,
          description: data.description || null,
          target_roles: data.target_roles,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document updated");
    },
    onError: (error) => {
      toast.error("Failed to update document: " + error.message);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Document) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete document record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });
}

export function useDocumentDownloadUrl(filePath: string) {
  return useQuery({
    queryKey: ["document-url", filePath],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

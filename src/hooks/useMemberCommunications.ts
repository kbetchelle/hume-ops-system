import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MemberCommunication {
  id: string;
  member_id: string;
  user_id: string;
  communication_type: "email" | "note" | "call" | "message";
  subject: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useMemberCommunications(memberId: string) {
  return useQuery({
    queryKey: ["memberCommunications", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_communications")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MemberCommunication[];
    },
    enabled: !!memberId,
  });
}

export function useMemberTimeline(memberId: string) {
  return useQuery({
    queryKey: ["memberTimeline", memberId],
    queryFn: async () => {
      // Fetch both communications and notes
      const [commsResult, notesResult] = await Promise.all([
        supabase
          .from("member_communications")
          .select("*")
          .eq("member_id", memberId)
          .order("created_at", { ascending: false }),
        supabase
          .from("member_notes")
          .select("*")
          .eq("member_id", memberId)
          .order("created_at", { ascending: false }),
      ]);

      if (commsResult.error) throw commsResult.error;
      if (notesResult.error) throw notesResult.error;

      // Combine and sort by date
      const communications = (commsResult.data || []).map((c) => ({
        ...c,
        type: c.communication_type as string,
        source: "communication" as const,
      }));

      const notes = (notesResult.data || []).map((n) => ({
        ...n,
        type: "note" as const,
        source: "note" as const,
        subject: null,
        communication_type: "note" as const,
      }));

      const combined = [...communications, ...notes].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return combined;
    },
    enabled: !!memberId,
  });
}

export function useAddCommunication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      userId,
      communicationType,
      subject,
      content,
      metadata = {} as Record<string, string | number | boolean | null>,
    }: {
      memberId: string;
      userId: string;
      communicationType: "email" | "note" | "call" | "message";
      subject?: string;
      content: string;
      metadata?: Record<string, string | number | boolean | null>;
    }) => {
      const { data, error } = await supabase
        .from("member_communications")
        .insert([{
          member_id: memberId,
          user_id: userId,
          communication_type: communicationType,
          subject,
          content,
          metadata,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({
        queryKey: ["memberCommunications", memberId],
      });
      queryClient.invalidateQueries({ queryKey: ["memberTimeline", memberId] });
      toast({
        title: "Communication logged",
        description: "The communication has been saved.",
      });
    },
    onError: (error) => {
      console.error("Failed to log communication:", error);
      toast({
        title: "Error",
        description: "Failed to log communication. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

export function useAddEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      title,
      subject,
      body,
      category,
      userId,
    }: {
      title: string;
      subject: string;
      body: string;
      category?: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          title,
          subject,
          body,
          category,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Template created",
        description: "Email template has been saved.",
      });
    },
    onError: (error) => {
      console.error("Failed to create template:", error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      subject,
      body,
      category,
    }: {
      id: string;
      title: string;
      subject: string;
      body: string;
      category?: string;
    }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update({ title, subject, body, category })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Template updated",
        description: "Email template has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update template:", error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Template deleted",
        description: "Email template has been removed.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });
}

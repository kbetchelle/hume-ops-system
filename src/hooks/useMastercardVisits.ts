import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { selectFrom, insertInto, updateTable, eq } from "@/lib/dataApi";
import { useToast } from "@/hooks/use-toast";

export interface MastercardVisit {
  id: string;
  visit_date: string;
  start_time: string;
  end_time: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  mastercard_tier: string | null;
  number_of_guests: number;
  assigned_concierge: string | null;
  service_preferences: string | null;
  special_requests: string | null;
  visit_purpose: string | null;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MastercardVisitStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface MastercardVisitsFilters {
  search?: string;
  status?: "all" | MastercardVisitStatus;
}

function filterBySearch(visits: MastercardVisit[], search: string): MastercardVisit[] {
  if (!search.trim()) return visits;
  const lower = search.trim().toLowerCase();
  return visits.filter(
    (v) =>
      (v.client_name?.toLowerCase().includes(lower)) ||
      (v.client_email?.toLowerCase().includes(lower))
  );
}

export function useMastercardVisits(filters?: MastercardVisitsFilters) {
  return useQuery({
    queryKey: ["mastercard-visits", filters],
    queryFn: async () => {
      const statusFilter =
        filters?.status && filters.status !== "all" ? filters.status : undefined;
      const filtersList = statusFilter ? [eq("status", statusFilter)] : [];
      const { data, error } = await selectFrom<MastercardVisit>("mastercard_visits", {
        filters: filtersList,
        order: [
          { column: "status", ascending: true },
          { column: "visit_date", ascending: false },
          { column: "start_time", ascending: false },
        ],
      });
      if (error) throw error;
      const list = data ?? [];
      return filterBySearch(list, filters?.search ?? "");
    },
  });
}

export function useCreateMastercardVisit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: Omit<MastercardVisit, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await insertInto<MastercardVisit>("mastercard_visits", payload);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastercard-visits"] });
      toast({
        title: "Visit created",
        description: "Mastercard visit has been scheduled.",
      });
    },
    onError: (error) => {
      console.error("Failed to create Mastercard visit:", error);
      toast({
        title: "Error",
        description: "Failed to create visit. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMastercardVisit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<MastercardVisit, "id" | "created_at">>;
    }) => {
      const { data, error } = await updateTable<MastercardVisit>(
        "mastercard_visits",
        { ...payload, updated_at: new Date().toISOString() },
        [eq("id", id)]
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastercard-visits"] });
      toast({
        title: "Visit updated",
        description: "Mastercard visit has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update Mastercard visit:", error);
      toast({
        title: "Error",
        description: "Failed to update visit. Please try again.",
        variant: "destructive",
      });
    },
  });
}

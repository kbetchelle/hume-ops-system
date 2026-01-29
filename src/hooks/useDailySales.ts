import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

export interface DailySales {
  id: string;
  business_date: string;
  total_sales: number;
  total_transactions: number;
  payment_breakdown: Record<string, number>;
  top_items: Array<{ name: string; quantity: number; revenue: number }>;
  synced_at: string;
}

function parseDailySales(data: {
  id: string;
  business_date: string;
  total_sales: number | null;
  total_transactions: number | null;
  payment_breakdown: Json | null;
  top_items: Json | null;
  synced_at: string;
}): DailySales {
  return {
    id: data.id,
    business_date: data.business_date,
    total_sales: data.total_sales ?? 0,
    total_transactions: data.total_transactions ?? 0,
    payment_breakdown: (data.payment_breakdown as Record<string, number>) ?? {},
    top_items: (data.top_items as Array<{ name: string; quantity: number; revenue: number }>) ?? [],
    synced_at: data.synced_at,
  };
}

export function useTodaySales() {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["daily-sales", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_sales")
        .select("*")
        .eq("business_date", today)
        .maybeSingle();

      if (error) throw error;
      return data ? parseDailySales(data) : null;
    },
  });
}

export function useSalesHistory(days: number = 7) {
  const today = new Date();
  const startDate = format(subDays(today, days - 1), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["sales-history", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_sales")
        .select("*")
        .gte("business_date", startDate)
        .lte("business_date", endDate)
        .order("business_date", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(parseDailySales);
    },
  });
}

export function useSyncToastSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date?: string) => {
      const { data, error } = await supabase.functions.invoke("sync-toast-sales", {
        body: date ? { date } : undefined,
      });
      
      if (error) throw error;
      if (!data.success && data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-history"] });
    },
  });
}

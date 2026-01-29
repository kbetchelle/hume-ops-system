import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export interface Expense {
  id: string;
  asset_id: string | null;
  category: string;
  location: string;
  amount: number;
  description: string;
  expense_date: string;
  receipt_url: string | null;
  created_by: string;
  created_at: string;
}

export interface ExpenseInput {
  asset_id?: string | null;
  category: string;
  location: string;
  amount: number;
  description: string;
  expense_date: string;
  receipt_url?: string | null;
}

export const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Repairs",
  "Utilities",
  "Cleaning",
  "Supplies",
  "Equipment Purchase",
  "Furniture Purchase",
  "Insurance",
  "Licensing",
  "Other"
];

export function useExpenses(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultStart = startOfMonth(subMonths(new Date(), 11));
  const defaultEnd = endOfMonth(new Date());
  const start = dateRange?.start || defaultStart;
  const end = dateRange?.end || defaultEnd;

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ["expenses", format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", format(start, "yyyy-MM-dd"))
        .lte("expense_date", format(end, "yyyy-MM-dd"))
        .order("expense_date", { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user
  });

  const createExpense = useMutation({
    mutationFn: async (input: ExpenseInput) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...input,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense logged successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to log expense", description: error.message, variant: "destructive" });
    }
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete expense", description: error.message, variant: "destructive" });
    }
  });

  // Aggregate expenses by category
  const getExpensesByCategory = () => {
    if (!expenses) return [];
    
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Aggregate expenses by location
  const getExpensesByLocation = () => {
    if (!expenses) return [];
    
    const locationTotals = expenses.reduce((acc, exp) => {
      acc[exp.location] = (acc[exp.location] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationTotals)
      .map(([location, amount]) => ({ location, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Aggregate expenses by month
  const getExpensesByMonth = () => {
    if (!expenses) return [];
    
    const monthlyTotals = expenses.reduce((acc, exp) => {
      const month = format(new Date(exp.expense_date), "MMM yyyy");
      acc[month] = (acc[month] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .reverse();
  };

  const getTotalExpenses = () => {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!expenses || expenses.length === 0) return;

    const headers = ["Date", "Category", "Location", "Description", "Amount"];
    const rows = expenses.map(exp => [
      exp.expense_date,
      exp.category,
      exp.location,
      exp.description,
      exp.amount.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${format(start, "yyyy-MM-dd")}_to_${format(end, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByLocation,
    getExpensesByMonth,
    getTotalExpenses,
    exportToCSV
  };
}

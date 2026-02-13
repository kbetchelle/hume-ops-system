import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoliciesTab } from "@/components/staff-resources/PoliciesTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sort_order: number;
  last_updated_by: string | null;
  updated_at: string;
}

export default function ResourcesPoliciesPage() {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["club-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_policies")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Policy[];
    },
  });

  return (
    <DashboardLayout title="Policies">
      <div className="p-4 md:p-8">
        <PoliciesTab policies={policies} isLoading={isLoading} searchTerm="" />
      </div>
    </DashboardLayout>
  );
}

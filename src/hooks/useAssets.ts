import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  depreciation_rate: number;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssetInput {
  name: string;
  category: string;
  location: string;
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  depreciation_rate: number;
  status: string;
  notes?: string;
}

export const ASSET_CATEGORIES = [
  "Cardio Equipment",
  "Strength Equipment",
  "Free Weights",
  "Furniture",
  "Electronics",
  "HVAC",
  "Plumbing",
  "Lighting",
  "Other"
];

export const LOCATIONS = [
  "Main Gym Floor",
  "Cardio Zone",
  "Weight Room",
  "Studio A",
  "Studio B",
  "Locker Room - Male",
  "Locker Room - Female",
  "Spa Area",
  "Reception",
  "Office",
  "Storage",
  "Outdoor Area"
];

export const ASSET_STATUSES = ["active", "maintenance", "retired", "disposed"];

export function useAssets() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!user
  });

  const createAsset = useMutation({
    mutationFn: async (input: AssetInput) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("assets")
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
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Asset created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create asset", description: error.message, variant: "destructive" });
    }
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...input }: AssetInput & { id: string }) => {
      const { data, error } = await supabase
        .from("assets")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Asset updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update asset", description: error.message, variant: "destructive" });
    }
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete asset", description: error.message, variant: "destructive" });
    }
  });

  // Calculate depreciated value based on straight-line depreciation
  const calculateCurrentValue = (asset: Asset): number => {
    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();
    const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const depreciation = asset.purchase_price * (asset.depreciation_rate / 100) * yearsOwned;
    const currentValue = Math.max(0, asset.purchase_price - depreciation);
    return Math.round(currentValue * 100) / 100;
  };

  // Get depreciation summary
  const getDepreciationSummary = () => {
    if (!assets) return { totalPurchaseValue: 0, totalCurrentValue: 0, totalDepreciation: 0 };
    
    const totalPurchaseValue = assets.reduce((sum, a) => sum + Number(a.purchase_price), 0);
    const totalCurrentValue = assets.reduce((sum, a) => sum + calculateCurrentValue(a), 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;
    
    return { totalPurchaseValue, totalCurrentValue, totalDepreciation };
  };

  return {
    assets,
    isLoading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    calculateCurrentValue,
    getDepreciationSummary
  };
}

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { selectFrom, insertInto, deleteFrom, eq } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Checklist {
  id: string;
  title: string;
  description: string | null;
  role: string;
  is_active: boolean;
}

interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface ChecklistCompletion {
  id: string;
  checklist_item_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
}

export function EmbeddedChecklist() {
  const { currentShift } = useCurrentShift();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch concierge checklists - filter by shift in title if available
  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ["checklists", "concierge", currentShift],
    queryFn: async () => {
      const { data, error } = await selectFrom<Checklist>("checklists", {
        filters: [
          { type: "eq", column: "role", value: "concierge" },
          { type: "eq", column: "is_active", value: true },
        ],
        order: { column: "title", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
  });

  // Find the shift-specific checklist or first available
  const activeChecklist = useMemo(() => {
    if (!checklists || checklists.length === 0) return null;
    
    // Try to find a checklist matching current shift (e.g., "AM Checklist" or "PM Checklist")
    const shiftSpecific = checklists.find(
      (c) => c.title.toUpperCase().includes(currentShift)
    );
    
    return shiftSpecific || checklists[0];
  }, [checklists, currentShift]);

  // Fetch items for the active checklist
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist-items", activeChecklist?.id],
    queryFn: async () => {
      if (!activeChecklist) return [];
      const { data, error } = await selectFrom<ChecklistItem>("checklist_items", {
        filters: [{ type: "eq", column: "checklist_id", value: activeChecklist.id }],
        order: { column: "sort_order", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeChecklist,
  });

  // Fetch today's completions for current user
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["checklist-completions", today, userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      const { data, error } = await selectFrom<ChecklistCompletion>(
        "checklist_completions",
        {
          filters: [
            { type: "eq", column: "user_id", value: userData.id },
            { type: "eq", column: "completion_date", value: today },
          ],
        }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.id,
  });

  // Set of completed item IDs for quick lookup
  const completedItemIds = useMemo(() => {
    return new Set(completions?.map((c) => c.checklist_item_id) || []);
  }, [completions]);

  // Toggle completion mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      if (!userData?.id) throw new Error("Not authenticated");

      if (isCompleted) {
        // Remove completion
        await deleteFrom("checklist_completions", [
          eq("checklist_item_id", itemId),
          eq("user_id", userData.id),
          eq("completion_date", today),
        ]);
      } else {
        // Add completion
        await insertInto("checklist_completions", {
          checklist_item_id: itemId,
          user_id: userData.id,
          completion_date: today,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-completions"] });
    },
  });

  const isLoading = checklistsLoading || itemsLoading || completionsLoading;
  
  const completedCount = completedItemIds.size;
  const totalCount = items?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (itemId: string) => {
    const isCompleted = completedItemIds.has(itemId);
    toggleMutation.mutate({ itemId, isCompleted });
  };

  return (
    <Card className="rounded-none border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-normal tracking-wide">
            <CheckSquare className="h-4 w-4" />
            {currentShift} Shift Checklist
          </CardTitle>
          <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-widest">
            {completedCount}/{totalCount} complete
          </Badge>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-1.5 rounded-none mt-3" 
        />
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-5 w-5 rounded-none" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : !activeChecklist ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No checklist template for {currentShift} shift
          </p>
        ) : !items || items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No checklist items configured
          </p>
        ) : (
          items.map((item) => {
            const isChecked = completedItemIds.has(item.id);
            const isPending = toggleMutation.isPending && 
              toggleMutation.variables?.itemId === item.id;

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 p-3 h-auto rounded-none text-left transition-colors duration-200",
                  isChecked 
                    ? "bg-primary/5 hover:bg-primary/10" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleToggle(item.id)}
                disabled={isPending}
              >
                {isChecked ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Square className="h-5 w-5 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isChecked && "line-through text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              </Button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

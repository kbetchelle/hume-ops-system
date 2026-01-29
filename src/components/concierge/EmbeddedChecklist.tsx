import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { selectFrom, insertInto, updateTable, eq } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ChecklistTemplate {
  id: string;
  name: string;
  role: string;
  shift_type: string;
  is_active: boolean;
}

interface ChecklistItem {
  id: string;
  template_id: string;
  item_text: string;
  sort_order: number;
  is_required: boolean;
}

interface ChecklistCompletion {
  id: string;
  item_id: string;
  template_id: string;
  completion_date: string;
  completed_by_id: string;
  completed_at: string;
  deleted_at: string | null;
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

  // Fetch the template for current shift and role
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["checklist-templates", "concierge", currentShift],
    queryFn: async () => {
      const { data, error } = await selectFrom<ChecklistTemplate>("checklist_templates", {
        filters: [
          { type: "eq", column: "role", value: "concierge" },
          { type: "eq", column: "shift_type", value: currentShift },
          { type: "eq", column: "is_active", value: true },
        ],
        limit: 1,
      });
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });

  // Fetch items for the template
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist-template-items", template?.id],
    queryFn: async () => {
      if (!template) return [];
      const { data, error } = await selectFrom<ChecklistItem>("checklist_template_items", {
        filters: [{ type: "eq", column: "template_id", value: template.id }],
        order: { column: "sort_order", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!template,
  });

  // Fetch today's completions (excluding soft-deleted)
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["checklist-template-completions", template?.id, today],
    queryFn: async () => {
      if (!template) return [];
      const { data, error } = await selectFrom<ChecklistCompletion>(
        "checklist_template_completions",
        {
          filters: [
            { type: "eq", column: "template_id", value: template.id },
            { type: "eq", column: "completion_date", value: today },
            { type: "is", column: "deleted_at", value: null },
          ],
        }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!template,
  });

  // Set of completed item IDs for quick lookup
  const completedItemIds = useMemo(() => {
    return new Set(completions?.map((c) => c.item_id) || []);
  }, [completions]);

  // Toggle completion mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      if (!userData?.id || !template) throw new Error("Not authenticated or no template");

      if (isCompleted) {
        // Soft delete: set deleted_at
        await updateTable(
          "checklist_template_completions",
          { deleted_at: new Date().toISOString() },
          [
            eq("item_id", itemId),
            eq("completion_date", today),
          ]
        );
      } else {
        // Insert new completion
        await insertInto("checklist_template_completions", {
          item_id: itemId,
          template_id: template.id,
          completion_date: today,
          completed_by_id: userData.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-template-completions"] });
    },
  });

  const isLoading = templateLoading || itemsLoading || completionsLoading;
  
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
        ) : !template ? (
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
                    "text-sm flex-1",
                    isChecked && "line-through text-muted-foreground"
                  )}
                >
                  {item.item_text}
                </span>
                {item.is_required && !isChecked && (
                  <span className="text-[10px] uppercase tracking-wider text-destructive">
                    Required
                  </span>
                )}
              </Button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

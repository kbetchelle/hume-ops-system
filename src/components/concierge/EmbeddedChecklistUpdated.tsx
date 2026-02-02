import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckSquare, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { selectFrom, insertInto, updateTable, eq } from "@/lib/dataApi";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MobileChecklistItem, ChecklistItemData } from "@/components/checklists/MobileChecklistItem";

interface ChecklistTemplate {
  id: string;
  name: string;
  role: string;
  shift_type: string;
  is_active: boolean;
}

interface ChecklistCompletion {
  id: string;
  item_id: string;
  template_id: string;
  completion_date: string;
  completed_by_id: string;
  completed_by: string;
  completed_at: string;
  deleted_at: string | null;
  completion_value?: string | null;
}

interface TimeGroup {
  timeHint: string;
  items: ChecklistItemData[];
  completedCount: number;
  totalCount: number;
}

export function EmbeddedChecklist() {
  const { currentShift } = useCurrentShift();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();

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

  // Fetch items for the template with new fields
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist-template-items", template?.id],
    queryFn: async () => {
      if (!template) return [];
      const { data, error } = await selectFrom<ChecklistItemData>("checklist_template_items", {
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

  // Map of item_id to completion data
  const completionMap = useMemo(() => {
    const map = new Map<string, ChecklistCompletion>();
    completions?.forEach((c) => map.set(c.item_id, c));
    return map;
  }, [completions]);

  // Group items by time_hint
  const timeGroups = useMemo<TimeGroup[]>(() => {
    if (!items) return [];

    const groups = new Map<string, ChecklistItemData[]>();

    items.forEach((item) => {
      const timeHint = item.time_hint || "No Time Specified";
      if (!groups.has(timeHint)) {
        groups.set(timeHint, []);
      }
      groups.get(timeHint)!.push(item);
    });

    return Array.from(groups.entries()).map(([timeHint, groupItems]) => {
      const completedCount = groupItems.filter((item) =>
        completionMap.has(item.id)
      ).length;

      return {
        timeHint,
        items: groupItems,
        completedCount,
        totalCount: groupItems.length,
      };
    });
  }, [items, completionMap]);

  // Determine which time group to expand by default (current time range)
  const defaultExpandedGroup = useMemo(() => {
    return timeGroups.find((group) => {
      const match = group.timeHint.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1]);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        
        return currentHour >= hour && currentHour < hour + 1;
      }
      return false;
    })?.timeHint;
  }, [timeGroups, currentHour]);

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(defaultExpandedGroup ? [defaultExpandedGroup] : [])
  );

  // Toggle completion mutation
  const toggleMutation = useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
      value,
    }: {
      itemId: string;
      isCompleted: boolean;
      value?: string;
    }) => {
      if (!userData?.id || !template) throw new Error("Not authenticated or no template");

      if (isCompleted) {
        // Soft delete: set deleted_at
        await updateTable(
          "checklist_template_completions",
          { deleted_at: new Date().toISOString() },
          [eq("item_id", itemId), eq("completion_date", today)]
        );
      } else {
        // Insert or update completion
        await insertInto("checklist_template_completions", {
          item_id: itemId,
          template_id: template.id,
          completion_date: today,
          completed_by_id: userData.id,
          completed_by: userData.email || userData.id,
          completion_value: value || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-template-completions"] });
    },
  });

  const isLoading = templateLoading || itemsLoading || completionsLoading;

  const completedCount = completionMap.size;
  const totalCount = items?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (itemId: string) => {
    const isCompleted = completionMap.has(itemId);
    toggleMutation.mutate({ itemId, isCompleted });
  };

  const handleUpdate = (itemId: string, value: string) => {
    toggleMutation.mutate({ itemId, isCompleted: false, value });
  };

  const toggleGroup = (timeHint: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(timeHint)) {
        next.delete(timeHint);
      } else {
        next.add(timeHint);
      }
      return next;
    });
  };

  return (
    <Card className="w-full border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckSquare className="h-5 w-5" />
            {currentShift} Shift Checklist
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount} complete
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-3" />
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : !template ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No checklist template for {currentShift} shift
          </p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No checklist items configured
          </p>
        ) : (
          <div className="space-y-0">
            {timeGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.timeHint);
              const progressPct =
                group.totalCount > 0
                  ? (group.completedCount / group.totalCount) * 100
                  : 0;

              return (
                <Collapsible
                  key={group.timeHint}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.timeHint)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{group.timeHint}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {group.completedCount}/{group.totalCount}
                        </Badge>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t">
                      {group.items.map((item) => {
                        const completion = completionMap.get(item.id);
                        const isCompleted = !!completion;

                        return (
                          <MobileChecklistItem
                            key={item.id}
                            item={item}
                            isCompleted={isCompleted}
                            completionValue={completion?.completion_value}
                            onToggle={() => handleToggle(item.id)}
                            onUpdate={(value) => handleUpdate(item.id, value)}
                            disabled={toggleMutation.isPending}
                          />
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

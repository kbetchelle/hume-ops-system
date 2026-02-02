import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, getDay } from "date-fns";
import { CheckSquare, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MobileChecklistItem, ChecklistItemData } from "@/components/checklists/MobileChecklistItem";

interface ChecklistRecord {
  id: string;
  title: string;
  role: string;
  shift_type: string | null;
  is_weekend: boolean | null;
  is_active: boolean;
}

interface ChecklistCompletion {
  id: string;
  checklist_item_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
}

interface TimeGroup {
  timeHint: string;
  items: ChecklistItemData[];
  completedCount: number;
  totalCount: number;
}

export function EmbeddedChecklist() {
  const { currentShift } = useCurrentShift();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();
  const [detectedShift, setDetectedShift] = useState<string>(currentShift);
  const [isWeekend, setIsWeekend] = useState(false);

  // Detect if today is weekend (0 = Sunday, 6 = Saturday)
  useEffect(() => {
    const dayOfWeek = getDay(new Date());
    setIsWeekend(dayOfWeek === 0 || dayOfWeek === 6);
  }, []);

  // Fetch user's shift from staff_shifts table
  useEffect(() => {
    async function fetchUserShift() {
      try {
        if (!user?.email) return;
        
        const slingResult = await supabase
          .from('sling_users')
          .select('sling_user_id')
          .eq('email', user.email)
          .maybeSingle();
        
        const slingUser = slingResult.data as { sling_user_id: number } | null;
        if (!slingUser) return;
        
        const shiftResult = await (supabase
          .from('staff_shifts')
          .select('shift_start, position') as any)
          .eq('sling_user_id', slingUser.sling_user_id)
          .eq('schedule_date', today)
          .maybeSingle();
        
        const shift = shiftResult.data as { shift_start: string; position: string } | null;
        
        if (shift?.shift_start) {
          const startHour = new Date(shift.shift_start).getHours();
          let shiftType = 'AM';
          if (startHour >= 12) {
            shiftType = 'PM';
          }
          setDetectedShift(shiftType);
        }
      } catch (error) {
        console.error('[EmbeddedChecklist] Failed to fetch user shift:', error);
      }
    }
    
    fetchUserShift();
  }, [user?.email, today]);

  // Get current user for completions
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch the checklist for current shift and role using unified checklists table
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["checklists", "concierge", detectedShift, isWeekend],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('id, title, role, shift_type, is_weekend, is_active')
        .eq('role', 'concierge')
        .eq('shift_type', detectedShift)
        .eq('is_weekend', isWeekend)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ChecklistRecord | null;
    },
    enabled: !!detectedShift,
  });

  // Fetch items for the checklist
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist-items", checklist?.id],
    queryFn: async () => {
      if (!checklist) return [];
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('template_id', checklist.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ChecklistItemData[];
    },
    enabled: !!checklist,
  });

  // Fetch today's completions
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["checklist-completions", checklist?.id, today, userData?.id],
    queryFn: async () => {
      if (!checklist || !userData?.id) return [];
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('completion_date', today);
      
      if (error) throw error;
      return (data || []) as ChecklistCompletion[];
    },
    enabled: !!checklist && !!userData?.id,
  });

  // Map of checklist_item_id to completion data
  const completionMap = useMemo(() => {
    const map = new Map<string, ChecklistCompletion>();
    completions?.forEach((c) => map.set(c.checklist_item_id, c));
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

  // Update expanded groups when default changes
  useEffect(() => {
    if (defaultExpandedGroup && !expandedGroups.has(defaultExpandedGroup)) {
      setExpandedGroups(new Set([defaultExpandedGroup]));
    }
  }, [defaultExpandedGroup]);

  // Toggle completion mutation
  const toggleMutation = useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
    }: {
      itemId: string;
      isCompleted: boolean;
    }) => {
      if (!userData?.id) throw new Error("Not authenticated");

      if (isCompleted) {
        // Remove completion
        await supabase
          .from('checklist_completions')
          .delete()
          .eq('checklist_item_id', itemId)
          .eq('user_id', userData.id)
          .eq('completion_date', today);
      } else {
        // Add completion
        await supabase
          .from('checklist_completions')
          .insert({
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

  const isLoading = checklistLoading || itemsLoading || completionsLoading;

  const completedCount = completionMap.size;
  const totalCount = items?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (itemId: string) => {
    const isCompleted = completionMap.has(itemId);
    toggleMutation.mutate({ itemId, isCompleted });
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
            {detectedShift} Shift Checklist {isWeekend && "(Weekend)"}
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
        ) : !checklist ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No checklist for {detectedShift} shift {isWeekend ? "(Weekend)" : "(Weekday)"}
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
                      className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50 border-b"
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
                    <div>
                      {group.items.map((item) => {
                        const completion = completionMap.get(item.id);
                        const isCompleted = !!completion;

                        return (
                          <MobileChecklistItem
                            key={item.id}
                            item={item}
                            isCompleted={isCompleted}
                            onToggle={() => handleToggle(item.id)}
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

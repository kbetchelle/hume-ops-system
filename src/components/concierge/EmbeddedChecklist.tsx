import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckSquare, ChevronDown, ChevronRight, Clock, Wifi, WifiOff, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { useAutoSubmitConcierge } from "@/hooks/useAutoSubmitConcierge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MobileChecklistItem, ChecklistItemData } from "@/components/checklists/MobileChecklistItem";

import {
  saveCompletionOffline,
  getPendingCompletions,
  markCompletionSynced,
  getOfflineStats,
  type OfflineCompletion,
} from "@/lib/offlineDb";

interface ConciergeChecklist {
  id: string;
  title: string;
  shift_time: string;
  is_active: boolean;
  is_weekend: boolean;
}

interface ConciergeChecklistItem {
  id: string;
  checklist_id: string;
  task_description: string;
  task_type: string;
  sort_order: number;
  time_hint: string | null;
  category: string | null;
  is_high_priority: boolean;
  required: boolean;
}

interface ShiftSubmission {
  id: string;
  submitted_at: string;
  submitted_by: string;
  submitted_by_id: string;
  completed_tasks: number;
  total_tasks: number;
  department: string;
  department_table: string;
  shift_time: string;
  completion_date: string;
  position: string | null;
}

interface ConciergeCompletion {
  id: string;
  item_id: string;
  checklist_id: string;
  completion_date: string;
  completed_by_id: string;
  completed_by: string;
  completed_at: string;
  deleted_at: string | null;
  note_text?: string | null;
}

interface TimeGroup {
  timeHint: string;
  items: ChecklistItemData[];
  completedCount: number;
  totalCount: number;
}

// Determine the current concierge checklist type based on time of day
function getCurrentChecklistType(isWeekend: boolean): { title: string; shiftTime: "AM" | "PM" } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (isWeekend) {
    // Weekend schedule:
    // Opening: 6am-7am (360-420)
    // AM: 7am-1pm (420-780)
    // PM: 1pm-6pm (780-1080)
    // Closing: 6pm-7pm (1080-1140)
    if (totalMinutes >= 360 && totalMinutes < 420) {
      return { title: "Concierge - Weekend Opening Checklist", shiftTime: "AM" };
    } else if (totalMinutes >= 420 && totalMinutes < 780) {
      return { title: "Concierge - Weekend AM", shiftTime: "AM" };
    } else if (totalMinutes >= 780 && totalMinutes < 1080) {
      return { title: "Concierge - Weekend PM", shiftTime: "PM" };
    } else if (totalMinutes >= 1080 && totalMinutes < 1140) {
      return { title: "Concierge - Weekend Closing Checklist", shiftTime: "PM" };
    } else if (totalMinutes < 360) {
      // Before 6am - show opening checklist
      return { title: "Concierge - Weekend Opening Checklist", shiftTime: "AM" };
    } else {
      // After 7pm - show closing checklist
      return { title: "Concierge - Weekend Closing Checklist", shiftTime: "PM" };
    }
  } else {
    // Weekday schedule:
    // Opening: 5am-6am (300-360)
    // AM: 6am-1:30pm (360-810)
    // PM: 1:30pm-8pm (810-1200)
    // Closing: 8pm-9pm (1200-1260)
    if (totalMinutes >= 300 && totalMinutes < 360) {
      return { title: "Concierge - Weekday Opening Checklist", shiftTime: "AM" };
    } else if (totalMinutes >= 360 && totalMinutes < 810) {
      return { title: "Concierge - Weekday AM", shiftTime: "AM" };
    } else if (totalMinutes >= 810 && totalMinutes < 1200) {
      return { title: "Concierge - Weekday PM", shiftTime: "PM" };
    } else if (totalMinutes >= 1200 && totalMinutes < 1260) {
      return { title: "Concierge - Weekday Closing Checklist", shiftTime: "PM" };
    } else if (totalMinutes < 300) {
      // Before 5am - show opening checklist
      return { title: "Concierge - Weekday Opening Checklist", shiftTime: "AM" };
    } else {
      // After 9pm - show closing checklist
      return { title: "Concierge - Weekday Closing Checklist", shiftTime: "PM" };
    }
  }
}

export function EmbeddedChecklist() {
  const { currentShift } = useCurrentShift();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  
  // Get the specific checklist based on time of day
  const checklistType = getCurrentChecklistType(isWeekend);

  // Online/Offline state tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending count on mount and periodically
  useEffect(() => {
    const loadPendingCount = async () => {
      const stats = await getOfflineStats();
      setPendingCount(stats.pendingCompletions);
    };
    loadPendingCount();
    
    // Update every 5 seconds
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const syncPendingCompletions = useCallback(async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const pending = await getPendingCompletions();
      if (pending.length === 0) {
        setPendingCount(0);
        return;
      }
      for (const completion of pending) {
        try {
          const { error } = await supabase
            .from("concierge_completions")
            .insert({
              item_id: completion.item_id,
              checklist_id: completion.template_id,
              completion_date: completion.completion_date,
              shift_time: completion.shift_time,
              completed_by_id: completion.completed_by_id || null,
              completed_by: completion.completed_by || null,
              note_text: completion.note_text || null,
              completed_at: completion.completed_at || new Date().toISOString(),
            });
          if (!error) {
            await markCompletionSynced(completion.id);
          }
        } catch (err) {
          console.error("Failed to sync completion:", err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["concierge-completions"] });
      const stats = await getOfflineStats();
      setPendingCount(stats.pendingCompletions);
    } catch (error) {
      console.error("Failed to sync pending completions:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queryClient]);

  // Sync pending completions when coming online
  useEffect(() => {
    if (isOnline) {
      syncPendingCompletions();
    }
  }, [isOnline, syncPendingCompletions]);

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch the concierge checklist for current time-based checklist
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["concierge-checklists", checklistType.title],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concierge_checklists")
        .select("*")
        .eq("title", checklistType.title)
        .eq("is_active", true)
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as ConciergeChecklist | null;
    },
  });

  // Fetch items for the checklist
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["concierge-checklist-items", checklist?.id],
    queryFn: async () => {
      if (!checklist) return [];
      const { data, error } = await supabase
        .from("concierge_checklist_items")
        .select("*")
        .eq("checklist_id", checklist.id)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      
      // Map to ChecklistItemData format
      return (data || []).map((item: ConciergeChecklistItem): ChecklistItemData => ({
        id: item.id,
        task_description: item.task_description,
        sort_order: item.sort_order,
        required: item.required,
        task_type: item.task_type,
        time_hint: item.time_hint || undefined,
        category: item.category || undefined,
        is_high_priority: item.is_high_priority,
      }));
    },
    enabled: !!checklist,
  });

  // Fetch today's completions (excluding soft-deleted)
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["concierge-completions", checklist?.id, today],
    queryFn: async () => {
      if (!checklist) return [];
      const { data, error } = await supabase
        .from("concierge_completions")
        .select("*")
        .eq("checklist_id", checklist.id)
        .eq("completion_date", today)
        .is("deleted_at", null);
      
      if (error) throw error;
      return (data || []) as ConciergeCompletion[];
    },
    enabled: !!checklist,
  });

  // Check if shift has been submitted
  const { data: shiftSubmission, isLoading: submissionLoading } = useQuery({
    queryKey: ["shift-submission", "concierge", today, currentShift],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("checklist_shift_submissions" as any) as any)
        .select("*")
        .eq("department_table", "concierge")
        .eq("department", "Concierge")
        .eq("completion_date", today)
        .eq("shift_time", currentShift)
        .is("position", null)
        .maybeSingle();
      
      if (error) throw error;
      return data as ShiftSubmission | null;
    },
  });

  // Submit shift mutation
  const submitShiftMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id) throw new Error("Not authenticated");

      const { error } = await (supabase
        .from("checklist_shift_submissions" as any) as any)
        .insert({
          department_table: "concierge",
          department: "Concierge",
          position: null,
          completion_date: today,
          shift_time: currentShift,
          submitted_by: userData.email || userData.id,
          submitted_by_id: userData.id,
          total_tasks: totalCount,
          completed_tasks: completedCount,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-submission"] });
    },
  });

  // Auto-submit hook
  const { willAutoSubmit } = useAutoSubmitConcierge(
    today,
    currentShift,
    null, // formData not needed for checklists
    () => submitShiftMutation.mutate(),
    !!shiftSubmission // isSubmitted
  );

  // Map of item_id to completion data
  const completionMap = useMemo(() => {
    const map = new Map<string, ConciergeCompletion>();
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
      if (!userData?.id || !checklist) throw new Error("Not authenticated or no checklist");

      if (isCompleted) {
        // Soft delete: set deleted_at
        if (isOnline) {
          const { error } = await supabase
            .from("concierge_completions")
            .update({ deleted_at: new Date().toISOString() })
            .eq("item_id", itemId)
            .eq("completion_date", today);
          
          if (error) throw error;
        }
        // Note: offline deletion not implemented yet - requires more complex logic
      } else {
        // Insert new completion
        if (isOnline) {
          const { error } = await supabase
            .from("concierge_completions")
            .insert({
              item_id: itemId,
              checklist_id: checklist.id,
              completion_date: today,
              shift_time: currentShift,
              completed_by_id: userData.id,
              completed_by: userData.email || userData.id,
              note_text: value || null,
            });
          
          if (error) throw error;
        } else {
          // Store offline
          const offlineCompletion: OfflineCompletion = {
            id: crypto.randomUUID(),
            item_id: itemId,
            template_id: checklist.id,
            completion_date: today,
            shift_time: currentShift,
            completed_at: new Date().toISOString(),
            completed_by: userData.email || userData.id,
            completed_by_id: userData.id,
            note_text: value || null,
            pending_sync: true,
            created_offline_at: new Date().toISOString(),
          };
          
          await saveCompletionOffline(offlineCompletion);
          
          // Update pending count
          const stats = await getOfflineStats();
          setPendingCount(stats.pendingCompletions);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concierge-completions"] });
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
    <Card className="w-full border-2 border-border shadow-md bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold" style={{ fontSize: '15.75px' }}>
            <CheckSquare className="h-5 w-5" />
            {checklist?.title || checklistType.title}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[12px]">
              {completedCount}/{totalCount} complete
            </Badge>
            {!isOnline && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {isOnline && !isSyncing && pendingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={syncPendingCompletions}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <Cloud className="h-3 w-3" />
                Sync {pendingCount}
              </Button>
            )}
            {isSyncing && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Cloud className="h-3 w-3 animate-pulse" />
                Syncing...
              </Badge>
            )}
          </div>
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
            No checklist template found for "{checklistType.title}"
          </p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No checklist items configured for this shift
          </p>
        ) : (
          <>

            <div className="space-y-0">
            {timeGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(group.timeHint);
              const progressPct =
                group.totalCount > 0
                  ? (group.completedCount / group.totalCount) * 100
                  : 0;

              return (
                <Collapsible
                  key={group.timeHint}
                  style={{ marginTop: '12px' }}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.timeHint)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto rounded-none hover:bg-muted/50 bg-muted/50 border"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium" style={{ fontSize: '13.5px' }}>{group.timeHint}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {group.completedCount}/{group.totalCount}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t">
                      {group.items.map((item, idx) => {
                        const completion = completionMap.get(item.id);
                        const isCompleted = !!completion;

                        return (
                          <MobileChecklistItem
                            key={item.id}
                            item={item}
                            isCompleted={isCompleted}
                            completionValue={completion?.note_text}
                            onToggle={() => handleToggle(item.id)}
                            onUpdate={(value) => handleUpdate(item.id, value)}
                            disabled={toggleMutation.isPending}
                            checkboxIndex={item.task_type === 'checkbox' ? idx : undefined}
                          />
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
          </>
        )}

        {/* Shift Submission Section */}
        {checklist && items && items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            {shiftSubmission ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Shift Submitted</span>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(shiftSubmission.submitted_at), "MMM d, h:mm a")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Submitted by {shiftSubmission.submitted_by} •{" "}
                  {shiftSubmission.completed_tasks}/{shiftSubmission.total_tasks} tasks completed
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {willAutoSubmit && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Auto-submitting shift after end time...
                  </div>
                )}
                <Button
                  onClick={() => submitShiftMutation.mutate()}
                  disabled={submitShiftMutation.isPending || !isOnline}
                  className="w-full"
                >
                  {submitShiftMutation.isPending
                    ? "Submitting..."
                    : "Submit Shift"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

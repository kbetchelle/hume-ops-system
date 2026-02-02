import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, getDay } from "date-fns";
import { CheckSquare, ChevronDown, ChevronRight, Clock, WifiOff } from "lucide-react";
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
import { saveCompletionOffline, getPendingCompletions, markCompletionSynced } from "@/lib/offlineDb";
import { ChecklistComments } from "@/components/checklists/ChecklistComments";

interface Checklist {
  id: string;
  title: string;
  department: string | null;
  position: string | null;
  shift_time: string;
  is_active: boolean;
}

interface ChecklistCompletion {
  id: string;
  item_id: string;
  checklist_id: string;
  completion_date: string;
  shift_time: string;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_id: string | null;
  photo_url: string | null;
  note_text: string | null;
  signature_data: string | null;
  submitted_at: string | null;
  deleted_at: string | null;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
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

  // Fetch the checklist for current shift using new schema
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["checklists", "Concierge", detectedShift],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('id, title, department, position, shift_time, is_active')
        .eq('department', 'Concierge')
        .eq('shift_time', detectedShift)
        .is('position', null) // Concierge has no specific position
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Checklist | null;
    },
    enabled: !!detectedShift,
  });

  // Fetch items for the checklist
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist-items", checklist?.id],
    queryFn: async () => {
      if (!checklist) return [];
      const { data, error} = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklist.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ChecklistItemData[];
    },
    enabled: !!checklist,
  });

  // Fetch today's completions for this shift
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["checklist-completions", checklist?.id, today, detectedShift, userData?.id],
    queryFn: async () => {
      if (!checklist || !userData?.id) return [];
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('completion_date', today)
        .eq('shift_time', detectedShift)
        .is('deleted_at', null); // Only get non-deleted completions
      
      if (error) throw error;
      return (data || []) as ChecklistCompletion[];
    },
    enabled: !!checklist && !!userData?.id,
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

  // Update expanded groups when default changes
  useEffect(() => {
    if (defaultExpandedGroup && !expandedGroups.has(defaultExpandedGroup)) {
      setExpandedGroups(new Set([defaultExpandedGroup]));
    }
  }, [defaultExpandedGroup]);

  // Check if shift has been submitted
  const { data: shiftSubmission } = useQuery({
    queryKey: ["shift-submission", today, detectedShift],
    queryFn: async () => {
      const { data } = await supabase
        .from('checklist_shift_submissions')
        .select('*')
        .eq('completion_date', today)
        .eq('shift_time', detectedShift)
        .maybeSingle();
      return data;
    },
  });

  const hasBeenSubmitted = !!shiftSubmission;

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
      if (!userData?.id || !checklist) throw new Error("Not authenticated");

      const completionData = {
        item_id: itemId,
        checklist_id: checklist.id,
        completion_date: today,
        shift_time: detectedShift,
        completed_by_id: userData.id,
        completed_by: userData.email || userData.id,
        completed_at: isCompleted ? null : new Date().toISOString(),
        note_text: value || null,
      };

      // Try online first
      if (isOnline) {
        if (isCompleted) {
          // Soft delete completion
          await supabase
            .from('checklist_completions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('item_id', itemId)
            .eq('completion_date', today)
            .eq('shift_time', detectedShift);
        } else {
          // Add/update completion
          await supabase
            .from('checklist_completions')
            .upsert(completionData, {
              onConflict: 'item_id,completion_date,shift_time'
            });
        }
      } else {
        // Save to IndexedDB when offline
        await saveCompletionOffline({
          id: crypto.randomUUID(),
          ...completionData,
          completed_at: completionData.completed_at || new Date().toISOString(),
          pending_sync: true,
          created_offline_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-completions"] });
    },
  });

  // Sync pending completions when coming back online
  useEffect(() => {
    const syncOfflineCompletions = async () => {
      if (!isOnline || !userData?.id || !checklist) return;

      console.log('[EmbeddedChecklist] Syncing offline completions...');
      const pending = await getPendingCompletions();

      if (pending.length === 0) {
        console.log('[EmbeddedChecklist] No pending completions to sync');
        return;
      }

      console.log(`[EmbeddedChecklist] Syncing ${pending.length} completions`);

      for (const completion of pending) {
        try {
          // Upload photo if exists (convert base64 to blob)
          let photoUrl = completion.note_text;
          if (completion.photo_base64) {
            const response = await fetch(completion.photo_base64);
            const blob = await response.blob();
            
            // Upload photo using same logic as PhotoTask
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const fileName = `${completion.id}_photo.jpg`;
            const filePath = `checklist/${year}/${month}/${day}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('checklist-photos')
              .upload(filePath, blob, { upsert: true });

            if (!uploadError) {
              const { data } = supabase.storage
                .from('checklist-photos')
                .getPublicUrl(filePath);
              photoUrl = data.publicUrl;
            }
          }

          // Upsert to Supabase
          await supabase
            .from('checklist_completions')
            .upsert({
              item_id: completion.item_id,
              checklist_id: checklist.id,
              completion_date: completion.completion_date,
              shift_time: completion.shift_time,
              completed_by_id: completion.completed_by_id,
              completed_by: completion.completed_by,
              completed_at: completion.completed_at,
              note_text: photoUrl,
              signature_data: completion.signature_data,
            }, {
              onConflict: 'item_id,completion_date,shift_time'
            });

          await markCompletionSynced(completion.id);
          console.log('[EmbeddedChecklist] Synced completion:', completion.id);
        } catch (error) {
          console.error('[EmbeddedChecklist] Failed to sync completion:', error);
        }
      }

      // Refresh completions after sync
      queryClient.invalidateQueries({ queryKey: ["checklist-completions"] });
      console.log('[EmbeddedChecklist] Sync complete');
    };

    if (isOnline) {
      syncOfflineCompletions();
    }
  }, [isOnline, checklist, userData, queryClient]);

  // Submit shift mutation
  const submitShiftMutation = useMutation({
    mutationFn: async (notes?: string) => {
      if (!userData?.id || !checklist) throw new Error("Not authenticated");

      const totalTasks = items?.length || 0;
      const completedTasks = completionMap.size;

      // 1. Upsert shift submission record using new schema
      const { error: submissionError } = await supabase
        .from('checklist_shift_submissions')
        .upsert({
          completion_date: today,
          shift_time: detectedShift,
          department: checklist.department,
          position: checklist.position,
          submitted_by: userData.email || 'Unknown',
          submitted_by_id: userData.id,
          submitted_at: new Date().toISOString(),
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          notes: notes || null,
        }, {
          onConflict: 'completion_date,shift_time,department,position'
        });

      if (submissionError) throw submissionError;

      // 2. Mark all completions as submitted
      const { error: updateError } = await supabase
        .from('checklist_completions')
        .update({ submitted_at: new Date().toISOString() })
        .eq('completion_date', today)
        .eq('shift_time', detectedShift)
        .is('submitted_at', null);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-submission"] });
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
    <Card className="w-full border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckSquare className="h-5 w-5" />
            {detectedShift} Shift Checklist {isWeekend && "(Weekend)"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalCount} complete
            </Badge>
            {hasBeenSubmitted ? (
              <Badge variant="secondary" className="text-xs">
                ✓ Submitted
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => submitShiftMutation.mutate(undefined)}
                disabled={submitShiftMutation.isPending || !checklist || !isOnline}
                className="h-7 text-xs"
              >
                Submit Shift
              </Button>
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
            No checklist for {detectedShift} shift
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
                            completionValue={completion?.note_text || completion?.photo_url}
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

        {/* Shift-level comments */}
        {checklist && !isLoading && (
          <div className="mt-6 pt-6 border-t px-4 pb-4">
            <ChecklistComments
              checklistId={checklist.id}
              completionDate={today}
              shiftTime={detectedShift}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ConciergeChecklistItem } from './ConciergeChecklistItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, X, Sparkles, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { add_color } from '@/lib/constants';

interface ConciergeChecklistWithItems {
  id: string;
  title: string;
  description: string | null;
  shift_time: 'AM' | 'PM';
  is_weekend: boolean;
  is_active: boolean;
  concierge_checklist_items: any[];
}

// Determine which checklist to show based on current hour/minute for weekdays
function getWeekdayChecklistSlot(hour: number, minute: number): string {
  const timeInMinutes = hour * 60 + minute;
  if (timeInMinutes < 360) return 'opening';       // before 6:00am
  if (timeInMinutes < 810) return 'am';             // 6:00am - 1:29pm
  if (timeInMinutes < 1200) return 'pm';            // 1:30pm - 7:59pm
  return 'closing';                                  // 8:00pm onwards
}

function getWeekendChecklistSlot(hour: number, minute: number): string {
  const timeInMinutes = hour * 60 + minute;
  if (timeInMinutes < 420) return 'opening';        // before 7:00am
  if (timeInMinutes < 780) return 'am';             // 7:00am - 12:59pm
  if (timeInMinutes < 1080) return 'pm';            // 1:00pm - 5:59pm
  return 'closing';                                  // 6:00pm onwards
}

const WEEKDAY_SLOT_LABELS: Record<string, string> = {
  opening: 'Opening',
  am: 'AM',
  pm: 'PM',
  closing: 'Closing',
};

function matchChecklistToSlot(checklist: ConciergeChecklistWithItems, slot: string): boolean {
  const t = checklist.title.toLowerCase();
  switch (slot) {
    case 'opening': return t.includes('opening');
    case 'closing': return t.includes('closing');
    case 'am': return !t.includes('opening') && !t.includes('closing') && checklist.shift_time === 'AM';
    case 'pm': return !t.includes('opening') && !t.includes('closing') && checklist.shift_time === 'PM';
    default: return false;
  }
}

export function ConciergeChecklistView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hideCompleted, setHideCompleted] = useState(() => localStorage.getItem('checklist-hide-completed') === 'true');
  // Local override: when user clicks the blurred overlay, we show items without changing localStorage
  const [localShowAll, setLocalShowAll] = useState(false);
  const isWeekend = [0, 6].includes(new Date(selectedDate + 'T00:00:00').getDay());

  const now = new Date();
  const currentSlot = isWeekend
    ? getWeekendChecklistSlot(now.getHours(), now.getMinutes())
    : getWeekdayChecklistSlot(now.getHours(), now.getMinutes());
  const [activeSlot, setActiveSlot] = useState(currentSlot);

  // Fetch ALL active concierge checklists for the day type
  const { data: allChecklists, isLoading } = useQuery({
    queryKey: ['concierge-checklists-all', isWeekend],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_checklists')
        .select(`*, concierge_checklist_items(*)`)
        .eq('is_weekend', isWeekend)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as ConciergeChecklistWithItems[];
    },
  });

  const checklist = useMemo(() => {
    if (!allChecklists) return null;
    return allChecklists.find(cl => matchChecklistToSlot(cl, activeSlot)) || null;
  }, [allChecklists, activeSlot]);

  // Determine shiftTime from the matched checklist for completions query
  const shiftTime = checklist?.shift_time || 'AM';

  // Fetch completions for selected date
  const { data: completions } = useQuery({
    queryKey: ['concierge-completions', selectedDate, checklist?.id, user?.id],
    queryFn: async () => {
      if (!user || !checklist) return [];
      const { data, error } = await supabase
        .from('concierge_completions')
        .select('*')
        .eq('completion_date', selectedDate)
        .eq('shift_time', shiftTime);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!checklist,
  });

  // Fetch active mat_cleaning and roof_music_reset notifications
  const { data: checklistAlerts } = useQuery({
    queryKey: ['checklist-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['mat_cleaning', 'roof_music_reset'])
        .is('dismissed_at', null)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true, dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });

  const completionMap = new Map(completions?.map(c => [c.item_id, c]) || []);
  const completedCount = completions?.filter(c => c.completed_at).length || 0;
  const totalCount = checklist?.concierge_checklist_items?.length || 0;

  const isClosingSlot = activeSlot === 'closing';
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const effectiveHideCompleted = hideCompleted && !localShowAll;
  const showCompletedOverlay = isClosingSlot && hideCompleted && allCompleted && !localShowAll;

  // Reset localShowAll when slot or date changes
  const slotDateKey = `${activeSlot}-${selectedDate}`;
  const [prevSlotDateKey, setPrevSlotDateKey] = useState(slotDateKey);
  if (slotDateKey !== prevSlotDateKey) {
    setPrevSlotDateKey(slotDateKey);
    setLocalShowAll(false);
  }

  if (isLoading) {
    return <div className="p-4">Loading checklist...</div>;
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No checklist found for {isWeekend ? 'weekend' : 'weekday'} {WEEKDAY_SLOT_LABELS[activeSlot]} shift.</p>
          <p className="text-sm mt-2">Contact your manager to set up checklists.</p>
        </CardContent>
      </Card>
    );
  }

  const ALERT_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
    mat_cleaning: { icon: Sparkles, color: add_color.red, label: 'MAT CLEANING' },
    roof_music_reset: { icon: Music, color: add_color.yellow, label: 'MUSIC RESET' },
  };

  return (
    <div className="space-y-4">
      {/* Checklist alert banners */}
      {(checklistAlerts || []).map((alert) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.mat_cleaning;
        const Icon = config.icon;
        return (
          <div
            key={alert.id}
            className="flex items-center gap-3 px-4 py-3 border-l-4"
            style={{
              borderLeftColor: config.color,
              backgroundColor: `${config.color}1A`,
            }}
          >
            <div
              className="h-7 w-7 flex items-center justify-center shrink-0"
              style={{ backgroundColor: config.color }}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest shrink-0 text-white font-medium"
                  style={{ backgroundColor: config.color }}
                >
                  {config.label}
                </span>
                <span className="text-xs font-medium truncate">{alert.title}</span>
              </div>
              {alert.body && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.body}</p>
              )}
            </div>
            <button
              onClick={() => dismissAlert.mutate(alert.id)}
              className="shrink-0 p-1 hover:bg-muted rounded-sm transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      })}

      {/* Header with date selector and slot toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-md"
            />
          </div>
          <div className="flex gap-1">
            {(['opening', 'am', 'pm', 'closing'] as const).map(slot => (
              <Button
                key={slot}
                variant={activeSlot === slot ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveSlot(slot); setLocalShowAll(false); }}
              >
                {WEEKDAY_SLOT_LABELS[slot]}
              </Button>
            ))}
          </div>
        </div>
        <Badge variant={completedCount === totalCount ? 'default' : 'secondary'} className="text-[10px] rounded-none border-none text-white" style={{ backgroundColor: '#f6821f', paddingBottom: '2.25px', paddingLeft: '6.75px', paddingRight: '6.75px' }}>
          {completedCount} / {totalCount} Complete
        </Badge>
      </div>

      {/* Checklist card */}
      <Card className="border-none p-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{checklist.title}</CardTitle>
              {checklist.description && (
                <p className="text-sm text-muted-foreground">{checklist.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-completed-concierge" className="text-xs text-muted-foreground cursor-pointer">Hide completed</Label>
              <Switch
                id="hide-completed-concierge"
                checked={hideCompleted}
                onCheckedChange={(v) => {
                  setHideCompleted(v);
                  localStorage.setItem('checklist-hide-completed', String(v));
                  setLocalShowAll(false);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          {showCompletedOverlay && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer rounded-b-lg"
              onClick={() => setLocalShowAll(true)}
            >
              <div className="absolute inset-0 backdrop-blur-sm bg-background/60 rounded-b-lg" />
              <div className="relative z-20 text-center p-6">
                <p className="text-lg font-semibold text-foreground">Today's Concierge tasks completed ✓</p>
                <p className="text-sm text-muted-foreground mt-1">Tap to view all tasks</p>
              </div>
            </div>
          )}
          {(() => {
            const items = checklist.concierge_checklist_items
              ?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
            // Group by time_hint (like BoH does)
            const grouped: Record<string, any[]> = {};
            items.forEach((item: any) => {
              const section = item.time_hint || 'Other';
              if (!grouped[section]) grouped[section] = [];
              grouped[section].push(item);
            });
            let sectionIdx = 0;
            return Object.entries(grouped).map(([section, sectionItems]) => {
              const filteredItems = effectiveHideCompleted
                ? sectionItems.filter((i: any) => !completionMap.get(i.id)?.completed_at)
                : sectionItems;
              if (filteredItems.length === 0) return null;
              const hasCheckboxes = sectionItems.some((i: any) => i.task_type === 'checkbox');
              const currentSectionIdx = hasCheckboxes ? sectionIdx++ : 0;
              const sectionCompleted = sectionItems.filter((i: any) => completionMap.get(i.id)?.completed_at).length;
              const allDone = sectionCompleted === sectionItems.length;
              return (
                <Collapsible key={section} defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors border">
                    <span className="font-semibold text-sm">{section}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {sectionCompleted}/{sectionItems.length}
                      </Badge>
                      <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>svg>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-2 pl-1">
                    {filteredItems.map((item: any) => (
                      <ConciergeChecklistItem
                        key={item.id}
                        item={item}
                        completion={completionMap.get(item.id)}
                        checklistId={checklist.id}
                        completionDate={selectedDate}
                        shiftTime={shiftTime}
                        checkboxIndex={currentSectionIdx}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            });
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStorageBool, setStorageBool } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import type { CafeChecklistItem } from '@/hooks/checklists/useCafeChecklists';
import { CafeChecklistItem as CafeChecklistItemComponent } from './CafeChecklistItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPSTToday } from '@/lib/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePageWrapper } from '@/components/mobile/MobilePageWrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CafeChecklistWithItems {
  id: string;
  title: string;
  description: string | null;
  shift_time: 'AM' | 'PM';
  is_weekend: boolean;
  is_active: boolean;
  cafe_checklist_items: any[];
}

export function CafeChecklistView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(getPSTToday);
  const [hideCompleted, setHideCompleted] = useState(() => getStorageBool('checklist-hide-completed', false));

  // Fetch ALL active cafe checklists regardless of day/shift
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['cafe-checklists-all-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafe_checklists')
        .select(`
          *,
          cafe_checklist_items(*)
        `)
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return (data || []) as CafeChecklistWithItems[];
    },
  });

  // Collect all checklist IDs for completion fetching
  const checklistIds = checklists?.map(c => c.id) || [];

  // Fetch completions for selected date across all checklists
  const { data: completions } = useQuery({
    queryKey: ['cafe-completions-all', selectedDate, user?.id, checklistIds],
    queryFn: async () => {
      if (!user || checklistIds.length === 0) return [];
      const { data, error } = await supabase
        .from('cafe_completions')
        .select('*')
        .eq('completion_date', selectedDate)
        .in('checklist_id', checklistIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && checklistIds.length > 0,
  });

  const completionMap = new Map(completions?.map(c => [c.item_id, c]) || []);

  if (isLoading) {
    return <div className="p-4">Loading checklist...</div>;
  }

  if (!checklists || checklists.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No active cafe checklists found.</p>
          <p className="text-sm mt-2">Contact your manager to set up checklists.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with date selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border rounded-md"
          />
        </div>
      </div>

      {/* Render each checklist */}
      {checklists.map((checklist) => {
        const items = checklist.cafe_checklist_items || [];
        const totalCount = items.length;
        const completedCount = items.filter((i: any) => completionMap.get(i.id)?.completed_at).length;
        const isAllComplete = totalCount > 0 && completedCount === totalCount;

        // Group items by category
        const groupedItems = items.reduce((acc: Record<string, any[]>, item: any) => {
          const category = item.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {} as Record<string, any[]>);

        // Determine shift_time for completions
        const shiftTime = checklist.shift_time;

        return (
          <Card key={checklist.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-bold">{checklist.title}</CardTitle>
                  {checklist.description && (
                    <p className="text-sm text-muted-foreground mt-1">{checklist.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={isAllComplete ? 'default' : 'secondary'} className="text-[10px] rounded-none border-none text-white" style={{ backgroundColor: '#f6821f', paddingBottom: '2.25px', paddingLeft: '6.75px', paddingRight: '6.75px' }}>
                    {completedCount} / {totalCount} Complete
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hide-completed-cafe" className="text-xs text-muted-foreground cursor-pointer">Hide completed</Label>
                    <Switch id="hide-completed-cafe" checked={hideCompleted} onCheckedChange={(v) => { setHideCompleted(v); setStorageBool('checklist-hide-completed', v); }} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isAllComplete && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Checklist for today has been completed</span>
                </div>
              )}

              {/* Render items grouped by category */}
              {(() => {
                let sectionIdx = 0;
                return Object.entries(groupedItems).map(([category, catItems]) => {
                  const categoryItems = (catItems as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order);
                  const filteredCategoryItems = hideCompleted
                    ? categoryItems.filter((i: any) => !completionMap.get(i.id)?.completed_at)
                    : categoryItems;
                  if (filteredCategoryItems.length === 0) return null;
                  const hasCheckboxes = categoryItems.some((i: any) => i.task_type === 'checkbox');
                  const currentSectionIdx = hasCheckboxes ? sectionIdx++ : 0;
                  const categoryCompleted = categoryItems.filter((i: any) => completionMap.get(i.id)?.completed_at).length;
                  const allDone = categoryCompleted === categoryItems.length;
                  return (
                    <Collapsible key={category} defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                        <span className="font-semibold text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs">
                            {categoryCompleted}/{categoryItems.length}
                          </Badge>
                          <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>svg>&]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-1">
                        {filteredCategoryItems.map((item: any) => (
                          <CafeChecklistItemComponent
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
        );
      })}
    </div>
  );
}
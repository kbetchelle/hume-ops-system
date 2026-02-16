import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CafeChecklistItem } from './CafeChecklistItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
                  <CardTitle>{checklist.title}</CardTitle>
                  {checklist.description && (
                    <p className="text-sm text-muted-foreground mt-1">{checklist.description}</p>
                  )}
                </div>
                <Badge variant={isAllComplete ? 'default' : 'secondary'}>
                  {completedCount} / {totalCount} Complete
                </Badge>
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
              {Object.entries(groupedItems).map(([category, catItems]) => {
                const categoryItems = (catItems as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order);
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
                    <CollapsibleContent className="space-y-1 pt-2 pl-1">
                      {categoryItems.map((item: any) => (
                        <CafeChecklistItem
                          key={item.id}
                          item={item}
                          completion={completionMap.get(item.id)}
                          checklistId={checklist.id}
                          completionDate={selectedDate}
                          shiftTime={shiftTime}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
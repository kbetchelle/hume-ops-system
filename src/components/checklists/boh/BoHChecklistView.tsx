import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { BoHChecklistItem } from './BoHChecklistItem';
import { MobilePageWrapper } from '@/components/mobile/MobilePageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BoHChecklistViewProps {
  /** Optional content rendered inside the scrollable area before the checklist (e.g. alert banners). */
  headerSlot?: React.ReactNode;
}

interface BoHChecklistWithItems {
  id: string;
  title: string;
  description: string | null;
  role_type: 'floater' | 'male_spa_attendant' | 'female_spa_attendant';
  shift_time: 'AM' | 'PM';
  is_weekend: boolean;
  is_active: boolean;
  boh_checklist_items: any[];
}

export function BoHChecklistView({ headerSlot }: BoHChecklistViewProps = {}) {
  const { user } = useAuth();
  const { data: userRolesData } = useUserRoles(user?.id);
  const { activeRole } = useActiveRole();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const roles = userRolesData || [];
  // Use PST date to avoid UTC day-boundary mismatch
  const getPSTDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
  };
  const getPSTDayOfWeek = (dateStr: string) => {
    // Parse as local PST date components to get correct day-of-week
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  };
  const [selectedDate, setSelectedDate] = useState(getPSTDate);
  const isWeekend = [0, 6].includes(getPSTDayOfWeek(selectedDate));
  const [hideCompleted, setHideCompleted] = useState(() => localStorage.getItem('checklist-hide-completed') === 'true');

  const bohRoles = ['floater', 'male_spa_attendant', 'female_spa_attendant'];
  const userBoHRole = (activeRole && bohRoles.includes(activeRole))
    ? roles.find(r => r.role === activeRole)
    : roles.find(r => bohRoles.includes(r.role));

  // Query PM checklist time_hints to auto-detect shift cutoff per role
  const { data: pmChecklist } = useQuery({
    queryKey: ['boh-pm-start', isWeekend, userBoHRole?.role],
    queryFn: async () => {
      if (!userBoHRole) return null;
      const { data, error } = await supabase
        .from('boh_checklists')
        .select('boh_checklist_items(time_hint)')
        .eq('role_type', userBoHRole.role)
        .eq('shift_time', 'PM')
        .eq('is_weekend', isWeekend)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    },
    enabled: !!userBoHRole,
  });

  // Parse earliest PM time_hint to determine shift cutoff
  const getPmStartMinutes = useCallback(() => {
    const items = (pmChecklist as any)?.boh_checklist_items ?? [];
    let earliest = Infinity;
    for (const item of items) {
      const hint = item.time_hint;
      if (!hint || hint === 'End of Shift') continue;
      const match = hint.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const total = hours * 60 + mins;
        if (total < earliest) earliest = total;
      }
    }
    return earliest === Infinity ? (isWeekend ? 780 : 840) : earliest;
  }, [pmChecklist, isWeekend]);

  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const pmCutoff = getPmStartMinutes();
  const detectedShift = currentMinutes < pmCutoff ? 'AM' : 'PM';
  const [shiftTime, setShiftTime] = useState<'AM' | 'PM'>(detectedShift);

  const queryClient = useQueryClient();
  const { data: checklist, isLoading, refetch: refetchChecklist } = useQuery({
    queryKey: ['boh-checklist', shiftTime, isWeekend, userBoHRole?.role],
    queryFn: async () => {
      if (!userBoHRole) return null;
      
      const { data, error } = await supabase
        .from('boh_checklists')
        .select(`
          *,
          boh_checklist_items(*)
        `)
        .eq('role_type', userBoHRole.role)
        .eq('shift_time', shiftTime)
        .eq('is_weekend', isWeekend)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as BoHChecklistWithItems | null;
    },
    enabled: !!userBoHRole,
  });

  const { data: completions, refetch: refetchCompletions } = useQuery({
    queryKey: ['boh-completions', selectedDate, shiftTime, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('boh_completions')
        .select('*')
        .eq('completion_date', selectedDate)
        .eq('shift_time', shiftTime);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const completionMap = new Map(completions?.map(c => [c.item_id, c]) || []);
  const completedCount = completions?.filter(c => c.completed_at).length || 0;
  const totalCount = checklist?.boh_checklist_items?.length || 0;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchChecklist(), refetchCompletions()]);
  }, [refetchChecklist, refetchCompletions]);

  if (!userBoHRole) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>{t('You don\'t have a Back of House role assigned.', 'No tienes un rol de Back of House asignado.')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="p-4">{t('Loading checklist...', 'Cargando lista...')}</div>;
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>{t(
            `No checklist found for ${userBoHRole.role} (${isWeekend ? 'weekend' : 'weekday'} ${shiftTime} shift).`,
            `No se encontró lista para ${userBoHRole.role} (${isWeekend ? 'fin de semana' : 'entre semana'} turno ${shiftTime}).`
          )}</p>
          <p className="text-sm mt-2">{t('Contact your manager to set up checklists.', 'Contacta a tu gerente para configurar las listas.')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    const items = checklist.boh_checklist_items?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
    const grouped: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const section = item.time_hint || t('Other', 'Otro');
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    });
    const groupedEntries = Object.entries(grouped);
    let sectionIdx = 0;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <MobilePageWrapper onRefresh={handleRefresh} className="flex flex-col min-h-0 !overflow-visible">
        {headerSlot}
        {/* Date + Shift + Hide completed */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-2 min-h-[44px]">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-none text-[13.25px] min-h-[44px]"
            />
          </div>
          <div className="flex gap-1 min-h-[44px] items-center">
            <Button
              variant={shiftTime === 'AM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShiftTime('AM')}
              className="min-h-[44px] min-w-[44px]"
            >
              AM
            </Button>
            <Button
              variant={shiftTime === 'PM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShiftTime('PM')}
              className="min-h-[44px] min-w-[44px]"
            >
              PM
            </Button>
          </div>
          <div className="flex items-center gap-2 min-h-[44px] ml-auto">
            <Label htmlFor="hide-completed-boh-mobile" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">{t('Hide completed', 'Ocultar completados')}</Label>
            <Switch id="hide-completed-boh-mobile" checked={hideCompleted} onCheckedChange={(v) => { setHideCompleted(v); localStorage.setItem('checklist-hide-completed', String(v)); }} />
          </div>
        </div>
        {/* Sections + items */}
        <div>
          {groupedEntries.map(([section, sectionItems]) => {
            const filteredItems = hideCompleted
              ? sectionItems.filter((i: any) => !completionMap.get(i.id)?.completed_at)
              : sectionItems;
            if (filteredItems.length === 0) return null;
            const hasCheckboxes = sectionItems.some((i: any) => i.task_type === 'checkbox');
            const currentSectionIdx = hasCheckboxes ? sectionIdx++ : 0;
            const sectionCompleted = sectionItems.filter((i: any) => completionMap.get(i.id)?.completed_at).length;
            return (
              <div key={section}>
                <div className="sticky top-0 z-10 px-4 py-2 bg-muted/95 backdrop-blur border-b font-semibold text-sm flex items-center justify-between">
                  <span>{section}</span>
                  <span className="text-muted-foreground font-normal">{sectionCompleted}/{sectionItems.length}</span>
                </div>
                <div>
                  {filteredItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="min-h-[48px] p-0 bg-card"
                    >
                      <BoHChecklistItem
                        item={item}
                        completion={completionMap.get(item.id)}
                        checklistId={checklist.id}
                        completionDate={selectedDate}
                        shiftTime={shiftTime}
                        checkboxIndex={currentSectionIdx}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {groupedEntries.every(([, sectionItems]) => {
            const filtered = hideCompleted
              ? sectionItems.filter((i: any) => !completionMap.get(i.id)?.completed_at)
              : sectionItems;
            return filtered.length === 0;
          }) && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground">
              <p className="text-base font-medium">{t('All done! Great work.', '¡Todo listo! Buen trabajo.')}</p>
            </div>
          )}
        </div>
      </MobilePageWrapper>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
          <div className="flex gap-2">
            <Button
              variant={shiftTime === 'AM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShiftTime('AM')}
            >
              AM
            </Button>
            <Button
              variant={shiftTime === 'PM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShiftTime('PM')}
            >
              PM
            </Button>
          </div>
        </div>
        <Badge variant={completedCount === totalCount ? 'default' : 'secondary'} className="text-[10px] rounded-none border-none text-white" style={{ backgroundColor: '#f6821f', paddingBottom: '2.25px', paddingLeft: '6.75px', paddingRight: '6.75px' }}>
          {completedCount} / {totalCount} {t('Complete', 'Completo')}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{checklist.title}</CardTitle>
              {checklist.description && (
                <p className="text-sm text-muted-foreground">{checklist.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-completed-boh" className="text-xs text-muted-foreground cursor-pointer">{t('Hide completed', 'Ocultar completados')}</Label>
              <Switch id="hide-completed-boh" checked={hideCompleted} onCheckedChange={(v) => { setHideCompleted(v); localStorage.setItem('checklist-hide-completed', String(v)); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const items = checklist.boh_checklist_items?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
            const grouped: Record<string, any[]> = {};
            items.forEach((item: any) => {
              const section = item.time_hint || t('Other', 'Otro');
              if (!grouped[section]) grouped[section] = [];
              grouped[section].push(item);
            });
            let sectionIdx = 0;
            return Object.entries(grouped).map(([section, sectionItems]) => {
              const filteredItems = hideCompleted
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
                      <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs">
                        {sectionCompleted}/{sectionItems.length}
                      </Badge>
                      <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>svg>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {filteredItems.map((item: any) => (
                      <BoHChecklistItem
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

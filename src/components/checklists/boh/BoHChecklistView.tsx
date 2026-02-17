import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { BoHChecklistItem } from './BoHChecklistItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

export function BoHChecklistView() {
  const { user } = useAuth();
  const { data: userRolesData } = useUserRoles(user?.id);
  const { t } = useLanguage();
  const roles = userRolesData || [];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const isWeekend = [0, 6].includes(new Date(selectedDate).getDay());
  const [hideCompleted, setHideCompleted] = useState(() => localStorage.getItem('checklist-hide-completed') === 'true');
  
  const currentHour = new Date().getHours();
  const detectedShift = currentHour < 13 ? 'AM' : 'PM';
  const [shiftTime, setShiftTime] = useState<'AM' | 'PM'>(detectedShift);

  const userBoHRole = roles.find(r => 
    ['floater', 'male_spa_attendant', 'female_spa_attendant'].includes(r.role)
  );

  const { data: checklist, isLoading } = useQuery({
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

  const { data: completions } = useQuery({
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
        <Badge variant={completedCount === totalCount ? 'default' : 'secondary'}>
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
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <span className="font-semibold text-sm">{section}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs">
                        {sectionCompleted}/{sectionItems.length}
                      </Badge>
                      <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>svg>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-2 pl-1">
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

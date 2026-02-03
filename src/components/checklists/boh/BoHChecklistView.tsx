import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { BoHChecklistItem } from './BoHChecklistItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

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
  const roles = userRolesData || [];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const isWeekend = [0, 6].includes(new Date(selectedDate).getDay());
  
  // Detect shift time (AM/PM) based on current time
  const currentHour = new Date().getHours();
  const detectedShift = currentHour < 13 ? 'AM' : 'PM';
  const [shiftTime, setShiftTime] = useState<'AM' | 'PM'>(detectedShift);

  // Get user's BoH role
  const userBoHRole = roles.find(r => 
    ['floater', 'male_spa_attendant', 'female_spa_attendant'].includes(r.role)
  );

  // Fetch checklist for selected date and shift
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

  // Fetch completions for selected date
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
          <p>You don't have a Back of House role assigned.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="p-4">Loading checklist...</div>;
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No checklist found for {userBoHRole.role} ({isWeekend ? 'weekend' : 'weekday'} {shiftTime} shift).</p>
          <p className="text-sm mt-2">Contact your manager to set up checklists.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with date selector and shift toggle */}
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
          {completedCount} / {totalCount} Complete
        </Badge>
      </div>

      {/* Checklist card */}
      <Card>
        <CardHeader>
          <CardTitle>{checklist.title}</CardTitle>
          {checklist.description && (
            <p className="text-sm text-muted-foreground">{checklist.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.boh_checklist_items
            ?.sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <BoHChecklistItem
                key={item.id}
                item={item}
                completion={completionMap.get(item.id)}
                checklistId={checklist.id}
                completionDate={selectedDate}
                shiftTime={shiftTime}
              />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

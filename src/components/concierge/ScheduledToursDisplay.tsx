import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface CalendlyTour {
  id: string;
  invitee_name: string | null;
  start_time: string;
  end_time: string | null;
  status: string | null;
}

interface ScheduledToursDisplayProps {
  reportDate: string;
  disabled?: boolean;
}

export function ScheduledToursDisplay({ reportDate, disabled }: ScheduledToursDisplayProps) {
  const [tours, setTours] = useState<CalendlyTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTours = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const dayStart = `${reportDate}T00:00:00.000Z`;
      const dayEnd = `${reportDate}T23:59:59.999Z`;
      const { data, error } = await supabase
        .from('calendly_events_staging')
        .select('id, invitee_name, start_time, end_time, status')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTours((data as CalendlyTour[]) ?? []);
    } catch (err) {
      console.error('[ScheduledToursDisplay] Failed to fetch:', err);
      setTours([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportDate]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const formatTime = (iso: string) => {
    try {
      return format(parseISO(iso), 'h:mm a');
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Scheduled Tours from Calendly
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fetchTours(true)}
          disabled={disabled || refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground py-2">Loading scheduled tours...</div>
      ) : tours.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2 rounded-md bg-muted/50 px-3 py-2">
          No scheduled tours for this date.
        </div>
      ) : (
        <ul className="space-y-2">
          {tours.map((tour) => (
            <li
              key={tour.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="font-medium">{tour.invitee_name ?? 'Unknown'}</span>
              <span className="text-muted-foreground">{formatTime(tour.start_time)}</span>
              {tour.status && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {tour.status}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

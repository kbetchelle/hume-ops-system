import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventDrink {
  id: string;
  drink_name: string;
  event_name: string | null;
  event_date: string | null;
  event_type: string | null;
  event_type_notes: string | null;
  recipe: string | null;
  food: string | null;
  staff: string[];
  supplies_needed: string | null;
  supplies_ordered: boolean;
  supplies_ordered_at: string | null;
  staff_notified: boolean;
  staff_notified_at: string | null;
  menu_printed: string | null;
  menu_printed_at: string | null;
  photoshoot: string | null;
  photoshoot_at: string | null;
  needs_followup: boolean;
  additional_notes: string | null;
  email_thread_path: string | null;
  email_thread_filename: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventDrinkInsert = Partial<EventDrink> & { drink_name: string };
export type EventDrinkUpdate = Partial<EventDrink>;



// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useEventDrinks(isArchived: boolean) {
  return useQuery({
    queryKey: ['event-drinks', isArchived],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('event_drinks' as any) as any)
        .select('*')
        .eq('is_archived', isArchived);

      if (error) throw error;

      // Sort client-side: menu warning first, then needs_followup, then event_date ASC (nulls last)
      const raw = new Date();
      const now = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
      const fourteenDaysFromNow = new Date(now);
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      return (data as EventDrink[]).sort((a, b) => {
        const aWarning = hasMenuWarning(a, now, fourteenDaysFromNow);
        const bWarning = hasMenuWarning(b, now, fourteenDaysFromNow);
        if (aWarning !== bWarning) return aWarning ? -1 : 1;

        if (a.needs_followup !== b.needs_followup) return a.needs_followup ? -1 : 1;

        // event_date ASC, nulls last
        if (a.event_date && b.event_date) return a.event_date.localeCompare(b.event_date);
        if (a.event_date && !b.event_date) return -1;
        if (!a.event_date && b.event_date) return 1;
        return 0;
      });
    },
  });
}

/** Returns true if event is within 14 days and menu is not yet printed */
export function hasMenuWarning(
  drink: EventDrink,
  now?: Date,
  threshold?: Date
): boolean {
  if (!drink.event_date) return false;
  if (drink.menu_printed === 'Yes') return false;
  const _now = now ?? new Date();
  // Normalize to start of day so today's events are always included
  const todayMidnight = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
  const _threshold = threshold ?? (() => {
    const d = new Date(todayMidnight);
    d.setDate(d.getDate() + 14);
    return d;
  })();
  const eventDate = new Date(drink.event_date + 'T00:00:00');
  return eventDate >= todayMidnight && eventDate <= _threshold;
}

// ---------------------------------------------------------------------------
// Staff names from Sling shifts
// ---------------------------------------------------------------------------

export function useCafeStaffNames() {
  return useQuery({
    queryKey: ['cafe-staff-names'],
    queryFn: async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const dateStr = sixtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('staff_shifts')
        .select('user_name')
        .or('position.ilike.%cafe%,position.ilike.%barista%')
        .gte('shift_date', dateStr)
        .not('user_name', 'is', null);

      if (error) throw error;

      // Deduplicate and sort
      const names = [...new Set(
        (data ?? [])
          .map((d) => d.user_name)
          .filter((n): n is string => !!n)
      )].sort();

      return names;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useEventDrinkMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-drinks'] });
  };

  const createEventDrink = useMutation({
    mutationFn: async (drink: EventDrinkInsert) => {
      const { data, error } = await (supabase
        .from('event_drinks' as any) as any)
        .insert(drink)
        .select()
        .single();
      if (error) throw error;
      return data as EventDrink;
    },
    onSuccess: invalidate,
  });

  const updateEventDrink = useMutation({
    mutationFn: async ({ id, ...updates }: EventDrinkUpdate & { id: string }) => {
      const { data, error } = await (supabase
        .from('event_drinks' as any) as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EventDrink;
    },
    onSuccess: invalidate,
  });

  const archiveEventDrink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('event_drinks' as any) as any)
        .update({ is_archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const restoreEventDrink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('event_drinks' as any) as any)
        .update({ is_archived: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const uploadEmailThread = useMutation({
    mutationFn: async ({ drinkId, file }: { drinkId: string; file: File }) => {
      const filePath = `event-drinks/${drinkId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('event-drinks-files')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await (supabase
        .from('event_drinks' as any) as any)
        .update({
          email_thread_path: filePath,
          email_thread_filename: file.name,
        })
        .eq('id', drinkId);
      if (updateError) throw updateError;
    },
    onSuccess: invalidate,
  });

  return {
    createEventDrink,
    updateEventDrink,
    archiveEventDrink,
    restoreEventDrink,
    uploadEmailThread,
  };
}

/** Generate a signed URL for a private-bucket email thread file */
export async function getEmailThreadSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('event-drinks-files')
    .createSignedUrl(path, 3600); // 1 hour
  if (error) {
    console.error('Failed to create signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

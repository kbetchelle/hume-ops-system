import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPSTToday, getPSTHour, getPSTMinute } from '@/lib/dateUtils';

/**
 * Checks if the current user is on a Sling shift right now.
 * Step 1: Look up the user's sling_user_id via the sling_users table.
 * Step 2: Check staff_shifts for a current shift.
 * Returns false if the user has no Sling link.
 *
 * Sling shift times are stored as PST values with +00 offset (pseudo-UTC),
 * so we compare using the current PST time formatted as an ISO string to
 * avoid the browser's local timezone shifting the comparison.
 */
export function useIsOnShift() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-on-shift', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;

      // Step 1: Find the user's sling_user_id
      const { data: slingUser, error: slingError } = await supabase
        .from('sling_users')
        .select('sling_user_id')
        .eq('linked_staff_id', user.id)
        .maybeSingle();

      if (slingError) throw slingError;
      if (!slingUser) return false;

      // Step 2: Check if there's a current shift
      // Build a PST "now" timestamp with +00 offset to match stored format
      const today = getPSTToday();
      const h = String(getPSTHour()).padStart(2, '0');
      const m = String(getPSTMinute()).padStart(2, '0');
      const nowPseudoUtc = `${today}T${h}:${m}:00+00`;

      const { data: shift, error: shiftError } = await supabase
        .from('staff_shifts')
        .select('id')
        .eq('sling_user_id', slingUser.sling_user_id)
        .lte('shift_start', nowPseudoUtc)
        .gte('shift_end', nowPseudoUtc)
        .limit(1)
        .maybeSingle();

      if (shiftError) throw shiftError;
      return !!shift;
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

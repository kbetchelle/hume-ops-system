import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Checks if the current user is on a Sling shift right now.
 * Step 1: Look up the user's sling_user_id via the sling_users table.
 * Step 2: Check staff_shifts for a current shift.
 * Returns false if the user has no Sling link.
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
      const now = new Date().toISOString();

      const { data: shift, error: shiftError } = await supabase
        .from('staff_shifts')
        .select('id')
        .eq('sling_user_id', slingUser.sling_user_id)
        .lte('shift_start', now)
        .gte('shift_end', now)
        .limit(1)
        .maybeSingle();

      if (shiftError) throw shiftError;
      return !!shift;
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

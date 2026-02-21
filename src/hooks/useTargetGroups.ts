import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { TargetGroup, RoleGroup } from '@/types/messaging';
import { ROLE_GROUPS } from '@/types/messaging';
import type { AppRole } from '@/types/roles';

/**
 * Fetch all target groups (visible to all authenticated users)
 */
export function useTargetGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['target-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('target_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as TargetGroup[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Get all members for a role group
 */
export function useRoleGroupMembers(roleGroup: RoleGroup) {
  return useQuery({
    queryKey: ['role-group-members', roleGroup.id],
    queryFn: async () => {
      let roles: AppRole[] = [];

      if (roleGroup.role === 'back_of_house') {
        roles = ['female_spa_attendant', 'male_spa_attendant', 'floater'];
      } else {
        roles = [roleGroup.role as AppRole];
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', roles);

      if (error) throw error;

      const uniqueUserIds = Array.from(
        new Set(data?.map((r) => r.user_id) || [])
      );

      return uniqueUserIds;
    },
  });
}

/**
 * Create a new target group
 */
export function useCreateGroup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      memberIds,
      description,
    }: {
      name: string;
      memberIds: string[];
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('target_groups')
        .insert({
          name,
          member_ids: memberIds,
          created_by: user.id,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TargetGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-groups'] });
      toast({ title: 'Group created' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing target group
 */
export function useUpdateGroup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      memberIds,
      description,
    }: {
      groupId: string;
      name: string;
      memberIds: string[];
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('target_groups')
        .update({
          name,
          member_ids: memberIds,
          description: description || null,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data as TargetGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-groups'] });
      toast({ title: 'Group updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a target group
 */
export function useDeleteGroup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('target_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-groups'] });
      toast({ title: 'Group deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

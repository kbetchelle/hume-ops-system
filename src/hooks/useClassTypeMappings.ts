import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  selectFrom,
  insertInto,
  updateTable,
  deleteFrom,
  eq,
} from '@/lib/dataApi';

export type ClassCategory = 'heated_room' | 'high_roof' | 'standard';

export interface ClassTypeMapping {
  id: string;
  class_name_pattern: string;
  class_category: ClassCategory;
  notes: string | null;
  created_at: string;
}

export const CLASS_CATEGORY_LABELS: Record<ClassCategory, string> = {
  heated_room: 'Heated Room',
  high_roof: 'High Roof',
  standard: 'Standard',
};

export function useClassTypeMappings() {
  return useQuery({
    queryKey: ['class-type-mappings'],
    queryFn: async () => {
      const { data, error } = await selectFrom<ClassTypeMapping>(
        'class_type_mappings',
        { order: [{ column: 'class_name_pattern', ascending: true }] }
      );
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateClassTypeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      class_name_pattern?: string;
      class_category?: ClassCategory;
      notes?: string | null;
    }) => {
      const { id, ...updates } = input;
      const payload: Record<string, unknown> = {};
      if (updates.class_name_pattern !== undefined) payload.class_name_pattern = updates.class_name_pattern;
      if (updates.class_category !== undefined) payload.class_category = updates.class_category;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { data, error } = await updateTable<ClassTypeMapping>(
        'class_type_mappings',
        payload,
        [eq('id', id)]
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-type-mappings'] });
    },
  });
}

export function useCreateClassTypeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      class_name_pattern: string;
      class_category: ClassCategory;
      notes?: string | null;
    }) => {
      const { data, error } = await insertInto<ClassTypeMapping>(
        'class_type_mappings',
        {
          class_name_pattern: input.class_name_pattern,
          class_category: input.class_category,
          notes: input.notes ?? null,
        }
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-type-mappings'] });
    },
  });
}

export function useDeleteClassTypeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom('class_type_mappings', [eq('id', id)]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-type-mappings'] });
    },
  });
}

/** Match class name against pattern (SQL LIKE style: % = any chars, _ = one char) */
export function matchClassCategory(
  className: string,
  mappings: ClassTypeMapping[]
): ClassCategory {
  const normalized = (className || '').trim();
  for (const m of mappings) {
    const pattern = m.class_name_pattern.replace(/%/g, '.*').replace(/_/g, '.');
    const re = new RegExp('^' + pattern + '$', 'i');
    if (re.test(normalized)) return m.class_category as ClassCategory;
  }
  return 'standard';
}

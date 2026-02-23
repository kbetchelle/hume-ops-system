import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash } from 'lucide-react';
import { getTaskColorClass } from '@/components/checklists/checklistColors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface SortableItem {
  id: string;
  sort_order: number;
  task_description: string;
  task_type: string;
  required?: boolean | null;
  is_high_priority?: boolean | null;
  category?: string | null;
  time_hint?: string | null;
}

interface SortableItemRowProps {
  item: SortableItem;
  index: number;
  onEdit: (item: SortableItem) => void;
  onDelete: (id: string) => void;
  /** Extra info shown in the secondary line (e.g. category or time_hint) */
  secondaryLabel?: string | null;
}

function SortableItemRow({ item, index, onEdit, onDelete, secondaryLabel }: SortableItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const colorClass = getTaskColorClass(item.task_type, index);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors ${colorClass} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing p-0.5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{item.task_description}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          {item.is_high_priority && <Badge variant="default" className="text-xs">High Priority</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">{item.task_type}</Badge>
          {secondaryLabel && <span>• {secondaryLabel}</span>}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)}>
          <Trash className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface SortableChecklistItemsProps {
  items: SortableItem[];
  onEdit: (item: SortableItem) => void;
  onDelete: (id: string) => void;
  onReorder: (reorderedItems: { id: string; sort_order: number }[]) => void;
  /** Which field to show as secondary label: 'category' or 'time_hint' */
  secondaryField?: 'category' | 'time_hint';
}

export function SortableChecklistItems({
  items,
  onEdit,
  onDelete,
  onReorder,
  secondaryField = 'category',
}: SortableChecklistItemsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Build reordered array
      const reordered = [...items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Emit new sort_order values
      onReorder(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })));
    },
    [items, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item, idx) => (
          <SortableItemRow
            key={item.id}
            item={item}
            index={idx}
            onEdit={onEdit}
            onDelete={onDelete}
            secondaryLabel={secondaryField === 'time_hint' ? item.time_hint : item.category}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

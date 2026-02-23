import { useState, useCallback, useRef, useEffect } from 'react';
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
import { GripVertical } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SortableChecklistItems, SortableItem } from '@/components/checklists/SortableChecklistItems';

interface SortableSectionProps {
  sectionId: string;
  label: string;
  itemCount: number;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onDoubleClick: () => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  children: React.ReactNode;
}

function SortableSection({
  sectionId,
  label,
  itemCount,
  isEditing,
  editValue,
  onEditValueChange,
  onDoubleClick,
  onEditCommit,
  onEditCancel,
  children,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`mt-3 first:mt-0 ${isDragging ? 'shadow-lg' : ''}`}>
      <Collapsible defaultOpen>
        <div className="flex items-center gap-1">
          <button
            className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <CollapsibleTrigger className="flex items-center justify-between flex-1 py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
            {isEditing ? (
              <Input
                ref={inputRef}
                className="h-6 text-xs uppercase tracking-widest font-semibold bg-background w-48"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') onEditCommit();
                  if (e.key === 'Escape') onEditCancel();
                }}
                onBlur={onEditCommit}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="font-semibold text-xs uppercase tracking-widest cursor-text"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onDoubleClick();
                }}
              >
                {label}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="pl-1">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface SortableSectionsProps {
  items: SortableItem[];
  onEdit: (item: SortableItem) => void;
  onDelete: (id: string) => void;
  onReorder: (reorderedItems: { id: string; sort_order: number }[]) => void;
  onRenameSection: (oldName: string, newName: string) => void;
  secondaryField?: 'category' | 'time_hint';
}

export function SortableSections({
  items,
  onEdit,
  onDelete,
  onReorder,
  onRenameSection,
  secondaryField = 'category',
}: SortableSectionsProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  // Build ordered groups preserving first-occurrence order
  const groupOrder: string[] = [];
  const grouped: Record<string, typeof sorted> = {};
  sorted.forEach((item) => {
    const group = item.time_hint || 'Ungrouped';
    if (!grouped[group]) {
      grouped[group] = [];
      groupOrder.push(group);
    }
    grouped[group].push(item);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSectionDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = groupOrder.indexOf(active.id as string);
      const newIdx = groupOrder.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return;

      // Reorder groups
      const reorderedGroups = [...groupOrder];
      const [moved] = reorderedGroups.splice(oldIdx, 1);
      reorderedGroups.splice(newIdx, 0, moved);

      // Flatten into new sort_order values
      const updates: { id: string; sort_order: number }[] = [];
      let order = 0;
      for (const group of reorderedGroups) {
        for (const item of grouped[group]) {
          updates.push({ id: item.id, sort_order: order });
          order++;
        }
      }
      onReorder(updates);
    },
    [groupOrder, grouped, onReorder]
  );

  const handleEditCommit = useCallback(() => {
    if (editingSection === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== editingSection) {
      onRenameSection(editingSection, trimmed);
    }
    setEditingSection(null);
  }, [editingSection, editValue, onRenameSection]);

  const handleEditCancel = useCallback(() => {
    setEditingSection(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleSectionDragEnd}
      id="section-dnd"
    >
      <SortableContext items={groupOrder} strategy={verticalListSortingStrategy}>
        {groupOrder.map((group) => (
          <SortableSection
            key={group}
            sectionId={group}
            label={group}
            itemCount={grouped[group].length}
            isEditing={editingSection === group}
            editValue={editValue}
            onEditValueChange={setEditValue}
            onDoubleClick={() => {
              setEditingSection(group);
              setEditValue(group === 'Ungrouped' ? '' : group);
            }}
            onEditCommit={handleEditCommit}
            onEditCancel={handleEditCancel}
          >
            <SortableChecklistItems
              items={grouped[group]}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
              secondaryField={secondaryField}
            />
          </SortableSection>
        ))}
      </SortableContext>
    </DndContext>
  );
}

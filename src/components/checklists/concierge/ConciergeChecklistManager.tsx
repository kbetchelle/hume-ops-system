import { useState } from 'react';
import { Plus, Edit, Trash, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { getTaskColorClass } from '@/components/checklists/checklistColors';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useConciergeChecklists,
  useConciergeChecklistItems,
  useCreateConciergeChecklist,
  useUpdateConciergeChecklist,
  useDeleteConciergeChecklist,
  useCreateConciergeItem,
  useUpdateConciergeItem,
  useDeleteConciergeItem,
  ConciergeChecklist,
  ConciergeChecklistItem,
} from '@/hooks/checklists/useConciergeChecklists';
import { useToast } from '@/hooks/use-toast';

const TASK_TYPES = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'photo', label: 'Photo' },
  { value: 'signature', label: 'Signature' },
  { value: 'free_response', label: 'Free Response' },
  { value: 'short_entry', label: 'Short Entry' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'header', label: 'Header' },
  { value: 'employee', label: 'Employee' },
];

const COLORS = ['gray', 'red', 'blue', 'orange', 'purple', 'yellow', 'green'];

export function ConciergeChecklistManager() {
  const { toast } = useToast();
  const { data: checklists, isLoading } = useConciergeChecklists();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ConciergeChecklist | null>(null);
  const [editingItem, setEditingItem] = useState<ConciergeChecklistItem | null>(null);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const { data: items } = useConciergeChecklistItems(expandedId || undefined);
  
  const createChecklist = useCreateConciergeChecklist();
  const updateChecklist = useUpdateConciergeChecklist();
  const deleteChecklist = useDeleteConciergeChecklist();
  const createItem = useCreateConciergeItem();
  const updateItem = useUpdateConciergeItem();
  const deleteItem = useDeleteConciergeItem();

  const handleSaveChecklist = async (data: Partial<ConciergeChecklist>) => {
    try {
      if (editingChecklist) {
        await updateChecklist.mutateAsync({ id: editingChecklist.id, updates: data });
        toast({ title: 'Checklist updated successfully' });
      } else {
        await createChecklist.mutateAsync(data);
        toast({ title: 'Checklist created successfully' });
      }
      setIsChecklistDialogOpen(false);
      setEditingChecklist(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Are you sure? This will delete all items and completions.')) return;
    try {
      await deleteChecklist.mutateAsync(id);
      toast({ title: 'Checklist deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveItem = async (data: Partial<ConciergeChecklistItem>) => {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ 
          id: editingItem.id, 
          checklistId: editingItem.checklist_id,
          updates: data 
        });
        toast({ title: 'Item updated successfully' });
      } else {
        await createItem.mutateAsync({
          ...data,
          checklist_id: expandedId!,
          sort_order: items?.length || 0,
        });
        toast({ title: 'Item created successfully' });
      }
      setIsItemDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem.mutateAsync({ id, checklistId: expandedId! });
      toast({ title: 'Item deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Concierge Checklists</h3>
          <p className="text-sm text-muted-foreground">Manage checklists for concierge staff</p>
        </div>
        <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingChecklist(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </DialogTrigger>
          <ChecklistDialog
            checklist={editingChecklist}
            onSave={handleSaveChecklist}
            onClose={() => {
              setIsChecklistDialogOpen(false);
              setEditingChecklist(null);
            }}
          />
        </Dialog>
      </div>

      <div className="grid gap-4">
        {checklists?.map((checklist) => (
          <Card key={checklist.id} className={`border p-[15px] ${!checklist.is_active ? 'opacity-60' : ''} ${checklist.is_weekend ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
            <CardHeader className="p-0 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{checklist.title}</CardTitle>
                    {!checklist.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {checklist.shift_time} • {checklist.is_weekend ? 'Weekend' : 'Weekday'}
                    {checklist.description && ` • ${checklist.description}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingChecklist(checklist);
                      setIsChecklistDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChecklist(checklist.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedId(expandedId === checklist.id ? null : checklist.id)}
                  >
                    {expandedId === checklist.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedId === checklist.id && (
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      Checklist Items ({items?.length || 0})
                    </h3>
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <ItemDialog
                        item={editingItem}
                        onSave={handleSaveItem}
                        onClose={() => {
                          setIsItemDialogOpen(false);
                          setEditingItem(null);
                        }}
                      />
                    </Dialog>
                  </div>

                  {(() => {
                    const sorted = [...(items || [])].sort((a, b) => a.sort_order - b.sort_order);
                    const grouped: Record<string, typeof sorted> = {};
                    sorted.forEach((item) => {
                      const group = item.time_hint || 'Ungrouped';
                      if (!grouped[group]) grouped[group] = [];
                      grouped[group].push(item);
                    });
                    return (
                      <div>
                        {Object.entries(grouped).map(([group, groupItems]) => (
                          <Collapsible key={group} defaultOpen className="mt-3 first:mt-0">
                            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                              <span className="font-semibold text-xs uppercase tracking-widest">{group}</span>
                              <Badge variant="secondary" className="text-xs">{groupItems.length}</Badge>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-1">
                              {groupItems.map((item, idx) => {
                                const colorClass = getTaskColorClass(item.task_type, idx);
                                return (
                                <div
                                  key={item.id}
                                  className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors ${colorClass}`}
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{item.task_description}</span>
                                      {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                      {item.is_high_priority && <Badge variant="default" className="text-xs">High Priority</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs">{item.task_type}</Badge>
                                      {item.category && <span>• {item.category}</span>}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsItemDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChecklistDialog({
  checklist,
  onSave,
  onClose,
}: {
  checklist: ConciergeChecklist | null;
  onSave: (data: Partial<ConciergeChecklist>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ConciergeChecklist>>(
    checklist || {
      title: '',
      description: '',
      shift_time: 'AM',
      is_weekend: false,
      is_active: true,
    }
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{checklist ? 'Edit Checklist' : 'Create New Checklist'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Concierge - Weekday AM"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shift_time">Shift Time</Label>
            <Select
              value={formData.shift_time}
              onValueChange={(value) => setFormData({ ...formData, shift_time: value as 'AM' | 'PM' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="is_weekend"
              checked={formData.is_weekend}
              onCheckedChange={(checked) => setFormData({ ...formData, is_weekend: checked })}
            />
            <Label htmlFor="is_weekend">Weekend</Label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ItemDialog({
  item,
  onSave,
  onClose,
}: {
  item: ConciergeChecklistItem | null;
  onSave: (data: Partial<ConciergeChecklistItem>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ConciergeChecklistItem>>(
    item || {
      task_description: '',
      task_type: 'checkbox',
      time_hint: '',
      category: '',
      color: 'gray',
      is_high_priority: false,
      required: false,
      label_spanish: '',
      is_class_triggered: false,
    }
  );

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit Item' : 'Create New Item'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="task_description">Task Description</Label>
          <Textarea
            id="task_description"
            value={formData.task_description}
            onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
            placeholder="Enter task description"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="task_type">Task Type</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) => setFormData({ ...formData, task_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Select
              value={formData.color || 'gray'}
              onValueChange={(value) => setFormData({ ...formData, color: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="time_hint">Time Hint</Label>
            <Input
              id="time_hint"
              value={formData.time_hint || ''}
              onChange={(e) => setFormData({ ...formData, time_hint: e.target.value })}
              placeholder="e.g., 7:00 AM - 8:00 AM"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Opening, Closing"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="label_spanish">Spanish Label (Optional)</Label>
          <Textarea
            id="label_spanish"
            value={formData.label_spanish || ''}
            onChange={(e) => setFormData({ ...formData, label_spanish: e.target.value })}
            placeholder="Spanish translation"
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
            />
            <Label htmlFor="required">Required</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_high_priority"
              checked={formData.is_high_priority}
              onCheckedChange={(checked) => setFormData({ ...formData, is_high_priority: checked })}
            />
            <Label htmlFor="is_high_priority">High Priority</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_class_triggered"
              checked={formData.is_class_triggered}
              onCheckedChange={(checked) => setFormData({ ...formData, is_class_triggered: checked })}
            />
            <Label htmlFor="is_class_triggered">Class Triggered</Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

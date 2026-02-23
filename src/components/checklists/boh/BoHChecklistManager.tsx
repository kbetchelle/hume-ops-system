import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import { getTaskColorClass } from '@/components/checklists/checklistColors';
import { SortableChecklistItems, SortableItem } from '@/components/checklists/SortableChecklistItems';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useBoHChecklists,
  useBoHChecklistItems,
  useCreateBoHChecklist,
  useUpdateBoHChecklist,
  useDeleteBoHChecklist,
  useCreateBoHItem,
  useUpdateBoHItem,
  useDeleteBoHItem,
  BoHChecklist,
  BoHChecklistItem,
} from '@/hooks/checklists/useBoHChecklists';
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

const ROLE_TYPES = [
  { value: 'floater', label: 'Floater' },
  { value: 'male_spa_attendant', label: 'Male Spa Attendant' },
  { value: 'female_spa_attendant', label: 'Female Spa Attendant' },
];

export function BoHChecklistManager() {
  const { toast } = useToast();
  const { data: checklists, isLoading } = useBoHChecklists();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<BoHChecklist | null>(null);
  const [editingItem, setEditingItem] = useState<BoHChecklistItem | null>(null);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const { data: items } = useBoHChecklistItems(expandedId || undefined);
  
  const createChecklist = useCreateBoHChecklist();
  const updateChecklist = useUpdateBoHChecklist();
  const deleteChecklist = useDeleteBoHChecklist();
  const createItem = useCreateBoHItem();
  const updateItem = useUpdateBoHItem();
  const deleteItem = useDeleteBoHItem();

  const handleSaveChecklist = async (data: Partial<BoHChecklist>) => {
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

  const handleSaveItem = async (data: Partial<BoHChecklistItem>) => {
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

  const handleReorder = useCallback(async (reorderedItems: { id: string; sort_order: number }[]) => {
    try {
      await Promise.all(
        reorderedItems.map(({ id, sort_order }) =>
          updateItem.mutateAsync({ id, checklistId: expandedId!, updates: { sort_order } })
        )
      );
    } catch (error: any) {
      toast({ title: 'Reorder failed', description: error.message, variant: 'destructive' });
    }
  }, [expandedId, updateItem, toast]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <ChecklistDialog
          checklist={editingChecklist}
          onSave={handleSaveChecklist}
          onClose={() => {
            setIsChecklistDialogOpen(false);
            setEditingChecklist(null);
          }}
        />
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <ItemDialog
          item={editingItem}
          existingTimeHints={[...new Set((items || []).map(i => i.time_hint).filter(Boolean) as string[])]}
          onSave={handleSaveItem}
          onClose={() => {
            setIsItemDialogOpen(false);
            setEditingItem(null);
          }}
        />
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold" style={{ fontSize: '20px' }}>Back of House Checklists</h3>
          <p className="text-sm text-muted-foreground">
            Manage checklists for floater, male spa attendant, and female spa attendant roles
          </p>
        </div>
        <Button onClick={() => { setEditingChecklist(null); setIsChecklistDialogOpen(true); }} style={{ paddingLeft: '9px', paddingRight: '9px' }}>
          <Plus className="h-4 w-4 mr-2" />
          New Checklist
        </Button>
      </div>

      <div className="space-y-6">
        {(() => {
          const roleGroups: Record<string, typeof checklists> = {};
          checklists?.forEach((checklist) => {
            const role = checklist.role_type || 'unknown';
            if (!roleGroups[role]) roleGroups[role] = [];
            roleGroups[role]!.push(checklist);
          });
          const roleOrder = ROLE_TYPES.map(r => r.value);
          const sortedRoles = Object.keys(roleGroups).sort((a, b) => {
            const ai = roleOrder.indexOf(a);
            const bi = roleOrder.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
          return sortedRoles.map((role) => (
            <Collapsible key={role} defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <span className="font-semibold text-xs uppercase tracking-widest">
                  {ROLE_TYPES.find(r => r.value === role)?.label || role}
                </span>
                <Badge variant="secondary" className="text-xs">{roleGroups[role]!.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {roleGroups[role]!.map((checklist) => (
                  <Card key={checklist.id} className={`border p-[15px] ${!checklist.is_active ? 'opacity-60' : ''} ${checklist.is_weekend ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                    <CardHeader className="p-0 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{checklist.title}</CardTitle>
                            {!checklist.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Badge variant="outline">
                              {ROLE_TYPES.find(r => r.value === checklist.role_type)?.label}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            {checklist.shift_time} • {checklist.is_weekend ? 'Weekend' : 'Weekday'}
                            {checklist.description && ` • ${checklist.description}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingChecklist(checklist); setIsChecklistDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteChecklist(checklist.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setExpandedId(expandedId === checklist.id ? null : checklist.id)}>
                            {expandedId === checklist.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedId === checklist.id && (
                      <CardContent className="p-0">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Checklist Items ({items?.length || 0})</h3>
                            <Button size="sm" variant="outline" onClick={() => { setEditingItem(null); setIsItemDialogOpen(true); }}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Item
                            </Button>
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
                                  <Collapsible key={group} defaultOpen>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                                      <span className="font-semibold text-xs uppercase tracking-widest">{group}</span>
                                      <Badge variant="secondary" className="text-xs">{groupItems.length}</Badge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pl-1">
                                      <SortableChecklistItems
                                        items={groupItems}
                                        onEdit={(item) => { setEditingItem(item as BoHChecklistItem); setIsItemDialogOpen(true); }}
                                        onDelete={handleDeleteItem}
                                        onReorder={handleReorder}
                                        secondaryField="category"
                                      />
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
              </CollapsibleContent>
            </Collapsible>
          ));
        })()}
      </div>
    </div>
  );
}

function ChecklistDialog({
  checklist,
  onSave,
  onClose,
}: {
  checklist: BoHChecklist | null;
  onSave: (data: Partial<BoHChecklist>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<BoHChecklist>>(
    checklist || {
      title: '',
      description: '',
      role_type: 'floater',
      shift_time: 'AM',
      is_weekend: false,
      is_active: true,
    }
  );

  useEffect(() => {
    setFormData(
      checklist || {
        title: '',
        description: '',
        role_type: 'floater',
        shift_time: 'AM',
        is_weekend: false,
        is_active: true,
      }
    );
  }, [checklist]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{checklist ? 'Edit Checklist' : 'Create New Checklist'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Floater - Weekday AM" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
        </div>
        <div>
          <Label htmlFor="role_type">Role Type</Label>
          <Select value={formData.role_type} onValueChange={(value) => setFormData({ ...formData, role_type: value as BoHChecklist['role_type'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shift_time">Shift Time</Label>
            <Select value={formData.shift_time} onValueChange={(value) => setFormData({ ...formData, shift_time: value as 'AM' | 'PM' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <Switch id="is_weekend" checked={formData.is_weekend} onCheckedChange={(checked) => setFormData({ ...formData, is_weekend: checked })} />
            <Label htmlFor="is_weekend">Weekend</Label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
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
  existingTimeHints = [],
  onSave,
  onClose,
}: {
  item: BoHChecklistItem | null;
  existingTimeHints?: string[];
  onSave: (data: Partial<BoHChecklistItem>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<BoHChecklistItem & { metadata?: any }>>(
    item || { task_description: '', task_type: 'checkbox', time_hint: '', category: '', color: 'gray', is_high_priority: false, required: false, label_spanish: '', is_class_triggered: false, metadata: {} }
  );

  const metadata = formData.metadata || {};
  const setMetadata = (updates: Record<string, any>) => setFormData({ ...formData, metadata: { ...metadata, ...updates } });

  useEffect(() => {
    if (item) { setFormData(item); } else { setFormData({ task_description: '', task_type: 'checkbox', time_hint: '', category: '', color: 'gray', is_high_priority: false, required: false, label_spanish: '', is_class_triggered: false, metadata: {} }); }
  }, [item]);

  const taskType = formData.task_type || 'checkbox';

  const taskTypeDescriptions: Record<string, string> = {
    checkbox: 'A simple check/uncheck task.', photo: 'Requires the user to upload a photo as proof of completion.', signature: 'Requires a signature to confirm completion.', free_response: 'Open-ended text response (multi-line).', short_entry: 'Short text input (single line).', multiple_choice: 'User selects from predefined answer options.', yes_no: 'Simple Yes or No question.', header: 'A section header (not a task) — used to organize items visually.', employee: 'Employee name entry field.',
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit Item' : 'Create New Item'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="task_type">Task Type</Label>
          <Select value={taskType} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">{taskTypeDescriptions[taskType]}</p>
        </div>

        <div>
          <Label htmlFor="task_description">{taskType === 'header' ? 'Header Text' : 'Task Description'}</Label>
          <Textarea id="task_description" value={formData.task_description} onChange={(e) => setFormData({ ...formData, task_description: e.target.value })} placeholder={taskType === 'header' ? 'Enter section header text' : 'Enter task description'} rows={taskType === 'header' ? 1 : 3} />
        </div>

        {taskType === 'multiple_choice' && (<BoHMultipleChoiceConfig metadata={metadata} setMetadata={setMetadata} />)}

        {taskType === 'yes_no' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="yes_label">Yes Label</Label><Input id="yes_label" value={metadata.yes_label || ''} onChange={(e) => setMetadata({ yes_label: e.target.value })} placeholder="Yes" /></div>
            <div><Label htmlFor="no_label">No Label</Label><Input id="no_label" value={metadata.no_label || ''} onChange={(e) => setMetadata({ no_label: e.target.value })} placeholder="No" /></div>
          </div>
        )}

        {taskType === 'photo' && (<div><Label htmlFor="photo_instructions">Photo Instructions (Optional)</Label><Input id="photo_instructions" value={metadata.photo_instructions || ''} onChange={(e) => setMetadata({ photo_instructions: e.target.value })} placeholder="e.g., Take a photo of the area" /></div>)}

        {taskType === 'short_entry' && (<div><Label htmlFor="placeholder_text">Placeholder Text (Optional)</Label><Input id="placeholder_text" value={metadata.placeholder || ''} onChange={(e) => setMetadata({ placeholder: e.target.value })} placeholder="e.g., Enter temperature reading" /></div>)}

        {taskType === 'free_response' && (<div><Label htmlFor="placeholder_text">Placeholder Text (Optional)</Label><Input id="placeholder_text" value={metadata.placeholder || ''} onChange={(e) => setMetadata({ placeholder: e.target.value })} placeholder="e.g., Describe any issues observed" /></div>)}

        {taskType !== 'header' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time_hint">Time Hint</Label>
                <Input id="time_hint" list="boh-time-hint-suggestions" value={formData.time_hint || ''} onChange={(e) => setFormData({ ...formData, time_hint: e.target.value })} placeholder="e.g., 7:00 AM - 8:00 AM" />
                <datalist id="boh-time-hint-suggestions">{existingTimeHints.map((hint) => (<option key={hint} value={hint} />))}</datalist>
              </div>
              <div>
                <Label htmlFor="label_spanish">Spanish Label (Optional)</Label>
                <Input id="label_spanish" value={formData.label_spanish || ''} onChange={(e) => setFormData({ ...formData, label_spanish: e.target.value })} placeholder="Spanish translation" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2"><Switch id="is_high_priority" checked={formData.is_high_priority} onCheckedChange={(checked) => setFormData({ ...formData, is_high_priority: checked })} /><Label htmlFor="is_high_priority">High Priority</Label></div>
              <div className="flex items-center space-x-2"><Switch id="is_class_triggered" checked={formData.is_class_triggered} onCheckedChange={(checked) => setFormData({ ...formData, is_class_triggered: checked })} /><Label htmlFor="is_class_triggered">Class Triggered</Label></div>
            </div>
          </>
        )}

        {taskType === 'header' && (
          <div>
            <Label htmlFor="time_hint">Time Hint</Label>
            <Input id="time_hint" list="boh-time-hint-suggestions" value={formData.time_hint || ''} onChange={(e) => setFormData({ ...formData, time_hint: e.target.value })} placeholder="e.g., 7:00 AM - 8:00 AM" />
            <datalist id="boh-time-hint-suggestions">{existingTimeHints.map((hint) => (<option key={hint} value={hint} />))}</datalist>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function BoHMultipleChoiceConfig({ metadata, setMetadata }: { metadata: Record<string, any>; setMetadata: (updates: Record<string, any>) => void; }) {
  const options: string[] = metadata.options || [];
  const selectMode: 'single' | 'multiple' = metadata.select_mode || 'single';
  const [newOption, setNewOption] = useState('');
  const addOption = () => { const trimmed = newOption.trim(); if (trimmed && !options.includes(trimmed)) { setMetadata({ options: [...options, trimmed] }); setNewOption(''); } };
  const removeOption = (index: number) => { setMetadata({ options: options.filter((_, i) => i !== index) }); };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <Label>Selection Mode</Label>
        <Select value={selectMode} onValueChange={(value) => setMetadata({ select_mode: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Select One</SelectItem><SelectItem value="multiple">Select All That Apply</SelectItem></SelectContent></Select>
      </div>
      <div>
        <Label>Answer Options</Label>
        <div className="flex gap-2 mt-1">
          <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Add an option..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }} />
          <Button type="button" size="sm" variant="outline" onClick={addOption}><Plus className="h-3 w-3" /></Button>
        </div>
        {options.length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{options.map((opt, i) => (<Badge key={i} variant="secondary" className="gap-1 pr-1">{opt}<button type="button" onClick={() => removeOption(i)} className="ml-1 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button></Badge>))}</div>)}
        {options.length === 0 && (<p className="text-xs text-muted-foreground mt-1">No options added yet. Add at least 2 options.</p>)}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface BulkAddItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId: string;
  currentItemCount: number;
  existingTimeHints: string[];
  createItem: (data: any) => Promise<any>;
}

export function BulkAddItemsDialog({
  open,
  onOpenChange,
  checklistId,
  currentItemCount,
  existingTimeHints,
  createItem,
}: BulkAddItemsDialogProps) {
  const { toast } = useToast();
  const [timeHint, setTimeHint] = useState('');
  const [taskType, setTaskType] = useState('checkbox');
  const [category, setCategory] = useState('');
  const [rows, setRows] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const addRow = () => setRows([...rows, '']);
  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };
  const updateRow = (index: number, value: string) => {
    const updated = [...rows];
    updated[index] = value;
    setRows(updated);
  };

  const reset = () => {
    setTimeHint('');
    setTaskType('checkbox');
    setCategory('');
    setRows(['', '']);
  };

  const handleSave = async () => {
    const descriptions = rows.map(r => r.trim()).filter(r => r.length > 0);
    if (descriptions.length === 0) {
      toast({ title: 'No items to add', description: 'Enter at least one item description.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      for (let i = 0; i < descriptions.length; i++) {
        await createItem({
          checklist_id: checklistId,
          task_description: descriptions[i],
          task_type: taskType,
          time_hint: timeHint || null,
          category: category || null,
          sort_order: currentItemCount + i,
        });
      }
      toast({ title: `${descriptions.length} item${descriptions.length > 1 ? 's' : ''} added successfully` });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error adding items', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shared settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bulk-time-hint">Time Hint</Label>
              <Input
                id="bulk-time-hint"
                list="bulk-time-hint-suggestions"
                value={timeHint}
                onChange={(e) => setTimeHint(e.target.value)}
                placeholder="e.g., 7:00 AM - 8:00 AM"
              />
              <datalist id="bulk-time-hint-suggestions">
                {existingTimeHints.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="bulk-category">Category</Label>
              <Input
                id="bulk-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Cleaning"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bulk-task-type">Task Type (applies to all)</Label>
            <Select value={taskType} onValueChange={setTaskType}>
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

          {/* Dynamic rows */}
          <div>
            <Label>Item Descriptions</Label>
            <div className="space-y-2 mt-1">
              {rows.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={row}
                    onChange={(e) => updateRow(index, e.target.value)}
                    placeholder={`Item ${index + 1} description`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 1}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add {rows.filter(r => r.trim()).length} Item{rows.filter(r => r.trim()).length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

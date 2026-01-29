import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseInput, EXPENSE_CATEGORIES } from "@/hooks/useExpenses";
import { LOCATIONS } from "@/hooks/useAssets";
import { Asset } from "@/hooks/useAssets";
import { format } from "date-fns";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets?: Asset[];
  onSave: (data: ExpenseInput) => void;
  isLoading?: boolean;
}

export function ExpenseDialog({ open, onOpenChange, assets, onSave, isLoading }: ExpenseDialogProps) {
  const [formData, setFormData] = useState<ExpenseInput>({
    asset_id: null,
    category: "",
    location: "",
    amount: 0,
    description: "",
    expense_date: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    if (open) {
      setFormData({
        asset_id: null,
        category: "",
        location: "",
        amount: 0,
        description: "",
        expense_date: format(new Date(), "yyyy-MM-dd")
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAssetSelect = (assetId: string) => {
    if (assetId === "none") {
      setFormData(prev => ({ ...prev, asset_id: null }));
      return;
    }
    
    const asset = assets?.find(a => a.id === assetId);
    if (asset) {
      setFormData(prev => ({
        ...prev,
        asset_id: assetId,
        location: asset.location
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            Log Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Related Asset (Optional)</Label>
              <Select
                value={formData.asset_id || "none"}
                onValueChange={handleAssetSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific asset</SelectItem>
                  {assets?.filter(a => a.status === "active").map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What was this expense for?"
                rows={3}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.category || !formData.location || formData.amount <= 0 || !formData.description}
            >
              Log Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

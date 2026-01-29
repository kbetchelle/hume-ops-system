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
import { Asset, AssetInput, ASSET_CATEGORIES, LOCATIONS, ASSET_STATUSES } from "@/hooks/useAssets";
import { format } from "date-fns";

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  onSave: (data: AssetInput) => void;
  isLoading?: boolean;
}

export function AssetDialog({ open, onOpenChange, asset, onSave, isLoading }: AssetDialogProps) {
  const [formData, setFormData] = useState<AssetInput>({
    name: "",
    category: "",
    location: "",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
    purchase_price: 0,
    current_value: 0,
    depreciation_rate: 10,
    status: "active",
    notes: ""
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        category: asset.category,
        location: asset.location,
        purchase_date: asset.purchase_date,
        purchase_price: asset.purchase_price,
        current_value: asset.current_value,
        depreciation_rate: asset.depreciation_rate,
        status: asset.status,
        notes: asset.notes || ""
      });
    } else {
      setFormData({
        name: "",
        category: "",
        location: "",
        purchase_date: format(new Date(), "yyyy-MM-dd"),
        purchase_price: 0,
        current_value: 0,
        depreciation_rate: 10,
        status: "active",
        notes: ""
      });
    }
  }, [asset, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      purchase_price: price,
      current_value: prev.current_value === prev.purchase_price ? price : prev.current_value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            {asset ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Asset Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Treadmill #5"
                required
              />
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
                    {ASSET_CATEGORIES.map(cat => (
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
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Purchase Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Current Value ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_value: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label>Depreciation (%/yr)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.depreciation_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, depreciation_rate: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the asset..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.category || !formData.location}>
              {asset ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

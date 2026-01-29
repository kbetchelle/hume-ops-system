import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { selectFrom, insertInto, updateTable, eq } from "@/lib/dataApi";
import { supabase } from "@/integrations/supabase/client";

interface LostFoundItem {
  id: string;
  description: string;
  location_found: string | null;
  date_found: string;
  found_by_id: string | null;
  found_by_name: string | null;
  status: "unclaimed" | "claimed" | "disposed";
  claimed_by: string | null;
  claimed_date: string | null;
  notes: string | null;
  created_at: string;
}

type StatusFilter = "all" | "unclaimed" | "claimed" | "disposed";

export function LostAndFoundTab() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    location_found: "",
    notes: "",
  });
  const [claimantName, setClaimantName] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<LostFoundItem>("lost_and_found", {
      order: { column: "created_at", ascending: false },
    });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_found?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unclaimed":
        return <Badge className="rounded-none bg-warning text-warning-foreground">Unclaimed</Badge>;
      case "claimed":
        return <Badge className="rounded-none bg-primary text-primary-foreground">Claimed</Badge>;
      case "disposed":
        return <Badge className="rounded-none bg-muted text-muted-foreground">Disposed</Badge>;
      default:
        return null;
    }
  };

  const handleAddItem = async () => {
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userData.user?.id)
      .single();

    const { error } = await insertInto("lost_and_found", {
      description: formData.description,
      location_found: formData.location_found || null,
      notes: formData.notes || null,
      date_found: format(new Date(), "yyyy-MM-dd"),
      found_by_id: userData.user?.id,
      found_by_name: profile?.full_name || "Staff",
      status: "unclaimed",
    });

    if (error) {
      toast.error("Failed to log item");
    } else {
      toast.success("Item logged successfully");
      setIsAddDialogOpen(false);
      setFormData({ description: "", location_found: "", notes: "" });
      fetchItems();
    }
  };

  const handleClaim = async () => {
    if (!selectedItem || !claimantName.trim()) {
      toast.error("Claimant name is required");
      return;
    }

    const { error } = await updateTable(
      "lost_and_found",
      {
        status: "claimed",
        claimed_by: claimantName,
        claimed_date: format(new Date(), "yyyy-MM-dd"),
      },
      [eq("id", selectedItem.id)]
    );

    if (error) {
      toast.error("Failed to update item");
    } else {
      toast.success("Item marked as claimed");
      setIsClaimDialogOpen(false);
      setSelectedItem(null);
      setClaimantName("");
      fetchItems();
    }
  };

  const handleDispose = async (item: LostFoundItem) => {
    const { error } = await updateTable(
      "lost_and_found",
      { status: "disposed" },
      [eq("id", item.id)]
    );

    if (error) {
      toast.error("Failed to update item");
    } else {
      toast.success("Item marked as disposed");
      fetchItems();
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Lost & Found
          </CardTitle>
          <Button
            size="sm"
            className="rounded-none h-8"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Log Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 rounded-none text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px] rounded-none text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="unclaimed" className="text-xs">Unclaimed</SelectItem>
                <SelectItem value="claimed" className="text-xs">Claimed</SelectItem>
                <SelectItem value="disposed" className="text-xs">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No items found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{item.description}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {item.location_found && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location_found}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.date_found), "MMM d, yyyy")}
                        </span>
                        {item.found_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Found by {item.found_by_name}
                          </span>
                        )}
                      </div>
                      {item.status === "claimed" && item.claimed_by && (
                        <p className="text-xs text-primary mt-1">
                          Claimed by {item.claimed_by} on{" "}
                          {item.claimed_date
                            ? format(new Date(item.claimed_date), "MMM d, yyyy")
                            : ""}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    {item.status === "unclaimed" && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-none text-xs"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsClaimDialogOpen(true);
                          }}
                        >
                          Claim
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-none text-xs"
                          onClick={() => handleDispose(item)}
                        >
                          Dispose
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Log Found Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Description *</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Black wallet with ID"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location Found</Label>
              <Input
                value={formData.location_found}
                onChange={(e) =>
                  setFormData({ ...formData, location_found: e.target.value })
                }
                placeholder="e.g., Main gym floor"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional details..."
                className="rounded-none text-xs min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="rounded-none">
              Log Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Claim Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Item: {selectedItem.description}
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Claimant Name *</Label>
              <Input
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                placeholder="Name of person claiming item"
                className="rounded-none text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsClaimDialogOpen(false);
                setSelectedItem(null);
                setClaimantName("");
              }}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button onClick={handleClaim} className="rounded-none">
              Mark as Claimed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

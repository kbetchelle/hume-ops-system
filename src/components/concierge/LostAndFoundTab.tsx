import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Calendar, User, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { selectFrom, insertInto, updateTable, eq } from "@/lib/dataApi";
import { supabase } from "@/integrations/supabase/client";
import { compressPhoto, generatePhotoFilename } from "@/lib/compressPhoto";
import { Constants } from "@/integrations/supabase/types";

type LostAndFoundCategory = (typeof Constants.public.Enums.lost_and_found_category)[number];

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
  photo_url: string | null;
  object_category: LostAndFoundCategory | null;
  member_requested: boolean;
}

type StatusFilter = "all" | "unclaimed" | "claimed" | "disposed";

const CATEGORY_LABELS: Record<LostAndFoundCategory, string> = {
  wallet: "Wallet",
  keys: "Keys",
  phone: "Phone",
  clothing: "Clothing",
  jewelry: "Jewelry",
  bag: "Bag",
  water_bottle: "Water Bottle",
  other: "Other",
};

interface MemberRequest {
  id: string;
  description: string;
  member_name: string | null;
  member_contact: string | null;
  date_inquired: string | null;
  notes: string | null;
  status: string | null;
  matched_item_id: string | null;
  created_at: string;
  updated_at: string;
}

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
    date_found: format(new Date(), "yyyy-MM-dd"),
    photo_url: "" as string | null,
    object_category: "" as LostAndFoundCategory | "",
    member_requested: false,
  });
  const [claimantName, setClaimantName] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Member requests state
  const [requests, setRequests] = useState<MemberRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [isAddRequestDialogOpen, setIsAddRequestDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [selectedRequestForMatch, setSelectedRequestForMatch] = useState<MemberRequest | null>(null);
  const [matchItemId, setMatchItemId] = useState<string>("");
  const [requestForm, setRequestForm] = useState({
    description: "",
    member_name: "",
    member_contact: "",
    date_inquired: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  useEffect(() => {
    fetchItems();
    fetchRequests();
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

  const fetchRequests = async () => {
    setRequestsLoading(true);
    const { data, error } = await selectFrom<MemberRequest>("lost_and_found_member_requests", {
      order: { column: "created_at", ascending: false },
    });
    if (!error && data) {
      setRequests(data);
    }
    setRequestsLoading(false);
  };

  const handleAddRequest = async () => {
    if (!requestForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await insertInto("lost_and_found_member_requests", {
      description: requestForm.description,
      member_name: requestForm.member_name || null,
      member_contact: requestForm.member_contact || null,
      date_inquired: requestForm.date_inquired || null,
      notes: requestForm.notes || null,
      status: "open",
      created_by_id: userData.user?.id ?? null,
    });
    if (error) {
      toast.error("Failed to add request");
    } else {
      toast.success("Request added");
      setIsAddRequestDialogOpen(false);
      setRequestForm({
        description: "",
        member_name: "",
        member_contact: "",
        date_inquired: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      fetchRequests();
    }
  };

  const handleMatchToItem = async () => {
    if (!selectedRequestForMatch || !matchItemId) {
      toast.error("Select an item to match");
      return;
    }
    const { error: updateRequestError } = await updateTable(
      "lost_and_found_member_requests",
      { status: "matched", matched_item_id: matchItemId, updated_at: new Date().toISOString() },
      [eq("id", selectedRequestForMatch.id)]
    );
    if (updateRequestError) {
      toast.error("Failed to match request");
      return;
    }
    const { error: updateItemError } = await updateTable(
      "lost_and_found",
      { member_requested: true },
      [eq("id", matchItemId)]
    );
    if (updateItemError) {
      toast.error("Request matched but could not update item");
    } else {
      toast.success("Request matched to item");
    }
    setIsMatchDialogOpen(false);
    setSelectedRequestForMatch(null);
    setMatchItemId("");
    fetchRequests();
    fetchItems();
  };

  const unclaimedItems = useMemo(() => items.filter((i) => i.status === "unclaimed"), [items]);

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const compressed = await compressPhoto(file);
      const filename = generatePhotoFilename(compressed.format === "webp" ? "webp" : "jpeg");
      const filePath = `items/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("lost-and-found-photos")
        .upload(filePath, compressed.blob, { contentType: compressed.blob.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("lost-and-found-photos").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, photo_url: data.publicUrl }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
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
      date_found: formData.date_found,
      found_by_id: userData.user?.id,
      found_by_name: profile?.full_name || "Staff",
      status: "unclaimed",
      photo_url: formData.photo_url || null,
      object_category: formData.object_category || null,
      member_requested: formData.member_requested,
    });

    if (error) {
      toast.error("Failed to log item");
    } else {
      toast.success("Item logged successfully");
      setIsAddDialogOpen(false);
      setFormData({
        description: "",
        location_found: "",
        notes: "",
        date_found: format(new Date(), "yyyy-MM-dd"),
        photo_url: null,
        object_category: "",
        member_requested: false,
      });
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
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="w-full rounded-none mb-4">
          <TabsTrigger value="items" className="flex-1 rounded-none text-xs">
            Found items
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 rounded-none text-xs">
            Member requests
          </TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-0">
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
                    {item.photo_url && (
                      <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted">
                        <img
                          src={item.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium">{item.description}</p>
                        {getStatusBadge(item.status)}
                        {item.object_category && (
                          <Badge variant="outline" className="rounded-none text-[10px] font-normal">
                            {CATEGORY_LABELS[item.object_category]}
                          </Badge>
                        )}
                        {item.member_requested && (
                          <Badge variant="secondary" className="rounded-none text-[10px] font-normal">
                            Member inquired
                          </Badge>
                        )}
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
        </TabsContent>
        <TabsContent value="requests" className="mt-0">
      <Card className="rounded-none border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Member requests
          </CardTitle>
          <Button
            size="sm"
            className="rounded-none h-8"
            onClick={() => setIsAddRequestDialogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add request
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : requests.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No member requests
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{req.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {req.status === "open" && (
                          <Badge className="rounded-none bg-amber-500/20 text-amber-700 dark:text-amber-400">Open</Badge>
                        )}
                        {req.status === "matched" && (
                          <Badge className="rounded-none bg-primary/20 text-primary">Matched</Badge>
                        )}
                        {req.status === "closed" && (
                          <Badge className="rounded-none bg-muted">Closed</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {req.member_name && <span>Member: {req.member_name}</span>}
                        {req.member_contact && <span>{req.member_contact}</span>}
                        {req.date_inquired && (
                          <span>{format(new Date(req.date_inquired), "MMM d, yyyy")}</span>
                        )}
                      </div>
                      {req.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{req.notes}</p>
                      )}
                    </div>
                    {req.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-none text-xs"
                        onClick={() => {
                          setSelectedRequestForMatch(req);
                          setIsMatchDialogOpen(true);
                          setMatchItemId("");
                        }}
                      >
                        Match to item
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-none max-h-[90vh] overflow-y-auto">
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
            <div className="flex gap-4">
              <div className="space-y-2 w-1/2">
                <Label className="text-xs">Date found</Label>
                <Input
                  type="date"
                  value={formData.date_found}
                  onChange={(e) =>
                    setFormData({ ...formData, date_found: e.target.value })
                  }
                  className="rounded-none text-xs"
                />
              </div>
              <div className="space-y-2 w-1/2 flex flex-col items-end">
                <Label className="text-xs">Photo (optional)</Label>
              {formData.photo_url ? (
                <div className="flex items-center gap-2">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none text-xs"
                    onClick={() => setFormData({ ...formData, photo_url: null })}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs"
                  disabled={photoUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoUploading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3 w-3 mr-1" />
                  )}
                  Add photo
                </Button>
              )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location found</Label>
              <Input
                value={formData.location_found}
                onChange={(e) =>
                  setFormData({ ...formData, location_found: e.target.value })
                }
                placeholder="e.g., Main gym floor"
                className="rounded-none text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="member-requested"
                checked={formData.member_requested}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, member_requested: !!checked })
                }
              />
              <Label htmlFor="member-requested" className="text-xs font-normal cursor-pointer">
                Member inquired about this item
              </Label>
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

      {/* Add Member Request Dialog */}
      <Dialog open={isAddRequestDialogOpen} onOpenChange={setIsAddRequestDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Add member request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Description *</Label>
              <Input
                value={requestForm.description}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, description: e.target.value })
                }
                placeholder="e.g., Black wallet"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Member name</Label>
              <Input
                value={requestForm.member_name}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, member_name: e.target.value })
                }
                placeholder="Name of member"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Member contact</Label>
              <Input
                value={requestForm.member_contact}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, member_contact: e.target.value })
                }
                placeholder="Email or phone"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date inquired</Label>
              <Input
                type="date"
                value={requestForm.date_inquired}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, date_inquired: e.target.value })
                }
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, notes: e.target.value })
                }
                placeholder="Any details..."
                className="rounded-none text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddRequestDialogOpen(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button onClick={handleAddRequest} className="rounded-none">
              Add request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match to item Dialog */}
      <Dialog
        open={isMatchDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsMatchDialogOpen(false);
            setSelectedRequestForMatch(null);
            setMatchItemId("");
          }
        }}
      >
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Match request to item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequestForMatch && (
              <p className="text-xs text-muted-foreground">
                Request: {selectedRequestForMatch.description}
                {selectedRequestForMatch.member_name && ` (${selectedRequestForMatch.member_name})`}
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Select unclaimed item *</Label>
              <Select
                value={matchItemId || "none"}
                onValueChange={(v) => setMatchItemId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="rounded-none text-xs">
                  <SelectValue placeholder="Choose item" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="none" className="text-xs">
                    —
                  </SelectItem>
                  {unclaimedItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      {item.description}
                      {item.object_category && ` (${CATEGORY_LABELS[item.object_category]})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMatchDialogOpen(false);
                setSelectedRequestForMatch(null);
                setMatchItemId("");
              }}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMatchToItem}
              disabled={!matchItemId}
              className="rounded-none"
            >
              Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

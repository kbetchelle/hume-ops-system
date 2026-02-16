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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, MapPin, Calendar, User, ImagePlus, X, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
  in_safe: boolean;
}

type StatusFilter = "all" | "unclaimed" | "claimed" | "disposed";
type SortColumn = "description" | "object_category" | "in_safe" | "date_found";
type SortDir = "asc" | "desc";

const CATEGORY_LABELS: Record<LostAndFoundCategory, string> = {
  bag: "Bag",
  jewelry: "Jewelry",
  keys: "Keys",
  wallet: "Wallet",
  tech_headphones: "Tech/Headphones",
  other: "Other",
  phone: "Phone",
  clothing: "Clothing",
  water_bottle: "Water Bottle",
};

const VISIBLE_CATEGORIES: LostAndFoundCategory[] = [
  "bag",
  "jewelry",
  "keys",
  "wallet",
  "tech_headphones",
  "other",
];

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [inSafeFilter, setInSafeFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("date_found");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    location_found: "",
    notes: "",
    date_found: format(new Date(), "yyyy-MM-dd"),
    photo_url: "" as string | null,
    object_category: "" as LostAndFoundCategory | "",
    member_requested: false,
    in_safe: false,
  });
  const [claimantName, setClaimantName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_found?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.object_category === categoryFilter;
      const matchesInSafe =
        inSafeFilter === "all" ||
        (inSafeFilter === "yes" && item.in_safe) ||
        (inSafeFilter === "no" && !item.in_safe);
      return matchesSearch && matchesStatus && matchesCategory && matchesInSafe;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "description":
          cmp = a.description.localeCompare(b.description);
          break;
        case "object_category":
          cmp = (a.object_category || "").localeCompare(b.object_category || "");
          break;
        case "in_safe":
          cmp = (a.in_safe ? 1 : 0) - (b.in_safe ? 1 : 0);
          break;
        case "date_found":
          cmp = new Date(a.date_found).getTime() - new Date(b.date_found).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [items, searchQuery, statusFilter, categoryFilter, inSafeFilter, sortColumn, sortDir]);

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDir(col === "date_found" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

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
      in_safe: formData.in_safe,
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
        in_safe: false,
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

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedItems.map((i) => i.id)));
    }
  };

  const handleBulkClaim = async () => {
    if (selectedIds.size === 0) return;
    let successCount = 0;
    for (const id of selectedIds) {
      const { error } = await updateTable(
        "lost_and_found",
        { status: "claimed", claimed_by: "Bulk claim", claimed_date: format(new Date(), "yyyy-MM-dd") },
        [eq("id", id)]
      );
      if (!error) successCount++;
    }
    toast.success(`${successCount} item(s) marked as claimed`);
    setSelectedIds(new Set());
    fetchItems();
  };

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    let successCount = 0;
    for (const id of selectedIds) {
      const { error } = await updateTable(
        "lost_and_found",
        { status: "disposed" },
        [eq("id", id)]
      );
      if (!error) successCount++;
    }
    toast.success(`${successCount} item(s) removed from L&F`);
    setSelectedIds(new Set());
    fetchItems();
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold normal-case tracking-normal">
            Please add valuable items found in the space to the tracker below (not water bottles, clothes, or shoes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + filters + add button */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 rounded-none text-xs"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-none text-xs w-[140px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {VISIBLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={inSafeFilter} onValueChange={setInSafeFilter}>
              <SelectTrigger className="rounded-none text-xs w-[120px] h-9">
                <SelectValue placeholder="In Safe?" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="yes" className="text-xs">In Safe</SelectItem>
                <SelectItem value="no" className="text-xs">Not in Safe</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="rounded-none h-9"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Log Item
            </Button>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" className="rounded-none h-7 text-xs" onClick={handleBulkClaim}>
                Mark as Claimed
              </Button>
              <Button size="sm" variant="destructive" className="rounded-none h-7 text-xs" onClick={handleBulkRemove}>
                Remove from L&F
              </Button>
            </div>
          )}

          {/* Table */}
          {filteredAndSortedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No items found
            </p>
          ) : (
            <Table>
              <TableHeader className="border">
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead
                    className="cursor-pointer select-none text-xs"
                    onClick={() => toggleSort("description")}
                  >
                    <span className="flex items-center">Item Name <SortIcon col="description" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs"
                    onClick={() => toggleSort("object_category")}
                  >
                    <span className="flex items-center">Category <SortIcon col="object_category" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[90px]"
                    onClick={() => toggleSort("in_safe")}
                  >
                    <span className="flex items-center">In Safe? <SortIcon col="in_safe" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs"
                    onClick={() => toggleSort("date_found")}
                  >
                    <span className="flex items-center">Found Date <SortIcon col="date_found" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-medium">{item.description}</TableCell>
                    <TableCell className="text-xs">
                      {item.object_category ? CATEGORY_LABELS[item.object_category] : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.in_safe ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(item.date_found), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDetailDialogOpen(false);
          setSelectedItem(null);
        }
      }}>
        <DialogContent className="rounded-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Item Details
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-2">
              {selectedItem.photo_url && (
                <div className="w-full max-h-64 rounded overflow-hidden bg-muted">
                  <img
                    src={selectedItem.photo_url}
                    alt={selectedItem.description}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Item Name</p>
                  <p className="font-medium">{selectedItem.description}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {selectedItem.object_category ? CATEGORY_LABELS[selectedItem.object_category] : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">In Safe?</p>
                  <p className="font-medium">{selectedItem.in_safe ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Found Date</p>
                  <p className="font-medium">{format(new Date(selectedItem.date_found), "MMM d, yyyy")}</p>
                </div>
                {selectedItem.found_by_name && (
                  <div>
                    <p className="text-muted-foreground">Found By</p>
                    <p className="font-medium">{selectedItem.found_by_name}</p>
                  </div>
                )}
                {selectedItem.location_found && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Location / Notes</p>
                    <p className="font-medium">{selectedItem.location_found}</p>
                  </div>
                )}
                {selectedItem.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Additional Notes</p>
                    <p className="font-medium italic">{selectedItem.notes}</p>
                  </div>
                )}
                {selectedItem.status === "claimed" && selectedItem.claimed_by && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Claimed By</p>
                    <p className="font-medium">
                      {selectedItem.claimed_by}
                      {selectedItem.claimed_date &&
                        ` on ${format(new Date(selectedItem.claimed_date), "MMM d, yyyy")}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedItem?.status === "unclaimed" && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    setIsClaimDialogOpen(true);
                  }}
                >
                  Claim
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none text-xs"
                  onClick={() => {
                    if (selectedItem) handleDispose(selectedItem);
                    setIsDetailDialogOpen(false);
                  }}
                >
                  Dispose
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label className="text-xs">Object category</Label>
              <Select
                value={formData.object_category || "none"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    object_category: v === "none" ? "" : (v as LostAndFoundCategory),
                  })
                }
              >
                <SelectTrigger className="rounded-none text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="none" className="text-xs">
                    None
                  </SelectItem>
                  {VISIBLE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="in-safe"
                checked={formData.in_safe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, in_safe: !!checked })
                }
              />
              <Label htmlFor="in-safe" className="text-xs cursor-pointer">
                Item is in the safe
              </Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location Found / Notes</Label>
              <Textarea
                value={formData.location_found}
                onChange={(e) =>
                  setFormData({ ...formData, location_found: e.target.value })
                }
                placeholder="e.g., Main gym floor, any additional details..."
                className="rounded-none text-xs min-h-[60px]"
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

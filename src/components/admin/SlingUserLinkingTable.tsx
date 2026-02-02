import { useState, useMemo } from "react";
import {
  useUsersWithSlingInfo,
  useSearchSlingUsers,
  useLinkUserToSling,
  UserWithSlingInfo,
  SlingUserSearchResult,
} from "@/hooks/useSlingUserLinking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Link2, Unlink, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";

const ITEMS_PER_PAGE = 10;

export function SlingUserLinkingTable() {
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  
  const [linkingUser, setLinkingUser] = useState<UserWithSlingInfo | null>(null);
  const [slingSearch, setSlingSearch] = useState("");
  const [debouncedSlingSearch] = useDebounce(slingSearch, 300);
  
  const { data: users, isLoading } = useUsersWithSlingInfo();
  const { data: slingUsers, isLoading: isSearchingSling } = useSearchSlingUsers(debouncedSlingSearch);
  const linkMutation = useLinkUserToSling();

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let result = users;
    
    // Apply status filter
    if (filterStatus === "linked") {
      result = result.filter((u) => u.sling_id);
    } else if (filterStatus === "unlinked") {
      result = result.filter((u) => !u.sling_id);
    }
    
    // Apply search
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(search) ||
          u.full_name?.toLowerCase().includes(search) ||
          u.sling_user_name?.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [users, filterStatus, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const handleLink = async (slingUser: SlingUserSearchResult) => {
    if (!linkingUser) return;
    
    try {
      await linkMutation.mutateAsync({
        userId: linkingUser.user_id,
        slingId: slingUser.id,
      });
      toast.success(`Linked ${linkingUser.full_name || linkingUser.email} to ${slingUser.full_name}`);
      setLinkingUser(null);
      setSlingSearch("");
    } catch (error: any) {
      toast.error(error.message || "Failed to link user");
    }
  };

  const handleUnlink = async (user: UserWithSlingInfo) => {
    try {
      await linkMutation.mutateAsync({
        userId: user.user_id,
        slingId: null,
      });
      toast.success(`Unlinked ${user.full_name || user.email} from Sling`);
    } catch (error: any) {
      toast.error(error.message || "Failed to unlink user");
    }
  };

  const openLinkDialog = (user: UserWithSlingInfo) => {
    setLinkingUser(user);
    setSlingSearch(user.email || "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Filter
          </span>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as any); setPage(0); }}>
            <SelectTrigger className="w-32 rounded-none border-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-foreground">
              <SelectItem value="all" className="text-[10px] uppercase tracking-widest">All</SelectItem>
              <SelectItem value="linked" className="text-[10px] uppercase tracking-widest">Linked</SelectItem>
              <SelectItem value="unlinked" className="text-[10px] uppercase tracking-widest">Unlinked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="pl-5"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-[10px] text-muted-foreground tracking-wide">
        <span>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
        <span>{users?.filter((u) => u.sling_id).length || 0} linked</span>
        <span>{users?.filter((u) => !u.sling_id).length || 0} unlinked</span>
      </div>

      {/* Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                User
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Sling Account
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Status
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    No users found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.user_id} className="border-b border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-xs tracking-wide">{user.full_name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wide">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.sling_id ? (
                      <div className="space-y-1">
                        <p className="text-xs tracking-wide">{user.sling_user_name}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wide">{user.sling_email}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Not linked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.sling_id ? (
                      user.is_auto_matched ? (
                        <Badge variant="secondary" className="text-[8px]">
                          <Check className="h-2 w-2 mr-1" />
                          Auto-matched
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px]">
                          Manual
                        </Badge>
                      )
                    ) : (
                      <Badge variant="destructive" className="text-[8px]">
                        Unlinked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLinkDialog(user)}
                        className="h-8 w-8"
                        title={user.sling_id ? "Change link" : "Link to Sling"}
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                      {user.sling_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnlink(user)}
                          disabled={linkMutation.isPending}
                          className="h-8 w-8"
                          title="Unlink"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground tracking-wide">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 rounded-none"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 rounded-none"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={!!linkingUser} onOpenChange={(open) => !open && setLinkingUser(null)}>
        <DialogContent className="rounded-none border-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
              Link to Sling Account
            </DialogTitle>
            <DialogDescription className="text-xs tracking-wide">
              Search and select a Sling user to link to{" "}
              <span className="font-medium">{linkingUser?.full_name || linkingUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search Sling users by name or email..."
                value={slingSearch}
                onChange={(e) => setSlingSearch(e.target.value)}
                className="pl-5"
              />
            </div>

            <div className="border border-border max-h-64 overflow-auto">
              {isSearchingSling ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : slingUsers && slingUsers.length > 0 ? (
                <div className="divide-y divide-border">
                  {slingUsers.map((slingUser) => (
                    <button
                      key={slingUser.id}
                      onClick={() => handleLink(slingUser)}
                      disabled={linkMutation.isPending}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs tracking-wide">{slingUser.full_name}</p>
                          <p className="text-[10px] text-muted-foreground tracking-wide">
                            {slingUser.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!slingUser.is_active && (
                            <Badge variant="outline" className="text-[8px]">
                              Inactive
                            </Badge>
                          )}
                          {linkingUser?.email?.toLowerCase() === slingUser.email?.toLowerCase() && (
                            <Badge variant="secondary" className="text-[8px]">
                              Email match
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {slingSearch ? "No Sling users found" : "Start typing to search"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Users, Check, X, Link2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSlingUsers, useSyncSlingUsers, useSyncStatus } from "@/hooks/useSlingApi";

export default function SlingUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users, isLoading: usersLoading, refetch } = useSlingUsers();
  const { data: syncStatus, isLoading: syncStatusLoading } = useSyncStatus();
  const syncUsers = useSyncSlingUsers();

  const filteredUsers = (users || []).filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSync = async () => {
    await syncUsers.mutateAsync();
    refetch();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-normal tracking-wide">Sling User Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage and sync users from GetSling scheduling system
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncUsers.isPending}
          className="rounded-none"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncUsers.isPending ? "animate-spin" : ""}`} />
          Sync Users
        </Button>
      </div>

      {/* Sync Status Card */}
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncStatusLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Last Sync
                </p>
                <p className="text-sm mt-1">{formatDateTime(syncStatus?.last_sync_at || null)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Status
                </p>
                <div className="mt-1">
                  {syncStatus?.last_sync_success ? (
                    <Badge variant="default" className="rounded-none text-[10px]">
                      <Check className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : syncStatus?.last_sync_success === false ? (
                    <Badge variant="destructive" className="rounded-none text-[10px]">
                      <X className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-none text-[10px]">
                      No sync yet
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Records Processed
                </p>
                <p className="text-sm mt-1">{syncStatus?.last_records_processed || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Sync Frequency
                </p>
                <p className="text-sm mt-1">{syncStatus?.sync_frequency_minutes || 30} min</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sling Users ({filteredUsers.length})
            </CardTitle>
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-8 text-xs rounded-none"
            />
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Sling ID
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Name
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Email
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Positions
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Linked
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">
                    Last Synced
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-xs font-mono">
                      {user.sling_user_id}
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.positions?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {user.positions.slice(0, 2).map((pos, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] rounded-none"
                            >
                              {pos}
                            </Badge>
                          ))}
                          {user.positions.length > 2 && (
                            <Badge variant="outline" className="text-[10px] rounded-none">
                              +{user.positions.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="default" className="text-[10px] rounded-none">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] rounded-none">
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.linked_staff_id ? (
                        <Badge variant="outline" className="text-[10px] rounded-none">
                          <Link2 className="h-3 w-3 mr-1" />
                          Linked
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.last_synced_at
                        ? format(new Date(user.last_synced_at), "MMM d, h:mm a")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      {searchTerm
                        ? "No users match your search."
                        : "No users synced yet. Click 'Sync Users' to fetch from Sling."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useClients, Client } from "@/hooks/useClients";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface ClientsTableProps {
  filterType?: string;
  emptyMessage?: string;
}

// Lifecycle stage badge styles
const stageStyles: Record<string, string> = {
  lead: "bg-secondary text-secondary-foreground",
  prospect: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  churned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ClientsTable({ filterType, emptyMessage = "No clients found" }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const { data: clients = [], isLoading, error } = useClients({ search });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter clients based on filterType if provided
  // For now, all pages show the same data since we don't have filter fields in arketa_clients
  // This can be customized once we have the proper fields
  const filteredClients = clients;

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load clients. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Lifecycle Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(client.client_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{client.client_name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.client_email}</TableCell>
                  <TableCell className="text-muted-foreground">{client.client_phone || "—"}</TableCell>
                  <TableCell>
                    {client.lifecycle_stage ? (
                      <Badge className={stageStyles[client.lifecycle_stage] || ""}>
                        {client.lifecycle_stage}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.created_at 
                      ? format(new Date(client.created_at), "MMM d, yyyy")
                      : "—"
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

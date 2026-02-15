import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Eye, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PackageWithRecipient } from "@/hooks/usePackages";
import { cn } from "@/lib/utils";

interface PackageTableProps {
  packages: PackageWithRecipient[];
  isLoading: boolean;
  selectedPackages: string[];
  onSelectPackage: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (pkg: PackageWithRecipient) => void;
  onMovePackage: (pkg: PackageWithRecipient) => void;
  onMarkPickedUp: (pkg: PackageWithRecipient) => void;
}

export function PackageTable({
  packages,
  isLoading,
  selectedPackages,
  onSelectPackage,
  onSelectAll,
  onViewDetails,
  onMovePackage,
  onMarkPickedUp,
}: PackageTableProps) {
  const allSelected = packages.length > 0 && selectedPackages.length === packages.length;
  const someSelected = selectedPackages.length > 0 && selectedPackages.length < packages.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No packages found</p>
      </div>
    );
  }

  const getRecipientDisplay = (pkg: PackageWithRecipient) => {
    if (pkg.recipient_profile) {
      return pkg.recipient_profile.full_name || pkg.recipient_profile.email;
    }
    return pkg.recipient_name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_pickup":
        return <Badge variant="default">Pending Pickup</Badge>;
      case "picked_up":
        return <Badge variant="secondary">Picked Up</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all packages"
                className={cn(
                  someSelected && "data-[state=checked]:bg-primary/50"
                )}
              />
            </TableHead>
            <TableHead>Tracking Code</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Arrived</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow
              key={pkg.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                selectedPackages.includes(pkg.id) && "bg-muted"
              )}
              onClick={() => onViewDetails(pkg)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedPackages.includes(pkg.id)}
                  onCheckedChange={() => onSelectPackage(pkg.id)}
                  aria-label={`Select package ${pkg.tracking_code}`}
                />
              </TableCell>
              <TableCell className="font-mono text-sm">
                {pkg.tracking_code}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{getRecipientDisplay(pkg)}</span>
                  {pkg.recipient_profile && (
                    <span className="text-xs text-muted-foreground">
                      {pkg.recipient_profile.email}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{pkg.current_location}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(pkg.arrived_at), "MMM d, yyyy")}
                <div className="text-xs text-muted-foreground">
                  {format(new Date(pkg.arrived_at), "h:mm a")}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(pkg.status)}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(pkg)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {pkg.status === "pending_pickup" && (
                      <>
                        <DropdownMenuItem onClick={() => onMovePackage(pkg)}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Move Location
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkPickedUp(pkg)}>
                          Mark as Picked Up
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

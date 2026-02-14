import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageReadReceipts, type StaffReadStatus } from "@/hooks/usePageReadReceipts";
import { useResourcePage } from "@/hooks/useStaffResources";
import { AppRole } from "@/types/roles";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Role Labels
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  concierge: "Concierge",
  female_spa_attendant: "Female Spa",
  male_spa_attendant: "Male Spa",
  floater: "Floater",
  cafe: "Cafe",
  trainer: "Trainer",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReadReceiptsDashboardProps {
  pageId: string | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReadReceiptsDashboard({ pageId }: ReadReceiptsDashboardProps) {
  const { data: page, isLoading: pageLoading } = useResourcePage(pageId);
  const { readers, nonReaders, totalStaff, readCount, isLoading } = usePageReadReceipts(pageId);
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");

  // Filter by role
  const filteredReaders = useMemo(() => {
    if (roleFilter === "all") return readers;
    return readers.filter((r) => r.roles.includes(roleFilter));
  }, [readers, roleFilter]);

  const filteredNonReaders = useMemo(() => {
    if (roleFilter === "all") return nonReaders;
    return nonReaders.filter((r) => r.roles.includes(roleFilter));
  }, [nonReaders, roleFilter]);

  if (pageLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Page not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Read Receipts</h2>
        <p className="text-sm text-muted-foreground">{page.title}</p>
      </div>

      {/* Stats Card */}
      <Card className="rounded-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">
                {readCount} of {totalStaff}
              </p>
              <p className="text-sm text-muted-foreground">
                staff have read this page
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Filter */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Filter by Role
        </label>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as AppRole | "all")}
        >
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Roles</SelectItem>
            {page.assigned_roles.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Read Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-medium uppercase tracking-wider">
            Read ({filteredReaders.length})
          </h3>
        </div>

        {filteredReaders.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No staff have read this page yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredReaders.map((staff) => (
              <StaffCard key={staff.userId} staff={staff} />
            ))}
          </div>
        )}
      </div>

      {/* Not Yet Read Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium uppercase tracking-wider">
            Not Yet Read ({filteredNonReaders.length})
          </h3>
        </div>

        {filteredNonReaders.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              All staff have read this page
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNonReaders.map((staff) => (
              <StaffCard key={staff.userId} staff={staff} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Card Component
// ---------------------------------------------------------------------------

function StaffCard({ staff }: { staff: StaffReadStatus }) {
  // Get initials for avatar
  const initials = useMemo(() => {
    const name = staff.fullName || staff.email || "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [staff.fullName, staff.email]);

  return (
    <Card className="rounded-none">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              staff.hasRead
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {staff.fullName || staff.email}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {staff.roles.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="rounded-none text-[10px]"
                >
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Read Date */}
          {staff.hasRead && staff.readAt && (
            <div className="text-xs text-muted-foreground shrink-0">
              {format(new Date(staff.readAt), "MMM d, yyyy")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

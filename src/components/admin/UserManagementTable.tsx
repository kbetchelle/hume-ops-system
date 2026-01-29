import { useState } from "react";
import { AdminUser, useUpdateUserRoles, useToggleUserDeactivation } from "@/hooks/useAdminUsers";
import { AppRole, ROLES } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRoleEditor } from "./UserRoleEditor";
import { toast } from "sonner";
import { Pencil, UserX, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserManagementTableProps {
  users: AdminUser[];
  currentUserId: string | undefined;
}

export function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  
  const updateRoles = useUpdateUserRoles();
  const toggleDeactivation = useToggleUserDeactivation();

  const filteredUsers = roleFilter === "all"
    ? users
    : users.filter((user) => user.roles.includes(roleFilter as AppRole));

  const getRoleLabel = (role: AppRole) => {
    return ROLES.find((r) => r.value === role)?.label || role;
  };

  const handleSaveRoles = async (roles: AppRole[]) => {
    if (!editingUser) return;
    
    try {
      await updateRoles.mutateAsync({ userId: editingUser.user_id, roles });
      toast.success("Roles updated successfully");
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update roles");
    }
  };

  const handleToggleDeactivation = async () => {
    if (!deactivatingUser) return;
    
    try {
      await toggleDeactivation.mutateAsync({
        userId: deactivatingUser.user_id,
        deactivated: !deactivatingUser.deactivated,
      });
      toast.success(
        deactivatingUser.deactivated
          ? "User reactivated successfully"
          : "User deactivated successfully"
      );
      setDeactivatingUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Filter by role
        </span>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 rounded-none border-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-foreground">
            <SelectItem value="all" className="text-[10px] uppercase tracking-widest">
              All Roles
            </SelectItem>
            {ROLES.map((role) => (
              <SelectItem
                key={role.value}
                value={role.value}
                className="text-[10px] uppercase tracking-widest"
              >
                {role.icon} {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground tracking-wide ml-auto">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </span>
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
                Roles
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Status
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Joined
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.user_id}
                className={cn(
                  "border-b border-border hover:bg-secondary/50",
                  user.deactivated && "opacity-50"
                )}
              >
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs tracking-wide">
                      {user.full_name || "—"}
                      {user.user_id === currentUserId && (
                        <span className="text-[10px] text-muted-foreground ml-2">(you)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground tracking-wide">
                      {user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[8px]">
                          {getRoleLabel(role)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.deactivated ? (
                    <Badge variant="destructive" className="text-[8px]">
                      Deactivated
                    </Badge>
                  ) : user.onboarding_completed ? (
                    <Badge variant="secondary" className="text-[8px]">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px]">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground tracking-wide">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingUser(user)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeactivatingUser(user)}
                      disabled={user.user_id === currentUserId}
                      className="h-8 w-8"
                    >
                      {user.deactivated ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Role Editor Dialog */}
      {editingUser && (
        <UserRoleEditor
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          userName={editingUser.full_name}
          userEmail={editingUser.email}
          currentRoles={editingUser.roles}
          onSave={handleSaveRoles}
          isSaving={updateRoles.isPending}
        />
      )}

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={!!deactivatingUser} onOpenChange={(open) => !open && setDeactivatingUser(null)}>
        <AlertDialogContent className="rounded-none border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
              {deactivatingUser?.deactivated ? "Reactivate User" : "Deactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs tracking-wide">
              {deactivatingUser?.deactivated
                ? `Are you sure you want to reactivate ${deactivatingUser?.full_name || deactivatingUser?.email}? They will be able to log in again.`
                : `Are you sure you want to deactivate ${deactivatingUser?.full_name || deactivatingUser?.email}? They will no longer be able to access the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleDeactivation}
              disabled={toggleDeactivation.isPending}
              className="rounded-none"
            >
              {toggleDeactivation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : deactivatingUser?.deactivated ? (
                "Reactivate"
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

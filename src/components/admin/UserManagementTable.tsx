import { useState, useMemo } from "react";
import { AdminUser, useUpdateUserRoles, useUpdatePrimaryRole, useToggleUserDeactivation, useResetUserPassword, useUpdateUserUsername } from "@/hooks/useAdminUsers";
import { getPrimaryRoleFromAppRoles } from "@/hooks/useUserRoles";
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
import { Pencil, UserX, UserCheck, KeyRound, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserManagementTableProps {
  users: AdminUser[];
  currentUserId: string | undefined;
}

export function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AdminUser | null>(null);
  
  const updateRoles = useUpdateUserRoles();
  const updatePrimaryRole = useUpdatePrimaryRole();
  const toggleDeactivation = useToggleUserDeactivation();
  const resetPassword = useResetUserPassword();
  const updateUsername = useUpdateUserUsername();

  const filteredUsers = useMemo(() => {
    let list = roleFilter === "all"
      ? users
      : users.filter((user) => user.roles.includes(roleFilter as AppRole));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q))
      );
    }

    return list;
  }, [users, roleFilter, search]);

  const getRoleLabel = (role: AppRole) => {
    return ROLES.find((r) => r.value === role)?.label || role;
  };

  const handleSaveRoles = async (roles: AppRole[], username: string | null) => {
    if (!editingUser) return;

    try {
      await updateRoles.mutateAsync({ userId: editingUser.user_id, roles });
      const usernameToSave = username?.trim() || null;
      if (usernameToSave !== (editingUser.username ?? null)) {
        await updateUsername.mutateAsync({
          userId: editingUser.user_id,
          username: usernameToSave || null,
        });
      }
      toast.success("Roles and username updated successfully");
      setEditingUser(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
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

  const handleResetPassword = async () => {
    if (!resettingPasswordUser) return;
    
    try {
      await resetPassword.mutateAsync({ userId: resettingPasswordUser.user_id });
      toast.success(`Password reset successfully for ${resettingPasswordUser.full_name || resettingPasswordUser.email}`);
      setResettingPasswordUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  const getEffectivePrimaryRole = (user: AdminUser): AppRole | null => {
    if (user.roles.length === 0) return null;
    const stored = user.primary_role;
    return stored != null && user.roles.includes(stored)
      ? stored
      : getPrimaryRoleFromAppRoles(user.roles);
  };

  const handlePrimaryRoleChange = async (userId: string, role: AppRole) => {
    try {
      await updatePrimaryRole.mutateAsync({ userId, primaryRole: role });
      toast.success("Primary role updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update primary role");
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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
                Username
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Roles
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Primary role
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Account
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Onboarding
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal text-foreground">
                Walkthrough
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
                <TableCell className="text-[10px] tracking-wide">
                  {user.username ?? "—"}
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
                  {user.roles.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  ) : (
                    <Select
                      value={getEffectivePrimaryRole(user) ?? ""}
                      onValueChange={(value) => handlePrimaryRoleChange(user.user_id, value as AppRole)}
                      disabled={updatePrimaryRole.isPending && updatePrimaryRole.variables?.userId === user.user_id}
                    >
                      <SelectTrigger className="w-[10rem] rounded-none border-foreground h-8 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-foreground">
                        {user.roles.map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="text-[10px] uppercase tracking-widest"
                          >
                            {getRoleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {/* Account Status */}
                <TableCell>
                  {user.deactivated ? (
                    <Badge variant="destructive" className="text-[8px]">
                      Deactivated
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px]">
                      Active
                    </Badge>
                  )}
                </TableCell>
                {/* Onboarding Status */}
                <TableCell>
                  {!user.onboarding_completed ? (
                    <Badge variant="outline" className="text-[8px]">
                      Not Started
                    </Badge>
                  ) : user.must_change_password ? (
                    <Badge variant="outline" className="text-[8px]">
                      Password Reset
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px]">
                      Complete
                    </Badge>
                  )}
                </TableCell>
                {/* Walkthrough Status */}
                <TableCell>
                  {user.walkthrough_completed_at ? (
                    <Badge variant="secondary" className="text-[8px]">
                      Completed
                    </Badge>
                  ) : user.walkthrough_skipped_at ? (
                    <Badge variant="outline" className="text-[8px]">
                      Skipped
                    </Badge>
                  ) : !user.onboarding_completed ? (
                    <span className="text-[10px] text-muted-foreground">—</span>
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
                      onClick={() => setResettingPasswordUser(user)}
                      disabled={user.user_id === currentUserId}
                      className="h-8 w-8"
                      title="Reset password"
                    >
                      <KeyRound className="h-3 w-3" />
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
          currentUsername={editingUser.username ?? ""}
          currentRoles={editingUser.roles}
          onSave={handleSaveRoles}
          isSaving={updateRoles.isPending || updateUsername.isPending}
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

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={!!resettingPasswordUser} onOpenChange={(open) => !open && setResettingPasswordUser(null)}>
        <AlertDialogContent className="rounded-none border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
              Reset Password
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs tracking-wide">
              {`Are you sure you want to reset the password for ${resettingPasswordUser?.full_name || resettingPasswordUser?.email}? Their password will be set to the default.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resetPassword.isPending}
              className="rounded-none"
            >
              {resetPassword.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

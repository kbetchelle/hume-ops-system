import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSlingUsers } from "@/hooks/useSlingApi";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { suggestUsername, normalizeUsernameForSubmit } from "@/lib/usernameSuggestions";
import { AppRole, ROLES } from "@/types/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Search, X, Pencil } from "lucide-react";
import { toast } from "sonner";

const BULK_LIMIT = 25;

interface UserRoleOverride {
  primaryRole: AppRole;
  additionalRoles: AppRole[];
}

export function CreateFromSlingTable() {
  const queryClient = useQueryClient();
  const { data: slingUsers, isLoading: slingLoading } = useSlingUsers();
  const { data: adminUsers } = useAdminUsers();

  const { data: existingUsernames = [] } = useQuery({
    queryKey: ["profiles", "usernames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .not("username", "is", null);
      if (error) throw error;
      return (data ?? []).map((r) => (r.username ?? "").trim().toLowerCase()).filter(Boolean);
    },
  });

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [usernameOverrides, setUsernameOverrides] = useState<Record<string, string>>({});
  const [defaultPrimaryRole, setDefaultPrimaryRole] = useState<AppRole>("concierge");
  const [defaultAdditionalRoles, setDefaultAdditionalRoles] = useState<AppRole[]>([]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, UserRoleOverride>>({});

  // Role editor dialog state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPrimary, setEditPrimary] = useState<AppRole>("concierge");
  const [editAdditional, setEditAdditional] = useState<AppRole[]>([]);

  const emailsWithAccount = useMemo(() => {
    const set = new Set<string>();
    (adminUsers ?? []).forEach((u) => {
      if (u.email) set.add(u.email.trim().toLowerCase());
    });
    return set;
  }, [adminUsers]);

  const slingWithHasAccount = useMemo(() => {
    const list = (slingUsers ?? []).map((s) => ({
      ...s,
      hasAccount: !!(
        s.email &&
        emailsWithAccount.has(s.email.trim().toLowerCase())
      ),
      hasEmail: !!(s.email && s.email.trim()),
    }));
    return list;
  }, [slingUsers, emailsWithAccount]);

  const filtered = useMemo(() => {
    let list = slingWithHasAccount.filter((s) => !s.hasAccount && s.hasEmail);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.first_name && s.first_name.toLowerCase().includes(q)) ||
          (s.last_name && s.last_name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.position_name && s.position_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [slingWithHasAccount, search]);

  const takenUsernames = useMemo(() => {
    const set = new Set(existingUsernames);
    return set;
  }, [existingUsernames]);

  const suggestedUsernames = useMemo(() => {
    const map: Record<string, string> = {};
    const used = new Set(takenUsernames);
    filtered.forEach((s) => {
      const suggested = suggestUsername(s.first_name, s.last_name, used);
      map[s.id] = suggested;
      used.add(suggested.toLowerCase());
    });
    return map;
  }, [filtered, takenUsernames]);

  const selectedList = useMemo(
    () => filtered.filter((s) => selectedIds.has(s.id)),
    [filtered, selectedIds]
  );
  const atLimit = selectedList.length >= BULK_LIMIT;
  const canCreate = selectedList.length > 0 && selectedList.length <= BULK_LIMIT;

  const getEffectiveRoles = (userId: string): { primaryRole: AppRole; allRoles: AppRole[] } => {
    const override = roleOverrides[userId];
    const primary = override?.primaryRole ?? defaultPrimaryRole;
    const additional = override?.additionalRoles ?? defaultAdditionalRoles;
    const allRoles = [primary, ...additional.filter((r) => r !== primary)];
    return { primaryRole: primary, allRoles };
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const accounts = selectedList.map((s) => {
        const username =
          usernameOverrides[s.id]?.trim() ||
          suggestedUsernames[s.id] ||
          suggestUsername(s.first_name, s.last_name, takenUsernames);
        const normalized = normalizeUsernameForSubmit(username);
        if (!normalized) throw new Error(`Invalid username for ${s.email}`);
        const { primaryRole, allRoles } = getEffectiveRoles(s.id);
        return {
          slingUserId: s.id,
          username: normalized,
          primaryRole,
          roles: allRoles,
        };
      });
      const { data, error } = await supabase.functions.invoke(
        "admin-create-accounts-from-sling",
        { body: { accounts } }
      );
      if (error) throw error;
      if (data?.success === false && data?.error) throw new Error(data.error);
      return data as {
        created: number;
        skipped: number;
        skippedReasons?: {
          alreadyHasAccount: number;
          noEmail: number;
          invalidOrDuplicateUsername: number;
        };
        errors?: string[];
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "usernames"] });
      setSelectedIds(new Set());
      setUsernameOverrides({});
      setRoleOverrides({});
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      if (created > 0 || skipped > 0) {
        toast.success(
          `${created} account(s) created.${skipped > 0 ? ` ${skipped} skipped (already have accounts or invalid).` : ""}`
        );
      }
      if (data?.errors?.length) {
        data.errors.slice(0, 3).forEach((msg) => toast.error(msg));
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create accounts");
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < BULK_LIMIT) next.add(id);
      return next;
    });
  };

  const maxSelectable = Math.min(filtered.length, BULK_LIMIT);
  const allSelectableSelected = filtered.length > 0 && selectedList.length === maxSelectable;
  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.slice(0, BULK_LIMIT).map((s) => s.id)));
    }
  };

  const setUsernameOverride = (id: string, value: string) => {
    setUsernameOverrides((prev) => ({ ...prev, [id]: value }));
  };

  const toggleDefaultAdditionalRole = (role: AppRole) => {
    setDefaultAdditionalRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const openRoleEditor = (userId: string) => {
    const override = roleOverrides[userId];
    setEditPrimary(override?.primaryRole ?? defaultPrimaryRole);
    setEditAdditional(override?.additionalRoles ?? defaultAdditionalRoles);
    setEditingUserId(userId);
  };

  const saveRoleOverride = () => {
    if (!editingUserId) return;
    setRoleOverrides((prev) => ({
      ...prev,
      [editingUserId]: { primaryRole: editPrimary, additionalRoles: editAdditional },
    }));
    setEditingUserId(null);
  };

  const clearRoleOverride = (userId: string) => {
    setRoleOverrides((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const toggleEditAdditionalRole = (role: AppRole) => {
    setEditAdditional((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const getRoleLabel = (role: AppRole) =>
    ROLES.find((r) => r.value === role)?.label || role;

  if (slingLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or position..."
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

      {/* Default role settings */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Default primary role
            </span>
            <Select value={defaultPrimaryRole} onValueChange={(v) => setDefaultPrimaryRole(v as AppRole)}>
              <SelectTrigger className="w-48 rounded-none border-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-foreground">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-[10px]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-none"
            disabled={!canCreate || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Create accounts ({selectedList.length}
            {atLimit ? `, max ${BULK_LIMIT}` : ""})
          </Button>
        </div>

        {/* Additional roles */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Default additional roles
          </span>
          {ROLES.filter((r) => r.value !== defaultPrimaryRole).map((role) => (
            <label
              key={role.value}
              htmlFor={`default-role-${role.value}`}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                id={`default-role-${role.value}`}
                checked={defaultAdditionalRoles.includes(role.value)}
                onCheckedChange={() => toggleDefaultAdditionalRole(role.value)}
                className="h-4 w-4"
              />
              <span className="text-[10px] uppercase tracking-widest">{role.label}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground tracking-wide">
        Select up to {BULK_LIMIT} Sling users and create app accounts. Click the edit icon to override roles for individual users. Default password: 1600Main!
      </p>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="w-10 text-[10px] uppercase tracking-widest font-normal">
                <Checkbox
                  checked={allSelectableSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={filtered.length === 0}
                />
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Name
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Email
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Username
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Roles
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Position
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    No Sling users without accounts found.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const { primaryRole, allRoles } = getEffectiveRoles(s.id);
                const hasOverride = !!roleOverrides[s.id];
                return (
                  <TableRow
                    key={s.id}
                    className="border-b border-border hover:bg-secondary/50"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                        disabled={atLimit && !selectedIds.has(s.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs tracking-wide">
                      {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs tracking-wide text-muted-foreground">
                      {s.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-48 rounded-none text-xs"
                        value={usernameOverrides[s.id] ?? suggestedUsernames[s.id] ?? ""}
                        onChange={(e) => setUsernameOverride(s.id, e.target.value)}
                        placeholder={suggestedUsernames[s.id]}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="default" className="text-[9px] px-1.5 py-0">
                            {getRoleLabel(primaryRole)}
                          </Badge>
                          {allRoles
                            .filter((r) => r !== primaryRole)
                            .map((r) => (
                              <Badge key={r} variant="secondary" className="text-[9px] px-1.5 py-0">
                                {getRoleLabel(r)}
                              </Badge>
                            ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => openRoleEditor(s.id)}
                          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit roles for this user"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => clearRoleOverride(s.id)}
                            className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Reset to defaults"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {s.position_name ?? s.positions?.join(", ") ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Per-user role editor dialog */}
      <Dialog open={!!editingUserId} onOpenChange={(open) => !open && setEditingUserId(null)}>
        <DialogContent className="rounded-none border-foreground bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-[0.15em] font-normal">
              Override Roles
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Primary role
              </span>
              <Select value={editPrimary} onValueChange={(v) => setEditPrimary(v as AppRole)}>
                <SelectTrigger className="w-full rounded-none border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-foreground">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-[10px]">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Additional roles
              </span>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {ROLES.filter((r) => r.value !== editPrimary).map((role) => (
                  <label
                    key={role.value}
                    htmlFor={`edit-role-${role.value}`}
                    className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:border-foreground transition-colors"
                  >
                    <Checkbox
                      id={`edit-role-${role.value}`}
                      checked={editAdditional.includes(role.value)}
                      onCheckedChange={() => toggleEditAdditionalRole(role.value)}
                    />
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-widest">{role.label}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wide mt-1">
                        {role.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingUserId(null)}>
              Cancel
            </Button>
            <Button onClick={saveRoleOverride}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

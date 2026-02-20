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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const BULK_LIMIT = 25;

type AccountFilter = "all" | "no_account" | "has_account";

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

  const [filter, setFilter] = useState<AccountFilter>("no_account");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [usernameOverrides, setUsernameOverrides] = useState<Record<string, string>>({});
  const [defaultRole, setDefaultRole] = useState<AppRole>("concierge");

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
    if (filter === "has_account") return slingWithHasAccount.filter((s) => s.hasAccount);
    if (filter === "no_account") return slingWithHasAccount.filter((s) => !s.hasAccount && s.hasEmail);
    return slingWithHasAccount.filter((s) => s.hasEmail);
  }, [slingWithHasAccount, filter]);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const accounts = selectedList.map((s) => {
        const username =
          usernameOverrides[s.id]?.trim() ||
          suggestedUsernames[s.id] ||
          suggestUsername(s.first_name, s.last_name, takenUsernames);
        const normalized = normalizeUsernameForSubmit(username);
        if (!normalized) throw new Error(`Invalid username for ${s.email}`);
        return {
          slingUserId: s.id,
          username: normalized,
          primaryRole: defaultRole,
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

  if (slingLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Filter
          </span>
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as AccountFilter);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-36 rounded-none border-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-foreground">
              <SelectItem value="all" className="text-[10px] uppercase tracking-widest">
                All (with email)
              </SelectItem>
              <SelectItem value="no_account" className="text-[10px] uppercase tracking-widest">
                No account
              </SelectItem>
              <SelectItem value="has_account" className="text-[10px] uppercase tracking-widest">
                Has account
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Default role
          </span>
          <Select value={defaultRole} onValueChange={(v) => setDefaultRole(v as AppRole)}>
            <SelectTrigger className="w-40 rounded-none border-foreground">
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
      </div>

      <p className="text-[10px] text-muted-foreground tracking-wide">
        Only Sling users with an email are shown. Select up to {BULK_LIMIT} and create app
        accounts (default password 1600Main!; they must change it on first login). Username is
        editable.
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
                Position
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-normal">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    No Sling users match the filter.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-b border-border hover:bg-secondary/50"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleSelect(s.id)}
                      disabled={!s.hasEmail || s.hasAccount || (atLimit && !selectedIds.has(s.id))}
                    />
                  </TableCell>
                  <TableCell className="text-xs tracking-wide">
                    {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-xs tracking-wide text-muted-foreground">
                    {s.email || "—"}
                  </TableCell>
                  <TableCell>
                    {s.hasAccount ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <Input
                        className="h-8 w-48 rounded-none text-xs"
                        value={usernameOverrides[s.id] ?? suggestedUsernames[s.id] ?? ""}
                        onChange={(e) => setUsernameOverride(s.id, e.target.value)}
                        placeholder={suggestedUsernames[s.id]}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {s.position_name ?? s.positions?.join(", ") ?? "—"}
                  </TableCell>
                  <TableCell>
                    {s.hasAccount ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Has account
                      </Badge>
                    ) : !s.hasEmail ? (
                      <Badge variant="outline" className="text-[10px]">
                        No email
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        No account
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

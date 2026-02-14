import { useState, useMemo } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  usePageEditors,
  useAddPageEditor,
  useRemovePageEditor,
} from "@/hooks/useResourcePageEditors";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AppRole } from "@/types/roles";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Role Labels
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
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

interface DelegatedEditorsManagerProps {
  pageId: string | undefined;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DelegatedEditorsManager({
  pageId,
  disabled = false,
}: DelegatedEditorsManagerProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: editors = [], isLoading: editorsLoading } = usePageEditors(pageId);
  const addEditorMutation = useAddPageEditor();
  const removeEditorMutation = useRemovePageEditor();

  // Search for users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          full_name,
          email,
          deactivated
        `
        )
        .eq("deactivated", false)
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Also fetch roles for these users
      const userIds = data?.map((u) => u.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Group roles by user
      const rolesMap = new Map<string, AppRole[]>();
      rolesData?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role as AppRole);
        rolesMap.set(r.user_id, existing);
      });

      return data?.map((u) => ({
        ...u,
        roles: rolesMap.get(u.user_id) || [],
      })) || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Filter out users who are already editors
  const editorIds = useMemo(
    () => new Set(editors.map((e) => e.user_id)),
    [editors]
  );

  const filteredResults = useMemo(
    () => searchResults.filter((u) => !editorIds.has(u.user_id)),
    [searchResults, editorIds]
  );

  const handleAddEditor = async (userId: string) => {
    if (!pageId) return;
    await addEditorMutation.mutateAsync({ pageId, userId });
    setSearchOpen(false);
    setSearchTerm("");
  };

  const handleRemoveEditor = async (userId: string) => {
    if (!pageId) return;
    await removeEditorMutation.mutateAsync({ pageId, userId });
  };

  return (
    <div className="space-y-3">
      {/* Add Editor Button */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full rounded-none"
            disabled={disabled || !pageId}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Editor
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 rounded-none" align="start">
          <Command>
            <CommandInput
              placeholder="Search by name or email..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {searchLoading ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredResults.length > 0 ? (
                <CommandGroup>
                  {filteredResults.map((user) => (
                    <CommandItem
                      key={user.user_id}
                      onSelect={() => handleAddEditor(user.user_id)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {user.full_name || user.email}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className="rounded-none text-[9px]"
                            >
                              {ROLE_LABELS[role] || role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  {searchTerm.length < 2
                    ? "Type to search for users..."
                    : "No users found"}
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Current Editors List */}
      {editorsLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : editors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No delegated editors yet
        </p>
      ) : (
        <div className="space-y-2">
          {editors.map((editor) => {
            const profile = editor.user_profile;
            const displayName = profile?.full_name || profile?.email || "Unknown";
            const initials = displayName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <Card key={editor.id} className="rounded-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleRemoveEditor(editor.user_id)}
                      disabled={disabled || removeEditorMutation.isPending}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

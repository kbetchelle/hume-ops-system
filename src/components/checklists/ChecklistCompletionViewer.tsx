import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useChecklists,
  useChecklistItems,
  useCompletionsForDate,
  type Checklist,
} from "@/hooks/useChecklists";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const CHECKLIST_ROLES: AppRole[] = ["concierge", "female_spa_attendant", "male_spa_attendant", "floater"];

function getRoleLabel(role: AppRole): string {
  switch (role) {
    case "concierge": return "Concierge";
    case "female_spa_attendant": return "Female Spa Attendant";
    case "male_spa_attendant": return "Male Spa Attendant";
    case "floater": return "Floater";
    default: return role;
  }
}

export function ChecklistCompletionViewer() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRole, setSelectedRole] = useState<AppRole | "all">("all");
  const [selectedChecklist, setSelectedChecklist] = useState<string | "all">("all");

  const dateString = format(selectedDate, "yyyy-MM-dd");
  const { data: checklists } = useChecklists();
  const { data: completions, isLoading: completionsLoading } = useCompletionsForDate(dateString);
  const { data: users } = useAdminUsers();

  // Filter checklists by role
  const filteredChecklists = checklists?.filter(
    (c) => selectedRole === "all" || c.role === selectedRole
  );

  // Get user info by id
  const getUserName = (userId: string): string => {
    const user = users?.find((u) => u.user_id === userId);
    return user?.full_name || user?.email || "Unknown User";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Completion Status</h2>
        <p className="text-xs text-muted-foreground tracking-wide mt-1">
          View checklist completions by date and user
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {CHECKLIST_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {getRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedChecklist} onValueChange={setSelectedChecklist}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by checklist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Checklists</SelectItem>
            {filteredChecklists?.map((checklist) => (
              <SelectItem key={checklist.id} value={checklist.id}>
                {checklist.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Completion Grid */}
      {completionsLoading ? (
        <div className="text-sm text-muted-foreground">Loading completions...</div>
      ) : (
        <div className="space-y-4">
          {filteredChecklists?.filter(
            (c) => selectedChecklist === "all" || c.id === selectedChecklist
          ).map((checklist) => (
            <ChecklistCompletionCard
              key={checklist.id}
              checklist={checklist}
              completions={completions || []}
              getUserName={getUserName}
              users={users || []}
            />
          ))}
          {(!filteredChecklists || filteredChecklists.length === 0) && (
            <Card className="border border-border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No checklists found for the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface ChecklistCompletionCardProps {
  checklist: Checklist;
  completions: { checklist_item_id: string; user_id: string }[];
  getUserName: (userId: string) => string;
  users: { user_id: string; roles: AppRole[] }[];
}

function ChecklistCompletionCard({ checklist, completions, getUserName, users }: ChecklistCompletionCardProps) {
  const { data: items } = useChecklistItems(checklist.id);

  // Get users who have this role
  const roleUsers = users.filter((u) => u.roles?.includes(checklist.role));

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {checklist.title}
          <Badge variant="outline" className="ml-2">
            {getRoleLabel(checklist.role)}
          </Badge>
        </CardTitle>
        {checklist.description && (
          <CardDescription>{checklist.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {roleUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users with this role.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Task
                  </th>
                  {roleUsers.map((user) => (
                    <th
                      key={user.user_id}
                      className="text-center py-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground min-w-[100px]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{getUserName(user.user_id)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">{item.title}</td>
                    {roleUsers.map((user) => {
                      const isCompleted = completions.some(
                        (c) => c.checklist_item_id === item.id && c.user_id === user.user_id
                      );
                      return (
                        <td key={user.user_id} className="text-center py-3 px-2">
                          {isCompleted ? (
                            <div className="flex justify-center">
                              <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <X className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

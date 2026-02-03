import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAdminUsers } from "@/hooks/useAdminUsers";

type RoleType = 'concierge' | 'boh' | 'cafe';

export function ChecklistCompletionViewer() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRole, setSelectedRole] = useState<RoleType>('concierge');
  const [shiftTime, setShiftTime] = useState<'AM' | 'PM'>('AM');

  const dateString = format(selectedDate, "yyyy-MM-dd");
  const { data: users } = useAdminUsers();

  // Query checklists based on selected role
  const { data: checklists } = useQuery({
    queryKey: [`${selectedRole}-checklists`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(`${selectedRole}_checklists`)
        .select('*')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Query completions based on selected role
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: [`${selectedRole}-completions`, dateString, shiftTime],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(`${selectedRole}_completions`)
        .select('*')
        .eq('completion_date', dateString)
        .eq('shift_time', shiftTime);
      if (error) throw error;
      return data;
    },
  });

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

        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as RoleType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concierge">Concierge</SelectItem>
            <SelectItem value="boh">Back of House</SelectItem>
            <SelectItem value="cafe">Cafe</SelectItem>
          </SelectContent>
        </Select>

        <Select value={shiftTime} onValueChange={(v) => setShiftTime(v as 'AM' | 'PM')}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM Shift</SelectItem>
            <SelectItem value="PM">PM Shift</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Completion Summary */}
      {completionsLoading ? (
        <div className="text-sm text-muted-foreground">Loading completions...</div>
      ) : (
        <div className="space-y-4">
          {checklists?.map((checklist) => (
            <RoleChecklistCompletionCard
              key={checklist.id}
              checklist={checklist}
              completions={completions || []}
              dateString={dateString}
              shiftTime={shiftTime}
              roleType={selectedRole}
              getUserName={getUserName}
              users={users || []}
            />
          ))}
          {(!checklists || checklists.length === 0) && (
            <Card className="border border-border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No checklists found for the selected role.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface RoleChecklistCompletionCardProps {
  checklist: any;
  completions: any[];
  dateString: string;
  shiftTime: string;
  roleType: RoleType;
  getUserName: (userId: string) => string;
  users: any[];
}

function RoleChecklistCompletionCard({ 
  checklist, 
  completions, 
  dateString, 
  shiftTime, 
  roleType,
  getUserName,
  users,
}: RoleChecklistCompletionCardProps) {
  // Query items for this checklist
  const { data: items } = useQuery({
    queryKey: [`${roleType}-checklist-items`, checklist.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(`${roleType}_checklist_items`)
        .select('*')
        .eq('checklist_id', checklist.id)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Get users with relevant roles
  const roleUsers = users.filter((u) => {
    if (roleType === 'concierge') {
      return u.roles?.includes('concierge');
    } else if (roleType === 'boh') {
      return u.roles?.some((r: string) => 
        ['floater', 'male_spa_attendant', 'female_spa_attendant'].includes(r)
      );
    } else if (roleType === 'cafe') {
      return u.roles?.includes('cafe');
    }
    return false;
  });

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {checklist.title}
          <Badge variant="outline" className="ml-2">
            {roleType === 'boh' ? 'Back of House' : roleType.charAt(0).toUpperCase() + roleType.slice(1)}
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
                    <td className="py-3 pr-4">{item.task_description}</td>
                    {roleUsers.map((user) => {
                      const isCompleted = completions.some(
                        (c) => c.item_id === item.id && c.completed_by_id === user.user_id
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

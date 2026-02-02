import { useState } from "react";
import { format, subDays } from "date-fns";
import { Check, Clock, History, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useChecklistsForRoles,
  useChecklistItems,
  useTodayCompletions,
  useCompletionHistory,
  useToggleCompletion,
  type Checklist,
  type ChecklistCompletion,
} from "@/hooks/useChecklists";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const STAFF_ROLES: AppRole[] = ["concierge", "female_spa_attendant", "male_spa_attendant", "floater"];

function getRoleLabel(role: AppRole): string {
  switch (role) {
    case "concierge": return "Concierge";
    case "female_spa_attendant": return "Female Spa Attendant";
    case "male_spa_attendant": return "Male Spa Attendant";
    case "floater": return "Floater";
    default: return role;
  }
}

export function StaffChecklistView() {
  const { user } = useAuth();
  const { data: userRoles } = useUserRoles(user?.id);
  const [showHistory, setShowHistory] = useState(false);

  // Filter to only staff roles that the user has
  const roles = userRoles?.map(r => r.role) || [];
  const userStaffRoles = roles.filter((r) => STAFF_ROLES.includes(r as AppRole)) as AppRole[];

  const { data: checklists, isLoading: checklistsLoading } = useChecklistsForRoles(userStaffRoles);
  const { data: todayCompletions } = useTodayCompletions(user?.id || null);
  const { data: historyCompletions } = useCompletionHistory(user?.id || null, 7);

  if (!user) {
    return <div className="text-sm text-muted-foreground">Please log in to view your checklists.</div>;
  }

  if (userStaffRoles.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No checklists assigned to your role.</p>
        </CardContent>
      </Card>
    );
  }

  if (checklistsLoading) {
    return <div className="text-sm text-muted-foreground">Loading checklists...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Today's Checklists */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Today's Checklists</h2>
          <span className="text-xs text-muted-foreground">— {format(new Date(), "EEEE, MMMM d")}</span>
        </div>

        {checklists?.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No active checklists for your role.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {checklists?.map((checklist) => (
              <TodayChecklistCard
                key={checklist.id}
                checklist={checklist}
                userId={user.id}
                completions={todayCompletions || []}
              />
            ))}
          </div>
        )}
      </div>

      {/* History Toggle */}
      <div>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-widest">Past 7 Days</span>
          {showHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {showHistory && (
          <div className="mt-4 space-y-4">
            <HistoryView
              checklists={checklists || []}
              completions={historyCompletions || []}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface TodayChecklistCardProps {
  checklist: Checklist;
  userId: string;
  completions: ChecklistCompletion[];
}

function TodayChecklistCard({ checklist, userId, completions }: TodayChecklistCardProps) {
  const { data: items } = useChecklistItems(checklist.id);
  const toggleCompletion = useToggleCompletion();

  const completedCount = items?.filter((item) =>
    completions.some((c) => c.checklist_item_id === item.id)
  ).length || 0;

  const totalCount = items?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (itemId: string, currentlyCompleted: boolean) => {
    toggleCompletion.mutate({
      item_id: itemId,
      user_id: userId,
      is_completed: !currentlyCompleted,
    });
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {checklist.title}
              <Badge variant="outline" className="text-[9px]">
                {getRoleLabel(checklist.role)}
              </Badge>
            </CardTitle>
            {checklist.description && (
              <CardDescription className="mt-1">{checklist.description}</CardDescription>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-normal">
              {completedCount}/{totalCount}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Completed
            </div>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1 mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items?.map((item) => {
            const isCompleted = completions.some((c) => c.checklist_item_id === item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded transition-colors cursor-pointer",
                  isCompleted ? "bg-green-500/5" : "bg-secondary/30 hover:bg-secondary/50"
                )}
                onClick={() => handleToggle(item.id, isCompleted)}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleToggle(item.id, isCompleted)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className={cn(
                    "text-sm",
                    isCompleted && "line-through text-muted-foreground"
                  )}>
                    {item.task_description}
                  </span>
                </div>
                {isCompleted && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoryViewProps {
  checklists: Checklist[];
  completions: ChecklistCompletion[];
}

function HistoryView({ checklists, completions }: HistoryViewProps) {
  // Group completions by date
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i + 1);
    return format(date, "yyyy-MM-dd");
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-muted-foreground">
              Checklist
            </th>
            {last7Days.map((date) => (
              <th
                key={date}
                className="text-center py-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground min-w-[80px]"
              >
                {format(new Date(date), "MMM d")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checklists.map((checklist) => (
            <HistoryRow
              key={checklist.id}
              checklist={checklist}
              dates={last7Days}
              completions={completions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface HistoryRowProps {
  checklist: Checklist;
  dates: string[];
  completions: ChecklistCompletion[];
}

function HistoryRow({ checklist, dates, completions }: HistoryRowProps) {
  const { data: items } = useChecklistItems(checklist.id);

  if (!items || items.length === 0) return null;

  return (
    <tr className="border-b border-border/50">
      <td className="py-3 pr-4">
        <div className="font-medium">{checklist.title}</div>
        <div className="text-xs text-muted-foreground">{items.length} tasks</div>
      </td>
      {dates.map((date) => {
        const dayCompletions = completions.filter((c) => c.completion_date === date);
        const completedCount = items.filter((item) =>
          dayCompletions.some((c) => c.checklist_item_id === item.id)
        ).length;

        return (
          <td key={date} className="text-center py-3 px-2">
            <div className={cn(
              "inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium",
              completedCount === items.length
                ? "bg-green-500/10 text-green-500"
                : completedCount > 0
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-muted text-muted-foreground"
            )}>
              {completedCount}/{items.length}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { 
  useDevTasks, 
  useUpdateTaskStatus, 
  useAddTask, 
  useDeleteTask,
  DevTaskStatus,
  useIsKat
} from "@/hooks/useDevDashboard";
import { useAuthContext } from "@/features/auth/AuthProvider";

const STATUS_LABELS: Record<DevTaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  finishing_touches: "Finishing touches",
  completed: "Completed",
};

const STATUS_COLORS: Record<DevTaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  finishing_touches: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export function DevTaskTracker() {
  const { user } = useAuthContext();
  const isKat = useIsKat(user?.email);
  const { data: tasks, isLoading } = useDevTasks();
  const updateStatus = useUpdateTaskStatus();
  const addTask = useAddTask();
  const deleteTask = useDeleteTask();
  const [newTaskName, setNewTaskName] = useState("");

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTask.mutate(newTaskName.trim());
      setNewTaskName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-[0.15em] font-normal text-muted-foreground">
          Development Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Task list */}
            <div className="space-y-2">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <span className="flex-1 text-xs">{task.name}</span>
                  
                  {isKat ? (
                    <>
                      <Select
                        value={task.status}
                        onValueChange={(value: DevTaskStatus) =>
                          updateStatus.mutate({ id: task.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-7 text-xs rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteTask.mutate(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`px-2 py-1 text-xs rounded-sm ${STATUS_COLORS[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  )}
                </div>
              ))}
              
              {tasks?.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No tasks yet</p>
              )}
            </div>

            {/* Add task input - only for Kat */}
            {isKat && (
              <div className="flex gap-2 pt-2">
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add new task..."
                  className="flex-1 h-8 text-xs rounded-none"
                />
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTaskName.trim()}
                  className="h-8 rounded-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

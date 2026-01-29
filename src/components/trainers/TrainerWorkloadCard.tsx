import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Users } from "lucide-react";
import { TrainerWithWorkload } from "@/hooks/useTrainerAssignments";

interface TrainerWorkloadCardProps {
  trainers: TrainerWithWorkload[];
  isLoading?: boolean;
  maxClientsTarget?: number;
}

export function TrainerWorkloadCard({
  trainers,
  isLoading,
  maxClientsTarget = 20,
}: TrainerWorkloadCardProps) {
  const totalAssignments = trainers.reduce((sum, t) => sum + t.assignment_count, 0);
  const averageLoad = trainers.length > 0 
    ? Math.round(totalAssignments / trainers.length) 
    : 0;

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Trainer Workload</CardTitle>
          <CardDescription>Loading trainer data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Trainer Workload
        </CardTitle>
        <CardDescription>
          {trainers.length} trainers • {totalAssignments} total assignments • {averageLoad} avg per trainer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trainers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trainers found
            </p>
          ) : (
            trainers.map((trainer) => {
              const loadPercentage = Math.min(
                (trainer.assignment_count / maxClientsTarget) * 100,
                100
              );
              const isOverloaded = trainer.assignment_count > maxClientsTarget;

              return (
                <div key={trainer.user_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {trainer.full_name || trainer.email}
                      </span>
                    </div>
                    <Badge
                      variant={
                        isOverloaded
                          ? "destructive"
                          : trainer.assignment_count === 0
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {trainer.assignment_count} client{trainer.assignment_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <Progress
                    value={loadPercentage}
                    className={`h-2 ${isOverloaded ? "[&>div]:bg-destructive" : ""}`}
                  />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

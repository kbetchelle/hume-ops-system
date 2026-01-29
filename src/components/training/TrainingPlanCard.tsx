import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreVertical,
  Edit,
  Copy,
  Link,
  Trash2,
  Dumbbell,
  Apple,
  User,
  Globe,
  Lock,
  ExternalLink,
} from "lucide-react";
import { TrainingPlan } from "@/hooks/useTrainingPlans";
import { useToast } from "@/hooks/use-toast";

interface TrainingPlanCardProps {
  plan: TrainingPlan;
  onEdit: (plan: TrainingPlan) => void;
  onDuplicate: (planId: string) => void;
  onDelete: (planId: string) => void;
  onTogglePublic: (planId: string, isPublic: boolean) => void;
}

export function TrainingPlanCard({
  plan,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublic,
}: TrainingPlanCardProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contentCount = plan.training_plan_content?.length || 0;
  const workoutCount = plan.training_plan_content?.filter((c) => c.content_type === "workout").length || 0;
  const nutritionCount = plan.training_plan_content?.filter((c) => c.content_type === "nutrition").length || 0;

  const shareUrl = `${window.location.origin}/plan/${plan.share_slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard" });
  };

  const getPlanTypeIcon = () => {
    switch (plan.plan_type) {
      case "workout":
        return <Dumbbell className="h-4 w-4" />;
      case "nutrition":
        return <Apple className="h-4 w-4" />;
      default:
        return (
          <div className="flex gap-1">
            <Dumbbell className="h-3 w-3" />
            <Apple className="h-3 w-3" />
          </div>
        );
    }
  };

  return (
    <>
      <Card className="border border-border hover:border-foreground/20 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getPlanTypeIcon()}
                <CardTitle className="truncate">{plan.title}</CardTitle>
              </div>
              {plan.description && (
                <CardDescription className="line-clamp-2">
                  {plan.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(plan.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Share Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublic(plan.id, !plan.is_public)}>
                  {plan.is_public ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Make Public
                    </>
                  )}
                </DropdownMenuItem>
                {plan.is_public && (
                  <DropdownMenuItem asChild>
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Public Link
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {plan.is_template && (
                <Badge variant="secondary">Template</Badge>
              )}
              {plan.is_public ? (
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
              {plan.members && (
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  {plan.members.full_name || plan.members.email}
                </Badge>
              )}
            </div>

            {/* Content summary */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {workoutCount > 0 && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  {workoutCount} workout{workoutCount !== 1 ? "s" : ""}
                </span>
              )}
              {nutritionCount > 0 && (
                <span className="flex items-center gap-1">
                  <Apple className="h-3 w-3" />
                  {nutritionCount} nutrition
                </span>
              )}
              {contentCount === 0 && (
                <span className="text-muted-foreground/60">No content yet</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Updated {format(new Date(plan.updated_at), "MMM d, yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plan.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(plan.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

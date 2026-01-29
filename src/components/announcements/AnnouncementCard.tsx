import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MoreVertical, Pencil, Trash2, Circle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ROLES } from "@/types/roles";
import type { Announcement } from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
}

export function AnnouncementCard({
  announcement,
  isOwner,
  onEdit,
  onDelete,
  onMarkRead,
}: AnnouncementCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getRoleLabel = (roleValue: string) => {
    const role = ROLES.find((r) => r.value === roleValue);
    return role ? `${role.icon} ${role.label}` : roleValue;
  };

  return (
    <>
      <Card
        className={cn(
          "transition-all",
          !announcement.is_read && "border-l-4 border-l-primary"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {announcement.is_read ? (
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Circle className="h-4 w-4 text-primary fill-primary" />
              )}
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {!announcement.is_read && onMarkRead && (
                <Button variant="ghost" size="sm" onClick={onMarkRead}>
                  Mark as read
                </Button>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {announcement.content}
          </p>

          <div className="flex flex-wrap gap-1">
            {announcement.target_roles.map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(announcement.created_at), {
              addSuffix: true,
            })}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
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

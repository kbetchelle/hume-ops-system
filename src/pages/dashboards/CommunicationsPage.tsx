import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useMarkAnnouncementRead,
  type Announcement,
} from "@/hooks/useAnnouncements";
import { AnnouncementDialog } from "@/components/announcements/AnnouncementDialog";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { Loader2, Plus, Bell } from "lucide-react";
import type { AppRole } from "@/types/roles";

export default function CommunicationsPage() {
  const { user } = useAuthContext();
  const { data: userRoles = [] } = useUserRoles(user?.id);
  const isManager = userRoles.some((r) => r.role === "admin" || r.role === "manager");

  // Announcements state
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const markRead = useMarkAnnouncementRead();
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  const handleCreateAnnouncement = (data: {
    title: string;
    content: string;
    target_roles: AppRole[];
  }) => {
    createAnnouncement.mutate(data, {
      onSuccess: () => setAnnouncementDialogOpen(false),
    });
  };

  const handleUpdateAnnouncement = (data: {
    title: string;
    content: string;
    target_roles: AppRole[];
  }) => {
    if (!editingAnnouncement) return;
    updateAnnouncement.mutate(
      { id: editingAnnouncement.id, ...data },
      { onSuccess: () => setEditingAnnouncement(null) }
    );
  };

  return (
    <DashboardLayout title="Communications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Announcements
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isManager
                ? "Create and manage announcements for your team"
                : "Stay updated with the latest announcements"}
            </p>
          </div>
        </div>

        {announcementsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No announcements yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isManager
                  ? "Create your first announcement to notify your team"
                  : "You'll see announcements here when they're posted"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwner={announcement.created_by === user?.id}
                onEdit={() => setEditingAnnouncement(announcement)}
                onDelete={() => deleteAnnouncement.mutate(announcement.id)}
                onMarkRead={() => markRead.mutate(announcement.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Announcement Dialogs */}
      <AnnouncementDialog
        open={announcementDialogOpen}
        onOpenChange={setAnnouncementDialogOpen}
        onSubmit={handleCreateAnnouncement}
        isLoading={createAnnouncement.isPending}
      />
      <AnnouncementDialog
        open={!!editingAnnouncement}
        onOpenChange={(open) => !open && setEditingAnnouncement(null)}
        announcement={editingAnnouncement}
        onSubmit={handleUpdateAnnouncement}
        isLoading={updateAnnouncement.isPending}
      />
    </DashboardLayout>
  );
}

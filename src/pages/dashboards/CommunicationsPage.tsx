import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  type Document,
} from "@/hooks/useDocuments";
import { AnnouncementDialog } from "@/components/announcements/AnnouncementDialog";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Loader2, Plus, Megaphone, FileText, Bell } from "lucide-react";
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

  // Documents state
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

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

  const handleCreateDocument = (data: {
    title: string;
    description?: string;
    file?: File;
    target_roles: AppRole[];
  }) => {
    if (!data.file) return;
    createDocument.mutate(
      { title: data.title, description: data.description, file: data.file, target_roles: data.target_roles },
      { onSuccess: () => setDocumentDialogOpen(false) }
    );
  };

  const handleUpdateDocument = (data: {
    title: string;
    description?: string;
    target_roles: AppRole[];
  }) => {
    if (!editingDocument) return;
    updateDocument.mutate(
      { id: editingDocument.id, title: data.title, description: data.description, target_roles: data.target_roles },
      { onSuccess: () => setEditingDocument(null) }
    );
  };

  return (
    <DashboardLayout title="Communications">
      <div className="space-y-6">
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Announcements</h2>
                <p className="text-sm text-muted-foreground">
                  {isManager
                    ? "Create and manage announcements for your team"
                    : "Stay updated with the latest announcements"}
                </p>
              </div>
              {isManager && (
                <Button onClick={() => setAnnouncementDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Announcement
                </Button>
              )}
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
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Document Library</h2>
                <p className="text-sm text-muted-foreground">
                  {isManager
                    ? "Upload and manage documents for your team"
                    : "Access documents shared with your role"}
                </p>
              </div>
              {isManager && (
                <Button onClick={() => setDocumentDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </div>

            {documentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No documents yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isManager
                      ? "Upload your first document to share with your team"
                      : "You'll see documents here when they're shared with you"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isOwner={doc.created_by === user?.id}
                    onEdit={() => setEditingDocument(doc)}
                    onDelete={() => deleteDocument.mutate(doc)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Document Dialogs */}
      <DocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onSubmit={handleCreateDocument}
        isLoading={createDocument.isPending}
      />
      <DocumentDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        document={editingDocument}
        onSubmit={handleUpdateDocument}
        isLoading={updateDocument.isPending}
      />
    </DashboardLayout>
  );
}

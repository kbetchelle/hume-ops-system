import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import {
  Bell,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Eye,
  Upload,
  X,
  Clock,
  Users,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { cn } from "@/lib/utils";
import {
  useStaffAnnouncements,
  useCreateStaffAnnouncement,
  useUpdateStaffAnnouncement,
  useDeleteStaffAnnouncement,
  useAnnouncementReadReceipts,
  uploadAnnouncementPhoto,
  deleteAnnouncementPhoto,
  type StaffAnnouncement,
  type CreateStaffAnnouncementInput,
} from "@/hooks/useStaffAnnouncements";
import { useAnnouncementCommentCounts } from "@/hooks/useAnnouncementComments";
import { AnnouncementTargetSelector, getTargetLabel } from "./AnnouncementTargetSelector";

type AnnouncementType = "announcement" | "weekly_update";
type Priority = "low" | "normal" | "high" | "urgent";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: "Low", color: "bg-slate-500", icon: <Info className="h-3 w-3" /> },
  normal: { label: "Normal", color: "bg-blue-500", icon: <Info className="h-3 w-3" /> },
  high: { label: "High", color: "bg-amber-500", icon: <AlertCircle className="h-3 w-3" /> },
  urgent: { label: "Urgent", color: "bg-destructive", icon: <AlertTriangle className="h-3 w-3" /> },
};

const EXPIRATION_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "never", label: "Never" },
];

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAnnouncement?: StaffAnnouncement | null;
}

function CreateEditDialog({ open, onOpenChange, editingAnnouncement }: CreateDialogProps) {
  const isEditing = !!editingAnnouncement;
  
  const [type, setType] = useState<AnnouncementType>(editingAnnouncement?.announcement_type || "announcement");
  const [title, setTitle] = useState(editingAnnouncement?.title || "");
  const [content, setContent] = useState(editingAnnouncement?.content || "");
  const [priority, setPriority] = useState<Priority>((editingAnnouncement?.priority as Priority) || "normal");
  const [targetDepartments, setTargetDepartments] = useState<string[] | null>(
    editingAnnouncement?.target_departments || null
  );
  const [expiration, setExpiration] = useState("never");
  const [weekStartDate, setWeekStartDate] = useState<string>(
    editingAnnouncement?.week_start_date || 
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(editingAnnouncement?.photo_url || null);
  const [uploading, setUploading] = useState(false);

  // Sync form state when editingAnnouncement changes (dialog reopens)
  useEffect(() => {
    if (editingAnnouncement) {
      setType(editingAnnouncement.announcement_type);
      setTitle(editingAnnouncement.title);
      setContent(editingAnnouncement.content);
      setPriority((editingAnnouncement.priority as Priority) || "normal");
      setTargetDepartments(editingAnnouncement.target_departments || null);
      setWeekStartDate(editingAnnouncement.week_start_date || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setPhotoUrl(editingAnnouncement.photo_url || null);
      if (editingAnnouncement.scheduled_at) {
        const d = new Date(editingAnnouncement.scheduled_at);
        setScheduleDate(format(d, "yyyy-MM-dd"));
        setScheduleTime(format(d, "HH:mm"));
      } else {
        setScheduleDate("");
        setScheduleTime("");
      }
      setExpiration("never");
    } else {
      setType("announcement");
      setTitle("");
      setContent("");
      setPriority("normal");
      setTargetDepartments(null);
      setExpiration("never");
      setWeekStartDate(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setScheduleDate("");
      setScheduleTime("");
      setPhotoUrl(null);
    }
  }, [editingAnnouncement]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createMutation = useCreateStaffAnnouncement();
  const updateMutation = useUpdateStaffAnnouncement();

  const resetForm = () => {
    setType("announcement");
    setTitle("");
    setContent("");
    setPriority("normal");
    setTargetDepartments(null);
    setExpiration("never");
    setWeekStartDate(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
    setScheduleDate("");
    setScheduleTime("");
    setPhotoUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadAnnouncementPhoto(file);
      setPhotoUrl(url);
    } catch (error) {
      console.error("Failed to upload photo:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (photoUrl) {
      try {
        await deleteAnnouncementPhoto(photoUrl);
      } catch (error) {
        console.error("Failed to delete photo:", error);
      }
    }
    setPhotoUrl(null);
  };

  const handleSubmit = async () => {
    const strippedContent = content.replace(/<[^>]*>/g, '').trim();
    if (!title.trim() || !strippedContent) return;

    // Calculate expires_at for announcements
    let expiresAt: string | null = null;
    if (type === "announcement" && expiration !== "never") {
      const days = parseInt(expiration);
      expiresAt = addDays(new Date(), days).toISOString();
    }

    // Calculate scheduled_at if scheduling
    let scheduledAt: string | null = null;
    if (scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    const input: CreateStaffAnnouncementInput = {
      title: title.trim(),
      content: content.trim(),
      announcement_type: type,
      priority: type === "announcement" ? priority : "normal",
      target_departments: targetDepartments,
      week_start_date: type === "weekly_update" ? weekStartDate : null,
      photo_url: photoUrl,
      expires_at: expiresAt,
      scheduled_at: scheduledAt,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: editingAnnouncement.id, ...input });
    } else {
      await createMutation.mutateAsync(input);
    }

    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Announcement" : "Create New Announcement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the announcement details below." : "Fill in the details for your new announcement."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Toggle - disabled when editing */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
                <TabsList className="w-full">
                  <TabsTrigger value="announcement" className="flex-1 gap-2">
                    <Bell className="h-4 w-4" />
                    Announcement
                  </TabsTrigger>
                  <TabsTrigger value="weekly_update" className="flex-1 gap-2">
                    <Calendar className="h-4 w-4" />
                    Weekly Update
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Enter announcement content..."
              minHeight="150px"
            />
          </div>


          {/* Week Date (Weekly Updates only) */}
          {type === "weekly_update" && (
            <div className="space-y-2">
              <Label htmlFor="weekDate">Week Starting</Label>
              <Input
                id="weekDate"
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Select the Monday of the week this update is for.
              </p>
            </div>
          )}

          {/* Expiration (Announcements only) */}
          {type === "announcement" && (
            <div className="space-y-2">
              <Label>Expires After</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Target Audience */}
          <AnnouncementTargetSelector
            value={targetDepartments}
            onChange={setTargetDepartments}
          />

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Photo Attachment</Label>
            {photoUrl ? (
              <div className="relative inline-block">
                <img
                  src={photoUrl}
                  alt="Attachment"
                  className="max-h-32 object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Upload Photo
                </Button>
              </div>
            )}
          </div>

          {/* Schedule for Later */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Schedule (Optional)</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                placeholder="Date"
              />
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="Time"
              />
              {(scheduleDate || scheduleTime) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to publish immediately.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.replace(/<[^>]*>/g, '').trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update" : "Create"} Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReadReceiptsDialog({
  announcement,
  open,
  onOpenChange,
}: {
  announcement: StaffAnnouncement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: receipts, isLoading } = useAnnouncementReadReceipts(announcement?.id || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Read Receipts</DialogTitle>
          <DialogDescription>
            {announcement?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : receipts && receipts.length > 0 ? (
            <div className="space-y-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.staff_id}
                  className="flex items-center justify-between p-2 border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {receipt.profile?.full_name || receipt.profile?.email || "Unknown"}
                    </p>
                    {receipt.roles && receipt.roles.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {receipt.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-[10px]">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(receipt.read_at), "MMM d, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No one has read this announcement yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementCard({
  announcement,
  thisWeekId,
  commentCounts,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onViewReceipts,
}: {
  announcement: StaffAnnouncement;
  thisWeekId: string | null;
  commentCounts: Record<string, number> | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewReceipts: () => void;
}) {
  const isWeekly = announcement.announcement_type === "weekly_update";
  const isScheduled = announcement.scheduled_at && new Date(announcement.scheduled_at) > new Date();

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/30",
        !announcement.is_active && "opacity-60",
        isWeekly && "border-blue-500 bg-blue-500/5"
      )}
      onClick={onToggleExpand}
    >
      <CardContent className="p-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isWeekly && announcement.id === thisWeekId && (
                <Badge className="bg-green-600 text-white border-green-600 text-[10px]">This Week</Badge>
              )}
              {isWeekly ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                  <Calendar className="h-3 w-3 mr-1" />
                  Weekly Update
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  <Bell className="h-3 w-3 mr-1" />
                  Announcement
                </Badge>
              )}
              {isScheduled ? (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Clock className="h-3 w-3" />
                  Scheduled {format(new Date(announcement.scheduled_at!), "MMM d, h:mm a")}
                </Badge>
              ) : announcement.is_active ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
              )}
            </div>

            <h3 className="font-medium truncate text-sm">{announcement.title}</h3>
            <div
              className={cn(
                "text-sm text-muted-foreground mt-1 prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline",
                !expanded && "line-clamp-2"
              )}
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />

            {announcement.photo_url && expanded && (
              <img src={announcement.photo_url} alt="Attachment" className="max-h-48 object-cover border mt-2" />
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getTargetLabel(announcement.target_departments)}
              </span>
              <span>
                Created {format(new Date(announcement.created_at), "MMM d, h:mm a")}
              </span>
              {announcement.week_start_date && (
                <span>Week of {format(new Date(announcement.week_start_date), "MMM d")}</span>
              )}
              {(commentCounts?.[announcement.id] || 0) > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {commentCounts?.[announcement.id]} comments
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onViewReceipts}
              title="View read receipts"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffAnnouncementsManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<StaffAnnouncement | null>(null);
  const [receiptsAnnouncement, setReceiptsAnnouncement] = useState<StaffAnnouncement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "announcement" | "weekly_update">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: announcements, isLoading } = useStaffAnnouncements();
  const deleteMutation = useDeleteStaffAnnouncement();

  const announcementIds = announcements?.map((a) => a.id) || [];
  const { data: commentCounts } = useAnnouncementCommentCounts(announcementIds);

  const filteredAnnouncements = (announcements || []).filter((a) => {
    if (typeFilter === "all") return true;
    return a.announcement_type === typeFilter;
  });

  const weeklyUpdates = (announcements || [])
    .filter((a) => a.announcement_type === "weekly_update")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const thisWeekId = useMemo(() => {
    if (weeklyUpdates.length === 0) return null;
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const newest = weeklyUpdates[0];
    return new Date(newest.created_at) >= sixDaysAgo ? newest.id : null;
  }, [weeklyUpdates]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEdit = (announcement: StaffAnnouncement) => {
    setEditingAnnouncement(announcement);
    setCreateDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteMutation.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const renderCards = (items: StaffAnnouncement[], emptyIcon: React.ReactNode, emptyText: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            {emptyIcon}
            <p className="text-muted-foreground">{emptyText}</p>
            <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              Create your first {typeFilter === "weekly_update" ? "weekly update" : "announcement"}
            </Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-2">
        {items.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            thisWeekId={thisWeekId}
            commentCounts={commentCounts}
            expanded={expandedIds.has(announcement.id)}
            onToggleExpand={() => toggleExpand(announcement.id)}
            onEdit={() => handleEdit(announcement)}
            onDelete={() => setDeleteConfirmId(announcement.id)}
            onViewReceipts={() => setReceiptsAnnouncement(announcement)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Staff Announcements</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage announcements for staff members.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* View tabs */}
      <Tabs
        value={typeFilter}
        onValueChange={(v) => setTypeFilter(v as "all" | "announcement" | "weekly_update")}
      >
        <TabsList className="w-full max-w-2xl">
          <TabsTrigger value="all" className="flex-1 gap-2">
            <Bell className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="announcement" className="flex-1 gap-2">
            <Bell className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="weekly_update" className="flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderCards(filteredAnnouncements, <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />, "No announcements found.")}
        </TabsContent>
        <TabsContent value="announcement" className="mt-6">
          {renderCards(filteredAnnouncements, <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />, "No announcements found.")}
        </TabsContent>
        <TabsContent value="weekly_update" className="mt-6">
          {renderCards(filteredAnnouncements, <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />, "No weekly updates found.")}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <CreateEditDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditingAnnouncement(null);
        }}
        editingAnnouncement={editingAnnouncement}
      />

      {/* Read Receipts Dialog */}
      <ReadReceiptsDialog
        announcement={receiptsAnnouncement}
        open={!!receiptsAnnouncement}
        onOpenChange={(open) => !open && setReceiptsAnnouncement(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement and all its comments will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

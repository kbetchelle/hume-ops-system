import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { insertInto } from "@/lib/dataApi";

type UpdateCategory = "feature" | "bugfix" | "improvement" | "announcement";

const CATEGORIES: { value: UpdateCategory; label: string }[] = [
  { value: "feature", label: "New Feature" },
  { value: "bugfix", label: "Bug Fix" },
  { value: "improvement", label: "Improvement" },
  { value: "announcement", label: "General Announcement" },
];

export default function DevUpdatesPage() {
  const [category, setCategory] = useState<UpdateCategory>("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) return;

    setSending(true);
    try {
      // Get all non-deactivated users
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("user_id")
        .or("deactivated.is.null,deactivated.eq.false");

      if (usersError) throw usersError;
      if (!allUsers || allUsers.length === 0) {
        toast.error("No users found");
        return;
      }

      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
      const notificationTitle = `[${categoryLabel}] ${title.trim()}`;

      const notifications = allUsers.map((u) => ({
        user_id: u.user_id,
        type: "announcement" as const,
        title: notificationTitle,
        body: body.trim() || null,
        data: { dev_update: true, category },
        is_read: false,
      }));

      const { error } = await insertInto("staff_notifications", notifications);
      if (error) throw error;

      toast.success(`Update sent to ${allUsers.length} users`);
      setTitle("");
      setBody("");
    } catch (err: any) {
      console.error("Failed to send dev update:", err);
      toast.error("Failed to send update");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Dev Updates">
      <div className="p-6 md:p-8 max-w-2xl">
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Broadcast App Update
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as UpdateCategory)}
              >
                <SelectTrigger className="rounded-none text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New checklist feature added"
                className="rounded-none text-xs"
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                Details (optional)
              </Label>
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Describe the update..."
                minHeight="120px"
                className="rounded-none text-xs"
              />
            </div>

            {/* Send */}
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim()}
              className="w-full rounded-none text-[10px] uppercase tracking-widest"
            >
              {sending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Send className="h-3 w-3 mr-2" />
              )}
              Send to All Users
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

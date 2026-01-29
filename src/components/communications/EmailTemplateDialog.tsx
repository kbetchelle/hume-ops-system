import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  EmailTemplate,
  useAddEmailTemplate,
  useUpdateEmailTemplate,
} from "@/hooks/useMemberCommunications";
import { useAuth } from "@/hooks/useAuth";

interface EmailTemplateDialogProps {
  template?: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailTemplateDialog({
  template,
  open,
  onOpenChange,
}: EmailTemplateDialogProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const { user } = useAuth();

  const addTemplate = useAddEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setSubject(template.subject);
      setBody(template.body);
      setCategory(template.category || "");
    } else {
      setTitle("");
      setSubject("");
      setBody("");
      setCategory("");
    }
  }, [template, open]);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !subject.trim() || !body.trim()) return;

    if (isEditing && template) {
      await updateTemplate.mutateAsync({
        id: template.id,
        title: title.trim(),
        subject: subject.trim(),
        body: body.trim(),
        category: category.trim() || undefined,
      });
    } else {
      await addTemplate.mutateAsync({
        title: title.trim(),
        subject: subject.trim(),
        body: body.trim(),
        category: category.trim() || undefined,
        userId: user.id,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setSubject("");
    setBody("");
    setCategory("");
    onOpenChange(false);
  };

  const isPending = addTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Email Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this email template."
              : "Create a reusable email template for member communications."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Onboarding"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line for the email..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the email template content..."
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use [Member Name] as a placeholder for personalization.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !subject.trim() || !body.trim() || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update" : "Create"} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

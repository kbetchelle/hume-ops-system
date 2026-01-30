import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { Member } from "@/hooks/useClients";
import { useEmailTemplates, useAddCommunication } from "@/hooks/useMemberCommunications";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailComposeDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brandVoiceSuggestions = [
  {
    label: "Warm Welcome",
    text: "We're delighted to have you as part of our community. ",
  },
  {
    label: "Personal Touch",
    text: "I wanted to personally reach out to ensure your experience with us is exceptional. ",
  },
  {
    label: "Appreciation",
    text: "Thank you for being a valued member. Your wellness journey is important to us. ",
  },
  {
    label: "Closing - Warm",
    text: "\n\nWarm regards,\n[Your Name]\nConcierge Team",
  },
  {
    label: "Closing - Professional",
    text: "\n\nBest regards,\n[Your Name]\nMember Services",
  },
];

export function EmailComposeDialog({
  member,
  open,
  onOpenChange,
}: EmailComposeDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { user } = useAuth();
  const { data: templates = [] } = useEmailTemplates();
  const addCommunication = useAddCommunication();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const insertBrandVoice = (text: string) => {
    setBody((prev) => prev + text);
  };

  const handleSend = async () => {
    if (!member || !user || !subject.trim() || !body.trim()) return;

    await addCommunication.mutateAsync({
      memberId: member.id,
      userId: user.id,
      communicationType: "email",
      subject: subject.trim(),
      content: body.trim(),
      metadata: {
        to: member.client_email,
        sentAt: new Date().toISOString(),
      },
    });

    handleClose();
  };

  const handleClose = () => {
    setSubject("");
    setBody("");
    onOpenChange(false);
  };

  if (!member) return null;

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send an email to {member.client_name || member.client_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To field */}
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={member.client_email} disabled className="bg-muted" />
          </div>

          {/* Template selector */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Insert template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {categoryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {template.title}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No templates available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Brand Voice Suggestions
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {brandVoiceSuggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => insertBrandVoice(suggestion.text)}
                        >
                          <span className="truncate">{suggestion.label}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || addCommunication.isPending}
          >
            {addCommunication.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Log Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

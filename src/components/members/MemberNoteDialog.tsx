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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Member, useMemberNotes, useAddMemberNote } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface MemberNoteDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberNoteDialog({
  member,
  open,
  onOpenChange,
}: MemberNoteDialogProps) {
  const [noteContent, setNoteContent] = useState("");
  const { user } = useAuth();
  
  const { data: notes = [], isLoading: notesLoading } = useMemberNotes(
    member?.id || ""
  );
  const addNoteMutation = useAddMemberNote();

  const handleSubmit = async () => {
    if (!member || !user || !noteContent.trim()) return;

    await addNoteMutation.mutateAsync({
      memberId: member.id,
      content: noteContent.trim(),
      userId: user.id,
    });

    setNoteContent("");
  };

  const handleClose = () => {
    setNoteContent("");
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notes for {member.client_name || member.client_email}</DialogTitle>
          <DialogDescription>
            Add notes about this member. All notes are visible to authorized staff.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new note */}
          <div className="space-y-2">
            <Textarea
              placeholder="Write a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              size="sm"
            >
              {addNoteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Note
            </Button>
          </div>

          <Separator />

          {/* Existing notes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Previous Notes</h4>
            {notesLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No notes yet for this member.
              </p>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-muted/50 rounded-lg space-y-1"
                    >
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

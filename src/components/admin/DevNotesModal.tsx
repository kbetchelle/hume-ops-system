import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/shared/RichTextEditor";

interface DevNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteContent: string;
  onNoteChange: (content: string) => void;
  onSave: () => void;
}

export function DevNotesModal({
  open,
  onOpenChange,
  noteContent,
  onNoteChange,
  onSave,
}: DevNotesModalProps) {
  const prevOpenRef = useRef(open);

  // Save when closing
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      onSave();
    }
    prevOpenRef.current = open;
  }, [open, onSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 rounded-none animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-sm">Latest Edits in Ops System Application</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <RichTextEditor
            value={noteContent}
            onChange={onNoteChange}
            placeholder="Click to add notes..."
            minHeight="100%"
            className="h-full border border-primary"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef } from "react";
import { useCallback } from "react";
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
  onSave
}: DevNotesModalProps) {
  const prevOpenRef = useRef(open);

  // Handle Cmd+Enter to save and close
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSave();
      onOpenChange(false);
    }
  }, [onSave, onOpenChange]);

  // Add keyboard listener when modal is open
  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Save when closing
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      onSave();
    }
    prevOpenRef.current = open;
  }, [open, onSave]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(56rem+40px)] h-[calc(80vh+40px)] flex flex-col p-0 gap-0 rounded-none animate-in fade-in-0 zoom-in-95 duration-200 text-[1.4em]">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-[0.875em]">Latest Edits in Ops System Application</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-[25px] px-[50px]">
          <RichTextEditor value={noteContent} onChange={onNoteChange} placeholder="Click to add notes..." minHeight="100%" className="h-full border border-primary text-[1em]" />
        </div>
      </DialogContent>
    </Dialog>;
}
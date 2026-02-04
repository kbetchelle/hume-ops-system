import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevNotes, useUpdateDevNotes, useIsKat } from "@/hooks/useDevDashboard";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { RichTextEditor } from "@/components/shared/RichTextEditor";

export function DevNotesCard() {
  const { user } = useAuthContext();
  const isKat = useIsKat(user?.email);
  const { data: notes, isLoading } = useDevNotes();
  const updateNotes = useUpdateDevNotes();
  const [localContent, setLocalContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasUnsavedChanges = useRef(false);

  // Sync local content with fetched notes
  useEffect(() => {
    if (notes?.content !== undefined && !isEditing) {
      setLocalContent(notes.content);
    }
  }, [notes?.content, isEditing]);

  // Save on blur or when clicking outside
  const handleSave = () => {
    if (hasUnsavedChanges.current && isKat) {
      updateNotes.mutate(localContent);
      hasUnsavedChanges.current = false;
    }
    setIsEditing(false);
  };

  // Handle content change
  const handleContentChange = (value: string) => {
    setLocalContent(value);
    hasUnsavedChanges.current = true;
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, localContent]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges.current && isKat) {
        updateNotes.mutate(localContent);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also save when component unmounts
      if (hasUnsavedChanges.current && isKat) {
        updateNotes.mutate(localContent);
      }
    };
  }, [localContent, isKat]);

  // Handle Enter key to save (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Card className="w-80 flex-shrink-0" ref={containerRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-[0.15em] font-normal text-muted-foreground">
          Notes from Dev
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : isKat ? (
          <div onClick={() => setIsEditing(true)} onKeyDown={handleKeyDown}>
            <RichTextEditor
              value={localContent}
              onChange={handleContentChange}
              placeholder="Click to add notes..."
              minHeight="150px"
              className="text-xs"
            />
            {isEditing && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Press Enter to save, Shift+Enter for new line
              </p>
            )}
          </div>
        ) : (
          <div 
            className="prose prose-sm max-w-none text-xs min-h-[150px] p-3 border border-input bg-background
              [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
              [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: localContent || "<em class='text-muted-foreground'>No notes yet</em>" }}
          />
        )}
      </CardContent>
    </Card>
  );
}

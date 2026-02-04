import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import {
  usePageStatuses,
  useUpdatePageStatus,
  useDevNotes,
  useUpdateDevNotes,
  PageStatus,
} from "@/hooks/useDevDashboard";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS: { value: PageStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "finishing_touches", label: "Finishing Touches" },
  { value: "completed", label: "Completed" },
];

const getStatusColor = (status: PageStatus) => {
  switch (status) {
    case "not_started":
      return "text-muted-foreground";
    case "in_progress":
      return "text-yellow-600";
    case "finishing_touches":
      return "text-blue-600";
    case "completed":
      return "text-green-600";
    default:
      return "";
  }
};

export function DevDashboardPanel() {
  const { data: pages, isLoading: pagesLoading } = usePageStatuses();
  const { data: devNote, isLoading: notesLoading } = useDevNotes();
  const updatePageStatus = useUpdatePageStatus();
  const updateDevNotes = useUpdateDevNotes();

  const [noteContent, setNoteContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const noteCardRef = useRef<HTMLDivElement>(null);
  const hasLoadedNote = useRef(false);

  // Load initial note content
  useEffect(() => {
    if (devNote && !hasLoadedNote.current) {
      setNoteContent(devNote.content || "");
      hasLoadedNote.current = true;
    }
  }, [devNote]);

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        noteCardRef.current &&
        !noteCardRef.current.contains(event.target as Node)
      ) {
        saveNotes();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, noteContent]);

  // Handle keyboard save
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Allow shift+enter for new lines
      saveNotes();
    }
  };

  useEffect(() => {
    if (isEditing) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isEditing, noteContent]);

  const saveNotes = () => {
    if (noteContent !== devNote?.content) {
      updateDevNotes.mutate({ content: noteContent });
    }
    setIsEditing(false);
  };

  const handleStatusChange = (pageId: string, newStatus: PageStatus) => {
    updatePageStatus.mutate({ pageId, status: newStatus });
  };

  if (pagesLoading || notesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left panel - Dev Notes (1/4 width) */}
      <div className="w-1/4 flex flex-col">
        <Card
          ref={noteCardRef}
          className="border flex flex-col flex-1 cursor-text"
          onClick={() => setIsEditing(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xs">Notes from Dev</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {isEditing ? (
              <RichTextEditor
                value={noteContent}
                onChange={setNoteContent}
                placeholder="Click to add notes..."
                minHeight="100%"
                className="flex-1"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none text-xs flex-1 overflow-auto
                  [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{
                  __html: noteContent || '<span class="text-muted-foreground">Click to add notes...</span>',
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right panel - Page Status Tracker (3/4 width) */}
      <div className="w-3/4 flex flex-col">
        <Card className="border flex flex-col flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs">Page Development Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-0">
              {/* Header row */}
              <div className="flex items-center py-2 border-b border-border">
                <div className="flex-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Page
                </div>
                <div className="w-48 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Status
                </div>
              </div>

              {/* Page rows */}
              {pages?.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center py-3 border-b border-border last:border-b-0"
                >
                  <div className="flex-1 text-xs tracking-wide">
                    {page.page_title}
                  </div>
                  <div className="w-48">
                    <Select
                      value={page.status}
                      onValueChange={(value: PageStatus) =>
                        handleStatusChange(page.id, value)
                      }
                    >
                      <SelectTrigger
                        className={`h-7 text-[10px] border-0 bg-transparent shadow-none ${getStatusColor(
                          page.status
                        )}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className={`text-xs ${getStatusColor(option.value)}`}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  useUpdatePageRole,
  useDeletePageStatus,
  PageStatus,
} from "@/hooks/useDevDashboard";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface PageRowProps {
  page: {
    id: string;
    page_title: string;
    status: PageStatus;
    role_category: string | null;
  };
  onStatusChange: (pageId: string, status: PageStatus) => void;
  onRoleChange: (pageId: string, role: string) => void;
  onDelete: (pageId: string) => void;
}

function PageRow({ page, onStatusChange, onRoleChange, onDelete }: PageRowProps) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleValue, setRoleValue] = useState(page.role_category || "");
  const [showDelete, setShowDelete] = useState(false);
  const [isHoveredStatus, setIsHoveredStatus] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const roleInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (isEditingRole && roleInputRef.current) {
      roleInputRef.current.focus();
    }
  }, [isEditingRole]);

  const handleRoleDoubleClick = () => {
    setIsEditingRole(true);
    setRoleValue(page.role_category || "");
  };

  const handleRoleBlur = () => {
    if (roleValue !== page.role_category) {
      onRoleChange(page.id, roleValue);
    }
    setIsEditingRole(false);
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRoleBlur();
    } else if (e.key === "Escape") {
      setRoleValue(page.role_category || "");
      setIsEditingRole(false);
    }
  };

  // Handle wheel event for two-finger swipe detection
  const handleWheel = (e: React.WheelEvent) => {
    // Detect horizontal scroll (two-finger swipe on trackpad)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && e.deltaX > 30) {
      setShowDelete(true);
    } else if (e.deltaX < -30) {
      setShowDelete(false);
    }
  };

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    
    if (deltaX > 50 && deltaY < 30) {
      setShowDelete(true);
    } else if (deltaX < -50 && deltaY < 30) {
      setShowDelete(false);
    }
  };

  return (
    <div
      ref={rowRef}
      className="flex items-center py-2 border-b border-border last:border-b-0 relative overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`flex items-center transition-transform duration-200 w-full ${
          showDelete ? "-translate-x-10" : "translate-x-0"
        }`}
      >
        {/* Page Title */}
        <div className="flex-1 text-xs tracking-wide min-w-0 truncate pr-2 pl-2">
          {page.page_title}
        </div>

        {/* Role Column */}
        <div 
          className="w-20 text-right pr-2"
          onDoubleClick={handleRoleDoubleClick}
        >
          {isEditingRole ? (
            <input
              ref={roleInputRef}
              type="text"
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
              onBlur={handleRoleBlur}
              onKeyDown={handleRoleKeyDown}
              className="w-full text-[10px] text-right bg-transparent border-none outline-none caret-primary"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground cursor-text">
              {page.role_category || "—"}
            </span>
          )}
        </div>

        {/* Status Column */}
        <div 
          className="w-28 flex justify-end"
          onMouseEnter={() => setIsHoveredStatus(true)}
          onMouseLeave={() => !isSelectOpen && setIsHoveredStatus(false)}
        >
          {isHoveredStatus || isSelectOpen ? (
            <Select
              value={page.status}
              onValueChange={(value: PageStatus) => onStatusChange(page.id, value)}
              onOpenChange={(open) => {
                setIsSelectOpen(open);
                if (!open) setIsHoveredStatus(false);
              }}
            >
              <SelectTrigger
                className={`h-6 text-[10px] border-0 bg-transparent shadow-none p-0 w-auto gap-1 ${getStatusColor(page.status)}`}
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
          ) : (
            <span className={`text-[10px] cursor-pointer ${getStatusColor(page.status)}`}>
              {STATUS_OPTIONS.find(o => o.value === page.status)?.label}
            </span>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <div 
        className={`absolute right-0 top-0 bottom-0 flex items-center transition-transform duration-200 ${
          showDelete ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Button
          variant="destructive"
          size="sm"
          className="h-full rounded-none px-2"
          onClick={() => onDelete(page.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function DevDashboardPanel() {
  const { data: pages, isLoading: pagesLoading } = usePageStatuses();
  const { data: devNote, isLoading: notesLoading } = useDevNotes();
  const updatePageStatus = useUpdatePageStatus();
  const updateDevNotes = useUpdateDevNotes();
  const updatePageRole = useUpdatePageRole();
  const deletePageStatus = useDeletePageStatus();

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

  const handleRoleChange = (pageId: string, roleCategory: string) => {
    updatePageRole.mutate({ pageId, roleCategory });
  };

  const handleDelete = (pageId: string) => {
    deletePageStatus.mutate(pageId);
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
      {/* Left panel - Dev Notes (7/12 width) */}
      <div className="w-7/12 flex flex-col">
        <Card
          ref={noteCardRef}
          className="border flex flex-col flex-1 cursor-text"
          onClick={() => setIsEditing(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xs">Latest Edits in Ops System Application</CardTitle>
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

      {/* Right panel - Page Status Tracker (5/12 width) */}
      <div className="w-5/12 flex flex-col">
        <Card className="border flex flex-col flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs">BUILD STATUS</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-0">
              {/* Header row */}
              <div className="flex items-center py-2 border-b border-border">
                <div className="flex-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Page
                </div>
                <div className="w-20 text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-right pr-2">
                  Role
                </div>
                <div className="w-28 text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-right">
                  Status
                </div>
              </div>

              {/* Page rows - grouped by role */}
              {(() => {
                const sortedPages = pages?.slice().sort((a, b) => {
                  const roleA = a.role_category || "zzz";
                  const roleB = b.role_category || "zzz";
                  return roleA.localeCompare(roleB);
                }) || [];
                
                let currentRole: string | null = null;
                
                return sortedPages.map((page) => {
                  const showDivider = page.role_category !== currentRole;
                  currentRole = page.role_category;
                  
                  return (
                    <div key={page.id}>
                      {showDivider && (
                        <div className="flex items-center gap-2 pt-4 pb-2 first:pt-0">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                            {page.role_category || "Uncategorized"}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <PageRow
                        page={page}
                        onStatusChange={handleStatusChange}
                        onRoleChange={handleRoleChange}
                        onDelete={handleDelete}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

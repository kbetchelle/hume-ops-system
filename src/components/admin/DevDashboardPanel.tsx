import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { usePageStatuses, useUpdatePageStatus, useDevNotes, useUpdateDevNotes, useUpdatePageRole, useDeletePageStatus, PageStatus } from "@/hooks/useDevDashboard";
import { Loader2 } from "lucide-react";
import { DevNotesModal } from "./DevNotesModal";
import { BuildStatusModal } from "./BuildStatusModal";
import { useActiveRole } from "@/hooks/useActiveRole";

const STATUS_OPTIONS: {
  value: PageStatus;
  label: string;
}[] = [{
  value: "not_started",
  label: "Not Started"
}, {
  value: "in_progress",
  label: "In Progress"
}, {
  value: "finishing_touches",
  label: "Finishing Touches"
}, {
  value: "completed",
  label: "Completed"
}];
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
}
function PageRow({
  page,
  onStatusChange
}: PageRowProps) {
  const [isHoveredStatus, setIsHoveredStatus] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  return <div className="flex items-center py-2 border-b border-border last:border-b-0">
      {/* Page Title */}
      <div className="flex-1 text-xs tracking-wide min-w-0 truncate pr-2 pl-2">
        {page.page_title}
      </div>

      {/* Status Column */}
      <div className="w-28 flex justify-end" onMouseEnter={() => setIsHoveredStatus(true)} onMouseLeave={() => !isSelectOpen && setIsHoveredStatus(false)}>
        {isHoveredStatus || isSelectOpen ? <Select value={page.status} onValueChange={(value: PageStatus) => onStatusChange(page.id, value)} onOpenChange={open => {
        setIsSelectOpen(open);
        if (!open) setIsHoveredStatus(false);
      }}>
            <SelectTrigger className={`h-6 text-xs border-0 bg-transparent shadow-none p-0 w-auto gap-1 ${getStatusColor(page.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => <SelectItem key={option.value} value={option.value} className={`text-sm ${getStatusColor(option.value)}`}>
                  {option.label}
                </SelectItem>)}
            </SelectContent>
          </Select> : <span className={`text-xs cursor-pointer ${getStatusColor(page.status)}`}>
            {STATUS_OPTIONS.find(o => o.value === page.status)?.label}
          </span>}
      </div>
    </div>;
}
export function DevDashboardPanel() {
  const { activeRole } = useActiveRole();
  const isAdmin = activeRole === 'admin';
  
  const {
    data: pages,
    isLoading: pagesLoading
  } = usePageStatuses();
  const {
    data: devNote,
    isLoading: notesLoading
  } = useDevNotes();
  const updatePageStatus = useUpdatePageStatus();
  const updateDevNotes = useUpdateDevNotes();
  const updatePageRole = useUpdatePageRole();
  const [noteContent, setNoteContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
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
      if (isEditing && noteCardRef.current && !noteCardRef.current.contains(event.target as Node)) {
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
  const saveNotes = useCallback(() => {
    if (noteContent !== devNote?.content) {
      updateDevNotes.mutate({
        content: noteContent
      });
    }
    setIsEditing(false);
  }, [noteContent, devNote?.content, updateDevNotes]);
  const handleStatusChange = (pageId: string, newStatus: PageStatus) => {
    updatePageStatus.mutate({
      pageId,
      status: newStatus
    });
  };
  const handleRoleChange = (pageId: string, roleCategory: string) => {
    updatePageRole.mutate({
      pageId,
      roleCategory
    });
  };
  if (pagesLoading || notesLoading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>;
  }
  return <>
      <div className="flex gap-6 h-full">
        {/* Left panel - Dev Notes (7/12 width) */}
        <div className="w-7/12 flex flex-col">
          <Card ref={noteCardRef} className="border flex flex-col flex-1 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setNotesModalOpen(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs">Latest Edits in Ops System Application</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0" onClick={e => e.stopPropagation()}>
              {isEditing ? <RichTextEditor value={noteContent} onChange={setNoteContent} placeholder="Click to add notes..." minHeight="100%" className="flex-1 border border-primary" /> : <div className="prose prose-sm max-w-none text-xs flex-1 overflow-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline border-primary border px-[10px] py-[6px] cursor-text" dangerouslySetInnerHTML={{
              __html: noteContent || '<span class="text-muted-foreground">Click to add notes...</span>'
            }} onClick={e => {
              e.stopPropagation();
              setIsEditing(true);
            }} />}
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Page Status Tracker (5/12 width) */}
        <div className="w-5/12 flex flex-col">
          <Card className="border flex flex-col flex-1 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusModalOpen(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs">BUILD STATUS</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="space-y-0">
                {/* Page rows - grouped by role */}
                {(() => {
                const sortedPages = pages?.slice().sort((a, b) => {
                  const roleA = a.role_category || "zzz";
                  const roleB = b.role_category || "zzz";
                  return roleA.localeCompare(roleB);
                }) || [];
                let currentRole: string | null = null;
                return sortedPages.map(page => {
                  const showDivider = page.role_category !== currentRole;
                  currentRole = page.role_category;
                  return <div key={page.id}>
                        {showDivider && <div className="flex items-center gap-3 pt-5 pb-2 first:pt-0 border-primary-foreground">
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                              {page.role_category || "Uncategorized"}
                            </span>
                            <div className="flex-1 h-[2px] bg-border/80" />
                          </div>}
                        <PageRow page={page} onStatusChange={handleStatusChange} />
                      </div>;
                });
              })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <DevNotesModal open={notesModalOpen} onOpenChange={setNotesModalOpen} noteContent={noteContent} onNoteChange={setNoteContent} onSave={saveNotes} />

      <BuildStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} pages={pages} onStatusChange={handleStatusChange} onRoleChange={handleRoleChange} isAdmin={isAdmin} />
    </>;
}
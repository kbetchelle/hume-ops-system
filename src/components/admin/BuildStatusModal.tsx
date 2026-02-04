import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PageStatus } from "@/hooks/useDevDashboard";
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
interface PageData {
  id: string;
  page_title: string;
  status: PageStatus;
  role_category: string | null;
}
interface ModalPageRowProps {
  page: PageData;
  onStatusChange: (pageId: string, status: PageStatus) => void;
  onRoleChange: (pageId: string, role: string) => void;
  onDelete: (pageId: string) => void;
}
function ModalPageRow({
  page,
  onStatusChange,
  onRoleChange,
  onDelete
}: ModalPageRowProps) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleValue, setRoleValue] = useState(page.role_category || "");
  const roleInputRef = useRef<HTMLInputElement>(null);
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
  return <div className="flex items-center py-3 border-b border-border last:border-b-0 gap-4">
      {/* Page Title */}
      <div className="flex-1 text-sm min-w-0 truncate pl-2 text-primary mx-[20px]">
        {page.page_title}
      </div>

      {/* Status Column */}
      <div className="w-36">
        <Select value={page.status} onValueChange={(value: PageStatus) => onStatusChange(page.id, value)}>
          <SelectTrigger className={`h-8 text-xs border-0 bg-transparent shadow-none ${getStatusColor(page.status)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => <SelectItem key={option.value} value={option.value} className={`text-xs ${getStatusColor(option.value)}`}>
                {option.label}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Delete Button */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(page.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>;
}
interface BuildStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PageData[] | undefined;
  onStatusChange: (pageId: string, status: PageStatus) => void;
  onRoleChange: (pageId: string, role: string) => void;
  onDelete: (pageId: string) => void;
}
export function BuildStatusModal({
  open,
  onOpenChange,
  pages,
  onStatusChange,
  onRoleChange,
  onDelete
}: BuildStatusModalProps) {
  const sortedPages = pages?.slice().sort((a, b) => {
    const roleA = a.role_category || "zzz";
    const roleB = b.role_category || "zzz";
    return roleA.localeCompare(roleB);
  }) || [];
  let currentRole: string | null = null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 rounded-none animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-sm">BUILD STATUS</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header row */}
          <div className="flex items-center py-2 border-b border-border gap-4 sticky top-0 bg-background z-10">
            <div className="flex-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium pl-2">
              ​
            </div>
            <div className="w-36 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Status
            </div>
            <div className="w-8" />
          </div>

          {/* Page rows - grouped by role */}
          {sortedPages.map(page => {
          const showDivider = page.role_category !== currentRole;
          currentRole = page.role_category;
          return <div key={page.id}>
                {showDivider && <div className="flex items-center gap-3 pt-6 pb-2 first:pt-0">
                    <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">
                      {page.role_category || "Uncategorized"}
                    </span>
                    <div className="flex-1 h-[2px] bg-border/80" />
                  </div>}
                <ModalPageRow page={page} onStatusChange={onStatusChange} onRoleChange={onRoleChange} onDelete={onDelete} />
              </div>;
        })}
        </div>
      </DialogContent>
    </Dialog>;
}
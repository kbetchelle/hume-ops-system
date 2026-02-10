import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageStatuses, useUpdatePageStatus, useUpdatePageRole, PageStatus } from "@/hooks/useDevDashboard";
import { Loader2 } from "lucide-react";
import { BuildStatusModal } from "./BuildStatusModal";
import { useActiveRole } from "@/hooks/useActiveRole";

const STATUS_OPTIONS: {
  value: PageStatus;
  label: string;
}[] = [{
  value: "Not Started",
  label: "Not Started"
}, {
  value: "In Progress",
  label: "In Progress"
}, {
  value: "Finishing Touches",
  label: "Finishing Touches"
}, {
  value: "Complete",
  label: "Complete"
}, {
  value: "Deprioritized",
  label: "Deprioritized"
}, {
  value: "PHASE 2",
  label: "Phase 2"
}, {
  value: "TBD",
  label: "TBD"
}];
const getStatusColor = (status: PageStatus) => {
  switch (status) {
    case "Not Started":
      return "text-muted-foreground";
    case "In Progress":
      return "text-yellow-600";
    case "Finishing Touches":
      return "text-blue-600";
    case "Complete":
      return "text-green-600";
    case "Deprioritized":
      return "text-orange-500";
    case "PHASE 2":
      return "text-purple-600";
    case "TBD":
      return "text-muted-foreground/70";
    default:
      return "text-muted-foreground";
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
  const updatePageStatus = useUpdatePageStatus();
  const updatePageRole = useUpdatePageRole();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
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
  if (pagesLoading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>;
  }
  return <>
      <div className="h-full">
          <Card className="border flex flex-col h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusModalOpen(true)}>
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

      <BuildStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} pages={pages} onStatusChange={handleStatusChange} onRoleChange={handleRoleChange} isAdmin={isAdmin} />
    </>;
}
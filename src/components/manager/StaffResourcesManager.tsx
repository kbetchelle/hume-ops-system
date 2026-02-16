import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, FileText } from "lucide-react";
import { QuickLinksManagement } from "@/components/manager/staff-resources/QuickLinksManagement";
import { ResourcePagesManagement } from "@/components/manager/staff-resources/ResourcePagesManagement";
import { useSearchParams } from "react-router-dom";

export function StaffResourcesManager() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "resource-pages" ? "resource-pages" : "quick-links";

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <Tabs defaultValue={defaultTab} className="w-full p-[10px] flex flex-col flex-1 min-h-0">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 h-auto p-0">
          <TabsTrigger
            value="quick-links"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3"
          >
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Quick Links</span>
          </TabsTrigger>
          <TabsTrigger
            value="resource-pages"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Resource Pages</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quick-links" className="pt-8 flex-1 min-h-0 overflow-auto">
          <QuickLinksManagement />
        </TabsContent>
        <TabsContent value="resource-pages" className="pt-8 flex-1 min-h-0 overflow-auto">
          <ResourcePagesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

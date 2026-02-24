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
        <TabsList className="w-full">
          <TabsTrigger value="quick-links" className="flex-1 gap-2">
            <Link2 className="h-4 w-4" />
            Quick Links
          </TabsTrigger>
          <TabsTrigger value="resource-pages" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            Resource Pages
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

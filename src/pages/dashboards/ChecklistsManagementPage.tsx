import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConciergeChecklistManager } from "@/components/checklists/concierge/ConciergeChecklistManager";
import { BoHChecklistManager } from "@/components/checklists/boh/BoHChecklistManager";
import { CafeChecklistManager } from "@/components/checklists/cafe/CafeChecklistManager";
import { ChecklistCompletionViewer } from "@/components/checklists/ChecklistCompletionViewer";
import { AssignChecklistsTab } from "@/components/checklists/AssignChecklistsTab";

export default function ChecklistsManagementPage() {
  return (
    <DashboardLayout title="Checklists">
      <div className="space-y-8">
        <Tabs defaultValue="concierge" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="concierge" className="flex-1 gap-2">
              Concierge
            </TabsTrigger>
            <TabsTrigger value="boh" className="flex-1 gap-2">
              Back of House
            </TabsTrigger>
            <TabsTrigger value="cafe" className="flex-1 gap-2">
              Cafe
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex-1 gap-2">
              Assign Checklists
            </TabsTrigger>
            <TabsTrigger value="status" className="flex-1 gap-2">
              Completion Status
            </TabsTrigger>
          </TabsList>
          <TabsContent value="concierge" className="pt-8">
            <ConciergeChecklistManager />
          </TabsContent>
          <TabsContent value="boh" className="pt-8">
            <BoHChecklistManager />
          </TabsContent>
          <TabsContent value="cafe" className="pt-8">
            <CafeChecklistManager />
          </TabsContent>
          <TabsContent value="assign" className="pt-8">
            <AssignChecklistsTab />
          </TabsContent>
          <TabsContent value="status" className="pt-8">
            <ChecklistCompletionViewer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

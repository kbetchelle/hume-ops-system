import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConciergeChecklistManager } from "@/components/checklists/concierge/ConciergeChecklistManager";
import { BoHChecklistManager } from "@/components/checklists/boh/BoHChecklistManager";
import { CafeChecklistManager } from "@/components/checklists/cafe/CafeChecklistManager";
import { ChecklistCompletionViewer } from "@/components/checklists/ChecklistCompletionViewer";

export default function ChecklistsManagementPage() {
  return (
    <DashboardLayout title="Checklists">
      <div className="space-y-8">
        <Tabs defaultValue="concierge" className="w-full">
          <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="concierge"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Concierge
            </TabsTrigger>
            <TabsTrigger
              value="boh"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Back of House
            </TabsTrigger>
            <TabsTrigger
              value="cafe"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Cafe
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
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
          <TabsContent value="status" className="pt-8">
            <ChecklistCompletionViewer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

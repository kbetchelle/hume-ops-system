import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistManager } from "@/components/checklists/ChecklistManager";
import { ChecklistCompletionViewer } from "@/components/checklists/ChecklistCompletionViewer";
import { TemplateChecklistManager } from "@/components/checklists/TemplateChecklistManager";

export default function ChecklistsManagementPage() {
  return (
    <DashboardLayout title="Checklists">
      <div className="space-y-8">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="templates"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Template Checklists
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Legacy Checklists
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
            >
              Completion Status
            </TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="pt-8">
            <TemplateChecklistManager />
          </TabsContent>
          <TabsContent value="manage" className="pt-8">
            <ChecklistManager />
          </TabsContent>
          <TabsContent value="status" className="pt-8">
            <ChecklistCompletionViewer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

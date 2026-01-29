import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { useTrainingPlans, TrainingPlan } from "@/hooks/useTrainingPlans";
import { useClients } from "@/hooks/useClients";
import { TrainingPlanCard } from "@/components/training/TrainingPlanCard";
import { TrainingPlanEditor } from "@/components/training/TrainingPlanEditor";
import { CreatePlanDialog } from "@/components/training/CreatePlanDialog";

export default function TrainingPlansPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);

  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    togglePublic,
    duplicatePlan,
    addContent,
    updateContent,
    deleteContent,
    isCreating,
    isUpdating,
  } = useTrainingPlans();

  const { data: members = [] } = useClients();

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMember =
      memberFilter === "all" ||
      memberFilter === "templates" ? plan.is_template :
      memberFilter === "unassigned" ? !plan.member_id && !plan.is_template :
      plan.member_id === memberFilter;

    return matchesSearch && matchesMember;
  });

  const templatePlans = filteredPlans.filter((p) => p.is_template);
  const memberPlans = filteredPlans.filter((p) => !p.is_template);

  const handleCreatePlan = async (data: Parameters<typeof createPlan>[0]) => {
    const newPlan = await createPlan(data);
    // Optionally open editor immediately
    const fullPlan = plans.find((p) => p.id === newPlan.id);
    if (fullPlan) {
      setEditingPlan(fullPlan);
    }
  };

  if (editingPlan) {
    // Find the most up-to-date version of the plan
    const currentPlan = plans.find((p) => p.id === editingPlan.id) || editingPlan;

    return (
      <DashboardLayout title="Edit Training Plan">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setEditingPlan(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
            <div className="flex-1" />
            {currentPlan.is_public && (
              <Button variant="outline" asChild>
                <a
                  href={`${window.location.origin}/plan/${currentPlan.share_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Public Link
                </a>
              </Button>
            )}
          </div>

          <TrainingPlanEditor
            plan={currentPlan}
            onSave={updatePlan}
            onAddContent={addContent}
            onUpdateContent={updateContent}
            onDeleteContent={deleteContent}
            isSaving={isUpdating}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Training Plans">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
              Training Plans
            </h2>
            <p className="text-xs text-muted-foreground tracking-wide">
              Create and manage workout and nutrition plans for your clients.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="templates">Templates Only</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="member-plans">
          <TabsList>
            <TabsTrigger value="member-plans">
              Member Plans ({memberPlans.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates ({templatePlans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="member-plans" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading plans...
              </div>
            ) : memberPlans.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || memberFilter !== "all"
                    ? "No plans match your filters"
                    : "No member plans yet"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {memberPlans.map((plan) => (
                  <TrainingPlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={setEditingPlan}
                    onDuplicate={duplicatePlan}
                    onDelete={deletePlan}
                    onTogglePublic={(id, isPublic) => togglePublic({ id, is_public: isPublic })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading templates...
              </div>
            ) : templatePlans.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No templates match your search" : "No templates yet"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templatePlans.map((plan) => (
                  <TrainingPlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={setEditingPlan}
                    onDuplicate={duplicatePlan}
                    onDelete={deletePlan}
                    onTogglePublic={(id, isPublic) => togglePublic({ id, is_public: isPublic })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreatePlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePlan}
        members={members}
        isSubmitting={isCreating}
      />
    </DashboardLayout>
  );
}

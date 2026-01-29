import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Save, Dumbbell, Apple, FileText } from "lucide-react";
import { TrainingPlan, TrainingPlanContent } from "@/hooks/useTrainingPlans";

interface TrainingPlanEditorProps {
  plan: TrainingPlan;
  onSave: (updates: Partial<TrainingPlan> & { id: string }) => Promise<unknown>;
  onAddContent: (content: {
    training_plan_id: string;
    section_title: string;
    content_type: "workout" | "nutrition" | "notes";
    content: string;
    sort_order: number;
  }) => Promise<unknown>;
  onUpdateContent: (content: Partial<TrainingPlanContent> & { id: string }) => Promise<unknown>;
  onDeleteContent: (id: string) => Promise<unknown>;
  isSaving?: boolean;
}

export function TrainingPlanEditor({
  plan,
  onSave,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  isSaving,
}: TrainingPlanEditorProps) {
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description || "");
  const [activeTab, setActiveTab] = useState<"workout" | "nutrition" | "notes">("workout");

  const content = plan.training_plan_content || [];
  const workoutSections = content.filter((c) => c.content_type === "workout").sort((a, b) => a.sort_order - b.sort_order);
  const nutritionSections = content.filter((c) => c.content_type === "nutrition").sort((a, b) => a.sort_order - b.sort_order);
  const notesSections = content.filter((c) => c.content_type === "notes").sort((a, b) => a.sort_order - b.sort_order);

  const handleSavePlan = async () => {
    await onSave({ id: plan.id, title, description: description || null });
  };

  const handleAddSection = async (type: "workout" | "nutrition" | "notes") => {
    const sections = type === "workout" ? workoutSections : type === "nutrition" ? nutritionSections : notesSections;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) : -1;

    await onAddContent({
      training_plan_id: plan.id,
      section_title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content_type: type,
      content: "",
      sort_order: maxOrder + 1,
    });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="h-4 w-4" />;
      case "nutrition":
        return <Apple className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderSections = (sections: TrainingPlanContent[], type: "workout" | "nutrition" | "notes") => (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Input
                value={section.section_title}
                onChange={(e) =>
                  onUpdateContent({ id: section.id, section_title: e.target.value })
                }
                className="flex-1 font-medium"
                placeholder="Section title"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteContent(section.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={section.content}
              onChange={(e) =>
                onUpdateContent({ id: section.id, content: e.target.value })
              }
              placeholder={getPlaceholder(type)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() => handleAddSection(type)}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {type.charAt(0).toUpperCase() + type.slice(1)} Section
      </Button>
    </div>
  );

  const getPlaceholder = (type: string) => {
    switch (type) {
      case "workout":
        return `Example workout format:

**Warm-up (10 min)**
- 5 min light cardio
- Dynamic stretching

**Main Workout**
1. Squats: 4 sets x 10 reps
2. Deadlifts: 3 sets x 8 reps
3. Lunges: 3 sets x 12 reps each leg

**Cool-down**
- Static stretching
- Foam rolling`;
      case "nutrition":
        return `Example nutrition plan:

**Daily Macros Target**
- Protein: 150g
- Carbs: 200g
- Fats: 70g

**Meal 1 - Breakfast**
- 3 eggs scrambled
- 2 slices whole wheat toast
- 1 banana

**Meal 2 - Lunch**
- Grilled chicken breast (6oz)
- Brown rice (1 cup)
- Mixed vegetables`;
      default:
        return "Add notes, instructions, or additional information here...";
    }
  };

  return (
    <div className="space-y-8">
      {/* Plan Header */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>Basic information about this training plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Plan Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 12-Week Strength Program"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of this training plan..."
              rows={3}
            />
          </div>
          <Button onClick={handleSavePlan} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Details"}
          </Button>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workout" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Workout ({workoutSections.length})
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="gap-2">
            <Apple className="h-4 w-4" />
            Nutrition ({nutritionSections.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" />
            Notes ({notesSections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workout" className="mt-6">
          {renderSections(workoutSections, "workout")}
        </TabsContent>

        <TabsContent value="nutrition" className="mt-6">
          {renderSections(nutritionSections, "nutrition")}
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          {renderSections(notesSections, "notes")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

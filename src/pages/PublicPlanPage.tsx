import { useParams } from "react-router-dom";
import { usePublicPlan } from "@/hooks/useTrainingPlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Apple, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import humeLogo from "@/assets/hume-logo.png";

export default function PublicPlanPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const { data: plan, isLoading, error } = usePublicPlan(shareSlug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Loading training plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground">
                Plan Not Found
              </h2>
              <p className="text-sm mt-2">
                This training plan doesn't exist or is no longer public.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = plan.training_plan_content || [];
  const workoutSections = content
    .filter((c) => c.content_type === "workout")
    .sort((a, b) => a.sort_order - b.sort_order);
  const nutritionSections = content
    .filter((c) => c.content_type === "nutrition")
    .sort((a, b) => a.sort_order - b.sort_order);
  const notesSections = content
    .filter((c) => c.content_type === "notes")
    .sort((a, b) => a.sort_order - b.sort_order);

  const renderSection = (section: typeof content[0]) => (
    <Card key={section.id} className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {section.content_type === "workout" && <Dumbbell className="h-4 w-4" />}
          {section.content_type === "nutrition" && <Apple className="h-4 w-4" />}
          {section.content_type === "notes" && <FileText className="h-4 w-4" />}
          {section.section_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-transparent p-0 m-0">
            {section.content}
          </pre>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <img src={humeLogo} alt="Hume" className="h-8" />
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(plan.updated_at), "MMM d, yyyy")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Plan Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {plan.plan_type === "workout" && <Dumbbell className="h-6 w-6" />}
              {plan.plan_type === "nutrition" && <Apple className="h-6 w-6" />}
              {plan.plan_type === "combined" && (
                <div className="flex gap-1">
                  <Dumbbell className="h-5 w-5" />
                  <Apple className="h-5 w-5" />
                </div>
              )}
              <h1 className="text-2xl font-normal">{plan.title}</h1>
            </div>
            {plan.description && (
              <p className="text-muted-foreground">{plan.description}</p>
            )}
          </div>

          {/* Content Tabs */}
          {content.length > 0 ? (
            <Tabs defaultValue={workoutSections.length > 0 ? "workout" : nutritionSections.length > 0 ? "nutrition" : "notes"}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workout" disabled={workoutSections.length === 0}>
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Workout ({workoutSections.length})
                </TabsTrigger>
                <TabsTrigger value="nutrition" disabled={nutritionSections.length === 0}>
                  <Apple className="h-4 w-4 mr-2" />
                  Nutrition ({nutritionSections.length})
                </TabsTrigger>
                <TabsTrigger value="notes" disabled={notesSections.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Notes ({notesSections.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workout" className="mt-6 space-y-6">
                {workoutSections.map(renderSection)}
              </TabsContent>

              <TabsContent value="nutrition" className="mt-6 space-y-6">
                {nutritionSections.map(renderSection)}
              </TabsContent>

              <TabsContent value="notes" className="mt-6 space-y-6">
                {notesSections.map(renderSection)}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                This training plan doesn't have any content yet.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-xs text-muted-foreground">
            Training plan provided by Hume Fitness
          </p>
        </div>
      </footer>
    </div>
  );
}

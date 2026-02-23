import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IdlePageHintPrompt } from "@/components/walkthrough";
import { useIdlePageHint } from "@/hooks/useIdlePageHint";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_HINT_CONTENT } from "@/config/walkthroughSteps";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wine } from "lucide-react";
import { CafeChecklistView } from "@/components/checklists/cafe/CafeChecklistView";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { cn } from "@/lib/utils";

const HINT_ID = "cafe-shift-toggle";

export default function CafeDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentShift, toggleShift, isManualOverride } = useCurrentShift();
  const hintContent = PAGE_HINT_CONTENT[HINT_ID];
  const { showHint, dismiss, triggerFullWalkthrough } = useIdlePageHint({
    hintId: HINT_ID,
    content: hintContent ? t(hintContent.en, hintContent.es) : "",
  });

  return (
    <DashboardLayout title="Cafe Dashboard">
      <div className="space-y-6">

        {/* Today's Checklist */}
        <CafeChecklistView />

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/dashboard/cafe/event-drinks")}
          >
            <CardHeader>
              <Wine className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Event Drinks</CardTitle>
              <CardDescription>
                Plan and track drinks for upcoming events
              </CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/dashboard/communications")}
          >
            <CardHeader>
              <MessageSquare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Communications</CardTitle>
              <CardDescription>
                View announcements and updates
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <IdlePageHintPrompt
          visible={showHint}
          content={hintContent ? t(hintContent.en, hintContent.es) : ""}
          onDismiss={dismiss}
          onSeeFullWalkthrough={triggerFullWalkthrough}
        />
      </div>
    </DashboardLayout>
  );
}

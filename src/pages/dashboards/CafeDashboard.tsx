import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IdlePageHintPrompt } from "@/components/walkthrough";
import { useIdlePageHint } from "@/hooks/useIdlePageHint";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_HINT_CONTENT } from "@/config/walkthroughSteps";
import { Button } from "@/components/ui/button";
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

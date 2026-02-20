import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export interface IdlePageHintPromptProps {
  /** Whether the prompt is visible. */
  visible: boolean;
  /** Page-specific tip text. */
  content: string;
  /** Called when the user dismisses (X or "Got it"). */
  onDismiss: () => void;
  /** Called when the user clicks "See full walkthrough". */
  onSeeFullWalkthrough: () => void;
  /** Optional class name for the container. */
  className?: string;
}

/**
 * Small, non-intrusive prompt shown after idle time. Includes page tip,
 * dismiss control, and a link to trigger the full walkthrough overlay.
 */
export function IdlePageHintPrompt({
  visible,
  content,
  onDismiss,
  onSeeFullWalkthrough,
  className,
}: IdlePageHintPromptProps) {
  const { t } = useLanguage();
  if (!visible) return null;

  return (
    <div
      className={cn("fixed bottom-6 right-6 z-50 max-w-[320px]", className)}
      role="dialog"
      aria-label={t("Page help", "Ayuda de la página")}
    >
      <Card className="rounded-none border border-border shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
          <h3 className="text-xs font-medium uppercase tracking-widest text-foreground">
            {t("Need help?", "¿Necesitas ayuda?")}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none"
            onClick={onDismiss}
            aria-label={t("Dismiss", "Cerrar")}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="text-xs text-muted-foreground tracking-wide">{content}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none text-xs uppercase tracking-widest"
              onClick={onDismiss}
            >
              {t("Got it", "Entendido")}
            </Button>
            <button
              type="button"
              className="text-xs font-medium uppercase tracking-widest text-primary underline-offset-4 hover:underline"
              onClick={onSeeFullWalkthrough}
            >
              {t("See full walkthrough", "Ver guía completa")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

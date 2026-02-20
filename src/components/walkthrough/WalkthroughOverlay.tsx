import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkWalkthroughCompleted, useMarkWalkthroughSkipped } from "@/hooks/useWalkthroughState";
import { useOptionalSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WalkthroughArrowDirection = "left" | "right" | "top" | "bottom";

export interface WalkthroughStep {
  /** CSS selector (e.g. `[data-walkthrough="role-switcher"]`) or ref to the target element */
  target: string | React.RefObject<HTMLElement | null>;
  /** Where the arrow starts from, pointing toward the target */
  arrowDirection: WalkthroughArrowDirection;
  /** Short label or 1–2 sentences */
  text: string;
  /** When false, this step is omitted from the walkthrough */
  showWhen?: () => boolean;
}

/** Arrow colors cycle: orange, yellow, red, purple, blue, green (app brand add palette + purple) */
export const WALKTHROUGH_ARROW_COLORS = [
  "#f6821f", // add.burntOrange
  "#fcb827", // add.amber
  "#e03a3c", // add.crimson
  "#7c3aed", // add.purple
  "#009ddc", // add.skyBlue
  "#62bb47", // add.olive
] as const;

const AUTO_ADVANCE_MS = 90_000; // 90 seconds per step
const SPOTLIGHT_PADDING = 8;
const ARROW_MARGIN = 80;
const ARROW_DRAW_DURATION_MS = 800;
const STEP_TEXT_GAP = 20;
const BOTTOM_SAFE_HEIGHT = 160; // reserve space for progress dots + buttons
const STEP_TEXT_MAX_WIDTH = 260;
const STEP_TEXT_EST_HEIGHT = 88;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTargetElement(
  step: WalkthroughStep,
  stepIndex: number
): HTMLElement | null {
  const t = step.target;
  if (typeof t === "string") {
    return document.querySelector(t);
  }
  return t.current;
}

function getTargetRect(element: HTMLElement | null): DOMRect | null {
  if (!element) return null;
  return element.getBoundingClientRect();
}

/** Start and end points for arrow (start = where arrow begins, end = where it points) */
function getArrowPoints(
  direction: WalkthroughArrowDirection,
  targetRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;
  switch (direction) {
    case "left":
      startX = Math.max(ARROW_MARGIN, targetRect.left - ARROW_MARGIN);
      startY = cy;
      endX = targetRect.left;
      endY = cy;
      break;
    case "right":
      startX = Math.min(viewportWidth - ARROW_MARGIN, targetRect.right + ARROW_MARGIN);
      startY = cy;
      endX = targetRect.right;
      endY = cy;
      break;
    case "top":
      startX = cx;
      startY = Math.max(ARROW_MARGIN, targetRect.top - ARROW_MARGIN);
      endX = cx;
      endY = targetRect.top;
      break;
    case "bottom":
      startX = cx;
      startY = Math.min(viewportHeight - ARROW_MARGIN, targetRect.bottom + ARROW_MARGIN);
      endX = cx;
      endY = targetRect.bottom;
      break;
    default:
      startX = targetRect.left - ARROW_MARGIN;
      startY = cy;
      endX = targetRect.left;
      endY = cy;
  }
  return { start: { x: startX, y: startY }, end: { x: endX, y: endY } };
}

/** Quadratic path from start to end with slight curve for organic feel */
function getArrowPathD(
  start: { x: number; y: number },
  end: { x: number; y: number }
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const perpX = -dy * 0.15;
  const perpY = dx * 0.15;
  const cpx = midX + perpX;
  const cpy = midY + perpY;
  return `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`;
}

/** Step text position: outside target rect, never overlapping controls or target */
function getStepTextPosition(
  direction: WalkthroughArrowDirection,
  targetRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number } {
  const maxTop = viewportHeight - BOTTOM_SAFE_HEIGHT - STEP_TEXT_EST_HEIGHT;
  const minLeft = 16;
  const maxLeft = viewportWidth - STEP_TEXT_MAX_WIDTH - 16;

  switch (direction) {
    case "left":
      return {
        left: Math.min(targetRect.right + STEP_TEXT_GAP, maxLeft),
        top: Math.max(16, Math.min(targetRect.top, maxTop)),
      };
    case "right":
      return {
        left: Math.max(minLeft, targetRect.left - STEP_TEXT_MAX_WIDTH - STEP_TEXT_GAP),
        top: Math.max(16, Math.min(targetRect.top, maxTop)),
      };
    case "top":
      return {
        left: Math.max(minLeft, Math.min(targetRect.left + targetRect.width / 2 - STEP_TEXT_MAX_WIDTH / 2, maxLeft)),
        top: Math.min(targetRect.bottom + STEP_TEXT_GAP, maxTop),
      };
    case "bottom":
      return {
        left: Math.max(minLeft, Math.min(targetRect.left + targetRect.width / 2 - STEP_TEXT_MAX_WIDTH / 2, maxLeft)),
        top: Math.max(16, targetRect.top - STEP_TEXT_EST_HEIGHT - STEP_TEXT_GAP),
      };
    default:
      return {
        left: Math.max(minLeft, targetRect.right + STEP_TEXT_GAP),
        top: Math.max(16, Math.min(targetRect.top, maxTop)),
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface WalkthroughOverlayProps {
  steps: WalkthroughStep[];
  onClose: () => void;
}

export function WalkthroughOverlay({ steps: rawSteps, onClose }: WalkthroughOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const markerId = `walkthrough-arrowhead-${React.useId().replace(/:/g, "-")}`;

  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [pathLength, setPathLength] = useState(0);

  const { t } = useLanguage();
  const markCompleted = useMarkWalkthroughCompleted();
  const markSkipped = useMarkWalkthroughSkipped();
  const optionalSidebar = useOptionalSidebar();
  const sidebarWasOpenRef = useRef<boolean | null>(null);

  const filteredSteps = useMemo(
    () => rawSteps.filter((s) => s.showWhen === undefined || s.showWhen()),
    [rawSteps]
  );

  const currentStep = filteredSteps[stepIndex] ?? null;
  const isLastStep = stepIndex === filteredSteps.length - 1;
  const canGoBack = stepIndex > 0;

  const updateTargetRect = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }
    const el = getTargetElement(currentStep, stepIndex);
    setTargetRect(getTargetRect(el));
  }, [currentStep, stepIndex]);

  // Force sidebar open when overlay mounts; restore on close
  useEffect(() => {
    if (optionalSidebar) {
      sidebarWasOpenRef.current = optionalSidebar.open;
      optionalSidebar.setOpen(true);
    }
    return () => {
      if (optionalSidebar && sidebarWasOpenRef.current !== null) {
        optionalSidebar.setOpen(sidebarWasOpenRef.current);
      }
    };
  }, [optionalSidebar]);

  // Resolve target and subscribe to resize
  useEffect(() => {
    updateTargetRect();
    const ro = new ResizeObserver(() => updateTargetRect());
    if (overlayRef.current) ro.observe(overlayRef.current);
    window.addEventListener("resize", updateTargetRect);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [updateTargetRect]);

  // Path length for stroke-dasharray animation
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
    }
  }, [currentStep, targetRect]);

  // Programmatically open dropdown when step targets a dropdown trigger (user menu, role switcher)
  const DROPDOWN_TARGET_SELECTORS = ["[data-walkthrough=user-menu]", "[data-walkthrough=role-switcher]"];
  useEffect(() => {
    if (!currentStep) return;
    const target = typeof currentStep.target === "string" ? currentStep.target : null;
    if (target && DROPDOWN_TARGET_SELECTORS.includes(target)) {
      const el = document.querySelector(target) as HTMLElement | null;
      if (el) {
        const timeoutId = setTimeout(() => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          requestAnimationFrame(() => {
            el.click();
          });
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentStep]);

  // Auto-advance after 90s except on last step
  useEffect(() => {
    if (filteredSteps.length === 0 || isLastStep) return;
    const t = setTimeout(() => setStepIndex((i) => Math.min(i + 1, filteredSteps.length - 1)), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [stepIndex, isLastStep, filteredSteps.length]);

  // Focus Skip on open
  useEffect(() => {
    skipButtonRef.current?.focus({ preventScroll: true });
  }, []);

  // Empty steps: close immediately
  useEffect(() => {
    if (filteredSteps.length === 0) {
      onClose();
    }
  }, [filteredSteps.length, onClose]);

  const handleSkip = useCallback(() => {
    markSkipped.mutate(undefined, { onSettled: onClose });
  }, [markSkipped, onClose]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      markCompleted.mutate(undefined, { onSettled: onClose });
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep, markCompleted, onClose]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (filteredSteps.length === 0) return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;
  const arrowPoints =
    currentStep && targetRect
      ? getArrowPoints(currentStep.arrowDirection, targetRect, viewportWidth, viewportHeight)
      : null;
  const pathD = arrowPoints ? getArrowPathD(arrowPoints.start, arrowPoints.end) : "";
  const arrowColor = WALKTHROUGH_ARROW_COLORS[stepIndex % WALKTHROUGH_ARROW_COLORS.length];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col bg-transparent"
      role="dialog"
      aria-modal="true"
      aria-label={t("App walkthrough", "Guía de la app")}
    >
      {/* Frosted glass layer with spotlight cutout */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden
      >
        <defs>
          <mask id="walkthrough-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - SPOTLIGHT_PADDING}
                y={targetRect.top - SPOTLIGHT_PADDING}
                width={targetRect.width + SPOTLIGHT_PADDING * 2}
                height={targetRect.height + SPOTLIGHT_PADDING * 2}
                fill="black"
                rx="4"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.25)"
          mask="url(#walkthrough-spotlight-mask)"
        />
      </svg>
      <div
        className="absolute inset-0 backdrop-blur-md bg-background/70"
        style={
          targetRect
            ? {
                mask: "url(#walkthrough-spotlight-mask)",
                WebkitMask: "url(#walkthrough-spotlight-mask)",
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
              }
            : undefined
        }
        aria-hidden
      />

      {/* Arrow and text */}
      {currentStep && (
        <>
          {pathD && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ "--walkthrough-path-length": pathLength } as React.CSSProperties}
              aria-hidden
            >
              <defs>
                <marker
                  id={markerId}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill={arrowColor} />
                </marker>
              </defs>
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke={arrowColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength}
                markerEnd={`url(#${markerId})`}
                className="walkthrough-arrow-path"
                style={{
                  animation: `walkthrough-arrow-draw ${ARROW_DRAW_DURATION_MS}ms ease-out forwards`,
                }}
              />
            </svg>
          )}
          <div
            className="absolute text-foreground max-w-[280px] md:max-w-[320px] whitespace-pre-line bg-background/90 backdrop-blur-sm px-4 py-3 rounded border border-border shadow-sm"
            style={
              arrowPoints && targetRect
                ? (() => {
                    const pos = getStepTextPosition(
                      currentStep.arrowDirection,
                      targetRect,
                      viewportWidth,
                      viewportHeight
                    );
                    return { left: pos.left, top: pos.top };
                  })()
                : {
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-2">
              {t("A Quick Walkthrough", "Un Recorrido Rápido")}
            </div>
            <p className="text-sm font-medium uppercase tracking-widest">
              {currentStep.text}
            </p>
          </div>
        </>
      )}

      {/* Controls: progress dots, back, next, skip */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          {filteredSteps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStepIndex(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === stepIndex ? "bg-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
              )}
              aria-label={t(`Step ${i + 1} of ${filteredSteps.length}`, `Paso ${i + 1} de ${filteredSteps.length}`)}
              aria-current={i === stepIndex ? "step" : undefined}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={!canGoBack}
            className="rounded-none h-9 w-9 border border-foreground"
            aria-label={t("Previous step", "Paso anterior")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="default"
            className="rounded-none uppercase text-[10px] tracking-widest border border-foreground"
            onClick={handleNext}
            aria-label={isLastStep ? t("Finish walkthrough", "Terminar guía") : t("Next step", "Siguiente paso")}
          >
            {isLastStep ? t("Done", "Listo") : t("Next", "Siguiente")}
          </Button>
          <Button
            ref={skipButtonRef}
            type="button"
            variant="ghost"
            className="rounded-none uppercase text-[10px] tracking-widest text-muted-foreground"
            onClick={handleSkip}
            aria-label={t("Skip walkthrough", "Omitir guía")}
          >
            {t("Skip", "Omitir")}
          </Button>
        </div>
      </div>
    </div>
  );
}

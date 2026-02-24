import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, User, Settings, Bug, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkWalkthroughCompleted, useMarkWalkthroughSkipped } from "@/hooks/useWalkthroughState";
import { useOptionalSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** Hex to rgba with alpha (0–1) for step text background */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  /** When true, show a static replica of the user menu dropdown */
  showMenuPreview?: boolean;
  /** Offset the arrow endpoint by {x, y} pixels from the target center */
  arrowEndOffset?: { x: number; y: number };
  /** Show a colored border highlight around the target element */
  highlightBorder?: string;
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
const SIDEBAR_WIDTH = 250;
const ARROW_MARGIN = 80;
const ARROW_DRAW_DURATION_MS = 800;
const STEP_TEXT_GAP = 20;
const BOTTOM_SAFE_HEIGHT = 160; // reserve space for progress dots + buttons
const STEP_TEXT_MAX_WIDTH = 260;
const STEP_TEXT_EST_HEIGHT = 88;
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

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

/** Start and end points for arrow (start = where arrow begins, end = where it points). Responsive margins. */
function getArrowPoints(
  direction: WalkthroughArrowDirection,
  targetRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
  endOffset?: { x: number; y: number }
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const margin = viewportWidth < BREAKPOINT_TABLET ? 100 : ARROW_MARGIN;
  const sidebarMin = viewportWidth < BREAKPOINT_TABLET ? 20 : SIDEBAR_WIDTH + 80;
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;
  switch (direction) {
    case "left":
      startX = Math.max(sidebarMin, targetRect.left - margin);
      startY = cy;
      endX = targetRect.left;
      endY = cy;
      break;
    case "right":
      startX = Math.min(viewportWidth - margin, targetRect.right + margin);
      startY = cy;
      endX = targetRect.right;
      endY = cy;
      break;
    case "top":
      startX = cx;
      startY = Math.max(margin, targetRect.top - margin);
      endX = cx;
      endY = targetRect.top;
      break;
    case "bottom":
      startX = cx;
      startY = Math.min(viewportHeight - margin, targetRect.bottom + margin);
      endX = cx;
      endY = targetRect.bottom;
      break;
    default:
      startX = Math.max(sidebarMin, targetRect.left - margin);
      startY = cy;
      endX = targetRect.left;
      endY = cy;
  }
  if (endOffset) {
    endX += endOffset.x;
    endY += endOffset.y;
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

/** Step text position: responsive, outside target rect, never overlapping controls or target */
function getStepTextPosition(
  direction: WalkthroughArrowDirection,
  targetRect: DOMRect,
  arrowStart: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number } {
  const isTabletOrSmaller = viewportWidth < BREAKPOINT_TABLET;
  const isDesktop = viewportWidth >= BREAKPOINT_DESKTOP;
  const maxTop = viewportHeight - BOTTOM_SAFE_HEIGHT - STEP_TEXT_EST_HEIGHT;
  const minLeft = isTabletOrSmaller ? 16 : SIDEBAR_WIDTH + 80;
  const maxLeft = viewportWidth - STEP_TEXT_MAX_WIDTH - 16;
  const gap = isTabletOrSmaller ? STEP_TEXT_GAP + 8 : STEP_TEXT_GAP;

  // Tablet/small: prefer text below target to avoid overlap and keep readable
  if (isTabletOrSmaller) {
    const centerX = targetRect.left + targetRect.width / 2 - STEP_TEXT_MAX_WIDTH / 2;
    return {
      left: Math.max(16, Math.min(centerX, maxLeft)),
      top: Math.min(targetRect.bottom + gap, maxTop),
    };
  }

  switch (direction) {
    case "left":
      return {
        left: Math.max(minLeft, Math.min(targetRect.right + gap, maxLeft)),
        top: Math.max(16, Math.min(targetRect.top, maxTop)),
      };
    case "right":
      return {
        left: Math.max(minLeft, targetRect.left - STEP_TEXT_MAX_WIDTH - gap),
        top: Math.max(16, Math.min(targetRect.top, maxTop)),
      };
    case "top": {
      const textLeft = Math.max(minLeft, arrowStart.x + gap);
      return {
        left: Math.min(textLeft, maxLeft),
        top: Math.min(targetRect.bottom + gap, maxTop),
      };
    }
    case "bottom": {
      const textLeft = Math.max(minLeft, arrowStart.x + gap);
      return {
        left: Math.min(textLeft, maxLeft),
        top: Math.max(16, targetRect.top - STEP_TEXT_EST_HEIGHT - gap),
      };
    }
    default:
      return {
        left: Math.max(minLeft, targetRect.right + gap),
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

  // Show static menu replica for steps with showMenuPreview flag
  const showMenuPreview = currentStep?.showMenuPreview && targetRect;
  // Bug step: has both showMenuPreview and arrowEndOffset
  const isBugStep = !!(currentStep?.showMenuPreview && currentStep?.arrowEndOffset);

  // Programmatically open dropdown when step targets role switcher only
  useEffect(() => {
    if (!currentStep) return;
    const target = typeof currentStep.target === "string" ? currentStep.target : null;
    if (target && target === "[data-walkthrough=role-switcher]") {
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
      ? getArrowPoints(currentStep.arrowDirection, targetRect, viewportWidth, viewportHeight, currentStep.arrowEndOffset)
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
      {/* Welcome step only: very light blur behind overlay. Other steps: fully clear (no dim, no blur). */}
      {stepIndex === 0 && (
        <div
          className="absolute inset-0 pointer-events-none backdrop-blur-[2px] bg-black/[0.04]"
          aria-hidden
        />
      )}

      {/* Arrow and text */}
      {currentStep && (
        <>
          {pathD && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-[102]"
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
            className="absolute text-foreground max-w-[360px] md:max-w-[400px] min-w-[360px] min-h-[168px] whitespace-pre-line px-4 py-3 rounded-none border shadow-sm flex flex-col gap-[15px] items-center justify-center text-center"
            style={
              arrowPoints && targetRect
                ? (() => {
                    const pos = getStepTextPosition(
                      currentStep.arrowDirection,
                      targetRect,
                      arrowPoints.start,
                      viewportWidth,
                      viewportHeight
                    );
                    return {
                      left: pos.left,
                      top: pos.top,
                    backgroundColor: hexToRgba(arrowColor, 1),
                    borderColor: arrowColor,
                    };
                  })()
                : {
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: hexToRgba(arrowColor, 1),
                    borderColor: arrowColor,
                  }
            }
          >
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-white">
                {currentStep.text}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Highlight border around target for menu preview steps */}
      {showMenuPreview && targetRect && (
        <div
          className="absolute z-[101] pointer-events-none"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: "2px solid #fcb827",
            borderRadius: 4,
          }}
          aria-hidden
        />
      )}

      {/* Highlight border around target for steps with highlightBorder */}
      {currentStep?.highlightBorder && targetRect && !showMenuPreview && (
        <div
          className="absolute z-[101] pointer-events-none"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: `2px solid ${currentStep.highlightBorder}`,
            borderRadius: 4,
          }}
          aria-hidden
        />
      )}

      {/* Static menu replica for walkthrough */}
      {showMenuPreview && targetRect && (
        <div
          className="absolute z-[101] w-56 border border-border bg-background shadow-md pointer-events-none"
          style={{
            left: targetRect.left,
            top: targetRect.bottom + 8,
          }}
          aria-hidden
        >
          <div className="p-1 flex flex-col">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-widest text-foreground">
              <Bell className="h-3 w-3" />
              {t("Notifications", "Notificaciones")}
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-widest text-foreground">
              <User className="h-3 w-3" />
              Profile
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-widest text-foreground">
              <Settings className="h-3 w-3" />
              Account Settings
            </div>
            <div className="my-1 h-px bg-border" />
            <div
              className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-widest text-foreground relative"
              style={isBugStep ? { outline: "2px solid #62bb47", outlineOffset: 2 } : undefined}
            >
              <Bug className="h-3 w-3" />
              {t("Report a Bug", "Reportar un Bug")}
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-widest text-foreground">
              <LogOut className="h-3 w-3" />
              {t("Sign out", "Cerrar sesión")}
            </div>
          </div>
        </div>
      )}

      {/* Controls: progress dots, back, next, skip */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 px-4">
        <Button
          ref={skipButtonRef}
          type="button"
          variant="link"
          className="text-add-orange hover:text-add-orange/80 uppercase text-[10px] tracking-widest p-0 h-auto no-underline hover:no-underline"
          onClick={handleSkip}
          aria-label={t("Skip walkthrough", "Omitir guía")}
        >
          {t("Skip", "Omitir")}
        </Button>
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
            className="rounded-none h-9 w-9 border-2 text-white hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: arrowColor, borderColor: arrowColor }}
            aria-label={t("Previous step", "Paso anterior")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="default"
            className="rounded-none uppercase text-[10px] tracking-widest border-2 text-white hover:opacity-80"
            style={{ backgroundColor: arrowColor, borderColor: arrowColor }}
            onClick={handleNext}
            aria-label={isLastStep ? t("Finish walkthrough", "Terminar guía") : t("Next step", "Siguiente paso")}
          >
            {isLastStep ? t("Done", "Listo") : t("Next", "Siguiente")}
          </Button>
        </div>
      </div>
    </div>
  );
}

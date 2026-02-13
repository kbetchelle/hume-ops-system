import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Reads ?highlight=<id> from URL search params, scrolls to the element with
 * data-resource-id matching the id, highlights it with an amber pulse animation,
 * and cleans up the URL param.
 *
 * If the element is inside a closed accordion or collapsed card, it will
 * attempt to expand it first.
 */
export function useScrollToResource() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (!highlightId) return;

    const timeoutId = setTimeout(() => {
      const element = document.querySelector(
        `[data-resource-id="${highlightId}"]`
      );
      if (!element) return;

      // If element is inside a closed accordion, expand it
      const closedAccordion = element.closest('[data-state="closed"]');
      if (closedAccordion) {
        const trigger = closedAccordion.querySelector(
          "[data-radix-collection-item]"
        );
        if (trigger instanceof HTMLElement) {
          trigger.click();
        }
      }

      // If element contains a collapsed card (chevron-right), expand it
      const expandButton = element.querySelector(
        'button[type="button"]'
      );
      if (expandButton instanceof HTMLElement) {
        const chevronRight = expandButton.querySelector(
          ".lucide-chevron-right"
        );
        if (chevronRight) {
          expandButton.click();
        }
      }

      // Scroll after a brief delay to allow expansion animation
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Add highlight class
        element.classList.add("resource-highlighted");

        // Clean up the URL param — read fresh from window.location to avoid
        // stale closure over the searchParams object from render time.
        const freshParams = new URLSearchParams(window.location.search);
        freshParams.delete("highlight");
        setSearchParams(freshParams, { replace: true });

        // Remove highlight class after animation completes.
        // Animation = 1s × 3 iterations = 3s; add 500ms buffer to avoid
        // racing with the final animation frame.
        setTimeout(() => {
          element.classList.remove("resource-highlighted");
        }, 3500);
      }, 200);
    }, 500);

    return () => clearTimeout(timeoutId);
    // Only re-run when the highlight value changes. setSearchParams is stable
    // (like a setState ref) so it won't cause extra runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);
}

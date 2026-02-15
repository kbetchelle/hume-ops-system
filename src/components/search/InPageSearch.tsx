import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronUp, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  highlightText,
  clearHighlights,
  setActiveHighlight,
  scrollToMatch,
  getHighlights,
  injectHighlightStyles,
} from "@/lib/textHighlighter";

export interface InPageSearchProps {
  contentRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function InPageSearch({
  contentRef,
  isOpen,
  onClose,
  className,
}: InPageSearchProps) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const highlightsRef = useRef<HTMLElement[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inject highlight styles on mount
  useEffect(() => {
    injectHighlightStyles();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search and highlight matches
  const performSearch = useCallback(() => {
    if (!contentRef.current || !query.trim()) {
      // Clear highlights if query is empty
      if (contentRef.current) {
        clearHighlights(contentRef.current);
      }
      highlightsRef.current = [];
      setTotalMatches(0);
      setCurrentIndex(0);
      return;
    }

    // Clear previous highlights
    clearHighlights(contentRef.current);

    // Add new highlights
    const highlights = highlightText(contentRef.current, query, caseSensitive);
    highlightsRef.current = highlights;
    setTotalMatches(highlights.length);
    
    if (highlights.length > 0) {
      setCurrentIndex(0);
      setActiveHighlight(highlights, 0);
      scrollToMatch(highlights[0]);
    } else {
      setCurrentIndex(0);
    }
  }, [contentRef, query, caseSensitive]);

  // Re-search when query or case sensitivity changes
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, caseSensitive, performSearch]);

  // Navigate to next match
  const goToNext = useCallback(() => {
    if (highlightsRef.current.length === 0) return;

    const nextIndex = (currentIndex + 1) % highlightsRef.current.length;
    setCurrentIndex(nextIndex);
    setActiveHighlight(highlightsRef.current, nextIndex);
    scrollToMatch(highlightsRef.current[nextIndex]);
  }, [currentIndex]);

  // Navigate to previous match
  const goToPrevious = useCallback(() => {
    if (highlightsRef.current.length === 0) return;

    const prevIndex =
      currentIndex === 0
        ? highlightsRef.current.length - 1
        : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setActiveHighlight(highlightsRef.current, prevIndex);
    scrollToMatch(highlightsRef.current[prevIndex]);
  }, [currentIndex]);

  // Handle close
  const handleClose = useCallback(() => {
    if (contentRef.current) {
      clearHighlights(contentRef.current);
    }
    highlightsRef.current = [];
    setQuery("");
    setTotalMatches(0);
    setCurrentIndex(0);
    onClose();
  }, [contentRef, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      // Cmd/Ctrl + G for next
      if ((e.metaKey || e.ctrlKey) && e.key === "g" && !e.shiftKey) {
        e.preventDefault();
        goToNext();
        return;
      }

      // Cmd/Ctrl + Shift + G for previous
      if ((e.metaKey || e.ctrlKey) && e.key === "g" && e.shiftKey) {
        e.preventDefault();
        goToPrevious();
        return;
      }

      // Enter for next
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goToNext();
        return;
      }

      // Shift + Enter for previous
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        goToPrevious();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrevious, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border border-border rounded-none shadow-lg",
        // Desktop: top-right positioning
        "top-4 right-4 w-[400px] max-w-[calc(100vw-2rem)]",
        // Mobile: bottom positioning for easier thumb access
        "md:top-20 md:right-8",
        "max-md:top-auto max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:w-auto",
        className
      )}
    >
      <div className="p-3 space-y-3">
        {/* Search Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find in page..."
              className="pl-8 pr-8 h-9 text-sm rounded-none"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none shrink-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="case-sensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(checked === true)}
            />
            <Label
              htmlFor="case-sensitive"
              className="text-xs cursor-pointer select-none"
            >
              Match case
            </Label>
          </div>

          <div className="flex items-center gap-2">
            {/* Match counter */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {totalMatches > 0
                ? `${currentIndex + 1} of ${totalMatches}`
                : query.trim()
                ? "No matches"
                : ""}
            </span>

            {/* Navigation buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={goToPrevious}
                disabled={totalMatches === 0}
                title="Previous match (Shift + Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={goToNext}
                disabled={totalMatches === 0}
                title="Next match (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Help text - hide on very small screens */}
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> next •{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> previous •{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> close
        </div>
      </div>
    </div>
  );
}

/**
 * Text Highlighting Utility for In-Page Search
 * 
 * Provides functions to find, highlight, and navigate text matches
 * within DOM elements for in-page search functionality.
 */

export interface MatchPosition {
  start: number;
  end: number;
  element?: HTMLElement;
}

const HIGHLIGHT_CLASS = "search-highlight";
const ACTIVE_HIGHLIGHT_CLASS = "search-highlight-active";
const HIGHLIGHT_TAG = "mark";

/**
 * Find all matches of a query string within text content
 */
export function findMatches(
  content: string,
  query: string,
  caseSensitive: boolean = false
): MatchPosition[] {
  if (!content || !query) return [];

  const matches: MatchPosition[] = [];
  const searchText = caseSensitive ? content : content.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  let index = 0;
  while ((index = searchText.indexOf(searchQuery, index)) !== -1) {
    matches.push({
      start: index,
      end: index + query.length
    });
    index += query.length;
  }

  return matches;
}

/**
 * Highlight text matches in a DOM element
 * Returns the created highlight elements
 */
export function highlightText(
  element: HTMLElement,
  query: string,
  caseSensitive: boolean = false
): HTMLElement[] {
  if (!element || !query) return [];

  const highlights: HTMLElement[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  const nodesToProcess: { node: Text; matches: MatchPosition[] }[] = [];

  // First pass: find all text nodes with matches
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const text = node.textContent || "";
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    const matches: MatchPosition[] = [];
    let index = 0;
    while ((index = searchText.indexOf(searchQuery, index)) !== -1) {
      matches.push({
        start: index,
        end: index + query.length
      });
      index += query.length;
    }

    if (matches.length > 0) {
      nodesToProcess.push({ node, matches });
    }
  }

  // Second pass: replace text nodes with highlighted versions
  nodesToProcess.forEach(({ node, matches }) => {
    const text = node.textContent || "";
    const parent = node.parentNode;
    if (!parent) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach((match) => {
      // Add text before match
      if (match.start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.start))
        );
      }

      // Add highlighted match
      const mark = document.createElement(HIGHLIGHT_TAG);
      mark.className = HIGHLIGHT_CLASS;
      mark.textContent = text.substring(match.start, match.end);
      mark.setAttribute("data-highlight", "true");
      fragment.appendChild(mark);
      highlights.push(mark);

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  });

  return highlights;
}

/**
 * Clear all highlights from an element
 */
export function clearHighlights(element: HTMLElement): void {
  if (!element) return;

  const highlights = element.querySelectorAll(`[data-highlight="true"]`);
  highlights.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      const textNode = document.createTextNode(mark.textContent || "");
      parent.replaceChild(textNode, mark);
      parent.normalize(); // Merge adjacent text nodes
    }
  });
}

/**
 * Set the active highlight (different styling)
 */
export function setActiveHighlight(
  highlights: HTMLElement[],
  index: number
): void {
  highlights.forEach((mark, i) => {
    if (i === index) {
      mark.classList.add(ACTIVE_HIGHLIGHT_CLASS);
    } else {
      mark.classList.remove(ACTIVE_HIGHLIGHT_CLASS);
    }
  });
}

/**
 * Scroll a highlight element into view
 */
export function scrollToMatch(element: HTMLElement, offset: number = 100): void {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetY = rect.top + scrollTop - offset;

  window.scrollTo({
    top: targetY,
    behavior: "smooth"
  });
}

/**
 * Get all highlight elements in a container
 */
export function getHighlights(element: HTMLElement): HTMLElement[] {
  if (!element) return [];
  
  const highlights = element.querySelectorAll(`[data-highlight="true"]`);
  return Array.from(highlights) as HTMLElement[];
}

/**
 * Inject CSS for highlights (call once on app load or component mount)
 */
export function injectHighlightStyles(): void {
  const styleId = "search-highlight-styles";
  
  // Don't inject if already exists
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      background-color: #fef08a;
      color: inherit;
      padding: 0;
      border-radius: 2px;
    }
    
    .dark .${HIGHLIGHT_CLASS} {
      background-color: rgba(234, 179, 8, 0.3);
    }
    
    .${ACTIVE_HIGHLIGHT_CLASS} {
      background-color: #fb923c;
    }
    
    .dark .${ACTIVE_HIGHLIGHT_CLASS} {
      background-color: rgba(251, 146, 60, 0.5);
    }
    
    @media print {
      .${HIGHLIGHT_CLASS},
      .${ACTIVE_HIGHLIGHT_CLASS} {
        background-color: transparent;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Text snippet extraction utility for search results
 * Extracts context around search matches for display
 */

export interface SnippetMatch {
  text: string;
  start: number;
  end: number;
  isMatch: boolean;
}

const CONTEXT_LENGTH = 80; // Characters on each side of match

/**
 * Extract snippet with context around first match
 * Returns array of text segments with match highlighting info
 */
export function extractSearchSnippet(
  text: string,
  query: string,
  maxLength: number = 200
): SnippetMatch[] {
  if (!text || !query) return [];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return [];

  // Calculate snippet boundaries
  const matchEnd = matchIndex + query.length;
  let start = Math.max(0, matchIndex - CONTEXT_LENGTH);
  let end = Math.min(text.length, matchEnd + CONTEXT_LENGTH);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = text.lastIndexOf(' ', start);
    if (spaceIndex > 0 && spaceIndex > start - 20) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    const spaceIndex = text.indexOf(' ', end);
    if (spaceIndex > 0 && spaceIndex < end + 20) {
      end = spaceIndex;
    }
  }

  // Build segments
  const segments: SnippetMatch[] = [];
  const snippet = text.substring(start, end);
  const relativeMatchStart = matchIndex - start;
  const relativeMatchEnd = relativeMatchStart + query.length;

  // Add leading ellipsis if needed
  if (start > 0) {
    segments.push({
      text: '...',
      start: 0,
      end: 3,
      isMatch: false
    });
  }

  // Add text before match
  if (relativeMatchStart > 0) {
    const beforeText = snippet.substring(0, relativeMatchStart);
    segments.push({
      text: beforeText,
      start: 0,
      end: beforeText.length,
      isMatch: false
    });
  }

  // Add match
  const matchText = snippet.substring(relativeMatchStart, relativeMatchEnd);
  segments.push({
    text: matchText,
    start: relativeMatchStart,
    end: relativeMatchEnd,
    isMatch: true
  });

  // Add text after match
  if (relativeMatchEnd < snippet.length) {
    const afterText = snippet.substring(relativeMatchEnd);
    segments.push({
      text: afterText,
      start: relativeMatchEnd,
      end: snippet.length,
      isMatch: false
    });
  }

  // Add trailing ellipsis if needed
  if (end < text.length) {
    segments.push({
      text: '...',
      start: snippet.length,
      end: snippet.length + 3,
      isMatch: false
    });
  }

  return segments;
}

/**
 * Highlight matches in title text
 * Returns array of segments for rendering
 */
export function highlightMatches(
  text: string,
  query: string
): SnippetMatch[] {
  if (!text || !query) {
    return [{ text, start: 0, end: text.length, isMatch: false }];
  }

  const segments: SnippetMatch[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let currentIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, currentIndex);

  while (matchIndex !== -1) {
    // Add non-match text before this match
    if (matchIndex > currentIndex) {
      segments.push({
        text: text.substring(currentIndex, matchIndex),
        start: currentIndex,
        end: matchIndex,
        isMatch: false
      });
    }

    // Add match
    const matchEnd = matchIndex + query.length;
    segments.push({
      text: text.substring(matchIndex, matchEnd),
      start: matchIndex,
      end: matchEnd,
      isMatch: true
    });

    currentIndex = matchEnd;
    matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
  }

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      text: text.substring(currentIndex),
      start: currentIndex,
      end: text.length,
      isMatch: false
    });
  }

  return segments;
}

/**
 * Count total matches in text
 */
export function countMatches(text: string, query: string): number {
  if (!text || !query) return 0;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let count = 0;
  let index = 0;

  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    count++;
    index += query.length;
  }

  return count;
}

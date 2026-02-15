/**
 * Advanced Search Filter Parser
 * 
 * Parses search queries with advanced filter syntax:
 * - tag:tagname - Filter by tag
 * - folder:foldername - Filter by folder name
 * - author:username - Filter by author/editor (future)
 * - Plain text - Search in titles and content
 * 
 * Examples:
 * - "tag:training folder:onboarding" -> filters by tag AND folder
 * - "safety procedures tag:policies" -> searches "safety procedures" with tag filter
 */

export interface ParsedSearch {
  plainText: string;
  filters: {
    tags: string[];
    folders: string[];
    authors: string[];
  };
}

const FILTER_PATTERNS = {
  tag: /tag:([^\s]+)/gi,
  folder: /folder:([^\s]+)/gi,
  author: /author:([^\s]+)/gi,
};

/**
 * Parse a search query into plain text and structured filters
 */
export function parseSearchQuery(query: string): ParsedSearch {
  if (!query || typeof query !== 'string') {
    return {
      plainText: '',
      filters: { tags: [], folders: [], authors: [] }
    };
  }

  let remainingText = query;
  const filters: ParsedSearch['filters'] = {
    tags: [],
    folders: [],
    authors: [],
  };

  // Extract tag filters
  const tagMatches = Array.from(query.matchAll(FILTER_PATTERNS.tag));
  tagMatches.forEach(match => {
    const tag = match[1];
    if (tag) {
      // Handle quoted tags (e.g., tag:"with spaces")
      const cleanTag = tag.replace(/^["']|["']$/g, '');
      filters.tags.push(cleanTag);
      remainingText = remainingText.replace(match[0], '');
    }
  });

  // Extract folder filters
  const folderMatches = Array.from(query.matchAll(FILTER_PATTERNS.folder));
  folderMatches.forEach(match => {
    const folder = match[1];
    if (folder) {
      const cleanFolder = folder.replace(/^["']|["']$/g, '');
      filters.folders.push(cleanFolder);
      remainingText = remainingText.replace(match[0], '');
    }
  });

  // Extract author filters
  const authorMatches = Array.from(query.matchAll(FILTER_PATTERNS.author));
  authorMatches.forEach(match => {
    const author = match[1];
    if (author) {
      const cleanAuthor = author.replace(/^["']|["']$/g, '');
      filters.authors.push(cleanAuthor);
      remainingText = remainingText.replace(match[0], '');
    }
  });

  // Clean up remaining text (remove extra spaces)
  const plainText = remainingText.trim().replace(/\s+/g, ' ');

  return { plainText, filters };
}

/**
 * Check if a search query contains any filters
 */
export function hasFilters(parsed: ParsedSearch): boolean {
  return (
    parsed.filters.tags.length > 0 ||
    parsed.filters.folders.length > 0 ||
    parsed.filters.authors.length > 0
  );
}

/**
 * Build a display string showing active filters
 */
export function getFilterSummary(parsed: ParsedSearch): string {
  const parts: string[] = [];
  
  if (parsed.filters.tags.length > 0) {
    parts.push(`${parsed.filters.tags.length} tag${parsed.filters.tags.length > 1 ? 's' : ''}`);
  }
  
  if (parsed.filters.folders.length > 0) {
    parts.push(`${parsed.filters.folders.length} folder${parsed.filters.folders.length > 1 ? 's' : ''}`);
  }
  
  if (parsed.filters.authors.length > 0) {
    parts.push(`${parsed.filters.authors.length} author${parsed.filters.authors.length > 1 ? 's' : ''}`);
  }
  
  return parts.length > 0 ? `Filtering by: ${parts.join(', ')}` : '';
}

/**
 * Reconstruct a search query from parsed components
 */
export function buildSearchQuery(parsed: ParsedSearch): string {
  const parts: string[] = [];
  
  if (parsed.plainText) {
    parts.push(parsed.plainText);
  }
  
  parsed.filters.tags.forEach(tag => {
    const needsQuotes = tag.includes(' ');
    parts.push(`tag:${needsQuotes ? `"${tag}"` : tag}`);
  });
  
  parsed.filters.folders.forEach(folder => {
    const needsQuotes = folder.includes(' ');
    parts.push(`folder:${needsQuotes ? `"${folder}"` : folder}`);
  });
  
  parsed.filters.authors.forEach(author => {
    const needsQuotes = author.includes(' ');
    parts.push(`author:${needsQuotes ? `"${author}"` : author}`);
  });
  
  return parts.join(' ');
}

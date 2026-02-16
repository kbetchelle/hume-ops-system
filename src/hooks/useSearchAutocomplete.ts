import { useMemo } from "react";
import { getRecentSearches } from "@/lib/searchHistory";
import type { ResourcePage } from "@/hooks/useStaffResources";

export interface SearchSuggestion {
  label: string;
  value: string;
  type: 'history' | 'tag' | 'pattern';
  description?: string;
}

/**
 * Hook to provide autocomplete suggestions for search
 * Combines recent searches and available tags
 */
export function useSearchAutocomplete(
  pages: ResourcePage[],
  currentQuery: string = ''
): SearchSuggestion[] {
  return useMemo(() => {
    const suggestions: SearchSuggestion[] = [];
    const query = currentQuery.toLowerCase().trim();

    // 1. Recent searches (if query is empty or very short)
    if (query.length < 3) {
      const recentSearches = getRecentSearches(5);
      recentSearches.forEach(entry => {
        suggestions.push({
          label: entry.query,
          value: entry.query,
          type: 'history',
          description: 'Recent search'
        });
      });
    }

    // 2. Extract all unique tags from pages
    const allTags = new Set<string>();
    pages.forEach(page => {
      page.tags.forEach(tag => allTags.add(tag));
    });

    // 3. Filter and add tag suggestions
    const tagArray = Array.from(allTags);
    tagArray
      .filter(tag => !query || tag.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach(tag => {
        suggestions.push({
          label: tag,
          value: `tag:${tag.includes(' ') ? `"${tag}"` : tag}`,
          type: 'tag',
          description: 'Filter by tag'
        });
      });

    // 4. Add common search patterns if query is empty
    if (!query || query.length < 2) {
      const patterns: SearchSuggestion[] = [
        {
          label: 'Search by tag',
          value: 'tag:',
          type: 'pattern',
          description: 'Type tag name after colon'
        }
      ];
      suggestions.push(...patterns);
    }

    // Remove duplicates based on value
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.value)) return false;
      seen.add(s.value);
      return true;
    });
  }, [pages, currentQuery]);
}

/**
 * Hook to get tag suggestions for autocomplete in tag filter context
 */
export function useTagSuggestions(pages: ResourcePage[], query: string = ''): string[] {
  return useMemo(() => {
    const allTags = new Set<string>();
    pages.forEach(page => {
      page.tags.forEach(tag => allTags.add(tag));
    });

    const tagArray = Array.from(allTags).sort();
    
    if (!query.trim()) return tagArray;
    
    const q = query.toLowerCase();
    return tagArray.filter(tag => tag.toLowerCase().includes(q));
  }, [pages, query]);
}

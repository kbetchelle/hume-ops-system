import { useMemo } from "react";
import { useResourcePageFolders } from "@/hooks/useResourcePageFolders";
import { getRecentSearches } from "@/lib/searchHistory";
import type { ResourcePage } from "@/hooks/useStaffResources";

export interface SearchSuggestion {
  label: string;
  value: string;
  type: 'history' | 'tag' | 'folder' | 'pattern';
  description?: string;
}

/**
 * Hook to provide autocomplete suggestions for search
 * Combines recent searches, available tags, and folder names
 */
export function useSearchAutocomplete(
  pages: ResourcePage[],
  currentQuery: string = ''
): SearchSuggestion[] {
  const { data: folders = [] } = useResourcePageFolders();

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

    // 4. Filter and add folder suggestions
    folders
      .filter(folder => !query || folder.name.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach(folder => {
        suggestions.push({
          label: folder.name,
          value: `folder:${folder.name.includes(' ') ? `"${folder.name}"` : folder.name}`,
          type: 'folder',
          description: folder.description || 'Filter by folder'
        });
      });

    // 5. Add common search patterns if query is empty
    if (!query || query.length < 2) {
      const patterns: SearchSuggestion[] = [
        {
          label: 'Search by tag',
          value: 'tag:',
          type: 'pattern',
          description: 'Type tag name after colon'
        },
        {
          label: 'Search by folder',
          value: 'folder:',
          type: 'pattern',
          description: 'Type folder name after colon'
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
  }, [pages, folders, currentQuery]);
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

/**
 * Hook to get folder suggestions for autocomplete
 */
export function useFolderSuggestions(query: string = ''): Array<{ id: string; name: string }> {
  const { data: folders = [] } = useResourcePageFolders();
  
  return useMemo(() => {
    if (!query.trim()) return folders;
    
    const q = query.toLowerCase();
    return folders.filter(folder => folder.name.toLowerCase().includes(q));
  }, [folders, query]);
}

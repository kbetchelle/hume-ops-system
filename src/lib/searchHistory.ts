/**
 * Search History Manager
 * 
 * Manages search history in localStorage with a maximum of 20 entries.
 * Used for providing recent search suggestions to users.
 */

const STORAGE_KEY = "hume-search-history-pages";
const MAX_HISTORY_ENTRIES = 20;

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
}

/**
 * Save a search query to history
 * Deduplicates and maintains most recent entries at the top
 */
export function saveSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;

  try {
    const history = getRecentSearches();
    
    // Remove duplicate if exists
    const filtered = history.filter(entry => entry.query !== trimmed);
    
    // Add new entry at the beginning
    const updated: SearchHistoryEntry[] = [
      { query: trimmed, timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to save search history:", error);
  }
}

/**
 * Get recent searches, most recent first
 */
export function getRecentSearches(limit?: number): SearchHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: SearchHistoryEntry[] = JSON.parse(stored);
    
    // Validate and filter out invalid entries
    const valid = history.filter(
      entry => 
        entry && 
        typeof entry.query === 'string' && 
        typeof entry.timestamp === 'number'
    );
    
    return limit ? valid.slice(0, limit) : valid;
  } catch (error) {
    console.warn("Failed to load search history:", error);
    return [];
  }
}

/**
 * Clear all search history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear search history:", error);
  }
}

/**
 * Remove a specific search from history
 */
export function removeSearch(query: string): void {
  try {
    const history = getRecentSearches();
    const filtered = history.filter(entry => entry.query !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn("Failed to remove search from history:", error);
  }
}

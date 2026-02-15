import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ResourcePage } from "@/hooks/useStaffResources";

/**
 * Hook to get popular/recent pages for display when search is empty
 * Shows recently updated pages and most read pages
 */
export function usePopularPages(limit: number = 6) {
  return useQuery({
    queryKey: ["popular-pages", limit],
    queryFn: async () => {
      // Get recently updated pages
      const { data: recentPages, error: recentError } = await supabase
        .from("resource_pages" as any)
        .select("*")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (recentError) throw recentError;

      // Get most read pages (by counting reads)
      const { data: readCounts, error: readsError } = await supabase
        .from("resource_page_reads")
        .select("page_id, count")
        .limit(100);

      if (readsError) {
        console.warn("Failed to fetch read counts:", readsError);
      }

      // Count reads per page
      const readCountMap = new Map<string, number>();
      if (readCounts) {
        readCounts.forEach((record: any) => {
          const pageId = record.page_id;
          readCountMap.set(pageId, (readCountMap.get(pageId) || 0) + 1);
        });
      }

      // Get pages with highest read counts
      const { data: allPages, error: allPagesError } = await supabase
        .from("resource_pages" as any)
        .select("*")
        .eq("is_published", true);

      if (allPagesError) throw allPagesError;

      const pagesWithReads = (allPages || []).map((page: any) => ({
        ...page,
        readCount: readCountMap.get(page.id) || 0
      }));

      const mostRead = pagesWithReads
        .sort((a, b) => b.readCount - a.readCount)
        .slice(0, limit);

      return {
        recent: (recentPages || []) as ResourcePage[],
        popular: mostRead as (ResourcePage & { readCount: number })[]
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all unique tags from resource pages.
 * Returns a list of distinct tag strings.
 */
export function useAvailableTags() {
  return useQuery({
    queryKey: ["resource-page-tags"],
    queryFn: async () => {
      // Fetch all pages with tags
      const { data, error } = await supabase
        .from("resource_pages")
        .select("tags");

      if (error) throw error;

      // Extract and flatten all tags
      const allTags = (data ?? [])
        .flatMap((page) => page.tags || [])
        .filter((tag): tag is string => Boolean(tag));

      // Get unique tags and sort alphabetically
      const uniqueTags = Array.from(new Set(allTags)).sort();

      return uniqueTags;
    },
  });
}

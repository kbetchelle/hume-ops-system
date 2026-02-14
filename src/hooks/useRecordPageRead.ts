import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";

/**
 * Auto-record read receipts when a staff member views a page.
 * Waits 3-5 seconds before recording to ensure they actually viewed it.
 */
export function useRecordPageRead(pageId: string | undefined) {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!pageId || !user) return;

    let timeoutId: NodeJS.Timeout | null = null;

    // Check if read receipt already exists
    const checkAndInsert = async () => {
      try {
        // Check if already read
        const { data: existing } = await supabase
          .from("resource_page_reads")
          .select("id")
          .eq("page_id", pageId)
          .eq("user_id", user.id)
          .maybeSingle();

        // If already recorded, don't insert again
        if (existing) return;

        // Wait 3-5 seconds before recording (random between 3000-5000ms)
        const delay = 3000 + Math.random() * 2000;
        timeoutId = setTimeout(async () => {
          // Double-check it still doesn't exist (in case of multiple quick mounts)
          const { data: stillNotExists } = await supabase
            .from("resource_page_reads")
            .select("id")
            .eq("page_id", pageId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!stillNotExists) {
            // Insert read receipt
            await supabase.from("resource_page_reads").insert({
              page_id: pageId,
              user_id: user.id,
            });
          }
        }, delay);
      } catch (error) {
        console.error("Failed to record page read:", error);
      }
    };

    checkAndInsert();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pageId, user]);
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";
import { useResourcePage } from "./useStaffResources";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StaffReadStatus {
  userId: string;
  fullName: string | null;
  email: string | null;
  roles: AppRole[];
  readAt: string | null;
  hasRead: boolean;
}

export interface PageReadReceipts {
  readers: StaffReadStatus[];
  nonReaders: StaffReadStatus[];
  totalStaff: number;
  readCount: number;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Query Key
// ---------------------------------------------------------------------------

export const PAGE_READ_RECEIPTS_KEY = "page-read-receipts";

// ===========================================================================
// Hook
// ===========================================================================

/**
 * Fetch read receipt data for a page: who has read it, who hasn't, counts.
 */
export function usePageReadReceipts(pageId: string | undefined): PageReadReceipts {
  const { data: page } = useResourcePage(pageId);

  const query = useQuery({
    queryKey: [PAGE_READ_RECEIPTS_KEY, pageId],
    queryFn: async () => {
      if (!pageId || !page) {
        return {
          readers: [],
          nonReaders: [],
          totalStaff: 0,
          readCount: 0,
        };
      }

      // 1. Fetch all read receipts for this page
      const { data: reads, error: readsError } = await (supabase
        .from("resource_page_reads" as any) as any)
        .select(
          `
          user_id,
          read_at
        `
        )
        .eq("page_id", pageId);

      if (readsError) throw readsError;

      // Create a map of userId -> readAt for quick lookup
      const readsMap = new Map<string, string>();
      reads?.forEach((read) => {
        readsMap.set(read.user_id, read.read_at);
      });

      // 2. Fetch all users with roles matching the page's assigned_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select(
          `
          user_id,
          role,
          profiles!inner(
            full_name,
            email,
            deactivated
          )
        `
        )
        .in("role", page.assigned_roles);

      if (rolesError) throw rolesError;

      // 3. Group users by user_id and aggregate their roles
      const userMap = new Map<
        string,
        {
          fullName: string | null;
          email: string | null;
          roles: AppRole[];
          deactivated: boolean;
        }
      >();

      userRoles?.forEach((ur: any) => {
        const profile = ur.profiles;
        const existing = userMap.get(ur.user_id);

        if (existing) {
          existing.roles.push(ur.role);
        } else {
          userMap.set(ur.user_id, {
            fullName: profile?.full_name || null,
            email: profile?.email || null,
            roles: [ur.role],
            deactivated: profile?.deactivated || false,
          });
        }
      });

      // 4. Build StaffReadStatus array and split into readers/nonReaders
      const readers: StaffReadStatus[] = [];
      const nonReaders: StaffReadStatus[] = [];

      userMap.forEach((user, userId) => {
        // Skip deactivated users
        if (user.deactivated) return;

        const readAt = readsMap.get(userId);
        const staffStatus: StaffReadStatus = {
          userId,
          fullName: user.fullName,
          email: user.email,
          roles: user.roles,
          readAt: readAt || null,
          hasRead: !!readAt,
        };

        if (readAt) {
          readers.push(staffStatus);
        } else {
          nonReaders.push(staffStatus);
        }
      });

      // 5. Sort: readers by most recent, nonReaders alphabetically
      readers.sort((a, b) => {
        if (!a.readAt || !b.readAt) return 0;
        return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
      });

      nonReaders.sort((a, b) => {
        const nameA = a.fullName || a.email || "";
        const nameB = b.fullName || b.email || "";
        return nameA.localeCompare(nameB);
      });

      return {
        readers,
        nonReaders,
        totalStaff: readers.length + nonReaders.length,
        readCount: readers.length,
      };
    },
    enabled: !!pageId && !!page,
  });

  return {
    readers: query.data?.readers || [],
    nonReaders: query.data?.nonReaders || [],
    totalStaff: query.data?.totalStaff || 0,
    readCount: query.data?.readCount || 0,
    isLoading: query.isLoading,
  };
}

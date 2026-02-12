/**
 * Barrel re-export for backward compatibility.
 *
 * The actual hooks live in:
 *   - ./useQuickLinks.ts   (groups + items)
 *   - ./useResourcePages.ts (resource pages)
 */

export {
  // Types
  type QuickLinkGroup,
  type QuickLinkItem,
  type QuickLinkGroupWithItems,
  type CreateQuickLinkGroupInput,
  type UpdateQuickLinkGroupInput,
  type CreateQuickLinkItemInput,
  type UpdateQuickLinkItemInput,
  // Query keys
  QUICK_LINK_GROUPS_KEY,
  QUICK_LINK_ITEMS_KEY,
  // Group hooks
  useQuickLinkGroups,
  useQuickLinkGroupsWithItems,
  useQuickLinkGroupsByRole,
  useCreateQuickLinkGroup,
  useUpdateQuickLinkGroup,
  useDeleteQuickLinkGroup,
  // Item hooks
  useQuickLinkItems,
  useCreateQuickLinkItem,
  useUpdateQuickLinkItem,
  useDeleteQuickLinkItem,
} from "./useQuickLinks";

export {
  // Types
  type ResourcePage,
  type CreateResourcePageInput,
  type UpdateResourcePageInput,
  // Query key
  RESOURCE_PAGES_KEY,
  // Hooks
  useResourcePages,
  useResourcePagesByRole,
  useCreateResourcePage,
  useUpdateResourcePage,
  useDeleteResourcePage,
} from "./useResourcePages";

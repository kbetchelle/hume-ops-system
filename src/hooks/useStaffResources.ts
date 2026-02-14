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
  type ResourcePagesFilters,
  // Query key
  RESOURCE_PAGES_KEY,
  // Hooks
  useResourcePages,
  useResourcePage,
  useResourcePagesByRole,
  useCreateResourcePage,
  useUpdateResourcePage,
  useDeleteResourcePage,
  useDuplicateResourcePage,
} from "./useResourcePages";

export {
  // Types
  type ResourcePageFolder,
  type CreateFolderInput,
  type UpdateFolderInput,
  // Query key
  RESOURCE_PAGE_FOLDERS_KEY,
  // Hooks
  useResourcePageFolders,
  useResourcePageFolder,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useReorderFolders,
} from "./useResourcePageFolders";

export {
  // Types
  type ResourcePageEditor,
  type PageEditorWithProfile,
  // Query key
  RESOURCE_PAGE_EDITORS_KEY,
  // Hooks
  usePageEditors,
  useMyEditablePages,
  useAddPageEditor,
  useRemovePageEditor,
} from "./useResourcePageEditors";

export {
  // Hooks
  useAvailableTags,
} from "./useAvailableTags";

export {
  // Hooks
  useCanEditPage,
} from "./useCanEditPage";

export {
  // Types
  type StaffReadStatus,
  type PageReadReceipts,
  // Query key
  PAGE_READ_RECEIPTS_KEY,
  // Hooks
  usePageReadReceipts,
} from "./usePageReadReceipts";

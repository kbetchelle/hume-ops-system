

## Target Groups - Universal Staff Grouping System

### Overview
Create a centralized "Target Groups" management page within User Management that replaces the existing `staff_message_groups` table. These groups will be universal -- usable across messaging, announcements, weekly updates, and any future feature that needs staff targeting. Only admins and managers can create/manage groups. Members are selected individually from the staff list.

---

### What Changes

**Database**
- Rename the existing `staff_message_groups` table to `target_groups` via migration
- Add new columns: `description` (optional text), `usage_context` (text array -- tracks where the group is used, e.g. `['messaging', 'announcements']` for display purposes)
- Update RLS policies so only admin/manager roles can insert, update, and delete; all authenticated users can read (since they need to see groups they belong to)
- Existing data and foreign key references (from `staff_messages.group_id`) will be preserved through the rename

**New Tab in User Management**
- Add a "Target Groups" tab to the User Management page (positioned after "Sling Linking")
- The tab shows a table listing all groups with columns: Group Name, Members (count + avatars/names), Created By, Last Updated
- Each row has Edit and Delete actions
- A "Create Group" button opens a dialog

**Create/Edit Dialog**
- Group name input field
- Optional description field
- Staff member picker with search -- checkboxes next to each staff member, showing name and email
- Selected member count badge with "Clear All" option
- Minimum 2 members required
- Save/Cancel buttons

**Delete Flow**
- Confirmation dialog warning that the group will be removed from all features that reference it
- Existing messages that used the group will retain their `group_name` field (already stored as denormalized text)

**Refactor Existing Code**
- Update `src/types/messaging.ts`: rename `StaffMessageGroup` to `TargetGroup`, update the interface
- Update `src/hooks/useMessageGroups.ts`: rename to `src/hooks/useTargetGroups.ts`, update table references from `staff_message_groups` to `target_groups`, update query keys
- Update all consuming components to use the new hook/type names:
  - `GroupDialogs.tsx` -- update imports and table references
  - `NewConversationDialog.tsx` -- update imports
  - `StaffMessagesInbox.tsx` -- update imports
  - `MessagesOptionsMenu.tsx` -- update imports
  - `MessageComposer.tsx` -- update imports
- Update `supabase/functions/data-api/index.ts` to reference `target_groups` instead of `staff_message_groups`

**New Components**
- `src/components/admin/TargetGroupsTable.tsx` -- main table view for the User Management tab
- `src/components/admin/TargetGroupDialog.tsx` -- create/edit dialog (similar to existing `GroupDialogs.tsx` but styled for the admin context)

---

### Technical Details

**Migration SQL**
```text
-- Rename table
ALTER TABLE staff_message_groups RENAME TO target_groups;

-- Add new columns
ALTER TABLE target_groups 
  ADD COLUMN description text,
  ADD COLUMN usage_context text[] DEFAULT '{}';

-- Update RLS policies for admin/manager write access
-- All authenticated can read (needed for messaging recipient resolution)
```

**File Changes Summary**
1. Database migration (rename table, add columns, update RLS)
2. New: `src/components/admin/TargetGroupsTable.tsx`
3. New: `src/components/admin/TargetGroupDialog.tsx`
4. Rename: `src/hooks/useMessageGroups.ts` -> `src/hooks/useTargetGroups.ts`
5. Edit: `src/types/messaging.ts` (rename type)
6. Edit: `src/pages/admin/UserManagementPage.tsx` (add tab)
7. Edit: 5 messaging components (update imports)
8. Edit: `supabase/functions/data-api/index.ts` (update table name)


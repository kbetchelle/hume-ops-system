

## Bulk Item Creation for All Checklist Managers

### What It Does
Adds a "Bulk Add Items" button next to the existing "Add Item" button in each checklist manager (Concierge, BoH, Cafe). Opens a dialog where you can set shared settings once (time hint, task type, category) and then add multiple item descriptions using dynamic rows with a "+" button. After saving, a brief confirmation summary shows how many items were created before the dialog closes.

### How It Works

1. **Shared settings at the top of the dialog:**
   - Time hint (with existing autocomplete suggestions)
   - Task type dropdown (defaults to Checkbox, applies to all rows)
   - Category field

2. **Dynamic rows section below:**
   - Each row has a text input for the item description and a remove (X) button
   - A "+ Add Row" button appends a new empty row
   - Starts with 2 empty rows by default

3. **Save flow:**
   - All rows are saved with the shared time hint, task type, and category
   - Sort order is auto-incremented from the current item count
   - After save, a toast confirmation shows "X items added successfully"
   - Dialog closes automatically

### Technical Approach

- **New shared component**: `BulkAddItemsDialog` in `src/components/checklists/BulkAddItemsDialog.tsx`
  - Accepts the `createItem` mutation, `checklistId`, current item count, and existing time hints as props
  - Keeps it generic so all three managers can use it

- **Integration into each manager** (3 files):
  - `ConciergeChecklistManager.tsx`
  - `BoHChecklistManager.tsx`
  - `CafeChecklistManager.tsx`
  - Add state for `isBulkDialogOpen`
  - Add "Bulk Add" button next to existing "Add Item" button
  - Render the shared `BulkAddItemsDialog` component

- **No database changes needed** -- uses the same `createItem` mutation that already exists in each manager

### Files to Create
- `src/components/checklists/BulkAddItemsDialog.tsx`

### Files to Modify
- `src/components/checklists/cafe/CafeChecklistManager.tsx`
- `src/components/checklists/concierge/ConciergeChecklistManager.tsx`
- `src/components/checklists/boh/BoHChecklistManager.tsx`



# Fix Text Formatting and Save Shortcut in Latest Edits

## Overview
This plan addresses two issues in the "Latest Edits in Ops System Application" feature:
1. Inconsistent text formatting (varying font sizes visible in the editor)
2. Enter key triggering save instead of Cmd+Enter

---

## Changes

### 1. Normalize Text Formatting in RichTextEditor
**File:** `src/components/shared/RichTextEditor.tsx`

- Remove inline styling that causes font size inconsistencies
- Ensure the editor strips font-size styles when content is pasted or modified
- Update the paste handler to strip HTML formatting that includes font sizes
- Add CSS normalization to ensure all text inherits the same base size

### 2. Normalize Display Formatting in DevDashboardPanel  
**File:** `src/components/admin/DevDashboardPanel.tsx`

- Ensure the display div (non-editing view) matches the editor's text styling
- Add CSS to normalize any existing formatted content to consistent sizing

### 3. Change Save Shortcut from Enter to Cmd+Enter
**File:** `src/components/admin/DevDashboardPanel.tsx`

Update the keyboard event handler:

```text
Current behavior:
┌─────────────────────────────┐
│ Enter key → triggers save   │
└─────────────────────────────┘

New behavior:
┌──────────────────────────────────────┐
│ Cmd+Enter (Mac) / Ctrl+Enter (Win)  │
│ → triggers save                      │
│                                      │
│ Enter key → normal line break       │
└──────────────────────────────────────┘
```

**Code change in handleKeyDown:**
```typescript
// Before:
if (event.key === "Enter" && !event.shiftKey) {
  saveNotes();
}

// After:
if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
  event.preventDefault();
  saveNotes();
}
```

### 4. Add Keyboard Shortcut Listener to Modal
**File:** `src/components/admin/DevNotesModal.tsx`

- Add a keyboard event listener for Cmd+Enter to trigger save and close the modal
- This ensures consistent behavior between the card view and modal view

---

## Technical Details

### Font Normalization CSS
The RichTextEditor will add styling to strip inline font-size:
```css
[&_*]:!text-inherit
```

### Paste Handler Enhancement
Update the paste handler to ensure clean text is inserted without formatting:
- Currently strips to plain text, which is good
- No changes needed here

### Display Consistency
The display div in DevDashboardPanel needs matching text-base class to match editor styling.

---

## Files to Modify
1. `src/components/admin/DevDashboardPanel.tsx` - Change Enter to Cmd+Enter, normalize display text
2. `src/components/admin/DevNotesModal.tsx` - Add Cmd+Enter keyboard shortcut support
3. `src/components/shared/RichTextEditor.tsx` - Add CSS to normalize all child text to inherit font size

---

## Expected Outcome
- All text in the Latest Edits panel will display at a consistent size
- Pressing Enter will create a new line (normal text editing behavior)
- Pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows) will save the notes
- Behavior will be consistent between the inline editor and the modal view

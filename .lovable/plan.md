

## Adjust Column Widths: Category and In Safe?

**Category column**: Decrease width by 10px
**In Safe? column**: Increase width by 10px

### Technical Changes

**File: `src/components/concierge/LostAndFoundTab.tsx`**

1. Find the Category `TableHead` width class and reduce by 10px (identify current width, subtract 10).
2. Change the In Safe? `TableHead` width from `w-[98px]` to `w-[108px]`.
3. If the Category column cells also have explicit widths, adjust those as well.


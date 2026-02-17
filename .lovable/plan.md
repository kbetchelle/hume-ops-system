

# Add Color Differentiation to Female Spa Attendant Checklist

## Problem
1. The `BoHChecklistItem` component does not render the `color` field from the database -- colors are stored but invisible to staff
2. The color `orange` is overused (40 of 121 items), reducing visual differentiation
3. The supported color palette is missing `purple` (already in DB but not in UI color map)

## Changes

### 1. Add color-based left border to BoHChecklistItem

Update `src/components/checklists/boh/BoHChecklistItem.tsx` to apply a colored left border on each item based on its `color` field, matching the pattern used in `MobileChecklistItem.tsx`.

Supported color map (adding `purple`, `teal`, `pink`):
- red, orange, yellow, green, blue, purple, gray, teal, pink

Each item's outer `div` will get a `border-l-4` with the corresponding Tailwind color class.

### 2. Add purple and teal to MobileChecklistItem color map

Update `src/components/checklists/MobileChecklistItem.tsx` to also include purple, teal, and pink in its `colorMap` for consistency.

### 3. Redistribute colors in the database

Update `boh_checklist_items` to break up the 40 orange items into task-meaningful color groups:

| Color | Meaning | Items |
|-------|---------|-------|
| orange | Opening / setup tasks (AM 5:30-6:15) | Keep existing 6 AM opening items |
| teal | Deep cleaning tasks (scrubbing, mopping, sauna) | ~12 items currently orange |
| pink | Restocking / amenities tasks | ~10 items currently orange |
| purple | Inspection / quality checks (already used for 6:15-7 AM) | Keep existing |
| blue | Recurring hourly tasks | Keep existing |
| yellow | Mid-shift tasks | Keep existing |
| green | Late-shift tasks | Keep existing |
| red | High-priority / time-critical | Keep existing |
| gray | End of shift | Keep existing |

SQL updates will reassign:
- Deep cleaning tasks (scrub showers, mop floors, clean sauna, steam room, drain cleaning, wipe mirrors) to **teal**
- Restocking/amenity tasks (stock amenities, restock towels in PM, take out trash) to **pink**
- Keep AM opening orange items as-is (they represent the opening block)

### 4. Files to change

| File | Change |
|------|--------|
| `src/components/checklists/boh/BoHChecklistItem.tsx` | Add color-based `border-l-4` styling to all task type wrappers |
| `src/components/checklists/MobileChecklistItem.tsx` | Add purple, teal, pink to colorMap |
| Database migration | UPDATE ~22 orange items to teal/pink based on task type |


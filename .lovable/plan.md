

# Apply Image Color Palette as Global Design Tokens

## Hex Codes from Image

| Name | Hex | Usage |
|------|-----|-------|
| Olive | #818807 | Checklist: deep cleaning / teal replacement |
| Sky Blue | #6CA2E8 | Checklist: recurring hourly / blue replacement |
| Amber | #F28B0C | Checklist: opening/setup (orange), badge default |
| Burnt Orange | #F2600C | Alert warning, badge destructive |
| Crimson | #D9310B | Alert destructive, high-priority tasks |

---

## Changes

### 1. Create global color constant `add_color`

**File:** `src/lib/constants.ts`

Add a new exported constant containing all 5 hex codes:

```typescript
export const add_color = {
  olive: "#818807",
  skyBlue: "#6CA2E8",
  amber: "#F28B0C",
  burntOrange: "#F2600C",
  crimson: "#D9310B",
} as const;
```

### 2. Register colors in Tailwind config

**File:** `tailwind.config.ts`

Add an `add` color group under `extend.colors` so these are available as Tailwind utilities (e.g., `bg-add-olive`, `border-l-add-amber`):

```typescript
add: {
  olive: "#818807",
  skyBlue: "#6CA2E8",
  amber: "#F28B0C",
  burntOrange: "#F2600C",
  crimson: "#D9310B",
},
```

### 3. Update Badge component

**File:** `src/components/ui/badge.tsx`

Add new color-specific variants using the palette:

| Variant | Style |
|---------|-------|
| `default` | `bg-add-amber/10 border-add-amber text-add-amber` |
| `destructive` | `bg-add-crimson/10 border-add-crimson text-add-crimson` |
| `secondary` | `bg-add-skyBlue/10 border-add-skyBlue text-add-skyBlue` |
| `outline` | `border-add-burntOrange text-add-burntOrange` |

### 4. Update Alert component

**File:** `src/components/ui/alert.tsx`

| Variant | Style |
|---------|-------|
| `default` | Keep as-is (neutral) |
| `destructive` | `border-add-crimson/50 text-add-crimson [&>svg]:text-add-crimson` |

Add a new `warning` variant:
- `border-add-burntOrange/50 text-add-burntOrange [&>svg]:text-add-burntOrange`

### 5. Update checklist color maps

**Files:** `BoHChecklistItem.tsx` and `MobileChecklistItem.tsx`

Replace the Tailwind default color borders with the new palette for the most-used categories:

| DB color value | Old class | New class |
|----------------|-----------|-----------|
| orange | `border-l-orange-500` | `border-l-add-amber` |
| red | `border-l-red-500` | `border-l-add-crimson` |
| blue | `border-l-blue-500` | `border-l-add-skyBlue` |
| teal | `border-l-teal-500` | `border-l-add-olive` |
| pink | `border-l-pink-500` | `border-l-add-burntOrange` |

The remaining colors (yellow, green, purple, gray) stay as Tailwind defaults since they are not part of this palette.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/constants.ts` | Add `add_color` constant with 5 hex codes |
| `tailwind.config.ts` | Register `add` color group |
| `src/components/ui/badge.tsx` | Update variant colors to use palette |
| `src/components/ui/alert.tsx` | Update destructive + add warning variant |
| `src/components/checklists/boh/BoHChecklistItem.tsx` | Update colorBorderMap to use `add-*` classes |
| `src/components/checklists/MobileChecklistItem.tsx` | Update colorMap to use `add-*` classes |




## Remove External Link Icon and Restyle Quick Links

### Changes

**File: `src/components/staff-resources/StaffResourcesView.tsx`**

1. Remove the `ExternalLink` icon import (and from the lucide-react import line).
2. Replace the icon with a bullet/dash prefix for each link item -- a small centered dot or dash character before the link name.
3. Add `hover:underline` to the link text span so underline appears only on hover.
4. Remove the existing `ExternalLink` SVG element from each link row.

### Technical Details

In the `QuickLinksTab` component, each link currently renders:
```
<ExternalLink icon /> <link name> <copy button>
```

It will become:
```
<span class="dot/dash">-</span> <link name with hover:underline> <copy button>
```

Specifically:
- Replace `<ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />` with `<span className="text-muted-foreground text-sm">-</span>` (or a bullet character)
- Add `hover:underline` to the link text `<span>` element
- Clean up the `ExternalLink` import from lucide-react


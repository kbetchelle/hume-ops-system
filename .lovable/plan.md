

# Unified Global Notification Formatting and Style

## Summary

Remap 10 notification types to new colors from app_colors, expand the global config with explicit style tokens for badges/banners/labels, and apply them consistently across all 4 consuming components.

---

## 1. New Color Assignments

| Notification Type | Current Color | New Color |
|---|---|---|
| message | green | **yellow** |
| announcement | yellow | **orange** |
| bug_report_update | red | **green** |
| member_alert | orange | **purple** |
| class_turnover | blue | blue (no change) |
| mat_cleaning | green | **blue** |
| resource_outdated | yellow | **orange** |
| package_arrived | purple | purple (no change) |
| room_turnover | orange | **green** |
| tour_alert | blue | blue (no change) |

Unchanged types: qa_answered (blue), qa_new_question (purple), account_pending (orange), account_approved (green), account_rejected (red).

---

## 2. Style Tokens (opacity rules)

Three distinct contexts with different styling:

- **Icon badge** (small square with icon): Solid color background, white icon (`bg-add-{color} text-white`)
- **Label tag** (type pill like "ANNOUNCEMENT"): Solid color background, white text (`bg-add-{color} text-white`)
- **Banner background**: 90% transparency = 10% opacity tint, black text/icons (`bg-add-{color}/10 text-foreground`)
- **Banner border**: Matches type color at 40% opacity (`border-add-{color}/40`)
- **Unread row highlight**: Per-type color at 10% opacity (`bg-add-{color}/10`)
- **Unread dot**: Stays universal red (`bg-add-red`)

---

## 3. Technical Changes

### File: `src/lib/notificationConfig.ts`

Expand `NotificationFormatConfig` interface with new properties:

```text
interface NotificationFormatConfig {
  icon: ...;
  // Solid color tokens (for icon badge + label tag)
  solidBg: string;       // e.g. 'bg-add-yellow'
  solidText: string;     // 'text-white'
  // Tint tokens (for banners + unread rows)
  tintBg: string;        // e.g. 'bg-add-yellow/10'
  tintText: string;      // 'text-foreground'
  tintBorder: string;    // e.g. 'border-add-yellow/40'
  // Icon color (for banner icons where bg is tinted)
  iconColor: string;     // e.g. 'text-add-yellow'
  // Labels
  labelEn: string;
  labelEs: string;
}
```

Remove old `bg` and `text` fields (replaced by the above). Update all 15 entries with the correct color mappings.

### File: `src/components/notifications/NotificationItem.tsx`

- Icon badge: use `fmt.solidBg` + `fmt.solidText` (solid square)
- Label tag: use `fmt.solidBg` + `fmt.solidText`
- Unread row: use `fmt.tintBg` instead of hardcoded `bg-add-yellow/10`
- Unread dot: keep `bg-add-red`

### File: `src/components/concierge/NotificationBell.tsx`

- Same formatting as inbox (consistent everywhere)
- Icon badge: solid color when unread, `bg-muted` when read
- Unread row: per-type `fmt.tintBg`

### File: `src/pages/admin/NotificationExamplesPage.tsx`

- `NotificationSample` (inbox-style): use solid badge + solid label tag
- `BannerSample` (default): use `fmt.tintBg` for background, `fmt.tintBorder` for border, `fmt.tintText` for text, `fmt.iconColor` for the icon
- `BannerSample` (urgent): keep red urgent override
- Color legend section: update to reflect new mappings
- All changes will be visible on the examples page immediately

### Cleanup

- Remove the old `bg` and `text` fields from the config interface
- Update the `getNotificationFormat` return and `FALLBACK_FORMAT` to use the new properties
- `useInAppNotifications.ts` does not use color tokens (only toasts via sonner) so no changes needed there


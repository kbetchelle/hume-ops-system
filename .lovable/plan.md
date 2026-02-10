
# Auto-Polling Sync Skipped Records Page

## Current Status
The page is **functional** -- queries return 200 OK. The table is empty because no skipped records have been logged yet (they appear when sync/backfill jobs encounter anomalies).

## Changes

### 1. Remove the Refresh button
Remove the `<Button>` with the `<RefreshCw>` icon and its `refetchNames` handler from `SyncSkippedRecordsPage.tsx`.

### 2. Add active-sync detection
Create a small helper query in `useSyncSkippedRecords.ts` that checks if any backfill job or sync schedule is currently running:

```typescript
export function useIsAnySyncRunning() {
  return useQuery({
    queryKey: ["isAnySyncRunning"],
    queryFn: async () => {
      const { data } = await supabase
        .from("backfill_jobs")
        .select("id")
        .in("status", ["pending", "running"])
        .limit(1);
      const backfillRunning = (data?.length ?? 0) > 0;

      const { data: schedData } = await supabase
        .from("sync_schedule")
        .select("id")
        .eq("last_status", "running")
        .limit(1);
      const schedRunning = (schedData?.length ?? 0) > 0;

      return backfillRunning || schedRunning;
    },
    refetchInterval: 30_000,
  });
}
```

### 3. Dynamic polling interval in SyncSkippedRecordsPage
- Use `useIsAnySyncRunning()` to determine if a sync is active.
- When active: poll skipped records and API names every **60 seconds**.
- When idle: poll every **5 minutes** (light background refresh).
- Pass the dynamic interval to both `useSyncSkippedRecords` and `useSyncSkippedRecordsApiNames`.
- Show a small status indicator (e.g., a pulsing dot + "Live -- syncs active") so the user knows auto-refresh is happening.

### 4. Files Modified
| File | Change |
|------|--------|
| `src/hooks/useSyncSkippedRecords.ts` | Add `useIsAnySyncRunning` hook |
| `src/pages/admin/SyncSkippedRecordsPage.tsx` | Remove Refresh button, wire dynamic polling, add sync-active indicator |

### Technical Details
- The `useSyncSkippedRecords` hook already accepts a `refetchInterval` option -- we just pass the dynamic value from the page.
- `useSyncSkippedRecordsApiNames` currently has a hardcoded 60s interval; we will make it accept an optional override parameter the same way.
- No database or edge function changes required.

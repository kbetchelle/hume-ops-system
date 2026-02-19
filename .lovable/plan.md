

## Add Location Name to Arketa Classes

### What This Does
Adds a `location_name` column to the `arketa_classes` table and populates it by looking up the `location_id` against the Arketa locations endpoint during class sync. Based on the API response you shared, the locations data is small (6 records) and static, so we fetch it once at the start of each sync and use it as a lookup map.

### Location Data (from your API response)
| ID | Name | Active |
|----|------|--------|
| ZpbZcKknSQeHKmmtYtes | HUME | Yes |
| exQWcsxbNQKOn17d0Nif | HUME | Deleted |
| zQUVWkrRHeqhThff6gh0 | High Roof | Deleted |
| H2mCPKfGZBrnpxgnxrPm | Ground Floor Studio | Deleted |
| A7d5KXnbKYTMW7NWPV7d | Reformer Studio | Deleted |
| fUTW1Ezl7j8Y6u046LK1 | Reformer Studio | Deleted |

### Technical Details

**1. Database migration:**
- Add `location_name TEXT` column to `arketa_classes`
- Add `location_name TEXT` column to `arketa_classes_staging`
- Update `upsert_arketa_classes_from_staging` RPC to include `location_name` in the INSERT/upsert
- Backfill existing rows using the known location ID-to-name mapping

**2. Edge function changes (`supabase/functions/sync-arketa-classes/index.ts`):**
- At the start of the sync, fetch the `/locations` endpoint once to build a `Map<string, string>` of location ID to name
- When building staging rows, look up `cls.location_id` in the map to set `location_name`
- Add `location_name` to the staging insert

**3. No changes needed to:**
- The 3-tier fetch strategy or pagination logic
- CORS, auth, or retry logic
- The `daily_schedule` refresh function (it doesn't use location_name)


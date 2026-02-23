

# CSV Import to `arketa_reservations_history` and `arketa_classes`

Both CSV files share the same columns (in slightly different order):
**First Name, Last Name, Time Booked, Class Name, Class Time, Instructor, Location, Status, Client ID, Class ID, Class Date, Type, Class Time Only**

**Note:** Values are triple-quoted (e.g. `"""Thomas"""`) -- the import function will need to strip these extra quotes.

---

## File Summary

| File | Rows | Date Range |
|------|------|------------|
| `next_4week_res_filtered` | 464 rows | Feb 23 - Apr 1, 2026 |
| `missingfeb_filtered` | 18,434 rows | Jan 20 - Apr 1, 2026 |

---

## Table 1: `arketa_reservations_history`

### Column Mapping

| DB Column | Source | Calculation / Notes |
|-----------|--------|---------------------|
| `reservation_id` | **Calculated** | `{Client ID}_{unix_timestamp(Time Booked)}_{random_8chars}` -- matches existing pattern (e.g. `QS0QV...f2_1750111311_hMBAXiphQdEO`) |
| `client_id` | CSV `Client ID` | Direct map |
| `class_id` | CSV `Class ID` | Direct map |
| `class_name` | CSV `Class Name` | Direct map (may be empty for "Gym Check in" style records) |
| `class_date` | CSV `Class Date` | Parse from `MM/DD/YYYY` to `YYYY-MM-DD` |
| `status` | CSV `Status` | Map: "Checked In" -> "ATTENDED", "Confirmed" -> "CONFIRMED", "Canceled" -> "CANCELLED", "Waitlist" -> "WAITLIST" |
| `checked_in` | CSV `Status` | `true` if Status = "Checked In", else `false` |
| `checked_in_at` | CSV `Time Booked` | Only populated when Status = "Checked In" (use Time Booked as approximate check-in time) |
| `reservation_type` | CSV `Type` | Direct map ("Subscription", "Unpaid", "Waitlist", etc.) |
| `client_first_name` | CSV `First Name` | Direct map |
| `client_last_name` | CSV `Last Name` | Direct map |
| `created_at_api` | CSV `Time Booked` | Parse timestamp (strip PST, treat as America/Los_Angeles) |
| `late_cancel` | -- | `false` (default, not in CSV) |
| `gross_amount_paid` | -- | `null` (not in CSV) |
| `net_amount_paid` | -- | `null` (not in CSV) |
| `spot_id` | -- | `null` (not in CSV) |
| `spot_name` | -- | `null` (not in CSV) |
| `client_email` | -- | `null` (not in CSV) |
| `client_phone` | -- | `null` (not in CSV) |
| `raw_data` | -- | Store full CSV row as JSON for traceability |
| `sync_batch_id` | -- | Generated per import run |

**Unique constraint:** `(reservation_id, class_id)` -- the generated `reservation_id` includes client_id + timestamp, making it unique per booking.

---

## Table 2: `arketa_classes`

Classes will be **extracted from the CSV** by collecting distinct `Class ID` values and their associated metadata.

### Column Mapping

| DB Column | Source | Calculation / Notes |
|-----------|--------|---------------------|
| `external_id` | CSV `Class ID` | Direct map |
| `name` | CSV `Class Name` | First non-empty name found for that Class ID |
| `class_date` | CSV `Class Date` | Parse from `MM/DD/YYYY` to `YYYY-MM-DD` |
| `start_time` | CSV `Class Time` | Parse full timestamp to `timestamptz` |
| `instructor_name` | CSV `Instructor` | First non-empty value found for that Class ID |
| `location_name` | CSV `Location` | Default to "HUME" |
| `booked_count` | **Calculated** | Count of non-cancelled reservations per (Class ID, Class Date) |
| `capacity` | -- | `null` (not in CSV) |
| `duration_minutes` | -- | `null` (not in CSV) |
| `waitlist_count` | **Calculated** | Count of "Waitlist" status records per (Class ID, Class Date) |
| `status` | -- | `null` |
| `is_cancelled` | -- | `false` |
| `is_deleted` | -- | `false` |
| `room_name` | -- | `null` |
| `description` | -- | `null` |
| `raw_data` | -- | `null` |
| `synced_at` | -- | `now()` |

**Unique constraint:** `(external_id, class_date)` -- upsert will update `booked_count` and `waitlist_count` if the class already exists.

---

## Deduplication Concern

The CSVs may contain duplicate reservation rows (same Client ID + Class ID + Time Booked). The edge function will deduplicate by keeping the latest `Time Booked` entry for each `(Client ID, Class ID, Class Date)` combination before inserting.

---

## Implementation Plan

1. **Create a new edge function** `import-arketa-csv` that:
   - Accepts the raw CSV content
   - Strips triple-quote wrapping from all values
   - Parses and deduplicates reservations
   - Generates `reservation_id` matching the existing `{clientId}_{unixTimestamp}_{random}` pattern
   - Maps status values (Checked In -> ATTENDED, etc.)
   - Extracts distinct classes from the reservation data
   - Upserts to `arketa_classes` first (so FK-like references are valid)
   - Upserts to `arketa_reservations_history` second
   - Returns counts of inserted/updated/skipped per table

2. **Add a UI trigger** on the Dev Tools or Backfill page to upload these CSVs and call the new function, processing in chunks of 1000 rows (similar to existing `useCSVImport` pattern).

3. **Process the two files** -- the smaller file (464 rows) in one batch, the larger (18,434 rows) in ~19 chunks.


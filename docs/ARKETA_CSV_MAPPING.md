# Arketa CSV → arketa_reservations_history & arketa_classes

Date range for import: **2026-01-20** through **2026-03-04**.

A template CSV with the correct column headers (no data rows) for this range is at `public/data/arketa_reservations_filtered_2026-01-20_to_2026-03-04.csv`; you can paste or import data into it.

Use the script to filter your CSV to that range and get a property match report:

```bash
npx tsx scripts/filter-arketa-csv-by-date.ts /path/to/your-arketa-export.csv
```

Output: `*_filtered_2026-01-20_to_2026-03-04.csv` (records in range only) and a console report of which CSV columns map to the tables.

---

## 1. arketa_reservations_history

Target table unique key: `(reservation_id, class_id)`.

| Table column         | In CSV? | Notes |
|----------------------|--------|--------|
| **id**               | No     | **Calculated:** Omit on insert; DB generates `gen_random_uuid()`. |
| **reservation_id**   | Yes    | **Match.** Required. Often exported as `reservation_id` or `id`. |
| **class_id**         | Yes    | **Match.** Required. May be named `class_id` or `arketa_class_id`. |
| **client_id**        | Yes    | **Match.** Optional. |
| **reservation_type** | Yes    | **Match.** Optional. |
| **class_name**       | Yes    | **Match.** Optional but useful for display. |
| **class_date**       | Yes    | **Match.** Used for date filter (2026-01-20 to 2026-03-04). Format `YYYY-MM-DD`. |
| **status**           | Yes    | **Match.** Optional. |
| **checked_in**       | Yes    | **Match.** Boolean; default false if missing. |
| **checked_in_at**    | Yes    | **Match.** Timestamptz (ISO preferred). |
| **late_cancel**      | Yes    | **Match.** Boolean; default false if missing. |
| **gross_amount_paid**| Yes    | **Match.** Numeric. |
| **net_amount_paid**  | Yes    | **Match.** Numeric. |
| **created_at_api**   | Maybe  | **Match if present.** Timestamptz. |
| **updated_at_api**   | Maybe  | **Match if present.** Timestamptz. |
| **spot_id**          | Maybe  | **Match if present.** |
| **spot_name**        | Maybe  | **Match if present.** |
| **client_email**     | Maybe  | **Match if present.** |
| **client_first_name**| Maybe  | **Match if present.** Or derive from `client_name` (split). |
| **client_last_name** | Maybe  | **Match if present.** Or derive from `client_name` (split). |
| **client_phone**     | Maybe  | **Match if present.** |
| **raw_data**         | No     | **Calculated/Optional:** JSON object of full row for debugging; can be `{}` or omit. |
| **sync_batch_id**    | No     | **Calculated:** Set per import batch (e.g. one UUID per run) or null. |

**Not in table (dropped in migrations):** `purchase_id`, `experience_type` — if your CSV has these, do not map them to history; they are ignored.

---

## 2. arketa_classes (from reservations or separate export)

Target unique key: `(external_id, class_date)`.

Classes can be **derived from reservation rows** (distinct `class_id` + `class_date` + `class_name`) to “fill gaps,” or come from a separate classes export.

| Table column       | From reservations CSV? | Notes |
|--------------------|-------------------------|--------|
| **id**             | No                      | **Calculated:** Omit; DB generates UUID. |
| **external_id**    | Yes                     | **Match.** Use `class_id` from reservations as `external_id`. |
| **class_date**     | Yes                     | **Match.** Use `class_date` from reservations. |
| **name**           | Yes                     | **Match.** Use `class_name` from reservations (or "Unknown (from reservation)" if null). |
| **start_time**     | No                      | **Calculated.** Not in reservations CSV. Use e.g. `class_date + T00:00:00Z` for stubs, or infer from a classes export. |
| **duration_minutes**| No                      | **Calculated/Optional.** Not in reservations; default null or 60. |
| **capacity**       | No                      | **Calculated/Optional.** Not in reservations; default null. |
| **booked_count**   | Yes                     | **Calculated.** Count of reservation rows per (class_id, class_date). |
| **waitlist_count** | No                      | **Calculated.** Default 0. |
| **status**         | No                      | **Calculated.** Use e.g. `"stub_from_reservation"` for reservation-derived stubs. |
| **is_cancelled**   | No                      | **Calculated.** Default false. |
| **room_name**      | No                      | **Calculated/Optional.** Not in reservations; default null. |
| **instructor_name**| No                      | **Calculated/Optional.** Not in reservations; default null. |
| **description**    | No                      | **Calculated/Optional.** Default null. |
| **location_id**     | No                      | **Calculated/Optional.** Default null. |
| **location_name**  | No                      | **Calculated/Optional.** Default null. |
| **raw_data**       | No                      | **Calculated/Optional.** Default null or `{}`. |
| **synced_at**      | No                      | **Calculated.** Use e.g. `now()` or import timestamp. |
| **updated_at**     | No                      | **Calculated.** DB/default. |
| **updated_at_api** | No                      | **Calculated/Optional.** Default null. |
| **is_deleted**     | No                      | **Calculated.** Default false. |

So: from a **reservations-only CSV** you can fill **arketa_classes** with stub rows using `class_id` → `external_id`, `class_date`, `class_name` → `name`, and **calculated** `start_time` (e.g. midnight on `class_date`), `booked_count` (count of reservations per class), and defaults for the rest.

---

## 3. Summary: what matches vs what must be calculated

**arketa_reservations_history**

- **Direct match from CSV:** reservation_id, class_id, client_id, reservation_type, class_name, class_date, status, checked_in, checked_in_at, late_cancel, gross_amount_paid, net_amount_paid, created_at_api, updated_at_api, spot_id, spot_name, client_email, client_first_name, client_last_name, client_phone.
- **Not in CSV / calculated:** id (auto), raw_data (optional), sync_batch_id (batch UUID or null).
- **Do not map:** purchase_id, experience_type (columns no longer in the table).

**arketa_classes (when derived from reservations CSV)**

- **From CSV (reservations):** external_id ← class_id, class_date, name ← class_name.
- **Calculated:** start_time (e.g. class_date at midnight), booked_count (count reservations per class), status (e.g. "stub_from_reservation"), and defaults for duration_minutes, capacity, waitlist_count, is_cancelled, room_name, instructor_name, synced_at, etc.

If you have a **separate Arketa classes export CSV**, its columns may align with arketa_classes (external_id, class_date, name, start_time, duration_minutes, capacity, instructor_name, room_name, etc.); use the same date range filter and map those columns directly where names match.

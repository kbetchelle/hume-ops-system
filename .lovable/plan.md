

# Import Concierge Reports CSV into daily_report_history

## Overview
Import ~608 rows from the uploaded semicolon-delimited CSV into the `daily_report_history` table. Four currently unmapped CSV columns will be added as new columns to the table.

## Step 1: Database Migration -- Add 4 new columns

Add the following columns to `daily_report_history`:

| New Column | Type | Default | Source CSV Column |
|---|---|---|---|
| `meaningful_conversations` | `text` | `NULL` | `meaningful_conversations` |
| `tour_name` | `text` | `NULL` | `tour_name` |
| `notes_target_date` | `date` | `NULL` | `notes_target_date` |
| `notes_target_shift` | `text` | `NULL` | `notes_target_shift` |

```sql
ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS meaningful_conversations text,
  ADD COLUMN IF NOT EXISTS tour_name text,
  ADD COLUMN IF NOT EXISTS notes_target_date date,
  ADD COLUMN IF NOT EXISTS notes_target_shift text;
```

## Step 2: Update the Edge Function

Modify `import-concierge-reports-csv/index.ts` to map the 4 new fields in the `mapRow()` function:

- `meaningful_conversations` -- stored as plain text (not JSONB)
- `tour_name` -- stored as plain text
- `notes_target_date` -- parsed as a date (YYYY-MM-DD)
- `notes_target_shift` -- uppercase text (AM/PM)

Also update the error message at line 216 to remove "or staff_id" since `staff_user_id` is now nullable and not required.

## Step 3: Complete Field Mapping

| CSV Column | Table Column | Transformation |
|---|---|---|
| `id` | `id` | Direct UUID |
| `report_date` | `report_date` | Parse to YYYY-MM-DD |
| `shift_time` | `shift_type` | Uppercase (AM/PM) |
| `staff_id` | `staff_user_id` | Direct UUID (nullable) |
| `staff_name` | `staff_name` | Direct text |
| `notes_for_next_shift` | `future_shift_notes` | Text to JSONB array |
| `member_feedback` | `member_feedback` | Parse JSON or wrap as JSONB |
| `membership_cancel_requests` | `membership_requests` | Text to JSONB array |
| `meaningful_conversations` | `meaningful_conversations` | Direct text (NEW) |
| `tour_name` | `tour_name` | Direct text (NEW) |
| `tour_followup_completed` | `tour_followup_completed` | Parse boolean |
| `facility_issues` | `facility_issues` | Text to JSONB array |
| `busiest_areas` | `busiest_areas` | Direct text |
| `system_issues` | `system_issues` | Text to JSONB array |
| `management_notes` | `management_notes` | Direct text |
| `created_at` | `created_at` | Parse timestamp |
| `updated_at` | `updated_at` | Parse timestamp |
| `notes_target_date` | `notes_target_date` | Parse to YYYY-MM-DD (NEW) |
| `notes_target_shift` | `notes_target_shift` | Uppercase AM/PM (NEW) |

Dropped CSV columns: `created_by`, `arketa_screenshot_url`, `extracted_checkins`, `extracted_appointments`, `extracted_class_signups`, `resolved`, `extracted_class_details`, `extracted_appointment_details`.

## Step 4: Deploy and Run Import

1. Deploy the updated edge function
2. Read the uploaded CSV file and invoke the edge function with `overwriteExisting: true`
3. Duplicate `(report_date, shift_type)` pairs: last row wins via `ON CONFLICT DO UPDATE`
4. CSV `id` values are preserved as primary keys

## Technical Details
- The edge function processes in batches of 50 rows
- `status` defaults to `"submitted"` for all imported rows
- Empty JSONB fields default to `[]`
- The existing 4 rows in the table will be preserved (unless a CSV row has the same date+shift combo, in which case it overwrites)


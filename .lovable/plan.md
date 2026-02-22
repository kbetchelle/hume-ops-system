
# Import Concierge Reports CSV into daily_report_history

## Overview
Import ~608 rows from the uploaded CSV into the `daily_report_history` table, matching columns with appropriate transformations. When duplicate (report_date, shift_type) pairs exist, later rows overwrite earlier ones.

## Step 1: Database Migration -- Make staff_user_id nullable
Alter the `daily_report_history` table to allow NULL values for `staff_user_id`, since the CSV has no staff_id data.

```sql
ALTER TABLE public.daily_report_history ALTER COLUMN staff_user_id DROP NOT NULL;
```

## Step 2: Update the Edge Function
Modify `import-concierge-reports-csv` to no longer require `staff_id` -- skip the validation that rejects rows without it. The function already handles all the column mapping and transformations correctly:

| CSV Column | Table Column | Transformation |
|---|---|---|
| id | id | Direct (UUID) |
| report_date | report_date | Parse to YYYY-MM-DD |
| shift_time | shift_type | Uppercase (AM/PM) |
| staff_name | staff_name | Direct (text) |
| notes_for_next_shift | future_shift_notes | Text to JSONB array |
| member_feedback | member_feedback | Parse JSON or wrap as JSONB |
| membership_cancel_requests | membership_requests | Text to JSONB array |
| tour_followup_completed | tour_followup_completed | Parse boolean |
| facility_issues | facility_issues | Text to JSONB array |
| busiest_areas | busiest_areas | Direct (text) |
| system_issues | system_issues | Text to JSONB array |
| management_notes | management_notes | Direct (text) |
| created_at | created_at | Parse timestamp |
| updated_at | updated_at | Parse timestamp |

Skipped CSV columns (no matching table column): `meaningful_conversations`, `tour_name`, `created_by`, `arketa_screenshot_url`, `extracted_*`, `notes_target_date`, `notes_target_shift`, `resolved`.

## Step 3: Deploy and Run
1. Deploy the updated edge function
2. Read the CSV file content and invoke the edge function with `overwriteExisting: true`
3. The function processes in batches of 50, using `ON CONFLICT (report_date, shift_type) DO UPDATE` -- so duplicate date+shift pairs get overwritten by the last occurrence

## Technical Details
- The edge function's `mapRow()` function will be updated to allow `null` for `staff_user_id` instead of returning `null` (skipping) when it's missing
- Status will default to `"submitted"` for all imported rows
- JSONB fields that are empty strings will default to `[]`

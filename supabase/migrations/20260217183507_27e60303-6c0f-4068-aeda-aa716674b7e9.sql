-- No-op migration to force types.ts regeneration
-- The daily_reports table and lost_and_found_category enum already exist with all columns/values
-- This migration simply triggers the type generation pipeline
SELECT 1;
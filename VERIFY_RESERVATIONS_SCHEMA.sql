-- Verify that all new columns exist in arketa_reservations table
-- Run this in Supabase SQL Editor to confirm the schema is correct

-- Check if booking_id column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_reservations'
  AND column_name IN (
    'booking_id',
    'first_name',
    'last_name',
    'email_marketing_opt_in',
    'date_purchased',
    'purchase_id',
    'reservation_type',
    'class_name',
    'class_time',
    'instructor_name',
    'location_name',
    'location_address',
    'purchase_type',
    'gross_amount_paid',
    'net_amount_paid',
    'estimated_gross_revenue',
    'estimated_net_revenue',
    'coupon_code',
    'package_name',
    'package_period_start',
    'package_period_end',
    'offering_id',
    'payment_method',
    'payment_id',
    'service_id',
    'tags',
    'experience_type',
    'late_cancel',
    'canceled_at',
    'canceled_by',
    'milestone',
    'updated_at'
  )
ORDER BY column_name;

-- Count total columns (should be 31 new + original columns)
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_reservations';

-- Force PostgREST reload multiple times
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
SELECT pg_notify('pgrst', 'reload schema');

-- Test simple insert to verify columns work
-- (This will fail if columns don't exist)
DO $$
DECLARE
  test_id uuid;
BEGIN
  -- Try a test insert with all new columns
  INSERT INTO public.arketa_reservations (
    external_id,
    booking_id,
    first_name,
    last_name,
    email_marketing_opt_in,
    date_purchased,
    purchase_id,
    reservation_type,
    class_name,
    class_time,
    instructor_name,
    location_name,
    location_address,
    purchase_type,
    gross_amount_paid,
    net_amount_paid,
    estimated_gross_revenue,
    estimated_net_revenue,
    coupon_code,
    package_name,
    offering_id,
    payment_method,
    payment_id,
    service_id,
    tags,
    experience_type,
    late_cancel,
    milestone
  ) VALUES (
    'test_reservation_' || gen_random_uuid()::text,
    'test_booking_123',
    'John',
    'Doe',
    true,
    NOW(),
    'test_purchase_123',
    'class',
    'Test Class',
    NOW(),
    'Test Instructor',
    'Test Location',
    '123 Test St',
    'package',
    100.00,
    95.00,
    100.00,
    95.00,
    'TESTCODE',
    'Test Package',
    'offering_123',
    'card',
    'payment_123',
    'service_123',
    '{"tag1": "value1"}'::jsonb,
    'in-person',
    false,
    1
  )
  RETURNING id INTO test_id;
  
  -- Clean up test record
  DELETE FROM public.arketa_reservations WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: All columns exist and test insert worked!';
  RAISE NOTICE 'Test record ID was: %', test_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERROR: Test insert failed - %', SQLERRM;
END $$;

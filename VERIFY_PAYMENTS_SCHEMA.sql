-- DEFINITIVE TEST: Verify arketa_payments schema
-- Run this in Supabase SQL Editor

-- 1. Check which schema you're connected to
SELECT current_schema();

-- 2. List ALL columns in arketa_payments (public schema explicitly)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_payments'
ORDER BY ordinal_position;

-- 3. Count total columns (should be ~20+)
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_payments';

-- 4. Specifically check for the new columns
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='arketa_payments' AND column_name='amount_refunded') 
    THEN '✅ amount_refunded EXISTS'
    ELSE '❌ amount_refunded MISSING'
  END as amount_refunded_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='arketa_payments' AND column_name='currency') 
    THEN '✅ currency EXISTS'
    ELSE '❌ currency MISSING'
  END as currency_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='arketa_payments' AND column_name='description') 
    THEN '✅ description EXISTS'
    ELSE '❌ description MISSING'
  END as description_status;

-- 5. Try a simple insert/upsert test
INSERT INTO public.arketa_payments (
  external_id,
  amount,
  amount_refunded,
  currency,
  status
) VALUES (
  'test_verify_schema',
  100.00,
  0.00,
  'USD',
  'test'
)
ON CONFLICT (external_id)
DO UPDATE SET amount = EXCLUDED.amount
RETURNING external_id, amount, amount_refunded, currency;

-- 6. Cleanup
DELETE FROM public.arketa_payments WHERE external_id = 'test_verify_schema';

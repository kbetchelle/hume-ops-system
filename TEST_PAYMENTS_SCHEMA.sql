-- Verify arketa_payments columns and force a schema cache reload
-- Run this in Supabase SQL Editor to confirm columns exist

-- 1. Check all columns in arketa_payments
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'arketa_payments'
ORDER BY ordinal_position;

-- 2. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Test insert with new columns
INSERT INTO public.arketa_payments (
  external_id,
  client_id,
  amount,
  amount_refunded,
  currency,
  status,
  description,
  payment_type,
  source,
  location_name
) VALUES (
  'test_payment_123',
  'test_client',
  100.00,
  0.00,
  'USD',
  'succeeded',
  'Test payment',
  'stripe',
  'widget',
  'HUME'
)
ON CONFLICT (external_id) 
DO UPDATE SET
  amount = EXCLUDED.amount,
  updated_at = NOW();

-- 4. Verify test insert worked
SELECT * FROM public.arketa_payments WHERE external_id = 'test_payment_123';

-- 5. Clean up test record
DELETE FROM public.arketa_payments WHERE external_id = 'test_payment_123';

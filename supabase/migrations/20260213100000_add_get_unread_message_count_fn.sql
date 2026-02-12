-- Optimizes the unread message count query from two sequential queries
-- (N+1 pattern) into a single database function call.
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*)::integer
  FROM public.staff_messages m
  WHERE m.is_sent = true
    AND m.recipient_ids @> ARRAY[p_user_id]
    AND NOT EXISTS (
      SELECT 1
      FROM public.staff_message_reads r
      WHERE r.message_id = m.id
        AND r.staff_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
  RETURNS integer
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM staff_messages m
  WHERE m.is_sent = true
    AND m.sender_id != p_user_id
    AND (
      m.recipient_ids IS NULL
      OR p_user_id = ANY(m.recipient_ids)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM staff_message_reads r
      WHERE r.message_id = m.id
        AND r.staff_id = p_user_id
    );
$$;
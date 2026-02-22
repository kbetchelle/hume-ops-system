

# Fix: Phantom Unread Message Badge

## Problem
You're seeing a "1" unread badge but no unopened threads. The cause: the "Test Message" you sent to a group (that includes yourself as a recipient) is counted as unread because the database function doesn't exclude messages where you are the sender.

## Solution
Update the `get_unread_message_count` database function to exclude messages sent by the requesting user. Messages you send yourself should never count as "unread" for you.

## Technical Details

### 1. Database Migration
Alter the `get_unread_message_count` function to add a `AND m.sender_id != p_user_id` condition:

```sql
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
  RETURNS integer
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM staff_messages m
  WHERE m.is_sent = true
    AND m.sender_id != p_user_id          -- NEW: exclude own messages
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
```

### 2. Client-Side Consistency
Review the conversation list's `hasUnread` logic (in the conversation builder utilities) to also exclude self-sent messages from unread calculations, ensuring the badge and the conversation list stay in sync.

This is a one-line SQL change plus a minor client-side alignment -- no new tables or columns needed.


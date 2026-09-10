-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Chat Management & Auto-Disappearing Messages (7 days)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. RPC: clear_chat(p_conversation_id uuid)
-- Deletes all messages in a conversation. Only allowed for participants.
create or replace function public.clear_chat(p_conversation_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  -- Verify caller is a participant of the conversation
  if not exists (
    select 1 from public.conversations
    where id = p_conversation_id
      and (user_a = v_caller or user_b = v_caller)
  ) then
    return json_build_object('success', false, 'reason', 'Not authorized');
  end if;

  -- Delete all messages in the conversation
  delete from public.messages
  where conversation_id = p_conversation_id;

  return json_build_object('success', true);
end;
$$;

-- 2. RPC: delete_conversation(p_conversation_id uuid)
-- Deletes the conversation, all its messages (via ON DELETE CASCADE),
-- and the backing message_request record so neither party is stuck in 'accepted'.
create or replace function public.delete_conversation(p_conversation_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller  uuid := auth.uid();
  v_conv    public.conversations%rowtype;
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  select * into v_conv
  from public.conversations
  where id = p_conversation_id
    and (user_a = v_caller or user_b = v_caller);

  if not found then
    return json_build_object('success', false, 'reason', 'Conversation not found or not authorized');
  end if;

  -- Delete conversation (cascades to messages)
  delete from public.conversations
  where id = p_conversation_id;

  -- Also delete or reset the backing message request
  if v_conv.request_id is not null then
    delete from public.message_requests
    where id = v_conv.request_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- 3. Function & RPC: purge_expired_messages()
-- Automatically deletes messages older than 7 days (once a week cleanup)
create or replace function public.purge_expired_messages()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer;
begin
  delete from public.messages
  where created_at < now() - interval '7 days';

  get diagnostics v_deleted_count = row_count;

  return json_build_object('success', true, 'purged_count', v_deleted_count);
end;
$$;

-- 4. RPC: delete_single_message(p_message_id uuid)
-- Allows a sender to delete their own single message
create or replace function public.delete_single_message(p_message_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  delete from public.messages
  where id = p_message_id
    and sender_id = v_caller;

  return json_build_object('success', true);
end;
$$;

-- Delete policies
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'messages' and policyname = 'Senders can delete their own messages'
  ) then
    create policy "Senders can delete their own messages"
      on public.messages for delete
      using (auth.uid() = sender_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'messages' and policyname = 'Participants can delete messages in their conversation'
  ) then
    create policy "Participants can delete messages in their conversation"
      on public.messages for delete
      using (public.is_conversation_participant(conversation_id));
  end if;
end;
$$;

-- Permissions
grant execute on function public.clear_chat(uuid) to authenticated;
grant execute on function public.delete_conversation(uuid) to authenticated;
grant execute on function public.purge_expired_messages() to authenticated;
grant execute on function public.delete_single_message(uuid) to authenticated;

revoke execute on function public.clear_chat(uuid) from anon;
revoke execute on function public.delete_conversation(uuid) from anon;
revoke execute on function public.purge_expired_messages() from anon;
revoke execute on function public.delete_single_message(uuid) from anon;


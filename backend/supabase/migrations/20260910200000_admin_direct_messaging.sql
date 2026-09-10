-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Admin Direct Messaging
-- Allows main admin (hr@lexonit.com) and platform admins to start a conversation
-- with any student directly without requiring an accepted message request.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_start_conversation(p_student_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller        uuid := auth.uid();
  v_caller_email  text;
  v_caller_role   text;
  v_existing_conv uuid;
  v_req_id        uuid;
  v_conv_id       uuid;
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  if v_caller = p_student_id then
    return json_build_object('success', false, 'reason', 'Cannot message yourself');
  end if;

  -- Verify caller is root admin or admin
  select email, role into v_caller_email, v_caller_role from public.profiles where id = v_caller;
  if coalesce(v_caller_email, '') <> 'hr@lexonit.com' 
     and coalesce(v_caller_role, '') <> 'admin' then
    return json_build_object('success', false, 'reason', 'Only administrators can initiate direct conversations');
  end if;

  -- 1. Check if a conversation already exists
  select id into v_existing_conv
  from public.conversations
  where (user_a = v_caller and user_b = p_student_id)
     or (user_a = p_student_id and user_b = v_caller)
  limit 1;

  if v_existing_conv is not null then
    return json_build_object('success', true, 'conversation_id', v_existing_conv);
  end if;

  -- 2. Find or create a message request with status = 'accepted'
  select id into v_req_id
  from public.message_requests
  where (sender_id = v_caller and receiver_id = p_student_id)
     or (sender_id = p_student_id and receiver_id = v_caller)
  limit 1;

  if v_req_id is null then
    insert into public.message_requests (sender_id, receiver_id, status)
    values (v_caller, p_student_id, 'accepted')
    returning id into v_req_id;
  else
    update public.message_requests
    set status = 'accepted', updated_at = now()
    where id = v_req_id;
  end if;

  -- 3. Create the conversation
  insert into public.conversations (user_a, user_b, request_id)
  values (v_caller, p_student_id, v_req_id)
  on conflict do nothing
  returning id into v_conv_id;

  if v_conv_id is null then
    select id into v_conv_id
    from public.conversations
    where (user_a = v_caller and user_b = p_student_id)
       or (user_a = p_student_id and user_b = v_caller)
    limit 1;
  end if;

  return json_build_object('success', true, 'conversation_id', v_conv_id);
end;
$$;

grant execute on function public.admin_start_conversation(uuid) to authenticated;

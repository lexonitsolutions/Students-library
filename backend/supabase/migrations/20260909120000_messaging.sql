-- ─────────────────────────────────────────────────────────────────────────────
-- Messaging: message_requests, conversations, messages
-- ─────────────────────────────────────────────────────────────────────────────
-- Enum for request status
do $$ begin
  create type public.message_request_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: message_requests
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.message_requests (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status      public.message_request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- prevent duplicate active requests in the same direction
  constraint unique_active_request unique (sender_id, receiver_id)
);

create index if not exists idx_msg_req_receiver on public.message_requests(receiver_id, status);
create index if not exists idx_msg_req_sender   on public.message_requests(sender_id, status);

alter table public.message_requests enable row level security;

-- Sender can read their own outgoing requests
create policy "Sender can view own outgoing requests"
  on public.message_requests for select
  using (auth.uid() = sender_id);

-- Receiver can read their own incoming requests
create policy "Receiver can view own incoming requests"
  on public.message_requests for select
  using (auth.uid() = receiver_id);

-- Only authenticated users can insert (via RPC; direct insert blocked by check)
-- RPC functions are SECURITY DEFINER so they bypass RLS — direct client insert
-- is still blocked because sender_id must equal auth.uid()
create policy "Sender can insert own request"
  on public.message_requests for insert
  with check (auth.uid() = sender_id);

-- Sender can cancel their own pending request
create policy "Sender can delete own pending request"
  on public.message_requests for delete
  using (auth.uid() = sender_id and status = 'pending');

-- IMPORTANT: No UPDATE policy is exposed directly.
-- Status changes (accept/reject) MUST go through the RPC functions below.

-- Auto-update updated_at
create or replace function public.set_message_request_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_message_request_updated_at
  before update on public.message_requests
  for each row execute function public.set_message_request_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: conversations
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles(id) on delete cascade,
  user_b     uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.message_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_conversation unique (user_a, user_b),
  constraint unique_conversation_reverse unique (user_b, user_a),
  constraint no_self_conversation check (user_a <> user_b)
);

create index if not exists idx_conv_user_a on public.conversations(user_a);
create index if not exists idx_conv_user_b on public.conversations(user_b);

alter table public.conversations enable row level security;

-- Only participants can view the conversation
create policy "Participants can view conversation"
  on public.conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Conversations are created only via the RPC accept function (SECURITY DEFINER)
-- No direct INSERT from clients.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: messages
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) > 0 and char_length(body) <= 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index if not exists idx_messages_conv on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

-- Helper: verify the caller is a participant of a conversation AND the
-- backing message request is accepted. Used by both SELECT and INSERT policies.
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversations c
    join public.message_requests r on r.id = c.request_id
    where c.id = p_conversation_id
      and r.status = 'accepted'
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
  );
$$;

-- Only participants of an accepted conversation can read messages
create policy "Participants can read messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

-- Only a participant who is the sender can insert, AND the request must be accepted
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id)
  );

-- Participants can update read_at on messages sent to them
create policy "Participants can mark messages read"
  on public.messages for update
  using (
    public.is_conversation_participant(conversation_id)
    and sender_id <> auth.uid()
  )
  with check (
    public.is_conversation_participant(conversation_id)
    and sender_id <> auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: send_message_request
-- Called by sender to create a pending request.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.send_message_request(p_receiver_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_existing  public.message_requests%rowtype;
  v_new_req   public.message_requests%rowtype;
begin
  -- Must be authenticated
  if v_sender_id is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  -- Cannot message yourself
  if v_sender_id = p_receiver_id then
    return json_build_object('success', false, 'reason', 'Cannot send a request to yourself');
  end if;

  -- Check receiver exists
  if not exists (select 1 from public.profiles where id = p_receiver_id) then
    return json_build_object('success', false, 'reason', 'User not found');
  end if;

  -- Check for any existing request in either direction
  select * into v_existing
  from public.message_requests
  where (sender_id = v_sender_id and receiver_id = p_receiver_id)
     or (sender_id = p_receiver_id and receiver_id = v_sender_id)
  limit 1;

  if found then
    if v_existing.status = 'pending' then
      return json_build_object('success', false, 'reason', 'A pending request already exists', 'request_id', v_existing.id);
    end if;
    if v_existing.status = 'accepted' then
      return json_build_object('success', false, 'reason', 'You are already connected', 'request_id', v_existing.id);
    end if;
    if v_existing.status = 'rejected' then
      return json_build_object('success', false, 'reason', 'Your previous request was rejected');
    end if;
  end if;

  -- Insert the new request
  insert into public.message_requests (sender_id, receiver_id, status)
  values (v_sender_id, p_receiver_id, 'pending')
  returning * into v_new_req;

  return json_build_object('success', true, 'request_id', v_new_req.id);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: accept_message_request
-- Called ONLY by the receiver. Atomically accepts and creates a conversation.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.accept_message_request(p_request_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_req       public.message_requests%rowtype;
  v_conv_id   uuid;
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  select * into v_req from public.message_requests where id = p_request_id;

  if not found then
    return json_build_object('success', false, 'reason', 'Request not found');
  end if;

  -- CRITICAL: Only the receiver may accept
  if v_req.receiver_id <> v_caller then
    return json_build_object('success', false, 'reason', 'Not authorised');
  end if;

  if v_req.status <> 'pending' then
    return json_build_object('success', false, 'reason', 'Request is not pending', 'status', v_req.status);
  end if;

  -- Mark as accepted
  update public.message_requests
  set status = 'accepted', updated_at = now()
  where id = p_request_id;

  -- Create conversation (idempotent: if it already exists, just return it)
  insert into public.conversations (user_a, user_b, request_id)
  values (v_req.sender_id, v_req.receiver_id, p_request_id)
  on conflict do nothing
  returning id into v_conv_id;

  if v_conv_id is null then
    select id into v_conv_id from public.conversations
    where (user_a = v_req.sender_id and user_b = v_req.receiver_id)
       or (user_a = v_req.receiver_id and user_b = v_req.sender_id)
    limit 1;
  end if;

  return json_build_object('success', true, 'conversation_id', v_conv_id);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: reject_message_request
-- Called ONLY by the receiver.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.reject_message_request(p_request_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_req    public.message_requests%rowtype;
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  select * into v_req from public.message_requests where id = p_request_id;

  if not found then
    return json_build_object('success', false, 'reason', 'Request not found');
  end if;

  -- CRITICAL: Only the receiver may reject
  if v_req.receiver_id <> v_caller then
    return json_build_object('success', false, 'reason', 'Not authorised');
  end if;

  if v_req.status <> 'pending' then
    return json_build_object('success', false, 'reason', 'Request is not pending', 'status', v_req.status);
  end if;

  update public.message_requests
  set status = 'rejected', updated_at = now()
  where id = p_request_id;

  return json_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grant execute on RPCs to authenticated users only
-- ─────────────────────────────────────────────────────────────────────────────
grant execute on function public.send_message_request(uuid)    to authenticated;
grant execute on function public.accept_message_request(uuid)  to authenticated;
grant execute on function public.reject_message_request(uuid)  to authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

-- Revoke from anon
revoke execute on function public.send_message_request(uuid)    from anon;
revoke execute on function public.accept_message_request(uuid)  from anon;
revoke execute on function public.reject_message_request(uuid)  from anon;
revoke execute on function public.is_conversation_participant(uuid) from anon;

-- Profiles: one row per auth user. Holds everything from the "User accounts" /
-- "Admin information" rows of the data plan (name, email, phone, role, academic info).
create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  username text unique,
  email text,
  phone text,
  avatar_url text,
  university text,
  college text,
  branch text,
  major text,
  year text,
  semester text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security-definer helper so RLS policies can check "is this caller an admin"
-- without recursively re-evaluating the profiles RLS policy on itself.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

create policy "Profiles are viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Block privilege escalation: only an existing admin may change someone's role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Minimal public-facing profile info (uploader name/avatar shown across the app)
-- so we never expose email/phone to every visitor. View runs as its owner and
-- therefore bypasses the restrictive RLS policy above by design.
create view public.public_profiles as
  select id, name, username, avatar_url, university, college, branch, major
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Auto-provision a profile row whenever someone signs up via Supabase Auth
-- (email/password, Google OAuth, or OTP all funnel through auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Student'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

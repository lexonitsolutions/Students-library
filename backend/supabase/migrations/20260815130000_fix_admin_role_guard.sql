-- Bugfix: trg_protect_profile_role blocked *any* role change made outside
-- an authenticated PostgREST session (auth.uid() is null there) — including
-- trusted server-side changes like migrations, SQL Editor fixes, and the
-- admin_allowlist role-sync trigger added in ..._admin_workspace.sql. That
-- silently reverted the promotion of hr@lexonit.com to 'admin' if the
-- profile already existed (e.g. from testing) before its email landed in
-- admin_allowlist.
--
-- Fix: only block a role change made by an actual authenticated non-admin
-- user. A null auth.uid() means direct DB access, which is already fully
-- trusted (anyone with DB credentials could just disable the trigger).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin(auth.uid())
  then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Self-heal: re-promote the root admin now that the guard is fixed, in case
-- it got silently reverted by the bug above.
update public.profiles
set role = 'admin'
where lower(email) = 'hr@lexonit.com' and role <> 'admin';

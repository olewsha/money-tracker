-- Module 8: User roles (user/admin) and account blocking.
-- Run this in the Supabase SQL Editor AFTER migration 002.
--
-- IMPORTANT: at the very bottom of this file there is a single UPDATE
-- statement you MUST customise with your own email — that's how you
-- promote yourself to admin. Without it nobody can access /admin/**.

-- 1. profiles table — one row per auth.users row, holds role + block flag.
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'user' check (role in ('user', 'admin')),
  is_blocked  boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx  on public.profiles (role);

alter table public.profiles enable row level security;

-- 2. Trigger that auto-creates a profile whenever auth.users gets a new row.
--    Promotion to admin is intentionally NOT done here — see the manual
--    UPDATE at the end of this file. Keeps the trigger free of secrets.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill profiles for users that existed before this migration.
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 4. Helper: small SECURITY DEFINER function so RLS policies on profiles
--    can ask "is the current user an admin?" without running into
--    infinite recursion on the profiles table itself.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin' and is_blocked = false
  );
$$;

-- 5. RLS on profiles.
drop policy if exists "users read own profile"   on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "admins update profiles"   on public.profiles;

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- Only admins can change role / is_blocked. Insert / delete are handled
-- by the trigger + ON DELETE CASCADE from auth.users, so we don't grant
-- INSERT or DELETE policies to anyone.
create policy "admins update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 6. Tighten transactions policies: blocked users must not be able to
--    read or change anything. Drop the per-user policies from migration
--    002 and recreate them with the extra "not blocked" check.
drop policy if exists "users select own transactions" on public.transactions;
drop policy if exists "users insert own transactions" on public.transactions;
drop policy if exists "users update own transactions" on public.transactions;
drop policy if exists "users delete own transactions" on public.transactions;

create policy "users select own transactions"
  on public.transactions for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = false
    )
  );

create policy "users insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = false
    )
  );

create policy "users update own transactions"
  on public.transactions for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = false
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = false
    )
  );

create policy "users delete own transactions"
  on public.transactions for delete
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = false
    )
  );

-- 7. PROMOTE YOURSELF TO ADMIN.
-- Sign up at /register with your real email, then come back here and
-- run this with that email substituted in. This is intentionally manual
-- and not driven by env vars so credentials never leak into the DB.
--
--   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL@example.com';

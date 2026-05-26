-- Module 7: Add per-user ownership to transactions and tighten RLS.
-- Run this in the Supabase SQL Editor AFTER signing up at least one user.

-- 1. Add user_id column (nullable temporarily so the migration can run on an
--    existing table that already has rows).
alter table public.transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. The seed data from module 6 has no owner. Easiest path for a learning
--    project: wipe it and let users create their own. (If you want to keep it,
--    replace this with an UPDATE that sets user_id to your own auth.users.id.)
delete from public.transactions where user_id is null;

-- 3. Now we can require user_id and default it to the current session user, so
--    inserts that "forget" to set it still get the right owner.
alter table public.transactions
  alter column user_id set not null,
  alter column user_id set default auth.uid();

create index if not exists transactions_user_id_idx
  on public.transactions (user_id);

-- 4. Drop the permissive "allow all" policies from module 6.
drop policy if exists "Allow all SELECT" on public.transactions;
drop policy if exists "Allow all INSERT" on public.transactions;
drop policy if exists "Allow all UPDATE" on public.transactions;
drop policy if exists "Allow all DELETE" on public.transactions;

-- 5. Per-user policies: you can only touch rows where user_id = your auth.uid().
create policy "users select own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own transactions"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own transactions"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);

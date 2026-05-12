-- Run this in the Supabase SQL Editor to set up the database

create table if not exists public.transactions (
  id         bigint        generated always as identity primary key,
  amount     numeric(10,2) not null check (amount > 0),
  type       text          not null check (type in ('income', 'expense')),
  category   text          not null,
  description text,
  date       date          not null,
  created_at timestamptz   not null default now()
);

-- Enable Row Level Security
alter table public.transactions enable row level security;

-- Permissive policies for the learning project (Module 6)
-- Module 7 will add user authentication with auth.uid() = user_id
create policy "Allow all SELECT" on public.transactions
  for select using (true);

create policy "Allow all INSERT" on public.transactions
  for insert with check (true);

create policy "Allow all UPDATE" on public.transactions
  for update using (true);

create policy "Allow all DELETE" on public.transactions
  for delete using (true);

-- Seed test data
insert into public.transactions (amount, type, category, description, date) values
  (65000,  'income',  'Зарплата',      'Зарплата за апрель',    current_date - 10),
  (15000,  'income',  'Фриланс',       'Проект для клиента',    current_date - 7),
  (3200,   'expense', 'Еда',           'Продукты на неделю',    current_date - 5),
  (850,    'expense', 'Транспорт',     'Метро и автобус',       current_date - 3),
  (2500,   'expense', 'Развлечения',   'Кино и ресторан',       current_date - 1);

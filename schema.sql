-- CoLive House Manager – Supabase schema
-- Run this in the Supabase SQL Editor before starting the app.

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists roommates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique not null,
  avatar_url  text,
  created_at  timestamptz default now()
);

create table if not exists expenses (
  id             uuid primary key default gen_random_uuid(),
  amount         numeric(10, 2) not null,
  paid_by        uuid not null references roommates(id) on delete cascade,
  description    text not null,
  date           date not null default current_date,
  split_between  uuid[] not null
);

create table if not exists chores (
  id           uuid primary key default gen_random_uuid(),
  task_name    text not null,
  assigned_to  uuid not null references roommates(id) on delete cascade,
  completed    boolean not null default false,
  week         text not null   -- ISO week, e.g. "2025-W21"
);

-- ─── Row-level security (permissive for demo) ────────────────────────────────

alter table roommates enable row level security;
alter table expenses  enable row level security;
alter table chores    enable row level security;

create policy "anon_all" on roommates for all using (true) with check (true);
create policy "anon_all" on expenses  for all using (true) with check (true);
create policy "anon_all" on chores    for all using (true) with check (true);

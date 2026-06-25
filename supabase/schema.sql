-- ============================================================
--  PALLETTBILL — SUPABASE DATABASE SCHEMA
--  Paste this entire file into Supabase → SQL Editor → Run
--  This creates every table, index, and security policy.
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── USERS (managed by Supabase Auth, extended here) ──────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  company_name    text not null default 'PalletBill',
  address         text,
  phone           text,
  website         text,
  ein             text,
  plan            text not null default 'trial',   -- trial | starter | growth | pro
  trial_ends_at   timestamptz not null default (now() + interval '60 days'),
  stripe_customer_id text,
  stripe_account_id  text,   -- for Stripe Connect
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── CLIENTS ──────────────────────────────────────────────────
create table if not exists public.clients (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  contact_name    text,
  email           text,
  phone           text,
  address         text,
  city            text,
  tags            text[],
  notes           text,
  stage           text not null default 'Lead',    -- Lead|Contacted|Demo|Trial|Customer|Churned
  source          text,
  annual_value    numeric(10,2) default 0,
  next_follow_up  date,
  last_contact    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── INVOICES ─────────────────────────────────────────────────
create table if not exists public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  invoice_number  text not null,
  client_name     text not null,
  client_email    text,
  period_start    date,
  period_end      date,
  due_date        date,
  issue_date      date not null default current_date,
  subtotal        numeric(10,2) not null default 0,
  discount_pct    numeric(5,2) default 0,
  tax_pct         numeric(5,2) default 0,
  total           numeric(10,2) not null default 0,
  currency        text not null default 'USD',
  status          text not null default 'draft',   -- draft|sent|viewed|paid|overdue|partial
  payment_link_url text,
  payment_token   text,
  stripe_payment_link_id text,
  stripe_payment_intent_id text,
  paid_at         timestamptz,
  notes           text,
  terms           text,
  payment_instructions text,
  internal_notes  text,
  line_items      jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, invoice_number)
);

-- ── ACTIVITIES (CRM activity feed) ───────────────────────────
create table if not exists public.activities (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  type            text not null,   -- email|call|note|meeting|demo|follow_up
  text            text not null,
  activity_date   date not null default current_date,
  created_by      text default 'owner',
  created_at      timestamptz not null default now()
);

-- ── RATE CARDS ───────────────────────────────────────────────
create table if not exists public.rate_cards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  pallet_storage  numeric(8,2) default 18.00,
  bin_storage     numeric(8,2) default 4.50,
  floor_storage   numeric(8,2) default 0.45,
  monthly_min     numeric(8,2) default 250.00,
  inbound_unit    numeric(8,2) default 0.45,
  outbound_unit   numeric(8,2) default 0.45,
  inbound_pallet  numeric(8,2) default 12.00,
  outbound_pallet numeric(8,2) default 12.00,
  hazmat          numeric(8,2) default 85.00,
  repackaging     numeric(8,2) default 35.00,
  refused         numeric(8,2) default 65.00,
  after_hours     numeric(8,2) default 95.00,
  returns         numeric(8,2) default 2.50,
  kitting         numeric(8,2) default 0.75,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id)
);

-- ── SIGNUPS (beta waitlist) ───────────────────────────────────
create table if not exists public.signups (
  id              uuid primary key default uuid_generate_v4(),
  email           text not null unique,
  company         text,
  source          text default 'landing-page',
  status          text not null default 'waitlist',  -- waitlist|trial|converted|churned
  notes           text,
  created_at      timestamptz not null default now()
);

-- ── SUPPORT NOTES (admin only) ────────────────────────────────
create table if not exists public.support_notes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  admin_email     text not null,
  note            text not null,
  created_at      timestamptz not null default now()
);

-- ── PAYMENT TOKENS (secure portal access) ────────────────────
create table if not exists public.payment_tokens (
  id              uuid primary key default uuid_generate_v4(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  token           text not null unique,
  client_email    text not null,
  expires_at      timestamptz not null default (now() + interval '30 days'),
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_clients_user_id      on public.clients(user_id);
create index if not exists idx_clients_stage        on public.clients(stage);
create index if not exists idx_invoices_user_id     on public.invoices(user_id);
create index if not exists idx_invoices_status      on public.invoices(status);
create index if not exists idx_invoices_due_date    on public.invoices(due_date);
create index if not exists idx_activities_client_id on public.activities(client_id);
create index if not exists idx_activities_user_id   on public.activities(user_id);
create index if not exists idx_payment_tokens_token on public.payment_tokens(token);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Users can only see their own data. Admin sees everything.
alter table public.profiles    enable row level security;
alter table public.clients     enable row level security;
alter table public.invoices    enable row level security;
alter table public.activities  enable row level security;
alter table public.rate_cards  enable row level security;
alter table public.signups     enable row level security;
alter table public.support_notes enable row level security;
alter table public.payment_tokens enable row level security;

-- Profiles: users see their own, admin sees all
drop policy if exists "users_own_profile" on public.profiles;
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id);

drop policy if exists "admin_all_profiles" on public.profiles;
create policy "admin_all_profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Clients: user owns their own
drop policy if exists "users_own_clients" on public.clients;
create policy "users_own_clients" on public.clients
  for all using (auth.uid() = user_id);

drop policy if exists "admin_all_clients" on public.clients;
create policy "admin_all_clients" on public.clients
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Invoices: user owns their own
drop policy if exists "users_own_invoices" on public.invoices;
create policy "users_own_invoices" on public.invoices
  for all using (auth.uid() = user_id);

drop policy if exists "admin_all_invoices" on public.invoices;
create policy "admin_all_invoices" on public.invoices
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Activities
drop policy if exists "users_own_activities" on public.activities;
create policy "users_own_activities" on public.activities
  for all using (auth.uid() = user_id);

drop policy if exists "admin_all_activities" on public.activities;
create policy "admin_all_activities" on public.activities
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Rate cards
drop policy if exists "users_own_rate_card" on public.rate_cards;
create policy "users_own_rate_card" on public.rate_cards
  for all using (auth.uid() = user_id);

-- Signups: admin only
drop policy if exists "admin_signups" on public.signups;
create policy "admin_signups" on public.signups
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Support notes: admin only
drop policy if exists "admin_support_notes" on public.support_notes;
create policy "admin_support_notes" on public.support_notes
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Payment tokens: readable by anyone with the token (for portal), writable by owner
drop policy if exists "payment_tokens_select" on public.payment_tokens;
create policy "payment_tokens_select" on public.payment_tokens
  for select using (true);

drop policy if exists "payment_tokens_insert" on public.payment_tokens;
create policy "payment_tokens_insert" on public.payment_tokens
  for insert with check (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );

-- ── AUTO-UPDATE updated_at ────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
  before update on public.clients
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_invoices on public.invoices;
create trigger set_updated_at_invoices
  before update on public.invoices
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_rate_cards on public.rate_cards;
create trigger set_updated_at_rate_cards
  before update on public.rate_cards
  for each row execute function public.handle_updated_at();

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, company_name)
  values (new.id, new.email, 'PalletBill');

  insert into public.rate_cards (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── MAKE JOSE ADMIN ──────────────────────────────────────────
-- Run this AFTER you sign up with jose.i.chavira.jr@gmail.com
-- update public.profiles set is_admin = true
-- where email = 'jose.i.chavira.jr@gmail.com';

-- ============================================================
--  DONE. Your database is ready.
--  Next: copy your Supabase URL and anon key into your .env
-- ============================================================

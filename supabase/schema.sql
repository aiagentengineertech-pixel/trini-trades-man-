-- ============================================================
-- Trini Tradesman — Database Schema (Supabase / Postgres)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is idempotent-ish: safe to read top-to-bottom on a fresh project.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('customer', 'tradesman', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('open', 'hired', 'in_progress', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bid_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type escrow_status as enum ('held', 'released', 'refunded');
exception when duplicate_object then null; end $$;

-- ============================================================
-- profiles — extends Supabase auth.users (1:1)
-- A row is created automatically on signup via the trigger below.
-- ============================================================
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  photo_url    text,
  role         user_role not null default 'customer',
  -- coarse location for "near you" (lat/lng); refine later with PostGIS if needed
  location_lat double precision,
  location_lng double precision,
  area         text,                 -- e.g. "Port of Spain"
  verified     boolean not null default false,  -- ID-checked by admin
  rating_avg   numeric(2,1) not null default 0, -- 0.0 .. 5.0
  rating_count integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- trades — the catalog of services (Electrician, Plumber, Mason…)
-- ============================================================
create table if not exists trades (
  id   uuid primary key default uuid_generate_v4(),
  name text unique not null,
  icon text                          -- icon name/key used by the app
);

-- ============================================================
-- tradesman_info — extra profile data for the pro side
-- ============================================================
create table if not exists tradesman_info (
  user_id          uuid primary key references profiles(id) on delete cascade,
  bio              text,
  years_experience integer,
  service_radius_km integer not null default 25,
  id_doc_url       text,             -- uploaded ID for verification
  created_at       timestamptz not null default now()
);

-- which trades a tradesman offers (many-to-many)
create table if not exists tradesman_trades (
  user_id  uuid references profiles(id) on delete cascade,
  trade_id uuid references trades(id) on delete cascade,
  primary key (user_id, trade_id)
);

-- ============================================================
-- jobs — a customer's posted job
-- ============================================================
create table if not exists jobs (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references profiles(id) on delete cascade,
  trade_id     uuid references trades(id),
  title        text not null,
  description  text,
  photos       text[] not null default '{}',
  location_lat double precision,
  location_lng double precision,
  area         text,
  budget_min   numeric(10,2),
  budget_max   numeric(10,2),
  status       job_status not null default 'open',
  created_at   timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_trade_idx  on jobs(trade_id);

-- ============================================================
-- bids — a tradesman's offer on a job
-- ============================================================
create table if not exists bids (
  id           uuid primary key default uuid_generate_v4(),
  job_id       uuid not null references jobs(id) on delete cascade,
  tradesman_id uuid not null references profiles(id) on delete cascade,
  amount       numeric(10,2) not null,
  message      text,
  status       bid_status not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (job_id, tradesman_id)      -- one bid per pro per job
);
create index if not exists bids_job_idx on bids(job_id);

-- ============================================================
-- hires — the accepted bid + payment/escrow record
-- ============================================================
create table if not exists hires (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references jobs(id) on delete cascade,
  bid_id        uuid not null references bids(id) on delete cascade,
  amount        numeric(10,2) not null,
  commission    numeric(10,2) not null default 0,
  escrow_state  escrow_status not null default 'held',
  payment_ref   text,              -- WiPay transaction_id
  created_at    timestamptz not null default now()
);

-- ============================================================
-- conversations — a chat thread between a customer and a tradesman.
-- Optionally tied to a job (job_id null = a general enquiry).
-- ============================================================
create table if not exists conversations (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references profiles(id) on delete cascade,
  tradesman_id uuid not null references profiles(id) on delete cascade,
  job_id       uuid references jobs(id) on delete set null,
  last_message text,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (customer_id, tradesman_id, job_id)
);
create index if not exists conversations_customer_idx on conversations(customer_id);
create index if not exists conversations_tradesman_idx on conversations(tradesman_id);

-- ============================================================
-- messages — individual chat messages within a conversation
-- ============================================================
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  read            boolean not null default false,
  sent_at         timestamptz not null default now()
);
create index if not exists messages_conversation_idx on messages(conversation_id, sent_at);

-- ============================================================
-- reviews — left after a job completes
-- ============================================================
create table if not exists reviews (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references jobs(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  stars       integer not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (job_id, reviewer_id)
);

-- ============================================================
-- notifications — per-user activity feed (new bid, hired, message…)
-- ============================================================
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,            -- 'bid' | 'hired' | 'message' | 'review' | 'system'
  title      text not null,
  body       text,
  job_id     uuid references jobs(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

-- ============================================================
-- Trigger: auto-create a profile row when a user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row Level Security (RLS)
-- Supabase exposes tables over the API, so RLS is REQUIRED for safety.
-- ============================================================
alter table profiles        enable row level security;
alter table tradesman_info  enable row level security;
alter table tradesman_trades enable row level security;
alter table jobs            enable row level security;
alter table bids            enable row level security;
alter table hires           enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table reviews         enable row level security;
alter table notifications   enable row level security;
alter table trades          enable row level security;

-- trades: readable by everyone, writable by no one (seed via SQL/admin)
drop policy if exists "trades readable" on trades;
create policy "trades readable" on trades for select using (true);

-- profiles: anyone can read (you browse pros); you can only edit your own
drop policy if exists "profiles readable" on profiles;
create policy "profiles readable" on profiles for select using (true);
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update using (auth.uid() = id);

-- tradesman_info / trades: readable by all; writable by the owner
drop policy if exists "tinfo readable" on tradesman_info;
create policy "tinfo readable" on tradesman_info for select using (true);
drop policy if exists "tinfo write own" on tradesman_info;
create policy "tinfo write own" on tradesman_info for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ttrades readable" on tradesman_trades;
create policy "ttrades readable" on tradesman_trades for select using (true);
drop policy if exists "ttrades write own" on tradesman_trades;
create policy "ttrades write own" on tradesman_trades for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- jobs: open jobs readable by all; customer manages their own
drop policy if exists "jobs readable" on jobs;
create policy "jobs readable" on jobs for select using (true);
drop policy if exists "jobs insert own" on jobs;
create policy "jobs insert own" on jobs for insert with check (auth.uid() = customer_id);
drop policy if exists "jobs update own" on jobs;
create policy "jobs update own" on jobs for update using (auth.uid() = customer_id);

-- bids: the job's customer and the bidding pro can see them; pro creates own
drop policy if exists "bids readable to parties" on bids;
create policy "bids readable to parties" on bids for select using (
  auth.uid() = tradesman_id
  or auth.uid() = (select customer_id from jobs where jobs.id = bids.job_id)
);
drop policy if exists "bids insert own" on bids;
create policy "bids insert own" on bids for insert with check (auth.uid() = tradesman_id);
drop policy if exists "bids update own" on bids;
create policy "bids update own" on bids for update using (auth.uid() = tradesman_id);

-- conversations: visible to (and creatable by) the two parties
drop policy if exists "conversations readable to parties" on conversations;
create policy "conversations readable to parties" on conversations for select using (
  auth.uid() = customer_id or auth.uid() = tradesman_id
);
drop policy if exists "conversations insert party" on conversations;
create policy "conversations insert party" on conversations for insert with check (
  auth.uid() = customer_id or auth.uid() = tradesman_id
);
drop policy if exists "conversations update party" on conversations;
create policy "conversations update party" on conversations for update using (
  auth.uid() = customer_id or auth.uid() = tradesman_id
);

-- messages: only the two parties on the conversation can read/send
drop policy if exists "messages readable to parties" on messages;
create policy "messages readable to parties" on messages for select using (
  auth.uid() in (
    select customer_id from conversations where conversations.id = messages.conversation_id
    union
    select tradesman_id from conversations where conversations.id = messages.conversation_id
  )
);
drop policy if exists "messages insert own" on messages;
create policy "messages insert own" on messages for insert with check (auth.uid() = sender_id);

-- notifications: each user sees and updates only their own
drop policy if exists "notifications own" on notifications;
create policy "notifications own" on notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications update own" on notifications;
create policy "notifications update own" on notifications for update using (auth.uid() = user_id);

-- reviews: readable by all; you write your own
drop policy if exists "reviews readable" on reviews;
create policy "reviews readable" on reviews for select using (true);
drop policy if exists "reviews insert own" on reviews;
create policy "reviews insert own" on reviews for insert with check (auth.uid() = reviewer_id);

-- hires: visible to the two parties (kept simple for MVP)
drop policy if exists "hires readable to parties" on hires;
create policy "hires readable to parties" on hires for select using (
  auth.uid() = (select customer_id from jobs where jobs.id = hires.job_id)
  or auth.uid() = (select tradesman_id from bids where bids.id = hires.bid_id)
);

-- ============================================================
-- Seed: the trade catalog shown on the home screen
-- ============================================================
insert into trades (name, icon) values
  ('Electrician', 'flash'),
  ('Plumbing',    'water'),
  ('AC Repair',   'snow'),
  ('Carpentry',   'hammer'),
  ('Painting',    'color-fill'),
  ('Masonry',     'cube')
on conflict (name) do nothing;

-- ============================================================
-- accept_bid(p_bid_id): a customer accepts a quote on their own job.
-- security definer so it can update bids/job atomically, with an
-- ownership check so only the job's customer can call it.
-- ============================================================
create or replace function accept_bid(p_bid_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_job uuid;
  v_customer uuid;
begin
  select job_id into v_job from bids where id = p_bid_id;
  if v_job is null then raise exception 'bid not found'; end if;
  select customer_id into v_customer from jobs where id = v_job;
  if v_customer is distinct from auth.uid() then
    raise exception 'only the job owner can accept a bid';
  end if;
  update bids set status = 'accepted' where id = p_bid_id;
  update bids set status = 'rejected' where job_id = v_job and id <> p_bid_id;
  update jobs set status = 'hired' where id = v_job;
end;
$$;

-- ============================================================
-- portfolio — a tradesman's showcase projects (before/after photos)
-- ============================================================
create table if not exists portfolio (
  id           uuid primary key default uuid_generate_v4(),
  tradesman_id uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  value        numeric(10,2),
  before_url   text,
  after_url    text,
  created_at   timestamptz not null default now()
);
create index if not exists portfolio_tradesman_idx on portfolio(tradesman_id, created_at desc);
alter table portfolio enable row level security;
drop policy if exists "portfolio readable" on portfolio;
create policy "portfolio readable" on portfolio for select using (true);
drop policy if exists "portfolio write own" on portfolio;
create policy "portfolio write own" on portfolio for all
  using (auth.uid() = tradesman_id) with check (auth.uid() = tradesman_id);

-- ============================================================
-- payout_accounts — where a tradesman receives their money (private)
-- ============================================================
create table if not exists payout_accounts (
  user_id        uuid primary key references profiles(id) on delete cascade,
  method         text not null default 'bank',  -- 'bank' | 'wipay'
  bank_name      text,
  account_number text,
  account_holder text,
  wipay_number   text,
  updated_at     timestamptz not null default now()
);
alter table payout_accounts enable row level security;
drop policy if exists "payout own" on payout_accounts;
create policy "payout own" on payout_accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage buckets + policies (photos & ID documents)
-- ============================================================
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('verification', 'verification', false) on conflict (id) do nothing;

-- 'uploads' (public): anyone can read; signed-in users can write
drop policy if exists "uploads read" on storage.objects;
create policy "uploads read" on storage.objects for select using (bucket_id = 'uploads');
drop policy if exists "uploads insert" on storage.objects;
create policy "uploads insert" on storage.objects for insert to authenticated with check (bucket_id = 'uploads');
drop policy if exists "uploads update" on storage.objects;
create policy "uploads update" on storage.objects for update to authenticated using (bucket_id = 'uploads');

-- 'verification' (private): each user can only read/write their own folder
drop policy if exists "verif insert own" on storage.objects;
create policy "verif insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "verif read own" on storage.objects;
create policy "verif read own" on storage.objects for select to authenticated
  using (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);

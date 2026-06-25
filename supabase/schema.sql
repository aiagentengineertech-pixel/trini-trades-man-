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
  -- subscription / premium tier (Phase 1)
  is_premium        boolean not null default false,
  subscription_tier text not null default 'free',   -- 'free' | 'premium'
  premium_until     timestamptz,
  created_at   timestamptz not null default now()
);

-- For existing databases: add the subscription columns if missing.
alter table profiles add column if not exists is_premium boolean not null default false;
alter table profiles add column if not exists subscription_tier text not null default 'free';
alter table profiles add column if not exists premium_until timestamptz;
-- Tradesman cover/branding banner shown on their public profile.
alter table profiles add column if not exists banner_url text;

-- is_premium(): does the current user have an active premium subscription?
-- security definer so paywall policies can call it without extra grants.
create or replace function is_premium()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select is_premium and (premium_until is null or premium_until > now())
       from profiles where id = auth.uid()),
    false);
$$;
grant execute on function is_premium() to authenticated;

-- ============================================================
-- Super-Admin Command Console (standalone ops site).
-- Adds the SUPER_ADMIN role, an operational region, a global feature-gate
-- table, and an is_super_admin() helper. The admin role is enforced in the
-- standalone admin server (service-role) AND available to RLS here.
-- ============================================================
-- Add 'super_admin' to the role enum (run on its own; safe to re-run).
alter type user_role add value if not exists 'super_admin';

-- Operational region (e.g. "San Fernando", "Arima", "Port of Spain").
alter table profiles add column if not exists region text;

create or replace function is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select role = 'super_admin' from profiles where id = auth.uid()), false);
$$;
grant execute on function is_super_admin() to authenticated;

-- Account suspension flag (set by admins; login is also blocked via auth ban).
alter table profiles add column if not exists suspended boolean not null default false;

-- Audit log of every admin action (who did what, when).
create table if not exists admin_actions (
  id         uuid primary key default uuid_generate_v4(),
  admin_id   uuid references profiles(id) on delete set null,
  action     text not null,
  target_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_actions_idx on admin_actions(created_at desc);
alter table admin_actions enable row level security;
drop policy if exists "admin actions super" on admin_actions;
create policy "admin actions super" on admin_actions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Global feature gates the admin can toggle at will.
create table if not exists feature_gates (
  key        text primary key,           -- e.g. 'invoices', 'crm', 'dispatch'
  enabled    boolean not null default true,
  note       text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);
-- Friendly metadata so the admin console can show readable names + grouping.
alter table feature_gates add column if not exists label    text;
alter table feature_gates add column if not exists category text;
alter table feature_gates enable row level security;
drop policy if exists "gates readable" on feature_gates;
create policy "gates readable" on feature_gates for select to authenticated using (true);
drop policy if exists "gates admin write" on feature_gates;
create policy "gates admin write" on feature_gates for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Seed the full catalog of feature gates (remote kill-switches, default ON).
-- on conflict updates the label/category/note metadata but never the enabled
-- state, so re-running this never re-enables something an admin switched off.
insert into feature_gates (key, label, category, note) values
  ('business_suite',    'Business suite',        'Business suite', 'Master switch for the premium tradesman business tools'),
  ('crm',               'Clients & CRM',         'Business suite', 'Client hub / customer relationship management'),
  ('invoices',          'Quotes & invoices',     'Business suite', 'Estimates, quotes and billing'),
  ('expenses',          'Expenses & profit',     'Business suite', 'Expense tracking and the profit view'),
  ('catalog',           'Price book',            'Business suite', 'Saved services & materials catalogue'),
  ('team',              'Team accounts',         'Business suite', 'Staff members and roles'),
  ('dispatch',          'Dispatch & scheduling', 'Business suite', 'Assign and schedule the team'),
  ('post_jobs',         'Post a job',            'Marketplace',    'Customers creating new job requests'),
  ('bidding',           'Quotes / bidding',      'Marketplace',    'Tradesmen submitting quotes on jobs'),
  ('hiring',            'Hiring',                'Marketplace',    'Accepting a quote and hiring a tradesman'),
  ('messaging',         'In-app messaging',      'Marketplace',    'Chat between customers and tradesmen'),
  ('reviews',           'Ratings & reviews',     'Marketplace',    'Leaving and displaying reviews'),
  ('portfolio',         'Portfolio',             'Marketplace',    'Tradesman before/after showcase'),
  ('custom_trades',     'Add-your-own trades',   'Marketplace',    'Let tradesmen add their own trade/skill'),
  ('ai_quote',          'AI quote assistant',    'Marketplace',    'AI-assisted quote / job description helper'),
  ('payments',          'Card payments',         'Payments',       'Checkout and payment processing'),
  ('payouts',           'Payouts',               'Payments',       'Tradesman withdrawals / payouts'),
  ('wallet',            'Wallet',                'Payments',       'In-app balance and wallet'),
  ('push_notifications','Push notifications',    'Growth & comms', 'Device push notifications'),
  ('promotions',        'Promotions & offers',   'Growth & comms', 'Promotional banners and offers'),
  ('referrals',         'Referral program',      'Growth & comms', 'Invite-a-friend referral rewards'),
  ('broadcasts',        'Admin broadcasts',      'Growth & comms', 'Send broadcast messages to users'),
  ('new_signups',       'New sign-ups',          'Access',         'Allow creating new accounts'),
  ('tradesman_signups', 'Tradesman sign-ups',    'Access',         'Allow new accounts to become tradesmen'),
  ('verification',      'ID verification',       'Access',         'Government-ID verification flow')
on conflict (key) do update
  set label = excluded.label, category = excluded.category, note = excluded.note;

-- ============================================================
-- trades — the catalog of services (Electrician, Plumber, Mason…)
-- ============================================================
create table if not exists trades (
  id   uuid primary key default uuid_generate_v4(),
  name text unique not null,
  icon text                          -- icon name/key used by the app
);

-- Custom trades added by tradesmen (freelancer-style "add your own skill").
-- is_custom lets the admin console review/merge user-generated trades.
alter table trades add column if not exists is_custom  boolean not null default false;
alter table trades add column if not exists created_by uuid references profiles(id) on delete set null;

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
  invited_pro_id uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_trade_idx  on jobs(trade_id);
create index if not exists jobs_invited_idx on jobs(invited_pro_id);

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
  ('Masonry',     'cube'),
  ('Landscaping', 'leaf'),
  ('Powerwashing','water'),
  ('Roofing',     'home'),
  ('Tiling',      'grid'),
  ('Welding',     'flame'),
  ('Appliance Repair', 'hardware-chip'),
  ('Pest Control','bug'),
  ('Cleaning',    'sparkles'),
  ('Handyman',    'build'),
  ('CAD / Drafting','pencil'),
  ('Auto Mechanic','car-sport'),
  ('Aluminium & Glass','square')
on conflict (name) do nothing;

-- ============================================================
-- add_trade(p_name): lets a tradesman add their own trade/skill.
-- The trades table is read-only to clients (seeded by SQL/admin), so this
-- security-definer function is the only way the app can create one. It
-- de-dupes case-insensitively and reuses an existing trade when it matches,
-- so "welding" doesn't create a second "Welding".
-- ============================================================
create or replace function public.add_trade(p_name text)
returns trades
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text := nullif(btrim(p_name), '');
  v_row  trades;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to add a trade';
  end if;
  if v_name is null then
    raise exception 'trade name required';
  end if;
  v_name := left(v_name, 40);
  -- reuse an existing trade if one already matches (case-insensitive)
  select * into v_row from trades where lower(name) = lower(v_name) limit 1;
  if found then
    return v_row;
  end if;
  insert into trades (name, icon, is_custom, created_by)
  values (v_name, 'briefcase', true, auth.uid())
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.add_trade(text) from public;
grant execute on function public.add_trade(text) to authenticated;

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
-- complete_job(p_job_id): the customer confirms the work is done. Moves the
-- job hired -> done and releases any escrow record. Ownership-checked.
-- ============================================================
create or replace function complete_job(p_job_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer uuid;
begin
  select customer_id into v_customer from jobs where id = p_job_id;
  if v_customer is distinct from auth.uid() then
    raise exception 'only the job owner can complete the job';
  end if;
  update jobs set status = 'done' where id = p_job_id and status = 'hired';
  update hires set escrow_state = 'released' where job_id = p_job_id;
end;
$$;
grant execute on function complete_job(uuid) to authenticated;

-- ============================================================
-- profile_views: lightweight view log so a pro's Analytics can show real
-- profile-view counts.
-- ============================================================
create table if not exists profile_views (
  id         uuid primary key default uuid_generate_v4(),
  pro_id     uuid not null references profiles(id) on delete cascade,
  viewer_id  uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists profile_views_pro_idx on profile_views(pro_id, created_at desc);
alter table profile_views enable row level security;
drop policy if exists "pv insert" on profile_views;
create policy "pv insert" on profile_views for insert to authenticated with check (true);
drop policy if exists "pv read own" on profile_views;
create policy "pv read own" on profile_views for select using (auth.uid() = pro_id);

-- ============================================================
-- get_pro_stats(p_pro_id): real, aggregate-only stats for a public
-- tradesman profile. security definer so a viewer (who can't read the
-- pro's private bids/messages under RLS) still gets the computed numbers,
-- without exposing any row-level private data.
-- ============================================================
create or replace function get_pro_stats(p_pro_id uuid)
returns json
language sql
security definer set search_path = public
as $$
  with hires_cte as (
    select j.id as job_id, j.customer_id, j.status
    from bids b join jobs j on j.id = b.job_id
    where b.tradesman_id = p_pro_id and b.status = 'accepted'
  ),
  convs as (
    select
      (select min(m.sent_at) from messages m where m.conversation_id = c.id and m.sender_id <> p_pro_id) as first_in,
      (select min(m.sent_at) from messages m where m.conversation_id = c.id and m.sender_id  = p_pro_id) as first_pro
    from conversations c
    where c.tradesman_id = p_pro_id
  ),
  resp as (
    select
      count(*) as total_conv,
      count(*) filter (where first_pro is not null) as replied_conv,
      avg(extract(epoch from (first_pro - first_in)) / 60.0)
        filter (where first_pro is not null and first_in is not null and first_pro >= first_in) as avg_min
    from convs
  ),
  cust as (
    select customer_id, count(*) as n from hires_cte group by customer_id
  )
  select json_build_object(
    'years_experience', (select years_experience from tradesman_info where user_id = p_pro_id),
    'service_radius_km', coalesce((select service_radius_km from tradesman_info where user_id = p_pro_id), 25),
    'member_since', (select extract(year from created_at)::int from profiles where id = p_pro_id),
    'jobs_done', (select count(*) from hires_cte where status = 'done'),
    'hired_count', (select count(*) from hires_cte),
    'completion_rate', (select case when count(*) > 0 then round(100.0 * count(*) filter (where status = 'done') / count(*)) end from hires_cte),
    'response_rate', (select case when total_conv > 0 then round(100.0 * replied_conv / total_conv) end from resp),
    'avg_response_mins', (select round(avg_min) from resp),
    'repeat_rate', (select case when count(*) > 0 then round(100.0 * count(*) filter (where n > 1) / count(*)) end from cust),
    'rating_avg', (select rating_avg from profiles where id = p_pro_id),
    'rating_count', (select rating_count from profiles where id = p_pro_id)
  );
$$;
grant execute on function get_pro_stats(uuid) to anon, authenticated;

-- ============================================================
-- team_members — a tradesman business (the owner) and its employees.
-- Two roles only: 'owner' (the account holder) and 'employee'.
-- Employees are invited by email; they accept once logged in with that email.
-- ============================================================
do $$ begin
  create type team_role as enum ('owner', 'employee');
exception when duplicate_object then null; end $$;

create table if not exists team_members (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles(id) on delete cascade, -- the business
  member_id  uuid references profiles(id) on delete set null,         -- the employee once joined
  email      text not null,                                           -- invited email
  name       text,                                                    -- owner-provided display name
  role       team_role not null default 'employee',
  status     text not null default 'invited',                         -- 'invited' | 'active' | 'removed'
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);
create index if not exists team_owner_idx  on team_members(owner_id);
create index if not exists team_member_idx on team_members(member_id);
create index if not exists team_email_idx  on team_members(lower(email));
alter table team_members enable row level security;

-- owner manages their own roster. Inviting (insert) is a PREMIUM feature;
-- reading / editing / removing existing members stays available.
drop policy if exists "team owner all" on team_members;
drop policy if exists "team owner select" on team_members;
drop policy if exists "team owner update" on team_members;
drop policy if exists "team owner delete" on team_members;
drop policy if exists "team owner insert premium" on team_members;
create policy "team owner select" on team_members for select using (auth.uid() = owner_id);
create policy "team owner update" on team_members for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "team owner delete" on team_members for delete using (auth.uid() = owner_id);
create policy "team owner insert premium" on team_members for insert
  with check (auth.uid() = owner_id and public.is_premium());

-- an employee can read invites addressed to their email, and their memberships
drop policy if exists "team member read" on team_members;
create policy "team member read" on team_members for select
  using (member_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));

-- accept an invite (employee). security definer so we set only member_id+status.
create or replace function accept_team_invite(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
begin
  select lower(email) into v_email from team_members where id = p_id and status = 'invited';
  if v_email is null then raise exception 'invite not found'; end if;
  if v_email is distinct from lower(auth.jwt() ->> 'email') then
    raise exception 'this invite is not for you';
  end if;
  update team_members set member_id = auth.uid(), status = 'active' where id = p_id;
end;
$$;
grant execute on function accept_team_invite(uuid) to authenticated;

-- leave a team (employee removes their own membership)
create or replace function leave_team(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update team_members set status = 'removed' where id = p_id and member_id = auth.uid();
end;
$$;
grant execute on function leave_team(uuid) to authenticated;

-- ============================================================
-- Acting on behalf of the business: an owner assigns an employee to a hired
-- job; the employee can then see the business's jobs/quotes and message that
-- customer. is_team_member() is security definer to avoid RLS recursion.
-- ============================================================
create or replace function is_team_member(p_owner uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from team_members
    where owner_id = p_owner and member_id = auth.uid() and status = 'active'
  );
$$;
grant execute on function is_team_member(uuid) to authenticated;

create table if not exists job_assignments (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references jobs(id) on delete cascade,
  owner_id    uuid not null references profiles(id) on delete cascade,
  employee_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (job_id)
);
create index if not exists job_assign_emp_idx   on job_assignments(employee_id);
create index if not exists job_assign_owner_idx on job_assignments(owner_id);
alter table job_assignments enable row level security;
drop policy if exists "assign owner all" on job_assignments;
create policy "assign owner all" on job_assignments for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "assign employee read" on job_assignments;
create policy "assign employee read" on job_assignments for select
  using (employee_id = auth.uid());

-- bids: also readable by the bidding business's active employees
drop policy if exists "bids readable to parties" on bids;
create policy "bids readable to parties" on bids for select using (
  auth.uid() = tradesman_id
  or auth.uid() = (select customer_id from jobs where jobs.id = bids.job_id)
  or public.is_team_member(bids.tradesman_id)
);

-- conversations: also visible/creatable/updatable by the tradesman's employees
drop policy if exists "conversations readable to parties" on conversations;
create policy "conversations readable to parties" on conversations for select using (
  auth.uid() = customer_id or auth.uid() = tradesman_id or public.is_team_member(tradesman_id)
);
drop policy if exists "conversations insert party" on conversations;
create policy "conversations insert party" on conversations for insert with check (
  auth.uid() = customer_id or auth.uid() = tradesman_id or public.is_team_member(tradesman_id)
);
drop policy if exists "conversations update party" on conversations;
create policy "conversations update party" on conversations for update using (
  auth.uid() = customer_id or auth.uid() = tradesman_id or public.is_team_member(tradesman_id)
);

-- messages: also readable by the conversation tradesman's employees
drop policy if exists "messages readable to parties" on messages;
create policy "messages readable to parties" on messages for select using (
  auth.uid() in (
    select customer_id from conversations where conversations.id = messages.conversation_id
    union
    select tradesman_id from conversations where conversations.id = messages.conversation_id
  )
  or public.is_team_member((select tradesman_id from conversations where conversations.id = messages.conversation_id))
);

-- ============================================================
-- invoice_settings — a tradesman's branding for generated invoices/quotes.
-- ============================================================
create table if not exists invoice_settings (
  user_id        uuid primary key references profiles(id) on delete cascade,
  business_name  text,
  logo_url       text,
  brand_color    text not null default '#E11D26',
  tax_id         text,
  payment_terms  text,
  footer_note    text,
  contact_phone  text,
  contact_email  text,
  updated_at     timestamptz not null default now()
);
-- Template choice + extended branding for the invoice/quote PDF designs.
alter table invoice_settings add column if not exists template            text not null default 'classic';
alter table invoice_settings add column if not exists tagline             text;
alter table invoice_settings add column if not exists address             text;
alter table invoice_settings add column if not exists website             text;
alter table invoice_settings add column if not exists bank_name           text;
alter table invoice_settings add column if not exists bank_account_name   text;
alter table invoice_settings add column if not exists bank_account_number text;
alter table invoice_settings add column if not exists bank_routing        text;
alter table invoice_settings add column if not exists bank_swift          text;
alter table invoice_settings add column if not exists payment_extra       text;
alter table invoice_settings add column if not exists accept_note         text;
alter table invoice_settings add column if not exists signature_name      text;
alter table invoice_settings add column if not exists signature_title     text;
alter table invoice_settings enable row level security;
drop policy if exists "invoice settings own" on invoice_settings;
create policy "invoice settings own" on invoice_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- catalog_items — a tradesman's saved services & materials (price book).
-- ============================================================
create table if not exists catalog_items (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  name       text not null,
  kind       text not null default 'service',  -- 'service' | 'material'
  unit       text,                              -- e.g. 'job', 'ft', 'hr', 'each'
  price      numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists catalog_owner_idx on catalog_items(owner_id, created_at desc);
alter table catalog_items enable row level security;
drop policy if exists "catalog own" on catalog_items;
create policy "catalog own" on catalog_items for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- PHASE 1 base models for the Business Management platform.
-- (SavedItems already exists above as `catalog_items`.)
-- ============================================================

-- clients — a tradesman's CRM contacts (expanded in Phase 3)
create table if not exists clients (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references profiles(id) on delete cascade,
  name         text not null,
  phone        text,
  email        text,
  area         text,
  location_lat double precision,
  location_lng double precision,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists clients_owner_idx on clients(owner_id, created_at desc);
-- Link an auto-created client back to the customer's account (manual clients
-- leave this null); lets us avoid adding the same customer twice.
alter table clients add column if not exists customer_id uuid references profiles(id) on delete set null;
create index if not exists clients_customer_idx on clients(owner_id, customer_id);
alter table clients enable row level security;
drop policy if exists "clients own" on clients;
create policy "clients own" on clients for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Auto-add the customer to the tradesman's client list when their quote is
-- accepted (security definer; de-dupes by owner + customer).
create or replace function add_client_on_hire() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_title text; v_name text; v_phone text; v_area text;
        v_lat double precision; v_lng double precision;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select customer_id, title into v_customer, v_title from jobs where id = new.job_id;
    if v_customer is null then return new; end if;
    if exists (select 1 from clients where owner_id = new.tradesman_id and customer_id = v_customer) then
      return new;
    end if;
    select full_name, phone, area, location_lat, location_lng
      into v_name, v_phone, v_area, v_lat, v_lng
      from profiles where id = v_customer;
    insert into clients (owner_id, customer_id, name, phone, area, location_lat, location_lng, notes)
    values (new.tradesman_id, v_customer, coalesce(nullif(btrim(v_name), ''), 'Customer'),
            v_phone, v_area, v_lat, v_lng,
            'Added automatically when hired for "' || coalesce(v_title, 'a job') || '".');
  end if;
  return new;
end; $$;
drop trigger if exists trg_add_client_on_hire on bids;
create trigger trg_add_client_on_hire after update on bids
  for each row execute function add_client_on_hire();

-- ============================================================
-- delete_my_account(): lets a signed-in user permanently delete their own
-- account. Deleting the auth.users row cascades to profiles and (via on delete
-- cascade) to all of their jobs, bids, messages, clients, etc. Required by the
-- Apple/Google account-deletion policies.
-- ============================================================
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in';
  end if;
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;

-- per-client project photo vault (Phase 3)
create table if not exists client_photos (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  url        text not null,
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists client_photos_idx on client_photos(client_id, created_at desc);
alter table client_photos enable row level security;
drop policy if exists "client photos own" on client_photos;
create policy "client photos own" on client_photos for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- invoices + line items (persisted; the builder/PDF land in Phase 2)
do $$ begin
  create type invoice_status as enum ('draft', 'sent', 'paid', 'void');
exception when duplicate_object then null; end $$;

create table if not exists invoices (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  client_id     uuid references clients(id) on delete set null,
  job_id        uuid references jobs(id) on delete set null,
  number        text not null,
  customer_name text,
  status        invoice_status not null default 'draft',
  currency      text not null default 'TTD',
  subtotal      numeric(12,2) not null default 0,
  tax           numeric(12,2) not null default 0,
  total         numeric(12,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists invoices_owner_idx on invoices(owner_id, created_at desc);
alter table invoices enable row level security;
drop policy if exists "invoices own" on invoices;
create policy "invoices own" on invoices for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- one engine for every document: invoice / bill / estimate / quote (Phase 3)
do $$ begin
  create type doc_type as enum ('invoice', 'bill', 'estimate', 'quote');
exception when duplicate_object then null; end $$;
alter table invoices add column if not exists doc_type doc_type not null default 'invoice';
-- estimate/quote sign-off + conversion (Phase 3)
alter table invoices add column if not exists signed_name   text;
alter table invoices add column if not exists signed_at     timestamptz;
alter table invoices add column if not exists signature_url text;
alter table invoices add column if not exists converted_to  uuid references invoices(id) on delete set null;

create table if not exists invoice_items (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  description text not null,
  qty         numeric(10,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  amount      numeric(12,2) not null default 0,
  sort        int not null default 0
);
create index if not exists invoice_items_invoice_idx on invoice_items(invoice_id);
alter table invoice_items enable row level security;
drop policy if exists "invoice items own" on invoice_items;
create policy "invoice items own" on invoice_items for all
  using (exists (select 1 from invoices i where i.id = invoice_items.invoice_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from invoices i where i.id = invoice_items.invoice_id and i.owner_id = auth.uid()));

-- ============================================================
-- Phase 5: dispatch scheduling on assignments + in-app notifications.
-- ============================================================
alter table job_assignments add column if not exists scheduled_at timestamptz;
alter table job_assignments add column if not exists note         text;

-- notify(): insert an in-app notification for yourself or one of your active
-- employees (security definer; guarded so you can't spam arbitrary users).
create or replace function notify(p_user uuid, p_type text, p_title text, p_body text, p_job uuid default null)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_user <> auth.uid() and not exists (
    select 1 from team_members where owner_id = auth.uid() and member_id = p_user and status = 'active'
  ) then
    raise exception 'not allowed to notify this user';
  end if;
  insert into notifications (user_id, type, title, body, job_id) values (p_user, p_type, p_title, p_body, p_job);
end;
$$;
grant execute on function notify(uuid, text, text, text, uuid) to authenticated;

-- ============================================================
-- Auto-notifications: create an in-app notification for the other party when a
-- quote is submitted, a quote is accepted, or a message is sent. Security
-- definer so the trigger can write a notification row for a different user.
-- ============================================================
create or replace function notify_on_bid() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_title text;
begin
  select customer_id, title into v_customer, v_title from jobs where id = new.job_id;
  if v_customer is not null and v_customer <> new.tradesman_id then
    insert into notifications (user_id, type, title, body, job_id)
    values (v_customer, 'bid', 'New quote received',
            'A tradesman sent a quote on "' || coalesce(v_title, 'your job') || '".', new.job_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_on_bid on bids;
create trigger trg_notify_on_bid after insert on bids
  for each row execute function notify_on_bid();

create or replace function notify_on_bid_accepted() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select title into v_title from jobs where id = new.job_id;
    insert into notifications (user_id, type, title, body, job_id)
    values (new.tradesman_id, 'hired', 'Your quote was accepted',
            'You were hired for "' || coalesce(v_title, 'a job') || '". Tap to view.', new.job_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_on_bid_accepted on bids;
create trigger trg_notify_on_bid_accepted after update on bids
  for each row execute function notify_on_bid_accepted();

create or replace function notify_on_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_tradesman uuid; v_recipient uuid;
begin
  select customer_id, tradesman_id into v_customer, v_tradesman
  from conversations where id = new.conversation_id;
  v_recipient := case when new.sender_id = v_customer then v_tradesman else v_customer end;
  if v_recipient is not null and v_recipient <> new.sender_id then
    insert into notifications (user_id, type, title, body)
    values (v_recipient, 'message', 'New message', left(new.body, 80));
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_on_message on messages;
create trigger trg_notify_on_message after insert on messages
  for each row execute function notify_on_message();

-- ============================================================
-- expenses — receipts logged against a client project (Phase 4).
-- ============================================================
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  vendor      text,
  category    text not null default 'materials',  -- materials | fuel | tools | labour | permits | other
  amount      numeric(12,2) not null default 0,
  note        text,
  receipt_url text,
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists expenses_owner_idx  on expenses(owner_id, created_at desc);
create index if not exists expenses_client_idx on expenses(client_id);
alter table expenses enable row level security;
drop policy if exists "expenses own" on expenses;
create policy "expenses own" on expenses for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

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

-- ============================================================
-- Payments (PayPal, non-custodial marketplace; USD in T&T)
-- Money goes directly from the customer to the tradesman (payee); the platform
-- takes a fee via PayPal Commerce Platform. We never hold funds. Rows are
-- written only by the Edge Functions (service-role key), so no client-write RLS.
-- ============================================================
alter table profiles add column if not exists paypal_merchant_id text; -- tradesman's connected PayPal
alter table profiles add column if not exists paypal_email      text;

create table if not exists payments (
  id                       uuid primary key default uuid_generate_v4(),
  job_id                   uuid references jobs(id) on delete set null,
  bid_id                   uuid references bids(id) on delete set null,
  customer_id              uuid not null references profiles(id) on delete cascade,
  tradesman_id             uuid not null references profiles(id) on delete cascade,
  amount                   numeric(12,2) not null,
  platform_fee             numeric(12,2) not null default 0,
  currency                 text not null default 'USD',
  provider                 text not null default 'paypal',
  status                   text not null default 'created',  -- created|approved|authorized|captured|refunded|voided|failed
  paypal_order_id          text,
  paypal_authorization_id  text,
  paypal_capture_id        text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists payments_customer_idx  on payments(customer_id, created_at desc);
create index if not exists payments_tradesman_idx on payments(tradesman_id, created_at desc);
create index if not exists payments_order_idx     on payments(paypal_order_id);
alter table payments enable row level security;
drop policy if exists "payments read own" on payments;
create policy "payments read own" on payments for select
  using (auth.uid() = customer_id or auth.uid() = tradesman_id);

# Database (Supabase)

## Golden rule
**`supabase/schema.sql` is the single source of truth.** It is written to be re-runnable
(idempotent) — `create table if not exists`, `drop policy if exists` / `create policy`,
`create or replace function`, `on conflict do nothing/update`. When in doubt, **run the whole
file again** in the SQL Editor. Most "it won't save / nothing happens" bugs are a policy,
bucket, or trigger that was never applied because SQL was run piecemeal.

To set up (or repair) a project: Supabase → **SQL Editor → New query** → paste all of
`schema.sql` → Run.

## What's in it
- **Tables**: profiles, trades, tradesman_info, tradesman_trades, jobs, bids, conversations,
  messages, hires, reviews, notifications, feature_gates, clients, expenses, portfolio,
  team_members, payout_accounts, etc.
- **Row-Level Security (RLS)**: every table has RLS on; policies grant each user access to
  their own rows (e.g. `profiles update own`, `tinfo write own`, `jobs insert own`).
- **Storage**: `uploads` (public — avatars, banners, portfolio) and `verification` (private),
  with read/write policies.
- **Functions** (security-definer): `accept_bid`, `add_trade`, `notify`, `get_pro_stats`,
  `is_super_admin`, …
- **Triggers**: auto-create a profile on signup; create notifications on new quote / hire /
  message; auto-add the customer as a client when a quote is accepted.
- **Seed**: the trade catalogue and the feature-gate catalogue.

## Common symptoms → fix
| Symptom | Cause | Fix |
|---|---|---|
| Photo upload does nothing | `uploads` bucket or its insert policy missing | Re-run the storage section of `schema.sql` |
| Profile / trade / bio won't save | `profiles update own` / `tinfo write own` / `ttrades write own` missing | Re-run schema |
| Posting a job fails | `jobs insert own` missing | Re-run schema |
| No notifications appear | notify triggers not created | Re-run the trigger section |
| "function … does not exist" | that function block wasn't run | Re-run schema |

## Keys
- **anon / publishable** key → used by the app (browser-safe, RLS-protected). Goes in
  `mobile/.env` and Netlify env vars.
- **service-role / secret** key → bypasses RLS. Server-side ONLY (`admin-server/.env`).
  Never commit it; never ship it to the app.

## Changing the schema
Edit `supabase/schema.sql`, then run the changed statements (or the whole file) in the SQL
Editor. Keep every change idempotent so the file stays safe to re-run.

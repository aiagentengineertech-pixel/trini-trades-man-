# Trini Tradesman — Super-Admin Command Console (backend)

A **standalone** Node + TypeScript (Express) service for platform operators. It is
separate from the mobile app and talks to the **same Supabase Postgres** using the
**service-role key** (full access). Auth is enforced by the `requireSuperAdmin`
middleware, which validates the caller's Supabase JWT and confirms their
`profiles.role = 'super_admin'`. Non-admins get a flat `404` so the routes stay hidden.

## Setup
```bash
cd admin-server
cp .env.example .env          # fill in SUPABASE_URL, ANON, SERVICE_ROLE keys
npm install
npm run dev                   # http://localhost:8787
```

## Database prerequisites (run once in Supabase SQL editor)
```sql
alter type user_role add value if not exists 'super_admin';
alter table profiles add column if not exists region text;

create or replace function is_super_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select role = 'super_admin' from profiles where id = auth.uid()), false);
$$;
grant execute on function is_super_admin() to authenticated;

create table if not exists feature_gates (
  key text primary key, enabled boolean not null default true, note text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);
alter table feature_gates enable row level security;
drop policy if exists "gates readable" on feature_gates;
create policy "gates readable" on feature_gates for select to authenticated using (true);
drop policy if exists "gates admin write" on feature_gates;
create policy "gates admin write" on feature_gates for all
  using (public.is_super_admin()) with check (public.is_super_admin());
```

Make yourself an admin:
```sql
update profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Endpoints (all require `Authorization: Bearer <supabase-access-token>` of a super_admin)
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/dashboard-metrics` | — | `{ totalUsers, activePremium, jobsThisWeek }` |
| GET | `/api/admin/users?page=&pageSize=&q=` | — | paginated `{ users: [{ id, fullName, role, region, isPremium, subscriptionExpiresAt }] }` |
| PATCH | `/api/admin/users/:id/subscription` | `{ isPremium, monthsExtended }` | updated subscription |
| GET | `/api/admin/features` | — | `{ gates }` |
| PATCH | `/api/admin/features/toggle-gate` | `{ key, enabled, note? }` | updated gate |

`monthsExtended` stacks on any remaining time; `isPremium:false` revokes immediately.

## Security notes
- The **service-role key bypasses RLS** — keep it server-side only, never ship to the admin web page. The browser logs in with Supabase Auth and sends its JWT; this server validates it and does the privileged work.
- Failures in the gate return `404` by design (route hiding).

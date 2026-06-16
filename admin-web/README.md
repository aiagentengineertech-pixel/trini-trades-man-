# Trini Tradesman — Admin Console (web)

A standalone Vite + React + TypeScript front-end for the Super-Admin Command Console.
It logs in with Supabase Auth and drives the [`admin-server`](../admin-server) API.

## Run
```bash
cd admin-web
cp .env.example .env      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_API
npm install
npm run dev               # http://localhost:5173
```
The `admin-server` must be running (default http://localhost:8787) and your account must be a
`super_admin` (see admin-server README). Non-admins are shown "no access" (the API returns 404).

## What it does
- **Dashboard** — total users, active premium, jobs this week.
- **Users** — paginated/searchable list; per-user **Manage** to toggle premium and extend months.
- **Feature gates** — view/toggle global feature flags; add new gate keys.

Only the anon key lives here (browser-safe). All privileged work happens in `admin-server`
with the service-role key.

# Super-admin console

A hidden operator console to see and control the platform. Two parts:
- **`admin-server`** — Node/Express API that holds the Supabase **service-role (secret)** key
  and exposes guarded endpoints. The secret bypasses RLS, so this must stay server-side.
- **`admin-web`** — Vite/React UI that logs in with Supabase Auth and calls `admin-server`.

Access requires a Supabase user whose `profiles.role = 'super_admin'`.

## One-time setup
1. **Create the admin user**: Supabase → Authentication → Add user (Auto Confirm).
2. **Promote it** (SQL Editor):
   ```sql
   update profiles set role = 'super_admin' where id = (
     select id from auth.users where email = '<your-admin-email>'
   );
   ```
   Keep this email for admin only — using it in the normal app can flip the role back.
3. **`admin-server/.env`** (gitignored — never commit):
   ```
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_ANON_KEY=<anon / publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role / secret key>
   PORT=8787
   ADMIN_ORIGIN=http://localhost:5173
   ```

## Run locally
```powershell
# terminal 1
cd admin-server; npm install; npm run dev      # http://localhost:8787
# terminal 2
cd admin-web;    npm install; npm run dev      # http://localhost:5173
```
Open `admin-web`, sign in with the super-admin account.

## What it does
- **Dashboard**: signups/jobs trends, fill-rate by trade, demand by region, ratings, supply vs demand.
- **Users**: view/verify, change role, suspend, reset password.
- **Features**: 25 remote kill-switches grouped by area (Business suite, Marketplace, Payments,
  Growth & comms, Access). Default ON; flip OFF to disable a feature for everyone instantly.
- **Broadcast**: send a message to users.
- **Audit**: log of admin actions.

## Hosting it (later)
`admin-web` can be a static deploy, but `admin-server` needs a backend host (Render / Railway /
Fly) because it holds the secret key. It runs locally only for now. See the Roadmap.

## Security
- The service-role key must NEVER be committed or shipped to the app/PWA. It lives only in
  `admin-server/.env`. If it leaks, rotate it in Supabase immediately.

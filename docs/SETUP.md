# Local setup

## Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine)
- The **Expo Go** app on your phone (for device testing), or an emulator

## 1. Database
In Supabase → **SQL Editor → New query**, paste the entire contents of
[`../supabase/schema.sql`](../supabase/schema.sql) and run it. This creates every table,
security policy, function, trigger, storage bucket, and seed row. See
[DATABASE.md](DATABASE.md) for details and troubleshooting.

## 2. App environment
Create `mobile/.env` (this file is gitignored — never commit it):

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon / publishable key>
```

Both come from Supabase → **Project Settings → API**. The anon/publishable key is
browser-safe (it's protected by RLS). Do **not** put the service-role/secret key here.

## 3. Run it
```powershell
cd mobile
npm install
npx expo start          # press 'a' (Android) / 'i' (iOS), or scan the QR in Expo Go
```

If your phone can't connect over the local network, use a tunnel:
```powershell
npx expo start --tunnel
```

## 4. Useful checks
```powershell
npx tsc --noEmit        # type-check
npx expo export -p web  # produce the web build in mobile/dist
```

## Admin console (optional, local)
See [ADMIN.md](ADMIN.md) — it runs `admin-server` (needs the Supabase **secret** key in
`admin-server/.env`) and `admin-web`.

## Notes
- Auth: email/password via Supabase. For easy testing, you can turn **off** "Confirm email"
  in Supabase → Authentication → Providers → Email.
- Keep one email for the **super-admin** account and a separate email for normal app testing.

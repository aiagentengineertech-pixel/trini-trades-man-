# Architecture

How the parts of Trini Tradesman fit together.

```
                          ┌──────────────────────────┐
   Customers &            │   mobile/ (Expo app)      │
   Tradesmen      ◄─────► │   • iOS / Android (later) │
                          │   • Web PWA (now, Netlify)│
                          └────────────┬─────────────┘
                                       │  Supabase JS (anon/publishable key)
                                       ▼
                          ┌──────────────────────────┐
                          │        Supabase           │
                          │  Postgres + RLS + Auth    │
                          │  + Storage (uploads)      │
                          └────────────┬─────────────┘
                                       ▲  service-role (secret) key, server-side only
                                       │
                          ┌────────────┴─────────────┐
   Super-admin    ◄─────► │  admin-web (Vite/React)   │
   (operator)            │      └► admin-server (API) │
                          └──────────────────────────┘
```

## The app (`mobile/`)
- Expo + expo-router; the same codebase renders native and web.
- Talks directly to Supabase with the **anon/publishable** key (browser-safe). Row-Level
  Security (RLS) is what keeps users to their own data — there is no app server in the middle.
- Shipped today as an installable PWA (`docs/DEPLOYMENT.md`).

## Supabase
- **Single source of truth = `supabase/schema.sql`** — tables, RLS policies, security-definer
  functions (e.g. `accept_bid`, `add_trade`, `notify`), triggers (auto-notifications,
  auto-add-client-on-hire), storage buckets, and seed data.
- RLS means every table is locked down by default; policies grant the minimum each user needs.
  Most "X won't save" bugs trace back to a policy that wasn't applied — see `docs/DATABASE.md`.

## Admin console (`admin-server` + `admin-web`)
- Separate from the app on purpose: it uses the Supabase **service-role (secret)** key, which
  bypasses RLS and must NEVER reach the browser/app. So a small Node API (`admin-server`) holds
  the secret and exposes guarded endpoints; `admin-web` is the UI that calls it.
- Access is gated behind a super-admin role check (`profiles.role = 'super_admin'`).
- Feature gates: the admin can flip remote kill-switches (`feature_gates` table) that the app
  reads via `featureEnabled('key')` — default ON.

## Payments (planned)
- Card payments through a Central-Bank-registered PSP (WiPay/PowerTranz), using
  **auth-and-capture** (hold on hire, capture on completion) so the app never custodies funds —
  this keeps us out of money-transfer/AML licensing. See `docs/LAUNCH-CHECKLIST.md`.

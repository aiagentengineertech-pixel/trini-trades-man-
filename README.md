# Trini Tradesman 🔨

**Fix it. Trust it.** — a local-trades marketplace for Trinidad & Tobago.
Customers post a job → verified tradesmen submit quotes → the customer hires and pays
(escrow-style, via a licensed payment processor). Plus a premium business suite for
tradesmen and a hidden super-admin console.

Currently shipping as an installable **web app (PWA)** for testing; native iOS/Android
store builds are on the roadmap.

## Repo layout

```
trini-tradesman/
├── README.md            # You are here
├── netlify.toml         # Web (PWA) deploy config — builds mobile/ to mobile/dist
├── mobile/              # The Expo app (React Native + web/PWA) — the product
├── admin-server/        # Super-admin API (Node/Express, uses the Supabase secret key)
├── admin-web/           # Super-admin console UI (Vite + React)
├── supabase/
│   └── schema.sql       # The ENTIRE database: tables, RLS, functions, triggers, seed
└── docs/                # Project documentation (see below)
```

## Documentation

| Doc | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the pieces fit together |
| [docs/SETUP.md](docs/SETUP.md) | Run the app locally (Expo, env vars, Supabase) |
| [docs/DATABASE.md](docs/DATABASE.md) | Supabase setup — **run `schema.sql`**, RLS, storage, triggers |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy the web app to Netlify |
| [docs/ADMIN.md](docs/ADMIN.md) | The super-admin console + feature gates |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | PayPal (non-custodial) Edge Functions + setup; WiPay plan |
| [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) | What's left to reach the app stores |
| [docs/BUILD-PLAN.md](docs/BUILD-PLAN.md) | Original market/strategy/decisions plan |

## Tech stack

| Layer | Tech |
|---|---|
| App (iOS + Android + web/PWA) | React Native + Expo (TypeScript, expo-router) |
| Backend / DB / Auth / Storage | Supabase (Postgres + Row-Level Security) |
| Admin console | Node/Express (`admin-server`) + Vite/React (`admin-web`) |
| Payments (planned) | WiPay / PowerTranz — auth-and-capture, never custody funds |

## Quick start

```powershell
# 1. Database: in Supabase → SQL Editor, run the whole of supabase/schema.sql
# 2. App:
cd mobile
# create mobile/.env (see docs/SETUP.md) with your Supabase URL + anon key
npm install
npx expo start        # press a/i, or scan the QR with Expo Go
```

See [docs/SETUP.md](docs/SETUP.md) for the full walkthrough.

## Planning

Live status and the roadmap live in the **Notion project hub** (Roadmap board).
`docs/STATUS-archive.md` is the old static status file, kept for reference.

# Trini Tradesman 🔨

**Fix it. Trust it.** — A local-trades marketplace for Trinidad & Tobago.
Post a job → verified tradesmen bid → escrow-protected payment.

## Repo layout

```
trini-tradesman/
├── BUILD-PLAN.md        # The full plan: market, stack, roadmap, payments, decisions
├── README.md            # You are here
├── mobile/              # The Expo (React Native) app — iOS + Android
└── supabase/
    └── schema.sql       # Database tables, security rules, and seed data
```

## Tech stack

| Layer | Tech |
|---|---|
| Mobile app (iOS + Android) | React Native + Expo (TypeScript, expo-router) |
| Backend / DB / Auth / Storage | Supabase (Postgres) |
| Payments | WiPay (card rail; escrow handled in-app — see BUILD-PLAN §6a) |

## Getting started

### 1. Set up the backend (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. From **Project Settings → API**, copy your **Project URL** and **anon public key**.

### 2. Run the app
```powershell
cd mobile
# create mobile/.env with your Supabase keys (see mobile/.env.example)
npm install        # already done by the scaffold, run again if needed
npx expo start     # press 'a' for Android, 'i' for iOS, or scan the QR with Expo Go
```

Install the **Expo Go** app on your phone to see it live while developing.

## Status

🟢 **Phase 1 — MVP** (in progress). See [BUILD-PLAN.md](BUILD-PLAN.md) for the roadmap.

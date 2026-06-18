# Launch checklist

From "working PWA" to "live in the app stores." The live, prioritized version of this lives
in the **Notion Roadmap board**; this is the durable reference copy.

## P0 — launch blockers
- [ ] **Payments** — integrate WiPay / PowerTranz (card). Use **auth-and-capture** (hold on
      hire, capture on completion); the app must never hold funds.
- [ ] **Payments compliance** — confirm the auth-and-capture approach keeps us out of
      Money/Value-Transfer-Service / AML licensing under the Proceeds of Crime Act. If we ever
      custody funds, FIU registration + AML program + tiered KYC apply.
- [ ] **Legal** — fill `LEGAL_INFO` in `mobile/src/constants/legal.ts` (registered business
      name + support email) and have a Trinidad & Tobago attorney review all policy pages.
- [ ] **Native builds** — EAS build for iOS + Android: bundle IDs, permission strings
      (camera, photos, location), splash + icon (icon done).
- [ ] **Store accounts** — Apple Developer Program ($99/yr), Google Play Console ($25 once).

## P1 — important
- [x] **Account deletion** — in-app (Settings → Delete account) + public page (`/delete-account`)
      backed by the `delete_my_account()` RPC. Run the RPC in Supabase and deploy. *(Required by
      both stores.)*
- [ ] App store listing assets: screenshots per device, description, keywords, privacy labels,
      support URL, category. **Draft copy + data-safety answers in [STORE-LISTING.md](STORE-LISTING.md).**
- [ ] **Google closed test** — personal Play accounts must run a 12-tester / 14-day closed test
      before production (a registered business/org account is exempt).
- [ ] Host the admin console (`admin-server` backend + `admin-web` static).
- [ ] Verify the full `supabase/schema.sql` is applied in production (RLS, storage, triggers).
- [ ] Reviews & ratings end-to-end (after job completion → rolls up to profile + search).
- [ ] Real-device testing round with friends; triage feedback.

## P2 — nice to have
- [ ] Realtime updates (Supabase subscriptions) instead of refresh-on-open.
- [ ] Custom domain for the web app.
- [ ] Push notifications on native (expo-notifications) wired to events.

## Already done (highlights)
Marketplace core (post/bid/hire/message), photo uploads, custom trades + all T&T areas,
in-app notifications, auto-add client on hire + tradesman Active Jobs, installable PWA with
branded icon, Netlify auto-deploy, super-admin console with feature gates, legal page templates.

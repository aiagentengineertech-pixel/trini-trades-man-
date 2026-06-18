# Trini Tradesman — Project Summary

**"Fix it. Trust it."** — A two-sided local-trades marketplace for Trinidad & Tobago.
Customers post jobs → verified tradesmen bid → escrow-protected payment.

_Last updated: 2026-06-14_

---

## 1. The concept
A mobile app (iOS + Android) connecting people who need work done (electrical, plumbing,
masonry, AC, carpentry, painting) with local tradesmen, using a **post-a-job → competing-quotes →
escrow** model. Native to T&T.

## 2. Research & key decisions (validated)
- **Market gap confirmed.** No T&T app owns the "post → bid → escrow" model. Closest competitor
  (Service Call) is direct-booking, not bidding. Strong, mobile-first market (84.7% online).
- **Stack:** React Native + Expo (SDK 56, TypeScript) · Supabase (database/auth) · WiPay (payments).
- **WiPay verified:** has **no native escrow** — we hold funds in our account + manual payout
  (escrow built in-app). Fees: 3.5% + US$0.25 (free plan). Legal/escrow status to confirm before launch.
- **Money model:** commission via escrow, kept low/free for the first ~3 months to beat cold-start.

## 3. What's built (working prototype)
The app runs on iOS, Android, and web. Every screen below is built and verified:

**Accounts & navigation**
- Login / sign-up screen + "demo mode" (explore without a backend)
- 5-tab navigation, **role-aware** (the app changes for customers vs. tradesmen)
- Customer ↔ tradesman switch (in Profile)

**Customer side**
- Home (branded landing: search, popular services, top-rated pros, post-a-job)
- Explore — browse & filter tradesmen
- Post a Job (form → job is created → quotes arrive)
- Pro profile (bio, services, ratings, reviews, Hire / Message)
- Job detail — view incoming quotes & accept one
- Chat with tradesmen
- Messages list

**Tradesman side**
- Explore — available jobs to bid on
- Job detail — submit a quote
- My Bids — track submitted quotes (Pending / Won / Lost)

**Profile & account pages**
- Profile (account info, role switch, sign out)
- Edit Profile · Payment Methods · Verification (ID upload) · My Reviews · Help & Support
- Notifications

**Under the hood**
- In-memory data store wires everything together (post a job → bids come in → accept → chat all
  actually work). Swaps for Supabase later behind the same interface.

## 4. Database (schema ready)
`supabase/schema.sql` defines all tables with security rules + seed data:
`profiles`, `trades`, `tradesman_info`, `tradesman_trades`, `jobs`, `bids`, `hires`,
`conversations`, `messages`, `reviews`, `notifications`.

## 5. Current status
🟢 **Fully clickable prototype, verified working.**
⚠️ **Data is in-memory** — it resets on refresh and isn't shared between users yet. Connecting
Supabase is the next step to make everything persist and work across real accounts.

## 6. What's left
1. **Connect Supabase** — make accounts, jobs, bids, messages persist & sync between users
2. **Payments/escrow** — integrate WiPay checkout + the manual escrow/payout flow
3. **Real uploads** — photos for jobs, ID docs for verification
4. **Admin dashboard** (web) — approve IDs, handle payouts & disputes
5. **Push notifications**
6. **Launch prep** — confirm legal/escrow with WiPay + a lawyer, test on devices, publish to the
   App Store & Google Play

## 7. Where things live
```
trini-tradesman/
├── BUILD-PLAN.md      # full plan: market, stack, roadmap, payments, decisions
├── STATUS.md          # this summary
├── README.md          # setup & run guide
├── supabase/schema.sql# database tables + security + seed
└── mobile/            # the Expo app (run: cd mobile && npx expo start)
```

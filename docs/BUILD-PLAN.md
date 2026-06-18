# Trini Tradesman — Build Plan

**"Fix it. Trust it."** — A two-sided local-trades marketplace for Trinidad & Tobago.
Post a job → verified tradesmen bid → escrow-protected payment.

---

## 1. What you're actually building (it's 3 apps, not 1)

A marketplace is always two-sided, plus an admin layer. Budget for all three from day one:

| Surface | Who uses it | Core jobs |
|---|---|---|
| **Customer app** | Homeowners / businesses | Find pros, post jobs, review bids, hire, pay, rate |
| **Tradesman app** | Plumbers, electricians, masons… | Set up profile, browse jobs, submit bids, chat, get paid |
| **Admin dashboard** (web) | You / your team | Verify pros (ID check), resolve disputes, manage payments, moderate |

> The customer + tradesman apps can be **one codebase with two modes** (a role flag at login), which roughly halves the work vs. separate apps. Recommended for the MVP.

---

## 2. Recommended tech stack (tuned for "some coding")

The goal: maximum result, minimum infrastructure you have to babysit.

| Layer | Recommendation | Why |
|---|---|---|
| **Mobile app** | **React Native + Expo** (TypeScript) | One codebase → iOS + Android. Biggest community, easiest learning curve, tons of tutorials. Expo handles builds, push, updates without native tooling headaches. |
| **Backend / DB** | **Supabase** (hosted Postgres) | Auth, database, file storage, realtime, and security rules in one place. Relational data (jobs↔bids↔users) fits Postgres perfectly. Generous free tier. |
| **Payments** | **WiPay** | Local T&T gateway, no setup/monthly fee (3.5% + US$0.25/txn). Start here. |
| **Push notifications** | **Expo Notifications** (uses FCM/APNs) | Critical for a bidding app — "you got a new bid!", "you were hired!" |
| **Admin dashboard** | **Next.js** (or Supabase's built-in table UI to start) | Reuses your React knowledge. Can literally start with Supabase's dashboard before building a custom one. |
| **Maps / location** | Google Maps SDK | "Near you" distances, job locations |

**Alternative:** Flutter (Dart) instead of React Native — equally capable, beautiful UI, but smaller talent pool in T&T if you later hire help. React Native wins on hireability + reusing web skills.

---

## 3. Core data model (the heart of it)

```
users          → id, name, role (customer|tradesman|both), phone, photo,
                 location, verified (bool), rating_avg
trades         → id, name (Electrician, Plumber, Mason…), icon
tradesman_info → user_id, trades[], bio, years_exp, service_radius_km, id_doc_url
jobs           → id, customer_id, trade_id, title, description, photos[],
                 location, budget_range, status (open|hired|in_progress|done|cancelled),
                 created_at
bids           → id, job_id, tradesman_id, amount, message, status
                 (pending|accepted|rejected|withdrawn), created_at
hires          → id, job_id, bid_id, escrow_status (held|released|refunded),
                 amount, payment_ref
messages       → id, job_id, sender_id, body, sent_at
reviews        → id, job_id, reviewer_id, reviewee_id, stars, comment
```

This model directly supports the whole flow: post a job → many bids → accept one → escrow hold → work → release + review.

---

## 4. Feature breakdown

### Customer side
- [ ] Sign up / login (phone OTP is ideal for T&T)
- [ ] Browse trades + top-rated pros near you (your mockup's home screen)
- [ ] **Post a job** (trade, description, photos, location, budget)
- [ ] Receive & compare bids
- [ ] Accept a bid → pay into escrow
- [ ] In-app chat with the tradesman
- [ ] Mark job complete → release payment → leave a review

### Tradesman side
- [ ] Profile setup + **ID verification** (upload doc, you approve)
- [ ] Browse / filter open jobs by trade + location
- [ ] **Submit a bid** (amount + message)
- [ ] Chat with customers
- [ ] Track active jobs, get paid on completion
- [ ] Build up ratings / "Verified" badge

### Admin / trust layer
- [ ] Approve / reject ID verifications
- [ ] Escrow oversight (release/refund on disputes)
- [ ] Dispute resolution
- [ ] Content moderation, ban bad actors

---

## 5. Phased roadmap

### Phase 0 — Validate (before code) ⏱ ~1–2 weeks
- Confirm with **WiPay** that an escrow-style hold/release flow is allowed and how to implement it. **This gates everything.**
- Download & study **Service Call** (the closest T&T competitor) — note what's missing/annoying.
- Talk to 5 tradesmen + 5 homeowners. Would they use this? What do they hate today?

### Phase 1 — MVP ⏱ ~2–3 months
The smallest thing that proves the model. **Cut ruthlessly.**
- Auth, profiles, ID verification (manual/admin)
- Post a job → bid → accept → chat → mark done → review
- Payments via WiPay (escrow if approved; otherwise pay-on-completion to start)
- One city first (Port of Spain) to keep supply/demand dense
- ❌ Skip for now: AI SmartQuotes, in-app wallet, scheduling, multi-island

### Phase 2 — Trust & polish ⏱ +1–2 months
- Real escrow flow, push notifications, ratings/reviews surfaced, "Verified" badges, dispute flow, better search/filtering

### Phase 3 — Differentiate & grow
- **AI SmartQuotes** (your standout feature), subscriptions/featured listings for pros, expand islands-wide, referral program

---

## 6. How you'll make money (decide early — it shapes the build)
- **Commission** on each completed job (e.g. 5–15%) — aligns with escrow, most common
- **Lead/bid fees** — pros pay to submit bids (Bark.com model)
- **Subscriptions** — pros pay monthly for visibility / unlimited bids
- **Featured listings** — pay to appear in "Top Rated"
> **DECISION (locked):** Launch on **commission via escrow**, kept **low or 0% for the first ~3 months** to beat the cold-start problem, then introduce a modest cut. It's the only model that doesn't punish an empty app, it rides on the escrow you're already building, and featured listings + pro subscriptions can be layered on in Phase 3 as pure upside.
> **Fallback** if WiPay escrow approval is slow: pay-on-completion + commission invoice, so payments don't block launch.

---

## 6a. VERIFIED — WiPay escrow & fees (official API docs v1.0.8, Dec 2024)

**WiPay has NO native escrow.** Confirmed *absent* from the API: authorize/capture (pre-auth), fund-holding, split-to-third-party, API payouts/disbursements, marketplace/sub-merchant accounts, API refunds. The `fee_structure=split` option only splits *who pays the WiPay fee* (customer vs merchant) — **not** the payment between parties.

- **What WiPay actually is:** a hosted card-payment page that deposits funds into **ONE** account (yours). Only `method` = `credit_card`. Money leaves only via **manual** dashboard "Withdraw" → bank in ~5–7 business days. Min transaction US$1.00.
- **Fees (TT), verified from the rate table:**
  - BASIC plan (free, no monthly fee): **3.50% + US$0.25** / transaction
  - Paid plan (Business Plus/Premium, monthly subscription): **3.00% + US$0.25** / transaction

**Implication — you build escrow; WiPay is just the card rail:**
```
Customer hires → pays into YOUR WiPay account (you hold = "escrow")
   → job confirmed done in-app
   → you pay tradesman out (manual withdrawal/transfer), keeping your commission
```
1. ⚠️ **You become custodian of others' money** → may trigger Central Bank of T&T / payment-services regulation. **Confirm with a lawyer + WiPay before launch.** (Normal for marketplaces, but must be checked.)
2. ⚙️ **Payouts are manual** (no API). Fine at MVP scale (process by hand); revisit FAC-direct or negotiate with WiPay at volume.

**MVP decision:** implement escrow as *holding funds in your WiPay account + manual payouts on completion*. Don't let full automation block launch — it's a Phase 2/3 problem.

*Source: [WiPay Payments API Documentation v1.0.8](https://wipaycaribbean.com/WiPay-API-Documentation.pdf), [WiPay Developers](https://wipaycaribbean.com/developers)*

---

## 7. Biggest risks
1. **Escrow/payments** — technically + legally the hardest. Validate first.
2. **Cold-start / chicken-and-egg** — no jobs → no pros, no pros → no jobs. Solve by seeding one city and recruiting pros manually at launch.
3. **Trust & safety** — one bad experience kills word-of-mouth. ID verification + reviews + escrow are your moat.
4. **Scope creep** — Service Call's mistake. Stay "trades, done right."

---

## 8. Immediate next steps
1. ☐ Contact WiPay re: escrow flow (Phase 0)
2. ☐ Install + audit Service Call
3. ☐ Lock the monetization model (commission recommended)
4. ☐ Set up the project skeleton: Expo app + Supabase project
5. ☐ Build the data model in Supabase
6. ☐ Build screen 1 (the home screen you already designed)

---
*Generated as a living planning doc — update as decisions are made.*

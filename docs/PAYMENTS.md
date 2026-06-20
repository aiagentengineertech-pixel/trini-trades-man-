# Payments

## Model
- **Non-custodial.** Money goes **directly from the customer to the tradesman** (the tradesman
  is the PayPal `payee`); the platform takes a fee via PayPal Commerce Platform. The app never
  holds funds.
- **Escrow-style** via PayPal **auth-and-capture**: the payment is *authorized* (held) when the
  customer hires, and *captured* (released to the tradesman) when the job is completed.
- **Currency: USD.** PayPal does not support TTD in Trinidad & Tobago, so PayPal charges are in
  US dollars. (Local TTD via **WiPay** is planned next — see bottom.)

## Architecture
Backend = **Supabase Edge Functions** (Deno) in `supabase/functions/`. Secrets live in the
function environment (never in the app):

| Function | Purpose |
|---|---|
| `paypal-create-order` | Customer hires → create a PayPal order (intent AUTHORIZE), payee = tradesman |
| `paypal-authorize` | After the customer approves → place the hold |
| `paypal-capture` | Job completed → release funds to the tradesman (+ platform fee) |
| `paypal-webhook` | Keep `payments` in sync (captures, refunds, voids) |

Database: a `payments` table + `profiles.paypal_merchant_id` (see `supabase/schema.sql`).

## Secrets (set these yourself — never paste them in chat)
From your **PayPal Developer dashboard → My Apps & Credentials** (use the **Sandbox** app first),
copy the **Client ID** and **Secret**, then set them via the Supabase CLI:

```bash
supabase secrets set \
  PAYPAL_ENV=sandbox \
  PAYPAL_CLIENT_ID=<your sandbox client id> \
  PAYPAL_SECRET=<your sandbox secret> \
  PLATFORM_FEE_PERCENT=10 \
  ENABLE_PLATFORM_FEES=false \
  PAYPAL_BN_CODE=<your partner BN code, once you have Commerce Platform> \
  PAYPAL_WEBHOOK_ID=<from the webhook you create in the PayPal dashboard>
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically.

> Keep `ENABLE_PLATFORM_FEES=false` until your **PayPal Commerce Platform (partner)** application
> is approved — auto per-job fees require it. With it off, the full amount goes to the tradesman.

## Deploy the functions
```bash
# one-time
npm i -g supabase
supabase login
supabase link --project-ref bhlflhyojzjzoksejekc

# deploy
supabase functions deploy paypal-create-order
supabase functions deploy paypal-authorize
supabase functions deploy paypal-capture
supabase functions deploy paypal-webhook
```
(You can also create/deploy functions from the Supabase dashboard → Edge Functions.)

## Webhook
In PayPal Developer → your app → **Add Webhook**, set the URL to your deployed function:
`https://bhlflhyojzjzoksejekc.functions.supabase.co/paypal-webhook`
Subscribe to: authorization created/voided, capture completed/refunded/reversed/denied.
Put the **Webhook ID** into `PAYPAL_WEBHOOK_ID`.

## Sandbox test flow
1. PayPal Developer → **Sandbox → Accounts**: you get a test **buyer** and **business (seller)**.
2. Put the seller's sandbox **merchant id** on a test tradesman's `profiles.paypal_merchant_id`.
3. From the app (next step — client UI): hire → `paypal-create-order` → open the `approveUrl`
   and log in as the **sandbox buyer** → `paypal-authorize` → complete the job → `paypal-capture`.
4. Verify the `payments` row moves `created → authorized → captured`.

## What's still to do
- [ ] **Client UI** — a "Pay & hire" button that calls the functions and opens the PayPal
      approval window (`expo-web-browser`), plus wiring capture into "mark job complete". *(Next.)*
- [ ] **Tradesman onboarding** — connect their PayPal (Partner Referrals) to set
      `paypal_merchant_id`. Until then, pay-to-payee falls back to your account in sandbox.
- [ ] **Go live**: PayPal Commerce Platform (partner) approval for auto-fees → live credentials
      → set `PAYPAL_ENV=live`, `ENABLE_PLATFORM_FEES=true`, live webhook id.

## WiPay (planned next)
WiPay is custody-only and TTD/local. It will be added for the **tradesman subscription** (your
own revenue) and as a local TTD option — pending your business registration + merchant account.

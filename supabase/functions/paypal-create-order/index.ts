// Creates a PayPal order to pay a tradesman for a job (non-custodial).
// The customer calls this when hiring. Intent = AUTHORIZE so the payment is
// HELD (escrow-style) and only captured when the job is completed.
//
// Body: { bidId: string }
// Returns: { orderId, approveUrl }
import { admin, cors, getAccessToken, getUser, json, paypalBase } from "../_shared/paypal.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await getUser(req);
    if (!user) return json({ error: "unauthorized" }, 401);

    const { bidId } = await req.json().catch(() => ({}));
    if (!bidId) return json({ error: "bidId required" }, 400);

    const db = admin();
    const { data: bid } = await db.from("bids").select("id, amount, job_id, tradesman_id").eq("id", bidId).single();
    if (!bid) return json({ error: "bid not found" }, 404);

    const { data: job } = await db.from("jobs").select("id, customer_id, title").eq("id", bid.job_id).single();
    if (!job) return json({ error: "job not found" }, 404);
    if (job.customer_id !== user.id) return json({ error: "not your job" }, 403);

    const { data: pro } = await db.from("profiles").select("paypal_merchant_id").eq("id", bid.tradesman_id).single();

    const amount = Number(bid.amount).toFixed(2);
    const feePct = Number(Deno.env.get("PLATFORM_FEE_PERCENT") ?? "10");
    const fee = (Number(amount) * feePct / 100).toFixed(2);
    const feesEnabled = Deno.env.get("ENABLE_PLATFORM_FEES") === "true";

    const purchaseUnit: Record<string, unknown> = {
      amount: { currency_code: "USD", value: amount },
      custom_id: bid.id,
      description: `Trini Tradesman — ${job.title}`.slice(0, 127),
    };
    // Pay the tradesman directly (requires they've connected their PayPal).
    // NOTE: for the AUTHORIZE flow the platform fee is applied at CAPTURE time
    // (see paypal-capture), not here.
    if (pro?.paypal_merchant_id) {
      purchaseUnit.payee = { merchant_id: pro.paypal_merchant_id };
    }
    void fee; void feesEnabled; // fee computed/applied at capture

    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const bn = Deno.env.get("PAYPAL_BN_CODE");
    if (bn) headers["PayPal-Partner-Attribution-Id"] = bn;

    const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({ intent: "AUTHORIZE", purchase_units: [purchaseUnit] }),
    });
    const order = await res.json();
    if (!res.ok) return json({ error: order.message ?? "order failed", details: order }, 502);

    await db.from("payments").insert({
      job_id: job.id,
      bid_id: bid.id,
      customer_id: user.id,
      tradesman_id: bid.tradesman_id,
      amount,
      platform_fee: feesEnabled ? fee : 0,
      currency: "USD",
      provider: "paypal",
      status: "created",
      paypal_order_id: order.id,
    });

    const approveUrl = (order.links ?? []).find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
    return json({ orderId: order.id, approveUrl });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

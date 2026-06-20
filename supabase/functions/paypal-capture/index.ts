// Captures (RELEASES) a previously authorized payment when the job is completed.
// Money moves to the tradesman; the platform fee (if enabled) is taken here via
// PayPal Commerce Platform. Call this when the customer marks the job done.
//
// Body: { orderId: string }
// Returns: { captureId, status }
import { admin, cors, getAccessToken, getUser, json, paypalBase } from "../_shared/paypal.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await getUser(req);
    if (!user) return json({ error: "unauthorized" }, 401);

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) return json({ error: "orderId required" }, 400);

    const db = admin();
    const { data: pay } = await db.from("payments")
      .select("id, customer_id, amount, paypal_authorization_id").eq("paypal_order_id", orderId).single();
    if (!pay) return json({ error: "payment not found" }, 404);
    if (pay.customer_id !== user.id) return json({ error: "not your payment" }, 403);
    if (!pay.paypal_authorization_id) return json({ error: "payment not authorized yet" }, 409);

    const feePct = Number(Deno.env.get("PLATFORM_FEE_PERCENT") ?? "10");
    const fee = (Number(pay.amount) * feePct / 100).toFixed(2);
    const feesEnabled = Deno.env.get("ENABLE_PLATFORM_FEES") === "true";

    const body: Record<string, unknown> = { final_capture: true };
    if (feesEnabled) {
      body.payment_instruction = { platform_fees: [{ amount: { currency_code: "USD", value: fee } }] };
    }

    const token = await getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const bn = Deno.env.get("PAYPAL_BN_CODE");
    if (bn) headers["PayPal-Partner-Attribution-Id"] = bn;

    const res = await fetch(`${paypalBase()}/v2/payments/authorizations/${pay.paypal_authorization_id}/capture`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) return json({ error: result.message ?? "capture failed", details: result }, 502);

    await db.from("payments")
      .update({
        status: "captured",
        paypal_capture_id: result.id ?? null,
        platform_fee: feesEnabled ? fee : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pay.id);

    return json({ captureId: result.id ?? null, status: "captured" });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

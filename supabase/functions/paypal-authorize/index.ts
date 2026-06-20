// Authorizes (HOLDS) an approved PayPal order. Call this after the customer has
// approved the order in the PayPal window — it places the hold so funds are
// reserved until the job is completed and captured.
//
// Body: { orderId: string }
// Returns: { authorizationId, status }
import { admin, cors, getAccessToken, getUser, json, paypalBase } from "../_shared/paypal.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await getUser(req);
    if (!user) return json({ error: "unauthorized" }, 401);

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) return json({ error: "orderId required" }, 400);

    const db = admin();
    const { data: pay } = await db.from("payments").select("id, customer_id").eq("paypal_order_id", orderId).single();
    if (!pay) return json({ error: "payment not found" }, 404);
    if (pay.customer_id !== user.id) return json({ error: "not your payment" }, 403);

    const token = await getAccessToken();
    const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/authorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok) return json({ error: result.message ?? "authorize failed", details: result }, 502);

    const authId = result.purchase_units?.[0]?.payments?.authorizations?.[0]?.id ?? null;
    await db.from("payments")
      .update({ status: "authorized", paypal_authorization_id: authId, updated_at: new Date().toISOString() })
      .eq("id", pay.id);

    return json({ authorizationId: authId, status: "authorized" });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

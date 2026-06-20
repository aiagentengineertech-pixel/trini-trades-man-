// Receives PayPal webhooks and keeps the payments table in sync (captures,
// refunds, voided/denied authorizations). Configure this function's URL as a
// webhook in the PayPal dashboard and set PAYPAL_WEBHOOK_ID in secrets.
import { admin, getAccessToken, paypalBase } from "../_shared/paypal.ts";

async function verify(req: Request, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) return false; // refuse unverified events in absence of a configured id
  const token = await getAccessToken();
  const res = await fetch(`${paypalBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  const out = await res.json().catch(() => ({}));
  return out.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  try {
    const raw = await req.text();
    if (!(await verify(req, raw))) return new Response("invalid signature", { status: 400 });

    const event = JSON.parse(raw);
    const type: string = event.event_type ?? "";
    const resource = event.resource ?? {};
    const db = admin();

    // resource.supplementary_data.related_ids.order_id links most events to our order.
    const orderId = resource?.supplementary_data?.related_ids?.order_id;

    const setStatus = async (status: string, extra: Record<string, unknown> = {}) => {
      if (!orderId) return;
      await db.from("payments").update({ status, updated_at: new Date().toISOString(), ...extra })
        .eq("paypal_order_id", orderId);
    };

    switch (type) {
      case "PAYMENT.AUTHORIZATION.CREATED":
        await setStatus("authorized", { paypal_authorization_id: resource.id });
        break;
      case "PAYMENT.CAPTURE.COMPLETED":
        await setStatus("captured", { paypal_capture_id: resource.id });
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED":
        await setStatus("refunded");
        break;
      case "PAYMENT.AUTHORIZATION.VOIDED":
        await setStatus("voided");
        break;
      case "PAYMENT.CAPTURE.DENIED":
        await setStatus("failed");
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String((e as Error)?.message ?? e), { status: 500 });
  }
});

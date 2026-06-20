// Shared PayPal + Supabase helpers for the Edge Functions.
// Secrets are read from the function environment (set via `supabase secrets set`):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV ("sandbox" | "live"),
//   PLATFORM_FEE_PERCENT (e.g. "10"), ENABLE_PLATFORM_FEES ("true"|"false"),
//   PAYPAL_BN_CODE (partner attribution / BN code, for Commerce Platform).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function paypalBase(): string {
  return Deno.env.get("PAYPAL_ENV") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
  if (!id || !secret) throw new Error("PayPal credentials not configured");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${id}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "PayPal auth failed");
  return data.access_token as string;
}

// Admin client (service-role) — bypasses RLS so the functions can write payments.
export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// Identify the signed-in caller from their bearer token.
export async function getUser(req: Request) {
  const authz = req.headers.get("Authorization") ?? "";
  const token = authz.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

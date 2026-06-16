import { supabase } from './supabase';

const BASE = (import.meta.env.VITE_ADMIN_API as string) || 'http://localhost:8787';

/** Authenticated fetch to the admin-server. Attaches the Supabase access token. */
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

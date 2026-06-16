// Two Supabase clients:
//  - `admin`  : service-role key, FULL access (bypasses RLS). Server-side only.
//  - `authClient` : anon key, used purely to validate a caller's JWT.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in env');
}

/** Full-access client. NEVER expose this key to the browser. */
export const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Anon client used only to verify incoming user access tokens. */
export const authClient = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

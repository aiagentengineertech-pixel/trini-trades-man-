// Seeds marketplace ACTIVITY so dashboards have real data: tradesmen send
// quotes (bids), a couple of customers accept, and one job is completed
// (escrow released). Idempotent-ish. Run after seed-users.mjs.
//
//   node scripts/seed-activity.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const PASSWORD = 'TriniSeed123!';
const E = (k) => `aiagentengineertech+${k}@gmail.com`;

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BIDS = [
  { pro: 'ttpro1', job: 'Install 2 ceiling fans', amount: 650, msg: 'Can do both fans this week, fully wired and tested.' },
  { pro: 'ttpro6', job: 'Repaint living & dining room', amount: 2200, msg: 'Two coats, edges taped, clean finish. 2 days.' },
  { pro: 'ttpro2', job: 'Fix leaking kitchen sink', amount: 380, msg: 'Will replace the trap and reseal. Same-day fix.' },
  { pro: 'ttpro3', job: 'Service split AC unit', amount: 500, msg: 'Full service, gas check and clean. Warranty included.' },
  { pro: 'ttpro4', job: 'Build a small wooden deck', amount: 6000, msg: 'Treated lumber, sealed. About 4 days of work.' },
];

const ACCEPT = [
  { customer: 'ttcust1', job: 'Install 2 ceiling fans', complete: true },
  { customer: 'ttcust2', job: 'Fix leaking kitchen sink', complete: false },
];

async function signIn(key) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: E(key), password: PASSWORD });
  if (error) throw new Error(`${key}: ${error.message}`);
  return data.user;
}
async function jobByTitle(title) {
  const { data } = await supabase.from('jobs').select('id, customer_id, status, title').eq('title', title).limit(1);
  return data?.[0];
}

async function main() {
  // 1) tradesmen send quotes
  for (const b of BIDS) {
    try {
      const pro = await signIn(b.pro);
      const job = await jobByTitle(b.job);
      if (!job) { console.warn(`  ? job not found: ${b.job}`); await supabase.auth.signOut(); continue; }
      const { data: existing } = await supabase.from('bids').select('id').eq('job_id', job.id).eq('tradesman_id', pro.id);
      if (existing?.length) { console.log(`  · bid exists: ${b.pro} → ${b.job}`); }
      else {
        const { error } = await supabase.from('bids').insert({ job_id: job.id, tradesman_id: pro.id, amount: b.amount, message: b.msg, status: 'pending' });
        console.log(error ? `  ✗ bid ${b.pro}: ${error.message}` : `  + quote ${b.pro} → ${b.job} (TT$${b.amount})`);
      }
      await supabase.auth.signOut();
    } catch (e) { console.warn(`✗ ${b.pro}: ${e.message}`); }
  }

  // 2) customers accept (and maybe complete)
  for (const a of ACCEPT) {
    try {
      const cust = await signIn(a.customer);
      const job = await jobByTitle(a.job);
      if (!job || job.customer_id !== cust.id) { console.warn(`  ? job mismatch: ${a.job}`); await supabase.auth.signOut(); continue; }
      const { data: bids } = await supabase.from('bids').select('id, status').eq('job_id', job.id);
      const pick = bids?.find((x) => x.status === 'accepted') ?? bids?.find((x) => x.status === 'pending');
      if (!pick) { console.warn(`  ? no bid to accept on ${a.job}`); await supabase.auth.signOut(); continue; }
      if (pick.status !== 'accepted') {
        const { error } = await supabase.rpc('accept_bid', { p_bid_id: pick.id });
        console.log(error ? `  ✗ accept ${a.job}: ${error.message}` : `  ✓ ${a.customer} accepted a quote on ${a.job}`);
      } else console.log(`  · already accepted: ${a.job}`);
      if (a.complete) {
        const { error } = await supabase.rpc('complete_job', { p_job_id: job.id });
        console.log(error ? `  ✗ complete ${a.job}: ${error.message}` : `  ✓✓ ${a.job} marked complete (escrow released)`);
      }
      await supabase.auth.signOut();
    } catch (e) { console.warn(`✗ ${a.customer}: ${e.message}`); }
  }

  console.log('\nActivity seeded.');
}

main().then(() => process.exit(0));

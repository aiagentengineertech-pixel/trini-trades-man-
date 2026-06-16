// Seeds REAL accounts (not placeholders) into Supabase so the marketplace has
// linked, checkable data: tradesmen with trade/bio/years/coords + customers who
// have posted jobs with coords. Idempotent — safe to re-run.
//
//   node scripts/seed-users.mjs
//
// Uses the public anon key + signUp (email confirmation must be OFF in Supabase
// Auth settings, which it already is). Every account uses the password below.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const PASSWORD = 'TriniSeed123!';

// --- load .env ---
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) throw new Error('Missing Supabase env vars in .env');

const supabase = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const TOWN = {
  'Port of Spain': [10.6549, -61.5019],
  'San Fernando': [10.2797, -61.4663],
  Chaguanas: [10.5167, -61.4111],
  Arima: [10.6375, -61.2825],
  Couva: [10.4236, -61.4364],
  'Diego Martin': [10.7167, -61.5667],
  Tunapuna: [10.65, -61.3833],
  'San Juan': [10.65, -61.45],
  Marabella: [10.3, -61.45],
};

const TRADESMEN = [
  { email: 'aiagentengineertech+ttpro1@gmail.com', name: 'Kishore Ramlal', trade: 'Electrician', town: 'Chaguanas', years: 12, radius: 30, phone: '+1 868 712 4451', bio: 'Licensed electrician handling rewiring, panel upgrades, breaker faults and emergency call-outs across central Trinidad.' },
  { email: 'aiagentengineertech+ttpro2@gmail.com', name: 'Anil Maharaj', trade: 'Plumbing', town: 'San Fernando', years: 9, radius: 25, phone: '+1 868 730 9982', bio: 'Plumber for leaks, water heaters, bathroom installs and blocked drains. Fast, clean, guaranteed work in the south.' },
  { email: 'aiagentengineertech+ttpro3@gmail.com', name: 'Deon Charles', trade: 'AC Repair', town: 'Arima', years: 7, radius: 35, phone: '+1 868 689 1130', bio: 'AC technician — split-unit servicing, gas top-ups, installs and repairs. Keeping homes cool east to west.' },
  { email: 'aiagentengineertech+ttpro4@gmail.com', name: 'Marlon Joseph', trade: 'Carpentry', town: 'Port of Spain', years: 15, radius: 25, phone: '+1 868 776 5521', bio: 'Custom carpentry: kitchens, wardrobes, decks and doors. 15 years building quality woodwork in the city.' },
  { email: 'aiagentengineertech+ttpro5@gmail.com', name: 'Rishi Persad', trade: 'Masonry', town: 'Couva', years: 11, radius: 30, phone: '+1 868 701 3345', bio: 'Mason for block work, plastering, driveways and foundations. Solid, reliable construction in central.' },
  { email: 'aiagentengineertech+ttpro6@gmail.com', name: 'Curtis Baptiste', trade: 'Painting', town: 'San Juan', years: 6, radius: 20, phone: '+1 868 744 8876', bio: 'Interior and exterior painting, waterproofing and finishes. Neat lines, fair prices, on time every time.' },
];

const CUSTOMERS = [
  { email: 'aiagentengineertech+ttcust1@gmail.com', name: 'Sasha Mohammed', town: 'Diego Martin', phone: '+1 868 333 1201' },
  { email: 'aiagentengineertech+ttcust2@gmail.com', name: 'Brent Williams', town: 'Tunapuna', phone: '+1 868 333 5567' },
  { email: 'aiagentengineertech+ttcust3@gmail.com', name: 'Ayesha Khan', town: 'Marabella', phone: '+1 868 333 9090' },
  { email: 'aiagentengineertech+ttcust4@gmail.com', name: 'Jrue George', town: 'Arima', phone: '+1 868 333 4412' },
];

const JOBS = [
  { cust: 0, trade: 'Electrician', title: 'Install 2 ceiling fans', desc: 'Two bedrooms need ceiling fans mounted and wired; fixtures already bought.', min: 400, max: 800 },
  { cust: 1, trade: 'Plumbing', title: 'Fix leaking kitchen sink', desc: 'Sink trap dripping under the cabinet, needs resealing or replacing.', min: 250, max: 500 },
  { cust: 2, trade: 'AC Repair', title: 'Service split AC unit', desc: '12,000 BTU unit not cooling well; needs servicing and a gas check.', min: 300, max: 600 },
  { cust: 3, trade: 'Carpentry', title: 'Build a small wooden deck', desc: 'Back porch deck approx 10x12 ft in treated lumber.', min: 4000, max: 7000 },
  { cust: 0, trade: 'Painting', title: 'Repaint living & dining room', desc: 'Two rooms, walls and ceiling; paint will be supplied.', min: 1500, max: 3000 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function auth(email) {
  let res = await supabase.auth.signUp({ email, password: PASSWORD });
  if (res.error && /already registered|already been registered/i.test(res.error.message)) {
    res = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  }
  if (res.error) throw new Error(`${email}: ${res.error.message}`);
  return res.data.user;
}

async function main() {
  const { data: trades, error: tErr } = await supabase.from('trades').select('id,name');
  if (tErr) throw tErr;
  const tradeId = Object.fromEntries(trades.map((t) => [t.name, t.id]));

  // --- tradesmen ---
  for (const p of TRADESMEN) {
    try {
      const user = await auth(p.email);
      const [lat, lng] = TOWN[p.town];
      await supabase.from('profiles').update({ full_name: p.name, phone: p.phone, area: p.town, role: 'tradesman', verified: true, location_lat: lat, location_lng: lng }).eq('id', user.id);
      await supabase.from('tradesman_info').upsert({ user_id: user.id, bio: p.bio, years_experience: p.years, service_radius_km: p.radius });
      if (tradeId[p.trade]) await supabase.from('tradesman_trades').upsert({ user_id: user.id, trade_id: tradeId[p.trade] });
      console.log(`✓ tradesman ${p.name} (${p.trade}, ${p.town})`);
      await supabase.auth.signOut();
      await sleep(500);
    } catch (e) {
      console.warn(`✗ ${p.email}: ${e.message}`);
    }
  }

  // --- customers + their jobs ---
  for (let ci = 0; ci < CUSTOMERS.length; ci++) {
    const c = CUSTOMERS[ci];
    try {
      const user = await auth(c.email);
      const [lat, lng] = TOWN[c.town];
      await supabase.from('profiles').update({ full_name: c.name, phone: c.phone, area: c.town, role: 'customer', location_lat: lat, location_lng: lng }).eq('id', user.id);

      const myJobs = JOBS.filter((j) => j.cust === ci);
      const { data: existing } = await supabase.from('jobs').select('title').eq('customer_id', user.id);
      const have = new Set((existing ?? []).map((r) => r.title));
      for (const j of myJobs) {
        if (have.has(j.title)) { console.log(`  · job exists: ${j.title}`); continue; }
        const { error } = await supabase.from('jobs').insert({
          customer_id: user.id, trade_id: tradeId[j.trade] ?? null, title: j.title, description: j.desc,
          area: c.town, location_lat: lat, location_lng: lng, budget_min: j.min, budget_max: j.max, status: 'open',
        });
        console.log(error ? `  ✗ job ${j.title}: ${error.message}` : `  + job ${j.title}`);
      }
      console.log(`✓ customer ${c.name} (${c.town})`);
      await supabase.auth.signOut();
      await sleep(500);
    } catch (e) {
      console.warn(`✗ ${c.email}: ${e.message}`);
    }
  }

  console.log('\nDone. All accounts use password:', PASSWORD);
}

main().then(() => process.exit(0));

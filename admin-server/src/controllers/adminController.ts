// Super-Admin Command Console controllers. All run AFTER requireSuperAdmin,
// so they use the service-role client (RLS bypassed) safely.
import type { Request, Response } from 'express';

import { admin, authClient } from '../supabase';

/** GET /api/admin/dashboard-metrics */
export async function dashboardMetrics(_req: Request, res: Response) {
  const nowIso = new Date().toISOString();
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalUsers, premiumUsers, jobsThisWeek] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_premium', true)
      .or(`premium_until.is.null,premium_until.gt.${nowIso}`),
    admin.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
  ]);

  return res.json({
    totalUsers: totalUsers.count ?? 0,
    activePremium: premiumUsers.count ?? 0,
    jobsThisWeek: jobsThisWeek.count ?? 0,
    generatedAt: nowIso,
  });
}

/** GET /api/admin/users?page=1&pageSize=25&q=search */
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
  const q = String(req.query.q ?? '').trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from('profiles')
    .select('id, full_name, role, region, is_premium, premium_until, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) query = query.or(`full_name.ilike.%${q}%,region.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    users: (data ?? []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      role: u.role,
      region: u.region,
      isPremium: !!u.is_premium,
      subscriptionExpiresAt: u.premium_until,
      createdAt: u.created_at,
    })),
  });
}

/** PATCH /api/admin/users/:id/subscription  body: { isPremium, monthsExtended } */
export async function updateSubscription(req: Request, res: Response) {
  const { id } = req.params;
  const { isPremium, monthsExtended } = req.body ?? {};

  if (typeof isPremium !== 'boolean') {
    return res.status(400).json({ error: 'isPremium (boolean) is required' });
  }
  const months = Number.isFinite(monthsExtended) ? Math.trunc(monthsExtended) : 0;

  // Read the current expiry so extensions stack on top of remaining time.
  const { data: current, error: readErr } = await admin
    .from('profiles')
    .select('premium_until')
    .eq('id', id)
    .single();
  if (readErr || !current) return res.status(404).json({ error: 'User not found' });

  let premiumUntil: string | null = current.premium_until ?? null;

  if (!isPremium) {
    premiumUntil = null; // revoke
  } else if (months > 0) {
    const existing = current.premium_until ? new Date(current.premium_until) : null;
    const base = existing && existing.getTime() > Date.now() ? existing : new Date();
    base.setMonth(base.getMonth() + months);
    premiumUntil = base.toISOString();
  }
  // isPremium === true && months === 0 -> keep existing expiry (or null = no expiry)

  const { data, error } = await admin
    .from('profiles')
    .update({ is_premium: isPremium, premium_until: premiumUntil })
    .eq('id', id)
    .select('id, full_name, is_premium, premium_until')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await logAction(req.adminUser?.id, 'subscription', id, { isPremium, monthsExtended: months, premiumUntil });
  return res.json({
    id: data.id,
    fullName: data.full_name,
    isPremium: !!data.is_premium,
    subscriptionExpiresAt: data.premium_until,
  });
}

/** PATCH /api/admin/features/toggle-gate  body: { key, enabled, note? } */
export async function toggleFeatureGate(req: Request, res: Response) {
  const { key, enabled, note } = req.body ?? {};
  if (!key || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'key (string) and enabled (boolean) are required' });
  }

  // Only include `note` when explicitly provided so toggling a gate never
  // wipes its seeded description/label/category (omitted columns are preserved
  // on conflict-update).
  const payload: Record<string, unknown> = {
    key,
    enabled,
    updated_at: new Date().toISOString(),
    updated_by: req.adminUser?.id ?? null,
  };
  if (typeof note === 'string') payload.note = note;

  const { data, error } = await admin
    .from('feature_gates')
    .upsert(payload, { onConflict: 'key' })
    .select('key, enabled, note, label, category, updated_at')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.json(data);
}

/** GET /api/admin/features  -> list all gates (handy for the console UI) */
export async function listFeatureGates(_req: Request, res: Response) {
  const { data, error } = await admin
    .from('feature_gates')
    .select('key, enabled, note, label, category, updated_at')
    .order('category', { ascending: true })
    .order('key', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ gates: data ?? [] });
}

// ---------- audit helper ----------
async function logAction(adminId: string | undefined, action: string, targetId: string | null, detail: any) {
  try { await admin.from('admin_actions').insert({ admin_id: adminId ?? null, action, target_id: targetId, detail }); } catch { /* non-fatal */ }
}

const last30 = () => {
  const days: { date: string; key: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, key: d.toISOString().slice(0, 10), count: 0 });
  }
  return days;
};
const bucket = (rows: any[], series: ReturnType<typeof last30>) => {
  const idx: Record<string, { count: number }> = {};
  series.forEach((s) => (idx[s.key] = s));
  rows.forEach((r) => { const k = (r.created_at ?? '').slice(0, 10); if (idx[k]) idx[k].count++; });
  return series.map((s) => ({ date: s.date, count: s.count }));
};

/** GET /api/admin/analytics — full analytics payload for the dashboard charts. */
export async function analytics(_req: Request, res: Response) {
  const [profilesR, jobsR, bidsR, reviewsR, tradesR, ttR] = await Promise.all([
    admin.from('profiles').select('id, role, verified, is_premium, premium_until, region, created_at'),
    admin.from('jobs').select('id, trade_id, area, status, created_at'),
    admin.from('bids').select('job_id, created_at'),
    admin.from('reviews').select('stars'),
    admin.from('trades').select('id, name'),
    admin.from('tradesman_trades').select('trade_id'),
  ]);
  const profiles = profilesR.data ?? [];
  const jobs = jobsR.data ?? [];
  const bids = bidsR.data ?? [];
  const reviews = reviewsR.data ?? [];
  const tradeName: Record<string, string> = {};
  (tradesR.data ?? []).forEach((t: any) => (tradeName[t.id] = t.name));

  const tradesmen = profiles.filter((p: any) => p.role === 'tradesman' || p.role === 'both');
  const nowMs = Date.now();
  const premiumCount = profiles.filter((p: any) => p.is_premium && (!p.premium_until || new Date(p.premium_until).getTime() > nowMs)).length;
  const filled = jobs.filter((j: any) => j.status === 'hired' || j.status === 'done').length;

  // time-to-first-bid (hours)
  const firstBid: Record<string, number> = {};
  bids.forEach((b: any) => { const t = new Date(b.created_at).getTime(); if (!firstBid[b.job_id] || t < firstBid[b.job_id]) firstBid[b.job_id] = t; });
  const ttfb: number[] = [];
  jobs.forEach((j: any) => { if (firstBid[j.id]) ttfb.push((firstBid[j.id] - new Date(j.created_at).getTime()) / 3600000); });
  const avgTtfb = ttfb.length ? ttfb.reduce((a, b) => a + b, 0) / ttfb.length : null;

  // per-trade
  const byTradeMap: Record<string, { posted: number; hired: number }> = {};
  jobs.forEach((j: any) => {
    const name = tradeName[j.trade_id] || 'Other';
    (byTradeMap[name] ??= { posted: 0, hired: 0 }).posted++;
    if (j.status === 'hired' || j.status === 'done') byTradeMap[name].hired++;
  });
  const supplyByTrade: Record<string, number> = {};
  (ttR.data ?? []).forEach((r: any) => { const n = tradeName[r.trade_id] || 'Other'; supplyByTrade[n] = (supplyByTrade[n] ?? 0) + 1; });
  const byTrade = Object.entries(byTradeMap).map(([trade, v]) => ({
    trade, posted: v.posted, hired: v.hired, fillRate: v.posted ? Math.round((v.hired / v.posted) * 100) : 0, supply: supplyByTrade[trade] ?? 0,
  })).sort((a, b) => b.posted - a.posted);

  // per-region (demand)
  const byRegionMap: Record<string, number> = {};
  jobs.forEach((j: any) => { const a = j.area || 'Unknown'; byRegionMap[a] = (byRegionMap[a] ?? 0) + 1; });
  const byRegion = Object.entries(byRegionMap).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  const ratingDist = [1, 2, 3, 4, 5].map((s) => ({ stars: s, count: reviews.filter((r: any) => r.stars === s).length }));

  return res.json({
    liquidity: {
      fillRate: jobs.length ? Math.round((filled / jobs.length) * 100) : 0,
      hireRate: jobs.length ? Math.round((filled / jobs.length) * 100) : 0,
      bidsPerJob: jobs.length ? Math.round((bids.length / jobs.length) * 10) / 10 : 0,
      avgTimeToFirstBidHrs: avgTtfb == null ? null : Math.round(avgTtfb * 10) / 10,
      byTrade,
      byRegion,
    },
    growth: {
      totalUsers: profiles.length,
      tradesmen: tradesmen.length,
      customers: profiles.filter((p: any) => p.role === 'customer').length,
      signupsSeries: bucket(profiles, last30()),
      jobsSeries: bucket(jobs, last30()),
    },
    trust: {
      verifiedPct: tradesmen.length ? Math.round((tradesmen.filter((p: any) => p.verified).length / tradesmen.length) * 100) : 0,
      ratingDist,
      completionRate: filled ? Math.round((jobs.filter((j: any) => j.status === 'done').length / filled) * 100) : 0,
      cancellationRate: jobs.length ? Math.round((jobs.filter((j: any) => j.status === 'cancelled').length / jobs.length) * 100) : 0,
    },
    saas: {
      premiumCount,
      tradesmen: tradesmen.length,
      conversionPct: tradesmen.length ? Math.round((premiumCount / tradesmen.length) * 100) : 0,
    },
  });
}

/** GET /api/admin/users/:id — full detail for one user. */
export async function userDetail(req: Request, res: Response) {
  const { id } = req.params;
  const { data: p, error } = await admin
    .from('profiles')
    .select('id, full_name, phone, area, region, role, verified, is_premium, premium_until, suspended, rating_avg, rating_count, created_at')
    .eq('id', id).single();
  if (error || !p) return res.status(404).json({ error: 'User not found' });

  const [jobs, bidsMade, invoices, reviews] = await Promise.all([
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('customer_id', id),
    admin.from('bids').select('id', { count: 'exact', head: true }).eq('tradesman_id', id),
    admin.from('invoices').select('id', { count: 'exact', head: true }).eq('owner_id', id),
    admin.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewee_id', id),
  ]);

  return res.json({
    id: p.id, fullName: p.full_name, phone: p.phone, area: p.area, region: p.region, role: p.role,
    verified: !!p.verified, isPremium: !!p.is_premium, subscriptionExpiresAt: p.premium_until,
    suspended: !!p.suspended, ratingAvg: Number(p.rating_avg) || 0, ratingCount: p.rating_count ?? 0, createdAt: p.created_at,
    counts: { jobsPosted: jobs.count ?? 0, bidsMade: bidsMade.count ?? 0, invoices: invoices.count ?? 0, reviews: reviews.count ?? 0 },
  });
}

/** PATCH /api/admin/users/:id — verify / role / suspend. */
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { verified, role, suspended } = req.body ?? {};
  const patch: any = {};
  if (typeof verified === 'boolean') patch.verified = verified;
  if (role && ['customer', 'tradesman', 'both', 'super_admin'].includes(role)) patch.role = role;
  if (typeof suspended === 'boolean') patch.suspended = suspended;
  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const { error } = await admin.from('profiles').update(patch).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  // Suspension also blocks login at the auth layer.
  if (typeof suspended === 'boolean') {
    await admin.auth.admin.updateUserById(id, { ban_duration: suspended ? '87600h' : 'none' }).catch(() => {});
  }
  await logAction(req.adminUser?.id, 'update_user', id, patch);
  return res.json({ ok: true, ...patch });
}

/** POST /api/admin/users/:id/reset-password — send a password reset email. */
export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user?.email) return res.status(404).json({ error: 'User not found' });
  await authClient.auth.resetPasswordForEmail(data.user.email);
  await logAction(req.adminUser?.id, 'reset_password', id, { email: data.user.email });
  return res.json({ ok: true });
}

/** POST /api/admin/broadcast — body { title, body, audience } -> in-app notification to many users. */
export async function broadcast(req: Request, res: Response) {
  const { title, body, audience } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });

  let q = admin.from('profiles').select('id');
  if (audience === 'customers') q = q.eq('role', 'customer');
  else if (audience === 'tradesmen') q = q.in('role', ['tradesman', 'both']);
  else if (audience && audience !== 'all') q = q.eq('region', audience); // region name
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data ?? []).map((u: any) => ({ user_id: u.id, type: 'system', title, body }));
  if (rows.length) {
    // insert in chunks to be safe
    for (let i = 0; i < rows.length; i += 500) {
      const { error: insErr } = await admin.from('notifications').insert(rows.slice(i, i + 500));
      if (insErr) return res.status(500).json({ error: insErr.message });
    }
  }
  await logAction(req.adminUser?.id, 'broadcast', null, { audience: audience ?? 'all', title, recipients: rows.length });
  return res.json({ ok: true, recipients: rows.length });
}

/** GET /api/admin/audit — recent admin actions. */
export async function auditLog(_req: Request, res: Response) {
  const { data, error } = await admin
    .from('admin_actions')
    .select('id, action, target_id, detail, created_at, admin:profiles!admin_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    actions: (data ?? []).map((a: any) => ({
      id: a.id, action: a.action, targetId: a.target_id, detail: a.detail,
      admin: a.admin?.full_name ?? 'admin', createdAt: a.created_at,
    })),
  });
}

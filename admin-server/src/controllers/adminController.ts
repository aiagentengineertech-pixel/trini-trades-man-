// Super-Admin Command Console controllers. All run AFTER requireSuperAdmin,
// so they use the service-role client (RLS bypassed) safely.
import type { Request, Response } from 'express';

import { admin } from '../supabase';

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

  const { data, error } = await admin
    .from('feature_gates')
    .upsert(
      { key, enabled, note: note ?? null, updated_at: new Date().toISOString(), updated_by: req.adminUser?.id ?? null },
      { onConflict: 'key' },
    )
    .select('key, enabled, note, updated_at')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.json(data);
}

/** GET /api/admin/features  -> list all gates (handy for the console UI) */
export async function listFeatureGates(_req: Request, res: Response) {
  const { data, error } = await admin.from('feature_gates').select('key, enabled, note, updated_at').order('key');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ gates: data ?? [] });
}

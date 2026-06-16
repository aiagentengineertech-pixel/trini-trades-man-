// Strict admin gate. Validates the caller's Supabase JWT and confirms their
// profile role is SUPER_ADMIN. To hide the very existence of these routes from
// regular users / curious employees, every failure returns a flat 404.
import type { NextFunction, Request, Response } from 'express';

import { admin, authClient } from '../supabase';

const notFound = (res: Response) => res.status(404).json({ error: 'Not found' });

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return notFound(res);

    // 1) Validate the JWT against Supabase Auth.
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user) return notFound(res);

    // 2) Confirm the role in the profiles table (service-role read).
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (pErr || !profile || profile.role !== 'super_admin') return notFound(res);

    req.adminUser = { id: data.user.id, email: data.user.email ?? null };
    return next();
  } catch {
    return notFound(res);
  }
}

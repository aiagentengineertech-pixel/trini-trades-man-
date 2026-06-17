import { useEffect, useState } from 'react';

import { api } from '../api';

interface Action { id: string; action: string; admin: string; targetId: string | null; detail: any; createdAt: string }

const LABEL: Record<string, string> = {
  update_user: 'Updated user', reset_password: 'Sent password reset', broadcast: 'Sent broadcast',
  subscription: 'Changed subscription',
};

export default function Audit() {
  const [items, setItems] = useState<Action[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api<{ actions: Action[] }>('/api/admin/audit').then((r) => setItems(r.actions)).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="err">{err}</p>;

  return (
    <div>
      <p className="muted">Every admin action is logged here.</p>
      <table>
        <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="muted" style={{ whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleString()}</td>
              <td>{a.admin}</td>
              <td>{LABEL[a.action] || a.action}</td>
              <td className="muted" style={{ fontSize: 12 }}>{a.detail ? JSON.stringify(a.detail) : '—'}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="muted">No admin actions yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

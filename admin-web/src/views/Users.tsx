import { useCallback, useEffect, useState } from 'react';

import { api } from '../api';

interface AdminUser {
  id: string; fullName: string | null; role: string; region: string | null;
  isPremium: boolean; subscriptionExpiresAt: string | null;
}
interface UsersResponse { page: number; totalPages: number; total: number; users: AdminUser[] }

export default function Users() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [data, setData] = useState<UsersResponse | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setErr(null);
    api<UsersResponse>(`/api/admin/users?page=${page}&pageSize=25&q=${encodeURIComponent(q)}`)
      .then(setData).catch((e) => setErr(e.message));
  }, [page, q]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="toolbar">
        <input className="search" placeholder="Search name or region…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
      </div>
      {err && <p className="err">{err}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Region</th><th>Premium</th><th>Expires</th><th></th></tr>
        </thead>
        <tbody>
          {data?.users.map((u) => (
            <tr key={u.id}>
              <td>{u.fullName || '—'}</td>
              <td>{u.role}</td>
              <td>{u.region || '—'}</td>
              <td><span className={`pill ${u.isPremium ? 'on' : 'off'}`}>{u.isPremium ? 'Premium' : 'Free'}</span></td>
              <td className="muted">{u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="linkbtn" onClick={() => setDetailId(u.id)}>Details</button>
                <button className="linkbtn" style={{ marginLeft: 12 }} onClick={() => setEditing(u)}>Billing</button>
              </td>
            </tr>
          ))}
          {data && data.users.length === 0 && <tr><td colSpan={6} className="muted">No users.</td></tr>}
        </tbody>
      </table>
      <div className="pager">
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="muted">Page {data?.page ?? 1} / {data?.totalPages ?? 1} · {data?.total ?? 0} users</span>
        <button className="btn secondary" disabled={!data || page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {editing && <SubscriptionModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {detailId && <UserDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  );
}

interface UserDetail {
  id: string; fullName: string | null; phone: string | null; area: string | null; region: string | null;
  role: string; verified: boolean; isPremium: boolean; suspended: boolean; ratingAvg: number; ratingCount: number;
  createdAt: string; counts: { jobsPosted: number; bidsMade: number; invoices: number; reviews: number };
}

function UserDetailModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => api<UserDetail>(`/api/admin/users/${id}`).then(setD).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]);

  const patch = async (body: any, note: string) => {
    setBusy(true); setErr(null); setMsg(null);
    try { await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); setMsg(note); await load(); onChanged(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const resetPw = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try { await api(`/api/admin/users/${id}/reset-password`, { method: 'POST' }); setMsg('Password reset email sent.'); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
        {!d ? <p className="muted">Loading…</p> : (
          <>
            <h3>{d.fullName || 'User'}</h3>
            <p className="muted" style={{ marginTop: -8 }}>{d.role} · {d.area || d.region || 'no area'} · joined {new Date(d.createdAt).toLocaleDateString()}</p>
            <div className="countgrid">
              <div><b>{d.counts.jobsPosted}</b><span>Jobs</span></div>
              <div><b>{d.counts.bidsMade}</b><span>Bids</span></div>
              <div><b>{d.counts.invoices}</b><span>Invoices</span></div>
              <div><b>{d.ratingAvg.toFixed(1)} ({d.counts.reviews})</b><span>Rating</span></div>
            </div>

            <div className="row"><span>Verified tradesman</span>
              <button className="btn ghost" onClick={() => patch({ verified: !d.verified }, d.verified ? 'Unverified.' : 'Verified ✓')} disabled={busy}>{d.verified ? 'Verified ✓ — revoke' : 'Verify'}</button>
            </div>
            <div className="row"><span>Role</span>
              <select className="field" style={{ width: 160, marginBottom: 0 }} value={d.role} onChange={(e) => patch({ role: e.target.value }, 'Role updated.')} disabled={busy}>
                <option value="customer">customer</option>
                <option value="tradesman">tradesman</option>
                <option value="both">both</option>
                <option value="super_admin">super_admin</option>
              </select>
            </div>
            <div className="row"><span>Account</span>
              <button className="btn ghost" style={d.suspended ? undefined : { borderColor: '#999', color: '#999' }} onClick={() => patch({ suspended: !d.suspended }, d.suspended ? 'Reinstated.' : 'Suspended.')} disabled={busy}>{d.suspended ? 'Suspended — reinstate' : 'Suspend / ban'}</button>
            </div>
            <div className="row"><span>Password</span>
              <button className="btn ghost" onClick={resetPw} disabled={busy}>Send reset email</button>
            </div>

            {msg && <p className="ok" style={{ color: 'var(--green)' }}>{msg}</p>}
            {err && <p className="err">{err}</p>}
            <div style={{ textAlign: 'right', marginTop: 14 }}><button className="btn secondary" style={{ width: 'auto', padding: '10px 18px' }} onClick={onClose}>Close</button></div>
          </>
        )}
      </div>
    </div>
  );
}

function SubscriptionModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [isPremium, setIsPremium] = useState(user.isPremium);
  const [months, setMonths] = useState('0');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await api(`/api/admin/users/${user.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ isPremium, monthsExtended: Number(months) || 0 }),
      });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{user.fullName || 'User'} — subscription</h3>
        <div className="row">
          <span>Premium access</span>
          <label><input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} /> {isPremium ? 'On' : 'Off'}</label>
        </div>
        <div className="row">
          <span>Extend months</span>
          <input className="field" style={{ width: 90, marginBottom: 0 }} type="number" min={0} value={months} onChange={(e) => setMonths(e.target.value)} disabled={!isPremium} />
        </div>
        <p className="muted">Extensions stack on remaining time. Turning premium off revokes immediately.</p>
        {err && <p className="err">{err}</p>}
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

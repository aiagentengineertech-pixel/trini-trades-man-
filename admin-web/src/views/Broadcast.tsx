import { useState } from 'react';

import { api } from '../api';

export default function Broadcast() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!title.trim() || !body.trim()) { setErr('Title and message are required.'); return; }
    if (!confirm(`Send "${title}" to: ${audience}?`)) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await api<{ recipients: number }>('/api/admin/broadcast', {
        method: 'POST', body: JSON.stringify({ title: title.trim(), body: body.trim(), audience }),
      });
      setResult(`Sent to ${r.recipients} user${r.recipients === 1 ? '' : 's'}.`);
      setTitle(''); setBody('');
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <p className="muted">Send an in-app notification to users. They'll see it in their Notifications screen.</p>
      <label className="lbl">Audience</label>
      <select className="field" value={audience} onChange={(e) => setAudience(e.target.value)}>
        <option value="all">All users</option>
        <option value="customers">Customers only</option>
        <option value="tradesmen">Tradesmen only</option>
      </select>
      <label className="lbl">Title</label>
      <input className="field" placeholder="e.g. New feature: branded invoices" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="lbl">Message</label>
      <textarea className="field" style={{ minHeight: 90 }} placeholder="Your announcement…" value={body} onChange={(e) => setBody(e.target.value)} />
      {result && <p className="ok">{result}</p>}
      {err && <p className="err">{err}</p>}
      <button className="btn" style={{ width: 'auto', padding: '12px 22px', marginTop: 8 }} onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send broadcast'}</button>
    </div>
  );
}

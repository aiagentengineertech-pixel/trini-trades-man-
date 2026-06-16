import { useCallback, useEffect, useState } from 'react';

import { api } from '../api';

interface Gate { key: string; enabled: boolean; note: string | null; updated_at: string }

const KNOWN = ['invoices', 'crm', 'catalog', 'dispatch', 'expenses', 'team'];

export default function Features() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [newKey, setNewKey] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ gates: Gate[] }>('/api/admin/features').then((r) => setGates(r.gates)).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (key: string, enabled: boolean) => {
    setErr(null);
    try {
      await api('/api/admin/features/toggle-gate', { method: 'PATCH', body: JSON.stringify({ key, enabled }) });
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const addGate = async () => {
    const key = newKey.trim().toLowerCase();
    if (!key) return;
    await toggle(key, true);
    setNewKey('');
  };

  const existing = new Set(gates.map((g) => g.key));
  const suggestions = KNOWN.filter((k) => !existing.has(k));

  return (
    <div>
      {err && <p className="err">{err}</p>}
      {gates.map((g) => (
        <div className="gate" key={g.key}>
          <div>
            <strong>{g.key}</strong>
            <div className="muted">{g.enabled ? 'Enabled' : 'Disabled'} · updated {new Date(g.updated_at).toLocaleString()}</div>
          </div>
          <label><input type="checkbox" checked={g.enabled} onChange={(e) => toggle(g.key, e.target.checked)} /> {g.enabled ? 'On' : 'Off'}</label>
        </div>
      ))}
      {gates.length === 0 && <p className="muted">No feature gates yet. Add one below to control a module globally.</p>}

      <div className="toolbar" style={{ marginTop: 16 }}>
        <input className="search" placeholder="New gate key (e.g. invoices)" value={newKey} onChange={(e) => setNewKey(e.target.value)} list="gate-suggestions" />
        <datalist id="gate-suggestions">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        <button className="btn" style={{ width: 'auto', padding: '10px 18px' }} onClick={addGate}>Add gate</button>
      </div>
    </div>
  );
}

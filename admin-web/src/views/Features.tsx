import { useCallback, useEffect, useState } from 'react';

import { api } from '../api';

interface Gate {
  key: string;
  enabled: boolean;
  note: string | null;
  label: string | null;
  category: string | null;
  updated_at: string;
}

const CATEGORY_ORDER = ['Business suite', 'Marketplace', 'Payments', 'Growth & comms', 'Access', 'Other'];

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
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) return;
    await toggle(key, true);
    setNewKey('');
  };

  // Group gates by category for display.
  const groups = new Map<string, Gate[]>();
  for (const g of gates) {
    const cat = g.category || 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(g);
  }
  const orderedCats = [...groups.keys()].sort(
    (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99),
  );

  const enabledCount = gates.filter((g) => g.enabled).length;

  return (
    <div>
      {err && <p className="err">{err}</p>}
      <p className="muted" style={{ marginBottom: 16 }}>
        Remote kill-switches. Everything defaults <strong>On</strong>; turn one <strong>Off</strong> to hide or disable
        that feature for all users instantly. {enabledCount}/{gates.length} on.
      </p>

      {orderedCats.map((cat) => (
        <div key={cat} style={{ marginBottom: 22 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }}>{cat}</h3>
          {groups.get(cat)!.map((g) => (
            <div className="gate" key={g.key}>
              <div>
                <strong>{g.label || g.key}</strong>
                <div className="muted">{g.note || g.key}</div>
                <div className="muted" style={{ fontSize: 11, opacity: 0.6 }}>
                  {g.key} · updated {new Date(g.updated_at).toLocaleString()}
                </div>
              </div>
              <label>
                <input type="checkbox" checked={g.enabled} onChange={(e) => toggle(g.key, e.target.checked)} /> {g.enabled ? 'On' : 'Off'}
              </label>
            </div>
          ))}
        </div>
      ))}

      {gates.length === 0 && <p className="muted">No feature gates yet. Run the schema seed, or add one below.</p>}

      <div className="toolbar" style={{ marginTop: 16 }}>
        <input className="search" placeholder="New gate key (e.g. live_chat)" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <button className="btn" style={{ width: 'auto', padding: '10px 18px' }} onClick={addGate}>Add gate</button>
      </div>
    </div>
  );
}

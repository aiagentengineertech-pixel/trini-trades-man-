import { useEffect, useState } from 'react';

import { api } from '../api';

interface Metrics { totalUsers: number; activePremium: number; jobsThisWeek: number }

export default function Dashboard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Metrics>('/api/admin/dashboard-metrics').then(setM).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="err">{err}</p>;
  if (!m) return <p className="muted">Loading metrics…</p>;

  return (
    <div className="metrics">
      <div className="metric"><div className="v">{m.totalUsers.toLocaleString()}</div><div className="l">Registered users</div></div>
      <div className="metric"><div className="v">{m.activePremium.toLocaleString()}</div><div className="l">Active premium accounts</div></div>
      <div className="metric"><div className="v">{m.jobsThisWeek.toLocaleString()}</div><div className="l">Jobs posted this week</div></div>
    </div>
  );
}

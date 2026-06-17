import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { api } from '../api';

interface Analytics {
  liquidity: {
    fillRate: number; hireRate: number; bidsPerJob: number; avgTimeToFirstBidHrs: number | null;
    byTrade: { trade: string; posted: number; hired: number; fillRate: number; supply: number }[];
    byRegion: { region: string; count: number }[];
  };
  growth: { totalUsers: number; tradesmen: number; customers: number; signupsSeries: { date: string; count: number }[]; jobsSeries: { date: string; count: number }[] };
  trust: { verifiedPct: number; ratingDist: { stars: number; count: number }[]; completionRate: number; cancellationRate: number };
  saas: { premiumCount: number; tradesmen: number; conversionPct: number };
}

const RED = '#E11D26';
const GREEN = '#2EA84F';

export default function Dashboard() {
  const [a, setA] = useState<Analytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api<Analytics>('/api/admin/analytics').then(setA).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="err">{err}</p>;
  if (!a) return <p className="muted">Loading analytics…</p>;

  return (
    <div>
      {/* North-star + headline tiles */}
      <div className="metrics">
        <Tile v={`${a.liquidity.fillRate}%`} l="Fill rate (north-star)" hi />
        <Tile v={a.liquidity.avgTimeToFirstBidHrs == null ? '—' : `${a.liquidity.avgTimeToFirstBidHrs}h`} l="Avg time to first bid" />
        <Tile v={`${a.liquidity.bidsPerJob}`} l="Bids per job" />
      </div>
      <div className="metrics" style={{ marginTop: 14 }}>
        <Tile v={`${a.growth.totalUsers}`} l="Total users" />
        <Tile v={`${a.trust.verifiedPct}%`} l="Verified tradesmen" />
        <Tile v={`${a.saas.premiumCount} (${a.saas.conversionPct}%)`} l="Premium accounts" />
      </div>

      {/* Trend charts */}
      <div className="chart-grid">
        <Panel title="Signups (last 30 days)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={a.growth.signupsSeries} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={RED} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Jobs posted (last 30 days)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={a.growth.jobsSeries} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={GREEN} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Fill rate by trade (%)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.liquidity.byTrade} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 30 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="trade" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="fillRate" fill={RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Demand by region (open + posted jobs)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.liquidity.byRegion} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 30 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#2F6FED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Rating distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.trust.ratingDist} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {a.trust.ratingDist.map((r) => <Cell key={r.stars} fill={r.stars >= 4 ? GREEN : r.stars === 3 ? '#E8852B' : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Supply vs demand by trade">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.liquidity.byTrade} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="trade" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={44} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="supply" name="Pros" fill={GREEN} radius={[3, 3, 0, 0]} />
              <Bar dataKey="posted" name="Jobs" fill={RED} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        Trust: {a.trust.completionRate}% completion · {a.trust.cancellationRate}% cancellation. Money/escrow analytics arrive with the WiPay integration.
      </p>
    </div>
  );
}

function Tile({ v, l, hi }: { v: string; l: string; hi?: boolean }) {
  return <div className="metric" style={hi ? { borderColor: RED, borderWidth: 2 } : undefined}><div className="v">{v}</div><div className="l">{l}</div></div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel"><div className="panel-title">{title}</div>{children}</div>;
}

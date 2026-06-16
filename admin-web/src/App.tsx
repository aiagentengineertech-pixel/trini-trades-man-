import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { api } from './api';
import { supabase } from './supabase';
import Dashboard from './views/Dashboard';
import Features from './views/Features';
import Login from './views/Login';
import Users from './views/Users';

type Tab = 'dashboard' | 'users' | 'features';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Verify super-admin by calling a gated endpoint (non-admins get 404).
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    api('/api/admin/dashboard-metrics').then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
  }, [session]);

  if (checking) return <div className="center">Loading…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="center">Checking access…</div>;
  if (!isAdmin) {
    return (
      <div className="center">
        <p>This account does not have admin access.</p>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="topbar">
        <h1>Trini Tradesman — Command Console</h1>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      <div className="tabs">
        {(['dashboard', 'users', 'features'] as Tab[]).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'dashboard' ? 'Dashboard' : t === 'users' ? 'Users' : 'Feature gates'}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'users' && <Users />}
      {tab === 'features' && <Features />}
    </div>
  );
}

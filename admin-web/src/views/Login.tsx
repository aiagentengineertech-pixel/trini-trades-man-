import { useState } from 'react';

import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message);
  };

  return (
    <form className="login" onSubmit={submit}>
      <h1>Command Console</h1>
      <p>Trini Tradesman — operators only.</p>
      <input className="field" type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {err && <p className="err">{err}</p>}
    </form>
  );
}

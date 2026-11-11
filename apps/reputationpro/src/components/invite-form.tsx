'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

// Branch manager accepts an invitation (/pakvietimas/{token}).
export function InviteForm({ token, email }: { token: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setProblem('');
    try {
      const res = await fetch('/api/branch-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: f.get('email'), password: f.get('password'), password_confirm: f.get('password_confirm') }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url || '/admin');
    } catch (err) { setProblem(err instanceof Error && err.message ? err.message : 'Nepavyko.'); setBusy(false); }
  }
  return <form className="claim-form" onSubmit={submit}>
    <label>Jūsų el. paštas<input name="email" type="email" required autoComplete="email" maxLength={254} defaultValue={email}/>
      <small>Šiuo adresu prisijungsite ir gausite šio filialo klientų pastabas.</small></label>
    <div className="form-row">
      <label>Sugalvokite slaptažodį<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128}/><small>Mažiausiai 8 simboliai.</small></label>
      <label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128}/></label>
    </div>
    {problem && <p className="form-error" role="alert">{problem}</p>}
    <button className="btn btn-primary btn-full" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <ArrowRight size={18}/>} Prisijungti prie filialo</button>
  </form>;
}

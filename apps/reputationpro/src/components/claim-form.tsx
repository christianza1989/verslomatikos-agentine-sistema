'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, Mail, Check } from 'lucide-react';

// 1-step activation of a pre-provisioned profile (/aktyvuoti/{token}).
export function ClaimForm({ token, googleUrl, googleVerified, email: initialEmail }: { token: string; googleUrl: string; googleVerified: boolean; email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const emailChanged = email.trim().toLowerCase() !== initialEmail.toLowerCase();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [editGoogle, setEditGoogle] = useState(!googleVerified);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setProblem('');
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: f.get('password'),
          password_confirm: f.get('password_confirm'),
          google_review_url: editGoogle ? String(f.get('google_review_url') || '') : undefined,
          email: email.trim(),
          email_confirm: emailChanged ? String(f.get('email_confirm') || '') : email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Nepavyko aktyvuoti. Bandykite dar kartą.');
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="stack-form claim-form">
    <label>Prisijungimo el. paštas
      <input name="email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)}/>
      <small>Šiuo adresu prisijungsite ir gausite pranešimus apie naujas klientų pastabas. Galite įrašyti kitą, pvz. asmeninį.</small>
    </label>
    {emailChanged && <label>Pakartokite el. paštą<input name="email_confirm" type="email" required autoComplete="off" maxLength={254}/></label>}
    {editGoogle
      ? <label>Google atsiliepimų nuoroda <span>(galite patikslinti ir vėliau)</span>
          <input name="google_review_url" type="url" maxLength={2000} defaultValue={googleUrl} placeholder="https://g.page/r/…/review"/>
          <small>Google verslo profilyje spauskite „Prašyti atsiliepimų“ ir nukopijuokite nuorodą.</small>
        </label>
      : <button type="button" className="claim-edit-link" onClick={() => setEditGoogle(true)}>Google nuoroda neteisinga? Pakeisti</button>}
    <div className="form-row">
      <label>Sugalvokite slaptažodį<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} autoFocus/><small>Mažiausiai 8 simboliai.</small></label>
      <label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128}/></label>
    </div>
    {problem && <p role="alert" className="form-error">{problem}</p>}
    <button className="btn btn-primary btn-full claim-submit" disabled={busy}>
      {busy ? <LoaderCircle size={18} className="spin"/> : <ArrowRight size={18}/>} {busy ? 'Aktyvuojama…' : 'Pradėti 14 d. nemokamai'}
    </button>
    <p className="form-fineprint">Be banko kortelės. Planą pasirinksite tik bandymo pabaigoje.</p>
  </form>;
}

// Shown when a prepared (demo) profile is reached without its token: mail a fresh link
// to the address on file. Nothing about the account is revealed beyond a masked email.
export function ClaimResend({ slug, businessName }: { slug: string; businessName: string }) {
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [problem, setProblem] = useState('');
  async function resend() {
    setBusy(true); setProblem('');
    try {
      const res = await fetch('/api/claim/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSentTo(data.sent_to);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Nepavyko išsiųsti.');
    } finally { setBusy(false); }
  }
  return <div className="claim-resend" role="status">
    <strong>„{businessName}“ paskyra jau paruošta</strong>
    {sentTo
      ? <p><Check size={15}/> Aktyvavimo nuorodą išsiuntėme į <b>{sentTo}</b>. Atverkite laišką ir nustatykite slaptažodį.</p>
      : <>
          <p>Nieko pildyti nereikia: atsiųsime aktyvavimo nuorodą į įmonės el. paštą, kuriuo jau susisiekėme.</p>
          <button type="button" className="btn btn-secondary btn-small" onClick={resend} disabled={busy}>
            {busy ? <LoaderCircle size={15} className="spin"/> : <Mail size={15}/>} Atsiųsti aktyvavimo nuorodą
          </button>
        </>}
    {problem && <p role="alert" className="form-error">{problem}</p>}
  </div>;
}

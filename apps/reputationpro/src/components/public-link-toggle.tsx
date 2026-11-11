'use client';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

// Owner decides whether customers who rate 1–3★ also see the public review link (Google or Rekvizitai.lt).
export function PublicLinkToggle({ clientId, initial, platform = 'Google' }: { clientId: string; initial: boolean; platform?: string }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [saved, setSaved] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true); setProblem(''); setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, show_public_link_low: next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOn(next); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setProblem(e instanceof Error ? e.message : 'Nepavyko išsaugoti.'); }
    finally { setBusy(false); }
  }

  return <div className="setting-toggle">
    <label className="switch-row">
      <span className="switch"><input type="checkbox" role="switch" checked={on} disabled={busy} onChange={(e) => toggle(e.target.checked)}/><i/></span>
      <span className="switch-text">
        <strong>Rodyti viešo {platform} atsiliepimo nuorodą ir po 1–3★ įvertinimo</strong>
        <small>{on
          ? `Įjungta: po žemo įvertinimo klientas mato privačią formą Jūsų komandai ir mažą nuorodą „Rašyti atsiliepimą ${platform}“.`
          : 'Išjungta: po žemo įvertinimo klientas mato tik privačią formą Jūsų komandai.'}</small>
        <small className="switch-note">{platform === 'Google' ? 'Google taisyklės draudžia atgrasyti klientus nuo neigiamų atsiliepimų. Įjungus nuorodą, šios rizikos išvengiama. Sprendimas Jūsų.' : 'Viešą atsiliepimą klientas visada gali parašyti ir pats. Sprendimas Jūsų.'}</small>
      </span>
      {busy && <LoaderCircle size={16} className="spin"/>}
    </label>
    {saved && <p className="success-text" role="status">Išsaugota.</p>}
    {problem && <p className="form-error" role="alert">{problem}</p>}
  </div>;
}

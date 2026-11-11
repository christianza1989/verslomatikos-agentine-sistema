'use client';
// ROADMAP K5: who receives customer notes. The account email always does; the business can add
// up to 3 more (reception, administrator, manager) so the team can react without waiting.
import { useState } from 'react';
import { Check, LoaderCircle, Mail, Plus, Users, X } from 'lucide-react';

const MAX = 3;

export function NotifyEmails({ clientId, accountEmail, initial }: { clientId: string; accountEmail: string; initial: string[] }) {
  const [list, setList] = useState<string[]>(initial.length ? initial : []);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (i: number, v: string) => { setSaved(false); setList((l) => l.map((x, j) => (j === i ? v : x))); };
  async function save() {
    setBusy(true); setProblem(''); setSaved(false);
    const notify_emails = list.map((e) => e.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, notify_emails }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setList(notify_emails); setSaved(true);
    } catch (e) { setProblem(e instanceof Error && e.message ? e.message : 'Nepavyko išsaugoti.'); }
    finally { setBusy(false); }
  }

  return <div className="notify-emails">
    <div className="ne-head"><Users size={18}/><div><strong>Kas gauna klientų pastabas</strong>
      <small>Kai klientas parašo pastabą, el. laiškas iškart ateina visiems šiems adresams. Pridėkite registratūrą ar administratorių: darbuotojai galės patys greitai sureaguoti.</small></div></div>
    <ul className="ne-list">
      <li className="ne-fixed"><Mail size={15}/><span>{accountEmail}</span><em>paskyros el. paštas</em></li>
      {list.map((e, i) => <li key={i}>
        <input type="email" value={e} maxLength={254} placeholder="registratura@imone.lt" aria-label={`Papildomas el. paštas ${i + 1}`} onChange={(ev) => set(i, ev.target.value)}/>
        <button type="button" className="ne-remove" aria-label="Pašalinti" onClick={() => { setSaved(false); setList((l) => l.filter((_, j) => j !== i)); }}><X size={15}/></button>
      </li>)}
    </ul>
    <div className="ne-actions">
      {list.length < MAX && <button type="button" className="btn btn-secondary btn-small" onClick={() => { setSaved(false); setList((l) => [...l, '']); }}><Plus size={14}/> Pridėti adresą</button>}
      <button type="button" className="btn btn-primary btn-small" disabled={busy} onClick={save}>{busy ? <LoaderCircle size={14} className="spin"/> : <Check size={14}/>} Išsaugoti</button>
      {saved && <span className="success-text" role="status">Išsaugota.</span>}
    </div>
    {problem && <p className="form-error" role="alert">{problem}</p>}
  </div>;
}

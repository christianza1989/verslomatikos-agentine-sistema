'use client';
// Branches (filialai), 2026-11-11: one account can run review pages for all its locations.
// Each branch has its own page, QR codes, notes inbox, statistics and settings; the dashboard
// switches between them with ?clinic={slug}.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Building2, Check, ExternalLink, LoaderCircle, MapPin, MessageSquare, Plus, Printer, Star, Trash2, X } from 'lucide-react';

export type LocationView = {
  id: string; slug: string; business_name: string; location_label: string; is_root: boolean;
  platform: 'google' | 'rekvizitai'; link_ok: boolean; ratings: number; positive: number; ratings30: number; unread: number;
};

type FormValues = { business_name: string; location_label: string; google_review_url: string; email: string; phone: string; slug?: string };

export function BranchForm({ mode, rootName, rootEmail, rootId, branchId, initial, onDone }: {
  mode: 'create' | 'edit'; rootName: string; rootEmail: string; rootId?: string; branchId?: string; initial?: Partial<FormValues>; onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: FormValues & { parent_id?: string } = {
      business_name: String(f.get('business_name') || ''), location_label: String(f.get('location_label') || ''),
      google_review_url: String(f.get('google_review_url') || ''), email: String(f.get('email') || ''), phone: String(f.get('phone') || ''),
    };
    if (mode === 'edit') body.slug = String(f.get('slug') || '') || undefined;
    if (mode === 'create' && rootId) body.parent_id = rootId; // used only for the owner login
    setBusy(true); setProblem(''); setSaved(false);
    try {
      const res = await fetch(mode === 'create' ? '/api/admin/branches' : `/api/admin/branches?id=${encodeURIComponent(branchId || '')}`, {
        method: mode === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (mode === 'create') { router.push(`/admin?clinic=${encodeURIComponent(data.slug)}#qr`); return; }
      setSaved(true);
      if (data.slug && data.slug !== initial?.slug) router.push(`/admin?clinic=${encodeURIComponent(data.slug)}#settings`); else router.refresh();
      onDone?.();
    } catch (err) { setProblem(err instanceof Error && err.message ? err.message : 'Nepavyko išsaugoti.'); }
    finally { setBusy(false); }
  }

  return <form className="bm-form" onSubmit={submit}>
    <div className="bm-row">
      <label>Filialo pavadinimas<input name="business_name" required minLength={2} maxLength={120} defaultValue={initial?.business_name || ''} placeholder={`${rootName} Kaunas`}/>
        <small>Taip jį matys klientai atsiliepimų puslapyje.</small></label>
      <label>Miestas ar adresas<input name="location_label" maxLength={120} defaultValue={initial?.location_label || ''} placeholder="Kaunas, Savanorių pr. 1"/>
        <small>Kad lengvai atskirtumėte filialus skydelyje.</small></label>
    </div>
    <label>Šio filialo atsiliepimų nuoroda (Google arba Rekvizitai.lt)<input name="google_review_url" type="url" required maxLength={2000} defaultValue={initial?.google_review_url || ''} placeholder="https://g.page/r/…/review"/>
      <small>Kiekvienas filialas Google turi savo profilį: jo verslo profilyje spauskite „Prašyti atsiliepimų“ ir nukopijuokite nuorodą. Neturite? Tinka ir Rekvizitai.lt nuoroda arba <a href="/google-profilis" target="_blank" rel="noopener noreferrer">instrukcija, kaip susikurti</a>.</small></label>
    <div className="bm-row">
      <label>Filialo el. paštas <span>(nebūtina)</span><input name="email" type="email" maxLength={254} defaultValue={initial?.email || ''} placeholder="kaunas@imone.lt"/>
        <small>Pastabos iš šio filialo ateis čia ir į {rootEmail}.</small></label>
      <label>Telefonas <span>(nebūtina)</span><input name="phone" type="tel" maxLength={40} defaultValue={initial?.phone || ''} placeholder="+370"/></label>
    </div>
    {mode === 'edit' && <label>Puslapio adresas<input name="slug" required minLength={3} maxLength={70} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={initial?.slug || ''}/>
      <small className="bm-warn"><AlertTriangle size={13}/> Pakeitus adresą, jau atspausdinti šio filialo QR kodai nebeveiks.</small></label>}
    {problem && <p className="form-error" role="alert">{problem}</p>}
    <div className="bm-actions">
      <button className="btn btn-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin"/> : mode === 'create' ? <Plus size={16}/> : <Check size={16}/>} {mode === 'create' ? 'Sukurti filialą ir QR kodus' : 'Išsaugoti filialą'}</button>
      {onDone && mode === 'create' && <button type="button" className="btn btn-secondary" onClick={onDone}><X size={16}/> Atšaukti</button>}
      {saved && <span className="success-text" role="status"><Check size={15}/> Išsaugota.</span>}
    </div>
  </form>;
}

export function ArchiveBranch({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button type="button" className="btn btn-secondary btn-small bm-archive" disabled={busy} onClick={async () => {
    if (!confirm(`Pašalinti filialą „${name}“? Jo atsiliepimų puslapis ir QR kodai nustos veikti. Gauti įvertinimai ir pastabos išliks.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/branches?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (res?.ok) router.push('/admin#filialai'); else alert('Nepavyko pašalinti filialo.');
  }}><Trash2 size={14}/> Pašalinti filialą</button>;
}

export function BranchManager({ rootId, rootName, rootEmail, locations, current, canAdd, max }: {
  rootId: string; rootName: string; rootEmail: string; locations: LocationView[]; current: string; canAdd: boolean; max: number;
}) {
  const [adding, setAdding] = useState(false);
  const branches = locations.length - 1;
  return <section id="filialai" className="dashboard-panel bm">
    <div className="panel-heading">
      <div>
        <h2>Filialai ir vietos</h2>
        <p>Kiekvienas filialas turi savo atsiliepimų puslapį, QR kodus, pastabų dėžutę ir nustatymus. {branches ? `Iš viso vietų: ${locations.length}.` : 'Turite daugiau padalinių? Pridėkite juos čia.'}</p>
      </div>
      {canAdd && !adding && <button type="button" className="btn btn-primary btn-small" onClick={() => setAdding(true)}><Plus size={15}/> Pridėti filialą</button>}
    </div>
    {adding && <div className="bm-new"><h3><Building2 size={17}/> Naujas filialas</h3>
      <BranchForm mode="create" rootId={rootId} rootName={rootName} rootEmail={rootEmail} onDone={() => setAdding(false)}/></div>}
    {!canAdd && branches >= max && <p className="bm-limit">Pasiektas filialų limitas ({max}). Parašykite tomas@verslomatika.lt, jei reikia daugiau.</p>}
    <ul className="bm-list">
      {locations.map((l) => <li key={l.id} className={l.slug === current ? 'is-current' : ''}>
        <div className="bm-main">
          <b>{l.business_name}{l.is_root && <span className="bm-tag">Pagrindinis</span>}{l.slug === current && <span className="bm-tag bm-tag-on">Dabar valdote</span>}</b>
          <small>{l.location_label ? <><MapPin size={12}/> {l.location_label} · </> : null}/r/{l.slug}</small>
          <span className={`bm-link ${l.link_ok ? 'is-ok' : 'is-warn'}`}>{l.link_ok ? <Check size={12}/> : <AlertTriangle size={12}/>} {l.platform === 'rekvizitai' ? 'Rekvizitai.lt' : l.link_ok ? 'Google susieta' : 'Patikslinkite Google nuorodą'}</span>
        </div>
        <div className="bm-stats">
          <span><Star size={13} fill="currentColor" strokeWidth={0}/> {l.ratings} <small>({l.ratings30} per 30 d.)</small></span>
          <span className={l.unread ? 'is-unread' : ''}><MessageSquare size={13}/> {l.unread} neperskait.</span>
        </div>
        <div className="bm-row-actions">
          {l.slug !== current && <a className="btn btn-primary btn-small" href={`/admin?clinic=${encodeURIComponent(l.slug)}`}>Valdyti <ArrowRight size={14}/></a>}
          <a className="btn btn-secondary btn-small" href={`/admin/print?type=stand&slug=${encodeURIComponent(l.slug)}`} target="_blank"><Printer size={14}/> QR</a>
          <a className="btn btn-secondary btn-small" href={`/r/${l.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Puslapis</a>
        </div>
      </li>)}
    </ul>
  </section>;
}

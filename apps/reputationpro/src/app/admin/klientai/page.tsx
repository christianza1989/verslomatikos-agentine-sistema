import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Building2, Flame, FlaskConical, Gift, MapPin, PackageCheck, Phone, Star, Truck, Users } from 'lucide-react';
import { getActivatedClients, getCompanyCampaigns, getHotLeads, getSubjectVariantStats, isTestAccount, SUBJECT_CASES, SUBJECT_MIN_SAMPLE, type StandOrder } from '@/lib/db';
import { appUrl, currentPrincipal } from '@/lib/security';
import { CompanyActions, CopyText, OrderActions } from '@/components/owner-orders';

// Owner overview (2026-11-11): every business that activated its account and every
// free QR + NFC stand order, so the owner knows what to ship and to whom.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Klientai ir stoveliai · ReputationPro' };

const STATUS: Record<StandOrder['status'], string> = { requested: 'Laukia išsiuntimo', sent: 'Išsiųsta', delivered: 'Pristatyta', canceled: 'Atšaukta' };
const COMPANY_STATUS: Record<string, string> = { active: 'Vyksta', paused: 'Atsakė – atsakykite', stopped: 'Sustabdyta', converted: 'Aktyvavo' };
const SUB: Record<string, string> = { trialing: '14 d. bandymas', active: 'Aktyvi prenumerata', past_due: 'Vėluoja mokėjimas', canceled: 'Atšaukta', pending: 'Laukia' };
// The server PC clock is not in Lithuania (2026-11-12): always format in Europe/Vilnius.
const TZ = 'Europe/Vilnius';
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('lt-LT', { timeZone: TZ }) : '–';
const dayTime = (iso: string | null) => iso ? new Date(iso).toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ }) : '–';
// Google shows Lithuanian numbers as "(0-699) 11198": dial as +370 699 11198.
const tel = (p: string) => { const d = p.replace(/[^+\d]/g, ''); return d.startsWith('0') ? `+370${d.slice(1)}` : d.startsWith('8') && d.length === 9 ? `+370${d.slice(1)}` : d; };
const pct = (v: number) => `${Math.round(v * 100)} %`;

export default async function OwnerClients() {
  const principal = await currentPrincipal();
  if (!principal) redirect('/admin/login');
  if (principal.role !== 'owner') redirect('/admin');

  const rows = getActivatedClients();
  const realRows = rows.filter((r) => !isTestAccount(r));
  const hot = getHotLeads();
  const companies = getCompanyCampaigns();
  const subjects = getSubjectVariantStats();
  const base = appUrl();
  // Stand orders of main profiles and of their branches (filialai), one list.
  type OrderItem = { key: string; slug: string; title: string; sub: string | null; order: NonNullable<typeof rows[number]['order']> };
  const items: OrderItem[] = rows.flatMap((r) => [
    ...(r.order ? [{ key: r.order.id, slug: r.slug, title: r.business_name, sub: null, order: r.order }] : []),
    ...r.branches.filter((b) => b.order).map((b) => ({ key: b.order!.id, slug: b.slug, title: b.business_name, sub: `Filialas · ${r.business_name}${b.location_label ? ` · ${b.location_label}` : ''}`, order: b.order! })),
  ]).filter((i) => i.order.status !== 'canceled');
  const toShip = items.filter((i) => i.order.status === 'requested');
  const shipped = items.filter((i) => i.order.status !== 'requested');
  const branchCount = rows.reduce((n, r) => n + r.branches.length, 0);
  const totalRatings = rows.reduce((n, r) => n + r.ratings + r.branches.reduce((m, b) => m + b.ratings, 0), 0);

  return <main className="ok">
    <header className="ok-top">
      <Link href="/admin" className="ok-back"><ArrowLeft size={16}/> Į skydelį</Link>
      <div><h1>Klientai ir stoveliai</h1><p>Visos aktyvuotos paskyros ir nemokamų QR + NFC stovelių užsakymai.</p></div>
    </header>

    <section className="ok-kpis">
      <div><Users size={18}/><strong>{realRows.length}</strong><span>aktyvavo paskyrą{branchCount ? ` · ${branchCount} filialų` : ''}{rows.length > realRows.length ? ` · +${rows.length - realRows.length} testinės` : ''}</span></div>
      <div className={toShip.length ? 'is-hot' : ''}><Gift size={18}/><strong>{toShip.length}</strong><span>stovelių laukia išsiuntimo</span></div>
      <div><Truck size={18}/><strong>{shipped.length}</strong><span>išsiųsta / pristatyta</span></div>
      <div><Star size={18}/><strong>{totalRatings}</strong><span>klientų įvertinimų iš viso</span></div>
    </section>

    <section className="ok-panel">
      <h2><Gift size={18}/> Stovelių užsakymai</h2>
      {items.length === 0 && <p className="ok-empty">Užsakymų dar nėra. Klientai stovelį užsisako savo skydelyje (blokas „Nemokamas stovelis“).</p>}
      <div className="ok-orders">
        {[...toShip, ...shipped].map((r) => {
          const o = r.order;
          const nfc = `${base}/r/${r.slug}?s=stovelis`;
          return <article key={r.key} className={`ok-order is-${o.status}`}>
            <div className="ok-order-head">
              <div><b>{r.title}</b>{r.sub && <small>{r.sub}</small>}<small>Užsakyta {dayTime(o.created_at)}{o.updated_at && o.updated_at !== o.created_at ? ` · pakeista ${dayTime(o.updated_at)}` : ''}</small></div>
              <span className={`ok-pill is-${o.status}`}>{o.status === 'delivered' ? <PackageCheck size={13}/> : o.status === 'sent' ? <Truck size={13}/> : <Gift size={13}/>} {STATUS[o.status]}{o.sent_at && o.status !== 'requested' ? ` ${day(o.sent_at)}` : ''}</span>
            </div>
            <div className="ok-order-body">
              <p className="ok-addr"><MapPin size={15}/> <span>{o.delivery_address}</span> <CopyText text={o.delivery_address} label="Kopijuoti adresą"/></p>
              <p><b>Kiekis:</b> {o.quantity}{o.notes ? <> · <b>Pastabos:</b> {o.notes}</> : null}</p>
              <p className="ok-nfc"><b>NFC / QR nuoroda:</b> <code>{nfc}</code> <CopyText text={nfc} label="Kopijuoti"/></p>
            </div>
            <OrderActions orderId={o.id} status={o.status}/>
          </article>;
        })}
      </div>
    </section>

    <section className="ok-panel">
      <h2><Flame size={18}/> Karšti lead'ai: paspaudė arba atsakė</h2>
      <p className="ok-empty">Paskambinkite per 24 val. „Demo veiksmai“ = žmogus spaudė žvaigždutes demo puslapyje (robotai to nedaro). Vien atidarymai neįtraukti: dalį jų padaro pašto programos.</p>
      {hot.length === 0 ? <p className="ok-empty">Kol kas niekas nepaspaudė ir neatsakė.</p> :
      <div className="ok-table-wrap"><table className="ok-table">
        <thead><tr><th>Įmonė</th><th>Ką darė</th><th>Kontaktai</th><th>Paskutinis veiksmas</th></tr></thead>
        <tbody>{hot.map((h) => <tr key={h.id}>
          <td>{h.slug ? <Link href={`/r/${encodeURIComponent(h.slug)}`} target="_blank"><b>{h.business_name}</b></Link> : <b>{h.business_name}</b>}{h.is_demo === 0 ? <span className="ok-tag">aktyvavo</span> : null}<small>laiškas {day(h.sent_at)}</small></td>
          <td>{h.replied_at ? <b>Atsakė</b> : null}{h.replied_at && h.last_reply_text ? <small>„{h.last_reply_text.slice(0, 140)}{h.last_reply_text.length > 140 ? '…' : ''}“</small> : null}
            <small>{[h.demo_actions ? `demo veiksmų: ${h.demo_actions}` : '', h.clicks ? `paspaudimų: ${h.clicks}` : '', h.opens ? `atidarymų: ${h.opens}` : ''].filter(Boolean).join(' · ')}</small></td>
          <td><a href={`mailto:${h.email}`}>{h.email}</a>{h.phone ? <small><a href={`tel:${tel(h.phone)}`}><Phone size={12}/> {tel(h.phone)}</a></small> : null}</td>
          <td>{dayTime(h.replied_at || h.last_at)}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    <section className="ok-panel">
      <h2><Users size={18}/> Aktyvavę klientai</h2>
      {rows.length === 0 ? <p className="ok-empty">Dar niekas neaktyvavo paskyros.</p> :
      <div className="ok-table-wrap"><table className="ok-table">
        <thead><tr><th>Įmonė</th><th>Kontaktai</th><th>Aktyvuota</th><th>Planas</th><th>Įvertinimai</th><th>Stovelis</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>
          <td><Link href={`/admin?clinic=${encodeURIComponent(r.slug)}`}><b>{r.business_name}</b></Link>{isTestAccount(r) ? <span className="ok-tag">testas</span> : null}{r.branches.length ? <span className="ok-tag">{r.branches.length} filial.</span> : null}<small>{r.slug}</small>
            {r.branches.length > 0 && <div className="ok-branches">{r.branches.map((b) => <span key={b.id}>↳ <Link href={`/admin?clinic=${encodeURIComponent(b.slug)}`}>{b.business_name}</Link>{b.location_label ? ` · ${b.location_label}` : ''} · {b.ratings}★{b.unread ? ` · ${b.unread} neperskait.` : ''}{b.order ? ` · stovelis: ${STATUS[b.order.status].toLowerCase()}` : ''}</span>)}</div>}</td>
          <td><a href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <small>{r.phone}</small>}</td>
          <td>{dayTime(r.activated_at)}</td>
          <td>{SUB[r.subscription_status] || r.subscription_status}{r.trial_ends_at && r.subscription_status === 'trialing' ? <small>iki {day(r.trial_ends_at)}</small> : null}</td>
          <td><b>{r.ratings + r.branches.reduce((n, b) => n + b.ratings, 0)}</b>{r.branches.length ? <small>pagrindinis: {r.ratings}</small> : null}{r.ratings ? <small>{r.positive} × 4–5★ · paskutinis {day(r.last_rating_at)}</small> : <small>dar nėra</small>}{r.unread ? <small className="ok-unread">{r.unread} neperskaitytos pastabos</small> : null}</td>
          <td>{r.order ? <span className={`ok-pill is-${r.order.status}`}>{STATUS[r.order.status]}</span> : <small>neužsakė</small>}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    <section className="ok-panel">
      <h2><Building2 size={18}/> Kampanijos pagal įmones</h2>
      <p className="ok-empty">Viena įmonė = vienas pokalbis: pirmas laiškas pristato visus filialus, kitam filialo adresui rašoma tik jei tylima (kas 3 darbo d., iki 3 adresų).</p>
      {companies.length === 0 ? <p className="ok-empty">Įmonių kampanijų dar nėra.</p> :
      <div className="ok-table-wrap"><table className="ok-table">
        <thead><tr><th>Įmonė</th><th>Filialai</th><th>Parašyta</th><th>Būsena</th><th></th></tr></thead>
        <tbody>{companies.map((c) => <tr key={c.company_key}>
          <td>{c.root_slug ? <Link href={`/r/${encodeURIComponent(c.root_slug)}`} target="_blank"><b>{c.name}</b></Link> : <b>{c.name}</b>}<small>{c.company_key.replace(/^[a-z]:/, '')}{c.agent_id ? ` · ${c.agent_id.replace('agent-', '')}` : ''}</small></td>
          <td>{c.members.length}<small>{[...new Set(c.members.map((m) => m.city).filter(Boolean))].join(', ')}</small></td>
          <td>{c.contacted.length}<small>{c.contacted.join(', ')}</small></td>
          <td><span className={`ok-pill is-${c.status === 'converted' ? 'delivered' : c.status === 'active' ? 'sent' : c.status === 'paused' ? 'requested' : 'canceled'}`}>{COMPANY_STATUS[c.status] || c.status}</span>{c.reason && <small>{c.reason}</small>}</td>
          <td>{c.status !== 'converted' && <CompanyActions companyKey={c.company_key} status={c.status}/>}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    <section className="ok-panel">
      <h2><FlaskConical size={18}/> Laiškų temų rezultatai</h2>
      <p className="ok-empty">Pirmo laiško tema parenkama pagal lead'ą (A, B arba C) ir lieka ta pati follow-up'uose. Kol variantas turi mažiau nei {SUBJECT_MIN_SAMPLE} išsiuntimų, išvadų nedarykite. Atidarymus kai kurios pašto programos blokuoja, todėl paspaudimai patikimesni.</p>
      {subjects.length === 0 ? <p className="ok-empty">Laiškų su temos variantu dar neišsiųsta.</p> :
      <div className="ok-table-wrap"><table className="ok-table">
        <thead><tr><th>Atvejis</th><th>Variantas</th><th>Išsiųsta</th><th>Atidaryta</th><th>Paspausta</th><th>Aktyvavo</th></tr></thead>
        <tbody>{subjects.map((s) => <tr key={`${s.case_key}:${s.variant}`}>
          <td><b>{SUBJECT_CASES[s.case_key] || s.case_key}</b></td>
          <td><b>{s.variant}</b>{s.example && <small>pvz. „{s.example}“</small>}</td>
          <td>{s.sent}</td>
          {s.enough ? <>
            <td>{pct(s.open_rate)}<small>{s.opened}</small></td>
            <td>{pct(s.click_rate)}<small>{s.clicked}</small></td>
          </> : <td colSpan={2}><small>per mažai duomenų ({s.opened} atid. · {s.clicked} pasp.)</small></td>}
          <td>{s.activated}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>

  </main>;
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Gift, MapPin, PackageCheck, Star, Truck, Users } from 'lucide-react';
import { getActivatedClients, type StandOrder } from '@/lib/db';
import { appUrl, currentPrincipal } from '@/lib/security';
import { CopyText, OrderActions } from '@/components/owner-orders';

// Owner overview (2026-11-11): every business that activated its account and every
// free QR + NFC stand order, so the owner knows what to ship and to whom.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Klientai ir stoveliai · ReputationPro' };

const STATUS: Record<StandOrder['status'], string> = { requested: 'Laukia išsiuntimo', sent: 'Išsiųsta', delivered: 'Pristatyta', canceled: 'Atšaukta' };
const SUB: Record<string, string> = { trialing: '14 d. bandymas', active: 'Aktyvi prenumerata', past_due: 'Vėluoja mokėjimas', canceled: 'Atšaukta', pending: 'Laukia' };
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('lt-LT') : '–';
const dayTime = (iso: string | null) => iso ? new Date(iso).toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' }) : '–';

export default async function OwnerClients() {
  const principal = await currentPrincipal();
  if (!principal) redirect('/admin/login');
  if (principal.role !== 'owner') redirect('/admin');

  const rows = getActivatedClients();
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
      <div><Users size={18}/><strong>{rows.length}</strong><span>aktyvavo paskyrą{branchCount ? ` · ${branchCount} filialų` : ''}</span></div>
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
      <h2><Users size={18}/> Aktyvavę klientai</h2>
      {rows.length === 0 ? <p className="ok-empty">Dar niekas neaktyvavo paskyros.</p> :
      <div className="ok-table-wrap"><table className="ok-table">
        <thead><tr><th>Įmonė</th><th>Kontaktai</th><th>Aktyvuota</th><th>Planas</th><th>Įvertinimai</th><th>Stovelis</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>
          <td><Link href={`/admin?clinic=${encodeURIComponent(r.slug)}`}><b>{r.business_name}</b></Link>{r.branches.length ? <span className="ok-tag">{r.branches.length} filial.</span> : null}<small>{r.slug}</small>
            {r.branches.length > 0 && <div className="ok-branches">{r.branches.map((b) => <span key={b.id}>↳ <Link href={`/admin?clinic=${encodeURIComponent(b.slug)}`}>{b.business_name}</Link>{b.location_label ? ` · ${b.location_label}` : ''} · {b.ratings}★{b.unread ? ` · ${b.unread} neperskait.` : ''}{b.order ? ` · stovelis: ${STATUS[b.order.status].toLowerCase()}` : ''}</span>)}</div>}</td>
          <td><a href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <small>{r.phone}</small>}</td>
          <td>{dayTime(r.activated_at)}</td>
          <td>{SUB[r.subscription_status] || r.subscription_status}{r.trial_ends_at && r.subscription_status === 'trialing' ? <small>iki {day(r.trial_ends_at)}</small> : null}</td>
          <td><b>{r.ratings + r.branches.reduce((n, b) => n + b.ratings, 0)}</b>{r.branches.length ? <small>pagrindinis: {r.ratings}</small> : null}{r.ratings ? <small>{r.positive} × 4–5★ · paskutinis {day(r.last_rating_at)}</small> : <small>dar nėra</small>}{r.unread ? <small className="ok-unread">{r.unread} neperskaitytos pastabos</small> : null}</td>
          <td>{r.order ? <span className={`ok-pill is-${r.order.status}`}>{STATUS[r.order.status]}</span> : <small>neužsakė</small>}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </main>;
}

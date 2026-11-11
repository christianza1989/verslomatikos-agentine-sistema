'use client';
// Free QR + NFC stand (owner decision 2026-11-11): the client confirms a delivery address,
// the owner ships it and marks the status in /admin/klientai. Status shown here is real
// (stand_orders.status), never a decorative tracker.
import { useState } from 'react';
import { Check, Gift, MapPin, Nfc, PackageCheck, Pencil, QrCode, Send, Truck } from 'lucide-react';
import { StandScene } from '@/components/usage-scenes';

type Order = {
  id: string; status: 'requested' | 'sent' | 'delivered' | 'canceled'; created_at: string; sent_at: string | null; updated_at: string | null;
  recipient: string | null; company: string | null; phone: string | null; street: string | null; city: string | null;
  postal_code: string | null; notes: string | null; quantity: number; delivery_address: string;
};

const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('lt-LT', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export function StandOrder({ clientId, businessName, phone, qr, initial }: {
  clientId: string; businessName: string; phone: string; qr: string; initial: Order | null;
}) {
  const [order, setOrder] = useState<Order | null>(initial);
  const [editing, setEditing] = useState(!initial || initial.status === 'canceled');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setMessage(null);
    try {
      const res = await fetch('/api/admin/stand-order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId, recipient: f.get('recipient'), company: f.get('company'), phone: f.get('phone'),
          street: f.get('street'), city: f.get('city'), postal_code: f.get('postal_code'),
          notes: f.get('notes'), quantity: Number(f.get('quantity') || 1),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'Nepavyko išsaugoti. Bandykite dar kartą.'); return; }
      setOrder(body.order); setEditing(false); setJustSaved(true);
    } catch {
      setMessage('Nepavyko susisiekti su serveriu. Bandykite dar kartą.');
    } finally { setBusy(false); }
  }

  const active = order && order.status !== 'canceled' ? order : null;
  const steps = active ? [
    { done: true, icon: <Check size={14}/>, title: 'Užsakymas patvirtintas', text: date(active.created_at) },
    { done: active.status === 'sent' || active.status === 'delivered', icon: <Truck size={14}/>, title: 'Išsiųsta', text: active.sent_at ? date(active.sent_at) : 'Paruošime ir išsiųsime artimiausiu metu' },
    { done: active.status === 'delivered', icon: <PackageCheck size={14}/>, title: 'Pristatyta', text: active.status === 'delivered' ? 'Pastatykite prie kasos ar registratūros' : 'Pranešime čia, kai stovelis pasieks Jus' },
  ] : [];

  return <section id="stovelis" className="dashboard-panel so">
    <div className="so-grid">
      <div className="so-art">
        <StandScene qr={qr} name={businessName}/>
        <span className="so-nfc-pill"><Nfc size={14}/> NFC</span>
      </div>
      <div className="so-main">
        <span className="so-eyebrow"><Gift size={14}/> Nemokamai aktyviems klientams</span>
        <h2>QR + NFC stovelis prie kasos ar registratūros</h2>
        <p className="so-lead">Atsiųsime stovelį su Jūsų QR kodu ir NFC lustu. Klientas nuskenuoja kodą arba tiesiog priglaudžia telefoną, ir atsidaro Jūsų įvertinimo puslapis.</p>
        <ul className="so-benefits">
          <li><QrCode size={16}/> QR kodas su Jūsų nuoroda, matuojamas skydelyje kaip „Stovelis“</li>
          <li><Nfc size={16}/> NFC: priglaudus telefoną puslapis atsidaro per sekundę, programėlės nereikia</li>
          <li><MapPin size={16}/> Pristatymas nemokamas, užtenka nurodyti adresą</li>
        </ul>

        {justSaved && active && <p className="so-success"><Check size={16}/> Ačiū! Užsakymą gavome. Kai išsiųsime, būsena čia pasikeis.</p>}

        {active && !editing && <div className="so-status">
          <ol className="so-steps">
            {steps.map((s) => <li key={s.title} className={s.done ? 'is-done' : ''}><span className="so-step-dot">{s.icon}</span><div><b>{s.title}</b><small>{s.text}</small></div></li>)}
          </ol>
          <div className="so-address">
            <MapPin size={16}/>
            <div><b>Pristatymo adresas</b><span>{active.delivery_address}</span>{active.quantity > 1 && <span>Kiekis: {active.quantity}</span>}{active.notes && <span>Pastabos: {active.notes}</span>}</div>
            {active.status === 'requested' && <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditing(true); setJustSaved(false); }}><Pencil size={14}/> Pakeisti</button>}
          </div>
        </div>}

        {editing && <form className="so-form" onSubmit={submit}>
          {order?.status === 'canceled' && <p className="so-note">Ankstesnis užsakymas atšauktas. Jei stovelio vis dar reikia, patvirtinkite adresą iš naujo.</p>}
          <div className="so-row">
            <label>Gavėjas (vardas, pavardė)<input name="recipient" required maxLength={100} autoComplete="name" defaultValue={order?.recipient || ''}/></label>
            <label>Telefonas kurjeriui<input name="phone" required maxLength={40} inputMode="tel" autoComplete="tel" defaultValue={order?.phone || phone}/></label>
          </div>
          <label>Įmonė<input name="company" maxLength={120} autoComplete="organization" defaultValue={order?.company ?? businessName}/></label>
          <label>Gatvė, namo ir buto / biuro nr.<input name="street" required maxLength={200} autoComplete="street-address" defaultValue={order?.street || ''}/></label>
          <div className="so-row so-row-3">
            <label>Miestas<input name="city" required maxLength={80} autoComplete="address-level2" defaultValue={order?.city || ''}/></label>
            <label>Pašto kodas<input name="postal_code" required maxLength={12} placeholder="LT-01234" autoComplete="postal-code" defaultValue={order?.postal_code || ''}/></label>
            <label>Kiekis<select name="quantity" defaultValue={String(order?.quantity || 1)}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>
          </div>
          <label>Pastabos kurjeriui <span>(neprivaloma)</span><textarea name="notes" maxLength={500} rows={2} placeholder="Pvz. darbo laikas, įėjimas iš kiemo" defaultValue={order?.notes || ''}/></label>
          {message && <p className="so-error" role="alert">{message}</p>}
          <div className="so-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}><Send size={16}/> {busy ? 'Siunčiama…' : active ? 'Išsaugoti pakeitimus' : 'Užsakyti nemokamą stovelį'}</button>
            {active && <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Atšaukti</button>}
          </div>
          <small className="so-fine">Nemokamai ir be įsipareigojimų. Duomenis naudosime tik stovelio pristatymui.</small>
        </form>}
      </div>
    </div>
  </section>;
}

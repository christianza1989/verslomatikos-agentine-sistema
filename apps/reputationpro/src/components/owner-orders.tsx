'use client';
// Owner-only controls on /admin/klientai: change a stand order status, copy the NFC/QR link.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, PackageCheck, RotateCcw, Truck, X } from 'lucide-react';

type Status = 'requested' | 'sent' | 'delivered' | 'canceled';

export function OrderActions({ orderId, status }: { orderId: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function set(next: Status) {
    if (next === 'canceled' && !confirm('Atšaukti šį stovelio užsakymą? Klientas galės užsakyti iš naujo.')) return;
    setBusy(true); setErr(null);
    const res = await fetch('/api/admin/stand-order', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: orderId, status: next }) }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) { setErr('Nepavyko'); return; }
    router.refresh();
  }
  return <div className="ok-actions">
    {status === 'requested' && <button type="button" className="btn btn-primary btn-small" disabled={busy} onClick={() => set('sent')}><Truck size={14}/> Išsiųsta</button>}
    {status === 'sent' && <button type="button" className="btn btn-primary btn-small" disabled={busy} onClick={() => set('delivered')}><PackageCheck size={14}/> Pristatyta</button>}
    {(status === 'sent' || status === 'delivered' || status === 'canceled') && <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => set('requested')} title="Grąžinti į „Laukia“"><RotateCcw size={14}/></button>}
    {status !== 'canceled' && status !== 'delivered' && <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => set('canceled')} title="Atšaukti"><X size={14}/></button>}
    {err && <span className="ok-err">{err}</span>}
  </div>;
}

export function CopyText({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="ok-copy" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* select manually */ }
  }}>{done ? <Check size={13}/> : <Copy size={13}/>} {done ? 'Nukopijuota' : label}</button>;
}

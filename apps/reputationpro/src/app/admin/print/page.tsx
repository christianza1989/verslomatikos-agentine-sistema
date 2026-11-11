import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft } from 'lucide-react';
import { currentPrincipal, appUrl } from '@/lib/security';
import { getClient, getClientById, getClients } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { channelUrl } from '@/lib/qr-channels';
import { PrintButton } from '@/components/print-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Spausdinti QR · ReputationPro', robots: { index: false, follow: false } };

type Kind = 'stand' | 'poster' | 'labels';
const KINDS: Record<Kind, { title: string; size: string; channel: 'stovelis' | 'lipdukai' }> = {
  stand: { title: 'Stovelio įdėklas', size: 'A6 (105 × 148 mm) – tinka standartiniam akriliniam stoveliui', channel: 'stovelis' },
  poster: { title: 'Plakatas', size: 'A4 – ant sienos, durų ar vitrinos', channel: 'stovelis' },
  labels: { title: 'Lipdukų lapas', size: 'A4, 12 lipdukų (3 × 4, apie 63 × 70 mm)', channel: 'lipdukai' },
};

// Printable QR sheets for the dashboard QR kit (ROADMAP D5.3). Browser print → paper or PDF.
export default async function PrintPage({ searchParams }: { searchParams: Promise<{ slug?: string; type?: string }> }) {
  const principal = await currentPrincipal();
  if (!principal) redirect('/admin/login');
  const q = await searchParams;
  const client = q.slug ? getClient(q.slug) : principal.role === 'clinic' ? getClientById(principal.clientId) : getClients()[0];
  if (!client || !canAccessClient(principal, client.id)) redirect('/admin');

  const kind: Kind = q.type === 'poster' || q.type === 'labels' ? q.type : 'stand';
  const meta = KINDS[kind];
  const url = channelUrl(appUrl(), client.slug, meta.channel);
  const qr = await QRCode.toDataURL(url, { width: 900, margin: 1, color: { dark: '#13112e', light: '#ffffff' }, errorCorrectionLevel: 'M' });
  const name = client.business_name;

  return <div className="pk-print-shell">
    <header className="pk-screen-only pk-print-bar">
      <Link href={`/admin?clinic=${encodeURIComponent(client.slug)}#qr`} className="pk-back"><ArrowLeft size={16}/> Atgal į skydelį</Link>
      <div className="pk-print-meta"><strong>{meta.title}</strong><span>{meta.size}</span></div>
      <div className="pk-print-tabs">
        {(Object.keys(KINDS) as Kind[]).map((k) => <Link key={k} href={`/admin/print?type=${k}&slug=${encodeURIComponent(client.slug)}`} className={k === kind ? 'active' : ''}>{KINDS[k].title}</Link>)}
      </div>
      <PrintButton/>
    </header>
    <p className="pk-screen-only pk-print-hint">Spausdinimo lange pasirinkite „Išsaugoti kaip PDF“, jei norite nusiųsti spaustuvei. Mastelis – 100 %.</p>

    {kind === 'stand' && <section className="pk-sheet pk-a6">
      <div className="pk-band">Įvertinkite mus</div>
      <div className="pk-name">{name}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pk-qr" src={qr} alt={`${name} QR kodas`}/>
      <div className="pk-stars">★★★★★</div>
      <p className="pk-cta">Nuskenuokite telefono kamera – užtruks 30 sekundžių</p>
      <p className="pk-url">{url.replace(/^https?:\/\//, '')}</p>
    </section>}

    {kind === 'poster' && <section className="pk-sheet pk-a4">
      <p className="pk-kicker">{name}</p>
      <h1 className="pk-title">Ar Jums patiko?</h1>
      <p className="pk-sub">Įvertinkite mus – Jūsų nuomonė mums labai svarbi</p>
      <div className="pk-stars pk-stars-big">★★★★★</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pk-qr pk-qr-big" src={qr} alt={`${name} QR kodas`}/>
      <ol className="pk-steps"><li><b>1</b> Nuskenuokite QR kodą</li><li><b>2</b> Pasirinkite žvaigždutes</li><li><b>3</b> Parašykite kelis žodžius</li></ol>
      <p className="pk-url">{url.replace(/^https?:\/\//, '')}</p>
    </section>}

    {kind === 'labels' && <section className="pk-sheet pk-labels">
      {Array.from({ length: 12 }, (_, i) => <div key={i} className="pk-label">
        <div className="pk-label-title">Įvertinkite mus</div>
        <div className="pk-stars pk-stars-small">★★★★★</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pk-qr-label" src={qr} alt=""/>
        <div className="pk-label-name">{name}</div>
      </div>)}
    </section>}
  </div>;
}

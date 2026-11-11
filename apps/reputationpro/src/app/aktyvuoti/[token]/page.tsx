import Link from 'next/link';
import QRCode from 'qrcode';
import { CheckCircle2, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ClaimForm } from '@/components/claim-form';
import { claimTokenClient } from '@/lib/claim';
import { isDirectReviewUrl } from '@/lib/validation';
import { platformCopy } from '@/lib/review-platforms';
import { appUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Aktyvuokite paskyrą – ReputationPro', robots: { index: false, follow: false } };

export default async function ActivatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = claimTokenClient(token);

  if (!client) {
    return <div className="login-shell"><Brand/>
      <main id="main" className="login-card claim-card">
        <span className="login-icon"><Clock size={24}/></span>
        <h1>Nuoroda nebegalioja</h1>
        <p>Aktyvavimo nuoroda jau panaudota arba pasibaigė jos galiojimas (30 d.).</p>
        <div className="claim-actions">
          <Link className="btn btn-primary btn-full" href="/admin/login">Jau aktyvavau – prisijungti</Link>
          <a className="btn btn-secondary btn-full" href="mailto:tomas@verslomatika.lt?subject=ReputationPro%20aktyvavimo%20nuoroda">Gauti naują nuorodą</a>
        </div>
      </main>
    </div>;
  }

  const pageUrl = `${appUrl()}/r/${client.slug}`;
  const qr = await QRCode.toDataURL(pageUrl, { width: 220, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
  const googleOk = isDirectReviewUrl(client.google_review_url);
  const platform = platformCopy(client.google_review_url);

  return <div className="login-shell"><Brand/>
    <main id="main" className="login-card claim-card">
      <span className="claim-badge"><CheckCircle2 size={15}/> Paskyra paruošta</span>
      <h1>{client.business_name}</h1>
      <p>Viską jau sutvarkėme. Liko tik sugalvoti slaptažodį: užtruks mažiau nei minutę.</p>

      <ul className="claim-ready">
        <li><CheckCircle2 size={18} className="ok"/><div><strong>Atsiliepimų puslapis</strong><span>{pageUrl.replace(/^https?:\/\//, '')}</span></div><a href={`/r/${client.slug}?view=klientas`} target="_blank" rel="noopener noreferrer">Peržiūrėti <ExternalLink size={13}/></a></li>
        <li><CheckCircle2 size={18} className="ok"/><div><strong>QR kodas</strong><span>Registratūrai, kasai ar sąskaitoms</span></div><img src={qr} alt={`${client.business_name} QR kodas`} width={52} height={52}/></li>
        <li>{googleOk ? <CheckCircle2 size={18} className="ok"/> : <AlertTriangle size={18} className="warn"/>}
          <div><strong>{platform.linkLabel}</strong><span>{googleOk ? `Susieta su Jūsų ${platform.name} profiliu` : 'Patikslinkite žemiau (arba vėliau nustatymuose)'}</span></div>
          <a href={client.google_review_url} target="_blank" rel="noopener noreferrer">Patikrinti <ExternalLink size={13}/></a></li>
      </ul>

      <ClaimForm token={token} googleUrl={client.google_review_url} googleVerified={googleOk} email={client.email}/>
    </main>
    <p className="claim-help">Klausimai? <a href="mailto:tomas@verslomatika.lt">tomas@verslomatika.lt</a></p>
  </div>;
}

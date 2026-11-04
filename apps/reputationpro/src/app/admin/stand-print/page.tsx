import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, Printer, Radio, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { currentPrincipal, appUrl } from '@/lib/security';
import { getClient, getClientById, getClients } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { PrintButton } from '@/components/print-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registratūros stovelio spausdinimas · ReputationPro' };

export default async function StandPrintPage({
  searchParams
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const principal = await currentPrincipal();
  if (!principal) redirect('/admin/login');

  const query = await searchParams;
  let clinic = principal.role === 'clinic' 
    ? getClientById(principal.clientId)
    : (query.slug ? getClient(query.slug) : getClients()[0]);

  if (!clinic) redirect('/admin');
  if (!canAccessClient(principal, clinic.id)) redirect('/admin');

  const url = `${appUrl()}/r/${clinic.slug}`;
  const qr = await QRCode.toDataURL(url, {
    width: 380,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });

  return (
    <div className="print-page-shell">
      {/* Screen-only top action bar */}
      <header className="print-screen-header">
        <div className="print-header-inner">
          <Link href={`/admin?clinic=${clinic.slug}`} className="print-back-link">
            <ArrowLeft size={16} />
            <span>Grįžti į skydelį</span>
          </Link>
          <div className="print-meta-center">
            <strong>{clinic.business_name}</strong>
            <span>Standartinis A6 stovelio įdėklas (105 × 148 mm)</span>
          </div>
          <div className="print-actions-right">
            <PrintButton />
          </div>
        </div>
      </header>

      {/* Printable Sheet Canvas */}
      <main className="print-canvas">
        <div className="print-stand-card">
          <div className="stand-card-inner">
            {/* Top Header */}
            <div className="stand-card-top">
              <span className="stand-clinic-badge">{clinic.business_name}</span>
              <div className="stand-stars-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={22} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <h1 className="stand-card-title">Jūsų nuomonė mums svarbi</h1>
              <p className="stand-card-subtitle">
                Pasidalinkite savo patirtimi vos per kelias sekundes
              </p>
            </div>

            {/* High-Resolution QR Stage */}
            <div className="stand-card-qr-box">
              <img 
                src={qr} 
                alt={`${clinic.business_name} QR kodas`}
                width={240} 
                height={240} 
                className="print-qr-image" 
              />

            </div>

            {/* NFC Contactless Instruction */}
            <div className="stand-card-nfc-block">
              <div className="nfc-symbol-circle">
                <Radio size={28} />
              </div>
              <strong className="nfc-main-text">Priglauskite telefoną čia</strong>
              <span className="nfc-sub-text">arba nukreipkite fotoaparato kamerą į QR kodą</span>
            </div>

            {/* Footer gratitude */}
            <div className="stand-card-footer">
              <span>Nereikia jokios programėlės · Veikia su visais telefonais</span>
              <small>Dėkojame, kad renkatės mus!</small>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

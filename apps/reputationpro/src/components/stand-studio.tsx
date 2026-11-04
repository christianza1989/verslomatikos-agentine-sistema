'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Truck, 
  Radio, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  FileCheck, 
  HelpCircle,
  Clock,
  MapPin
} from 'lucide-react';

export function StandStudio({
  clinicName,
  slug,
  qrCodeUrl,
  patientUrl,
  deliveryAddress,
  planStatus,
  trialEndsAt
}: {
  clinicName: string;
  slug: string;
  qrCodeUrl: string;
  patientUrl: string;
  deliveryAddress?: string;
  planStatus: string;
  trialEndsAt?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(patientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('Nepavyko nukopijuoti automatiškai. Nukopijuokite nuorodą rankiniu būdu.');
    }
  }

  const trialFormatted = trialEndsAt 
    ? new Intl.DateTimeFormat('lt-LT', { dateStyle: 'long', timeZone: 'Europe/Vilnius' }).format(new Date(trialEndsAt))
    : '14 dienų';

  return (
    <section id="stand" className="stand-studio-section">
      <div className="section-header-row">
        <div>
          <div className="section-pill-tag">
            <Radio size={14} className="radio-pulse" />
            <span>NFC & QR Registratūros Studija</span>
          </div>
          <h2>Registratūros stovelis ir skaitmeninė prieiga</h2>
          <p>
            Valdykite savo fizinį akrilinį NFC stovelį, spausdinkite registratūros korteles ir dalinkitės tiesiogine atsiliepimų nuoroda.
          </p>
        </div>
        <div className="section-header-actions">
          <Link 
            href={`/admin/stand-print?slug=${slug}`} 
            target="_blank" 
            className="btn btn-primary btn-print-quick"
          >
            <Printer size={16} />
            <span>Spausdinti A6 stovelio įdėklą</span>
          </Link>
        </div>
      </div>

      <div className="stand-studio-grid">
        {/* Left Column: Interactive Acrylic Stand Mockup */}
        <div className="stand-preview-card">
          <div className="stand-preview-header">
            <h3>Fizinio akrilinio stovelio peržiūra</h3>
            <span className="stand-spec-badge">A6 · 105 × 148 mm</span>
          </div>

          {/* Realistic Acrylic Stand Representation */}
          <div className="acrylic-stand-mockup">
            <div className="acrylic-stand-body">
              <div className="stand-glass-glare" />
              
              {/* Top Clinic Branding */}
              <div className="stand-top-brand">
                <span className="stand-clinic-name">{clinicName}</span>
                <div className="stand-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <h4 className="stand-heading-text">Jūsų nuomonė mums labai svarbi</h4>
              </div>

              {/* QR Code Center Stage */}
              <div className="stand-qr-stage">
                <div className="stand-qr-frame">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt={`${clinicName} registratūros QR kodas`}
                      className="stand-qr-img" 
                      width={180} 
                      height={180}
                    />
                  ) : (
                    <div className="qr-placeholder">
                      <QrCode size={140} color="#1e293b" />
                    </div>
                  )}

                </div>
              </div>

              {/* NFC Sensor Zone */}
              <div className="stand-nfc-zone">
                <div className="nfc-icon-wrapper">
                  <Radio size={22} className="nfc-pulse" />
                </div>
                <strong className="nfc-label">Priglauskite telefoną čia</strong>
                <p className="stand-instruction-sub">arba nukreipkite fotoaparato kamerą</p>
              </div>

              {/* Stand Base Shadow Accent */}
              <div className="stand-base-bevel" />
            </div>
            <div className="stand-desk-shadow" />
          </div>

          {/* Quick Action Buttons for the Stand */}
          <div className="stand-actions-bar">
            <Link 
              href={`/admin/stand-print?slug=${slug}`} 
              target="_blank" 
              className="btn btn-secondary stand-action-btn"
            >
              <Printer size={15} />
              <span>A6 Spaudos PDF</span>
            </Link>

            <a 
              href={`/api/admin/qr?slug=${slug}`} 
              download={`${slug}-qr.svg`}
              className="btn btn-secondary stand-action-btn"
            >
              <Download size={15} />
              <span>Vektorinis SVG</span>
            </a>

            <Link 
              href={`/r/${slug}`} 
              target="_blank" 
              className="btn btn-secondary stand-action-btn"
            >
              <ExternalLink size={15} />
              <span>Atverti puslapį</span>
            </Link>
          </div>

          {/* Patient URL Copy Field */}
          <div className="url-copy-box">
            <span className="url-copy-label">Tiesioginė paciento atsiliepimų nuoroda:</span>
            <div className="url-copy-field">
              <input 
                type="text" 
                readOnly 
                value={patientUrl} 
                aria-label="Tiesioginė klinikos vertinimo nuoroda"
                className="url-copy-input"
              />
              <button 
                type="button" 
                onClick={handleCopy} 
                className="btn btn-primary btn-copy-trigger"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Nukopijuota!' : 'Kopijuoti'}</span>
              </button>
            </div>
            {copyError && <span className="copy-error-msg">{copyError}</span>}
          </div>
        </div>

        {/* Right Column: Physical Stand Delivery Tracker & Front Desk Protocol */}
        <div className="stand-info-column">
          {/* Tracker Card */}
          <div className="delivery-tracker-card">
            <div className="tracker-header">
              <div className="tracker-title">
                <Truck size={19} className="truck-icon" />
                <div>
                  <h3>Fizinio akrilinio stovelio pristatymas</h3>
                  <small>Gaminamas pagal individualų klinikos užsakymą</small>
                </div>
              </div>
              <span className="tracker-status-pill in-production">
                <Clock size={12} /> Gamyboje
              </span>
            </div>

            {/* 3 Step Timeline */}
            <div className="delivery-timeline">
              {/* Step 1 */}
              <div className="timeline-step step-complete">
                <div className="step-marker">
                  <Check size={14} />
                </div>
                <div className="step-content">
                  <strong>1. Užsakymas patvirtintas</strong>
                  <p>Klinikos profilis ir nukreipimo algoritmai sukonfigūruoti.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="timeline-step step-active">
                <div className="step-marker">
                  <Radio size={14} className="spin-slow" />
                </div>
                <div className="step-content">
                  <strong>2. Lazerinis graviravimas ir NFC lusto kodavimas</strong>
                  <p>
                    Koduojamas greitasis NTAG213 bekontaktis lustas su unikalia nuoroda: 
                    <code>/r/{slug}</code>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="timeline-step step-pending">
                <div className="step-marker">
                  <Truck size={14} />
                </div>
                <div className="step-content">
                  <strong>3. Pristatymas su DPD kurjeriu</strong>
                  <p>Numatomas pristatymas per 1–2 d. d. registratūros adresu.</p>
                </div>
              </div>
            </div>

            {/* Stand Material Specs */}
            <div className="stand-specs-list">
              <div className="spec-item">
                <FileCheck size={15} className="spec-icon" />
                <span><strong>Medžiaga:</strong> 3 mm lietas optinis akrilas, atsparus medicininei dezinfekcijai.</span>
              </div>
              <div className="spec-item">
                <Radio size={15} className="spec-icon" />
                <span><strong>NFC lustas:</strong> Integruotas NTAG213 – nereikia jokių baterijų ar įkrovimo.</span>
              </div>
              <div className="spec-item">
                <MapPin size={15} className="spec-icon" />
                <span><strong>Pristatymas:</strong> Įskaičiuotas nemokamai į Jūsų narystę.</span>
              </div>
            </div>
          </div>

          {/* Front Desk Receptionist Protocol */}
          <div className="receptionist-guide-card">
            <div className="guide-card-header">
              <Sparkles size={18} className="guide-sparkle" />
              <div>
                <h3>Atmintinė registratūros darbuotojai</h3>
                <small>Kaip natūraliai surinkti 3–5 kartus daugiau 5★ atsiliepimų kasdien</small>
              </div>
            </div>

            <ol className="protocol-steps">
              <li>
                <strong>Kada pasiūlyti:</strong>
                <p>
                  Pacientui atsiskaitant už paslaugas arba laukiant kvito:
                  <em> „Gydytojas labai vertina Jūsų nuomonę – būsime dėkingi, jei priglausite telefoną prie šio stovelio.“</em>
                </p>
              </li>
              <li>
                <strong>Kaip veikia bekontaktis NFC:</strong>
                <p>
                  Nereikia diegti jokios programėlės. Pacientui pakanka atrakintą telefoną 
                  (iPhone viršumi arba Android nugarėle) priglausti prie stovelio. Langas atsidaro per 1 sekundę.
                </p>
              </li>
              <li>
                <strong>Saugi reputacija:</strong>
                <p>
                  Laimingi pacientai (4–5★) iškart atsiduria Google Maps atsiliepimų formoje. 
                  Jei pacientas turi pastabų (1–3★), jos keliauja tiesiai į šį vadovo skydelį, o ne į internetą.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { 
  ArrowUpRight, 
  Download, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  QrCode, 
  Plus, 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Send,
  Printer,
  Radio,
  MapPin,
  Sparkles,
  Building2,
  Calendar
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { BillingPortal, ClinicForm, ClinicPicker, CopyLink, Logout } from '@/components/admin-controls';
import { FeedbackInbox } from '@/components/feedback-inbox';
import { DashboardKPIs } from '@/components/dashboard-kpis';
import { StandStudio } from '@/components/stand-studio';
import { db, getClientById, getClients, getFeedback, getStats } from '@/lib/db';
import { appUrl, currentPrincipal, demoEnabled } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Klinikos Valdymo Skydelis · ReputationPro' };

const statuses: Record<string, string> = {
  demo_trial: 'Testinis 14 d. bandymas',
  pending: 'Laukia aktyvinimo',
  trialing: '14 d. Pro bandymas',
  active: 'Aktyvi prenumerata',
  past_due: 'Vėluoja mokėjimas',
  canceled: 'Atšaukta',
  unpaid: 'Neapmokėta',
  paused: 'Pristabdyta',
  incomplete: 'Neužbaigta',
  incomplete_expired: 'Pasibaigė'
};

export default async function Admin({
  searchParams
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const principal = await currentPrincipal();
  if (!principal) redirect('/admin/login');

  const query = await searchParams;
  const own = principal.role === 'clinic' ? getClientById(principal.clientId) : undefined;
  const clients = principal.role === 'owner' ? getClients() : own ? [own] : [];
  const clinic = principal.role === 'owner' 
    ? (clients.find((c) => c.slug === query.clinic) || clients[0]) 
    : own;

  const stats = clinic ? getStats(clinic.id) : null;
  const feedback = clinic ? getFeedback(clinic.id) : [];
  const url = clinic ? `${appUrl()}/r/${clinic.slug}` : '';

  const qr = clinic
    ? await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      })
    : '';

  const distribution = clinic
    ? (db().prepare('SELECT rating, COUNT(*) count FROM review_events WHERE client_id=? GROUP BY rating').all(clinic.id) as { rating: number; count: number }[])
    : [];

  return (
    <div className="admin-shell">
      {/* Luxury Sidebar */}
      <aside className="admin-sidebar">
        <Brand light />
        
        <div className="sidebar-space">
          <span className="sidebar-group-label">VALDYMO ERDVĖ</span>
          <nav aria-label="Valdymas">
            <a href="#overview" className="sidebar-nav-item active">
              <LayoutDashboard size={18} /> 
              <span>Apžvalga & Skydas</span>
            </a>

            <a href="#inbox" className="sidebar-nav-item">
              <MessageSquare size={18} /> 
              <span>Vadovo dėžutė</span>
              {stats?.unread ? <b className="sidebar-badge">{stats.unread}</b> : null}
            </a>

            <a href="#stand" className="sidebar-nav-item">
              <QrCode size={18} /> 
              <span>Stovelis & QR Studija</span>
            </a>

            {clinic && (
              <Link 
                href={`/admin/stand-print?slug=${clinic.slug}`} 
                target="_blank" 
                className="sidebar-nav-item"
              >
                <Printer size={18} /> 
                <span>Spausdinti kortelę</span>
              </Link>
            )}

            <a href="#settings" className="sidebar-nav-item">
              <Settings size={18} /> 
              <span>Google & Nustatymai</span>
            </a>

            {principal.role === 'owner' && (
              <Link href="/admin/campaigns" className="sidebar-nav-item sidebar-campaigns-link">
                <Send size={18} /> 
                <span>B2B Kampanijos</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="owner-label">
            <span className="owner-avatar">
              {clinic ? clinic.business_name[0].toUpperCase() : 'K'}
            </span>
            <div className="owner-meta">
              <strong>{clinic ? clinic.business_name : 'Klinikos erdvė'}</strong>
              <small>{principal.role === 'owner' ? 'Savininko prieiga' : 'Sertifikuota paskyra'}</small>
            </div>
          </div>
          <Logout />
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <div className="admin-body">
        {/* Top Header Bar */}
        <header className="admin-top">
          <div className="admin-top-left">
            <span className="status-live-indicator">
              <span className="online-dot" />
              <span>Sistemos būsena: <strong>Aktyvi</strong> · Sinchronizuota</span>
            </span>
          </div>

          <div className="admin-top-right">
            {clinic && (
              <a 
                href={`/r/${clinic.slug}?demo=1`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="topbar-action-link"
              >
                <span>Paciento vaizdas</span>
                <ExternalLink size={14} />
              </a>
            )}
            <Link href="/" className="subtle-link">
              <span>Į svetainę</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>

        <main id="main" className="admin-content">
          {/* Header Title & Clinic Switcher */}
          <section id="overview" className="dashboard-hero-header">
            <div className="hero-title-area">
              <div className="clinic-title-badge">
                <Building2 size={16} />
                <span>Klinikos Valdymo Centras</span>
              </div>
              <h1>{clinic ? clinic.business_name : 'Jūsų klinikos erdvė'}</h1>
              <p>
                Realaus laiko pacientų atsiliepimų filtras, registratūros stovelio valdymas ir apsauga nuo neigiamų Google Maps įvertinimų.
              </p>
            </div>

            {clinic && principal.role === 'owner' && (
              <div className="clinic-switcher-wrapper">
                <ClinicPicker 
                  clinics={clients.map((c) => ({ slug: c.slug, business_name: c.business_name }))} 
                  current={clinic.slug} 
                />
              </div>
            )}
          </section>

          {demoEnabled() && (
            <div className="demo-banner">
              <ShieldCheck size={18} />
              <span>
                <strong>Demonstracinis režimas.</strong> Duomenys saugomi vietinėje SQLite bazėje. 
                Google Maps atsiliepimų langas atidaromas saugiu peržiūros rėžimu.
              </span>
            </div>
          )}

          {clinic && stats ? (
            <>
              {/* 1. Executive Review Shield KPIs */}
              <DashboardKPIs 
                stats={stats} 
                clinicName={clinic.business_name} 
                slug={clinic.slug} 
                googleReviewUrl={clinic.google_review_url} 
              />

              {/* 2. Stand & QR Reception Studio */}
              <StandStudio 
                clinicName={clinic.business_name}
                slug={clinic.slug}
                qrCodeUrl={qr}
                patientUrl={url}
                planStatus={statuses[clinic.subscription_status] || clinic.subscription_status}
                trialEndsAt={clinic.trial_ends_at}
              />

              {/* 3. Main Dashboard Grid: Smart Inbox & Side Analytics */}
              <div className="dashboard-grid">
                {/* Left (Main): Smart Feedback Triage Inbox */}
                <section id="inbox" className="dashboard-panel inbox-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Vadovo Dėžutė (Review Shield™ Triage)</h2>
                      <p>Privačios pacientų pastabos, sulaikytos nuo viešo Google Maps. Išklausykite ir išspręskite tiesiogiai.</p>
                    </div>
                    <a 
                      className="icon-button" 
                      href={`/api/admin/export?slug=${clinic.slug}`} 
                      aria-label="Atsisiųsti žinutes CSV formatu"
                      title="Eksportuoti visas žinutes į CSV"
                    >
                      <Download size={18} />
                    </a>
                  </div>

                  <FeedbackInbox items={feedback} clinicName={clinic.business_name} />
                </section>

                {/* Right Rail: Distribution & Google Integration */}
                <aside className="dashboard-rail">
                  {/* Google Maps Live Verification Card */}
                  <section className="dashboard-panel google-sync-card">
                    <div className="panel-heading">
                      <h3>Google Maps ryšys</h3>
                      <div className="google-badge-live">
                        <CheckCircle2 size={14} /> Susietas
                      </div>
                    </div>
                    <p className="google-sync-desc">
                      Visi 4–5★ pacientų įvertinimai nukreipiami tiesiai į šį Jūsų profilį:
                    </p>
                    <div className="google-url-preview">
                      <span className="google-url-text">{clinic.google_review_url}</span>
                    </div>
                    <a 
                      href={clinic.google_review_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary btn-small btn-google-test"
                    >
                      <ExternalLink size={14} />
                      <span>Tikrinti Google Maps langą</span>
                    </a>
                  </section>

                  {/* Rating Distribution Breakdown */}
                  <section className="dashboard-panel distribution">
                    <div className="panel-heading">
                      <h3>Registratūros įvertinimai</h3>
                      <Star size={18} fill="#f59e0b" color="#f59e0b" />
                    </div>
                    <p>Sąveikos pacientų puslapyje prieš nukreipimą.</p>
                    
                    <div className="average-value">
                      <strong>{stats.average?.toFixed(1) || '5.0'}</strong>
                      <span>/ 5.0</span>
                    </div>

                    <div className="ratings-histogram">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const count = distribution.find((r) => r.rating === n)?.count || 0;
                        const percentage = stats.ratings ? (count / stats.ratings) * 100 : 0;
                        const isPositive = n >= 4;

                        return (
                          <div className="rating-bar-row" key={n}>
                            <span className="rating-bar-label">
                              {n} <Star size={11} fill="currentColor" />
                            </span>
                            <div className="rating-bar-track">
                              <i 
                                className={`rating-bar-fill ${isPositive ? 'fill-positive' : 'fill-shield'}`} 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                            <span className="rating-bar-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Subscription Membership Card */}
                  <section className="dashboard-panel subscription-card">
                    <div className="sub-header">
                      <CheckCircle2 size={18} className="sub-check" />
                      <div>
                        <strong>{statuses[clinic.subscription_status] || clinic.subscription_status}</strong>
                        <span>Profesionalus reputacijos planas</span>
                      </div>
                    </div>
                    {clinic.trial_ends_at && (
                      <div className="trial-countdown">
                        <Calendar size={14} />
                        <span>
                          Bandomasis laikotarpis iki:{' '}
                          {new Intl.DateTimeFormat('lt-LT', {
                            dateStyle: 'medium',
                            timeZone: 'Europe/Vilnius'
                          }).format(new Date(clinic.trial_ends_at))}
                        </span>
                      </div>
                    )}
                    {principal.role === 'clinic' && clinic.stripe_customer_id && (
                      <div className="billing-action-box">
                        <BillingPortal />
                      </div>
                    )}
                  </section>
                </aside>
              </div>

              {/* 4. Clinic Settings */}
              <section id="settings" className="dashboard-panel settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Klinikos Nustatymai</h2>
                    <p>Pakeitimai iškart atsispindės paciento atsiliepimų puslapyje ir NFC nukreipime.</p>
                  </div>
                  <Settings size={21} />
                </div>
                <ClinicForm client={clinic} />
              </section>
            </>
          ) : (
            <div className="empty-state">
              <h2>Pridėkite pirmą įmonę.</h2>
              <p>Įveskite duomenis toliau esančioje formoje.</p>
            </div>
          )}

          {principal.role === 'owner' && (
            <details className="dashboard-panel add-clinic">
              <summary>
                <span><Plus size={18} /> Pridėti dar vieną įmonę</span>
                <Plus size={18} />
              </summary>
              <ClinicForm />
            </details>
          )}

          <footer className="admin-footer">
            <div>
              <strong>ReputationPro</strong> · Verslomatika B2B Reputacijos Ekosistema
            </div>
            <span>Saugi SSL / AES-256 šifruota prieiga · MB „Pinet“</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

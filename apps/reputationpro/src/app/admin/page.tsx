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
  Calendar,
  Gift,
  Users
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { BillingPortal, ClinicForm, ClinicPicker, CopyLink, Logout } from '@/components/admin-controls';
import { FeedbackInbox } from '@/components/feedback-inbox';
import { DashboardKPIs } from '@/components/dashboard-kpis';
import { QrKit } from '@/components/qr-kit';
import { StandOrder } from '@/components/stand-order';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { PublicLinkToggle } from '@/components/public-link-toggle';
import { NotifyEmails } from '@/components/notify-emails';
import { ArchiveBranch, BranchForm, BranchManager } from '@/components/branch-manager';
import { isDirectReviewUrl, parseNotifyEmails } from '@/lib/validation';
import { reviewPlatform, PLATFORM_COPY } from '@/lib/review-platforms';
import { db, getAccountRoot, getBranches, getClientById, getClients, getFeedback, getLocationStats, getStats, getSourceStats, getStandOrder, isPlaceholderEmail, MAX_BRANCHES } from '@/lib/db';
import { appUrl, currentPrincipal, demoEnabled } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Valdymo skydelis · ReputationPro' };

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
  // Branches (filialai): a clinic login manages its main profile and all its branches (?clinic={slug}).
  const own = principal.role === 'clinic' ? getClientById(principal.clientId) : undefined;
  const clients = principal.role === 'owner'
    ? getClients().filter((c) => !c.archived_at)
    : own ? (own.parent_id ? [own] : [own, ...getBranches(own.id)]) : [];
  // ROADMAP N7: a branch manager's login sees only its own branch.
  const isBranchLogin = principal.role === 'clinic' && !!own?.parent_id;
  const clinic = clients.find((c) => c.slug === query.clinic) || (principal.role === 'owner' ? clients.find((c) => !c.parent_id) || clients[0] : own);
  const root = clinic ? getAccountRoot(clinic) : undefined;
  const locationStats = root && !isBranchLogin ? getLocationStats(root.id) : [];
  const locations = locationStats.map((l) => ({ ...l, platform: reviewPlatform(l.google_review_url), link_ok: isDirectReviewUrl(l.google_review_url) }));
  const rootNames = new Map(clients.filter((c) => !c.parent_id).map((c) => [c.id, c.business_name]));

  const stats = clinic ? getStats(clinic.id) : null;
  const feedback = clinic ? getFeedback(clinic.id) : [];
  const url = clinic ? `${appUrl()}/r/${clinic.slug}` : '';
  const googleOk = clinic ? isDirectReviewUrl(clinic.google_review_url) : false;
  const platform = reviewPlatform(clinic?.google_review_url);
  const pcopy = PLATFORM_COPY[platform];

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
              <span>Atsiliepimų dėžutė</span>
              {stats?.unread ? <b className="sidebar-badge">{stats.unread}</b> : null}
            </a>

            <a href="#qr" className="sidebar-nav-item">
              <QrCode size={18} />
              <span>QR kodai ir nuorodos</span>
            </a>

            {clinic && (
              <Link 
                href={`/admin/print?type=stand&slug=${clinic.slug}`} 
                target="_blank" 
                className="sidebar-nav-item"
              >
                <Printer size={18} /> 
                <span>Spausdinti QR</span>
              </Link>
            )}

            {clinic && !clinic.is_demo && (
              <a href="#stovelis" className="sidebar-nav-item">
                <Gift size={18} />
                <span>Nemokamas stovelis</span>
              </a>
            )}

            {clinic && !clinic.is_demo && !isBranchLogin && (
              <a href="#filialai" className="sidebar-nav-item">
                <MapPin size={18} />
                <span>Filialai</span>
              </a>
            )}

            <a href="#settings" className="sidebar-nav-item">
              <Settings size={18} /> 
              <span>Google & Nustatymai</span>
            </a>

            {principal.role === 'owner' && (
              <Link href="/admin/klientai" className="sidebar-nav-item">
                <Users size={18} />
                <span>Klientai ir stoveliai</span>
              </Link>
            )}
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
              {(root ?? clinic) ? (root ?? clinic)!.business_name[0].toUpperCase() : 'K'}
            </span>
            <div className="owner-meta">
              <strong>{(root ?? clinic)?.business_name ?? 'Jūsų erdvė'}</strong>
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
                <span>Kliento vaizdas</span>
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
                <span>{clinic?.parent_id ? `Filialas${clinic.location_label ? ` · ${clinic.location_label}` : ''}` : 'Valdymo centras'}</span>
              </div>
              <h1>{clinic ? clinic.business_name : 'Jūsų erdvė'}</h1>
              <p>
                Klientų įvertinimai, privačios pastabos ir Jūsų QR kodas vienoje vietoje.
              </p>
            </div>

            {clinic && (principal.role === 'owner' || locations.length > 1) && (
              <div className="clinic-switcher-wrapper">
                <ClinicPicker
                  label={principal.role === 'owner' ? 'Pasirinkite įmonę' : 'Pasirinkite filialą'}
                  clinics={principal.role === 'owner'
                    ? clients.map((c) => ({ slug: c.slug, business_name: c.business_name, label: c.parent_id ? `↳ ${c.business_name}${rootNames.get(c.parent_id) ? ` (${rootNames.get(c.parent_id)})` : ''}` : c.business_name }))
                    : locations.map((l) => ({ slug: l.slug, business_name: l.business_name, label: `${l.is_root ? '★ ' : ''}${l.business_name}${l.location_label ? ` · ${l.location_label}` : ''}` }))}
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
              {/* 0. First-run checklist (target of the /admin#onboarding redirect after activation) */}
              <OnboardingChecklist
                slug={clinic.slug}
                businessName={clinic.business_name}
                pageUrl={url}
                qr={qr}
                googleOk={googleOk}
                platform={platform}
                ratings={stats.ratings}
              />

              {/* 1. Executive Review Shield KPIs */}
              <DashboardKPIs 
                stats={stats} 
                clinicName={clinic.business_name} 
                slug={clinic.slug} 
                googleReviewUrl={clinic.google_review_url}
              />

              {/* 1b. Branches (filialai): list, switch, add */}
              {root && !root.is_demo && !isBranchLogin && (
                <BranchManager rootId={root.id} rootName={root.business_name} rootEmail={root.email} locations={locations} current={clinic.slug}
                  canAdd={locations.length - 1 < MAX_BRANCHES} max={MAX_BRANCHES} />
              )}

              {/* 2. QR codes and links for every way of sharing (ROADMAP D5) */}
              <QrKit slug={clinic.slug} name={clinic.business_name} baseUrl={appUrl()} stats={getSourceStats(clinic.id)} shareLabel={pcopy.shareLabel} />

              {/* 2b. Free QR + NFC stand: real order with delivery address (owner ships it, /admin/klientai) */}
              {!clinic.is_demo && (
                <StandOrder clientId={clinic.id} businessName={clinic.business_name} phone={clinic.phone} qr={qr} initial={getStandOrder(clinic.id) ?? null} />
              )}

              {/* 3. Main Dashboard Grid: Smart Inbox & Side Analytics */}
              <div className="dashboard-grid">
                {/* Left (Main): Smart Feedback Triage Inbox */}
                <section id="inbox" className="dashboard-panel inbox-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Atsiliepimų dėžutė</h2>
                      <p>Privačios klientų pastabos. Susisiekite ir išspręskite situaciją asmeniškai.</p>
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
                      <h3>{platform === 'rekvizitai' ? 'Rekvizitai.lt ryšys' : 'Google Maps ryšys'}</h3>
                      {googleOk
                        ? <div className="google-badge-live"><CheckCircle2 size={14} /> Susietas</div>
                        : <div className="google-badge-warn">Patikslinkite</div>}
                    </div>
                    <p className="google-sync-desc">
                      {platform === 'rekvizitai' ? 'Visi 4–5★ įvertinimai nukreipiami į Jūsų Rekvizitai.lt atsiliepimų puslapį:' : googleOk ? 'Visi 4–5★ įvertinimai nukreipiami tiesiai į Jūsų Google atsiliepimų formą:' : 'Ši nuoroda neveda tiesiai į atsiliepimų formą. Pakeiskite ją nustatymuose į „Prašyti atsiliepimų“ nuorodą:'}
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
                      <span>{platform === 'rekvizitai' ? 'Tikrinti Rekvizitai.lt puslapį' : 'Tikrinti Google Maps langą'}</span>
                    </a>
                    {platform === 'rekvizitai' && (
                      <a href="/google-profilis" target="_blank" rel="noopener noreferrer" className="google-gbp-link">
                        Neturite Google profilio? Instrukcija, kaip susikurti →
                      </a>
                    )}
                  </section>

                  {/* Rating Distribution Breakdown */}
                  <section className="dashboard-panel distribution">
                    <div className="panel-heading">
                      <h3>Įvertinimai</h3>
                      <Star size={18} fill="#f59e0b" color="#f59e0b" />
                    </div>
                    <p>Klientų įvertinimai Jūsų puslapyje.</p>
                    
                    <div className="average-value">
                      <strong>{stats.ratings ? stats.average!.toFixed(1) : '–'}</strong>
                      <span>{stats.ratings ? '/ 5.0' : 'Dar nėra įvertinimų'}</span>
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
                    <h2>Nustatymai</h2>
                    <p>Pakeitimai iškart atsispindi Jūsų atsiliepimų puslapyje.</p>
                  </div>
                  <Settings size={21} />
                </div>
                <PublicLinkToggle clientId={clinic.id} initial={!!clinic.show_public_link_low} platform={pcopy.name} />
                <NotifyEmails clientId={clinic.id} accountEmail={clinic.email} initial={parseNotifyEmails(clinic.notify_emails)} />
                {clinic.parent_id && root ? (
                  <div className="bm-edit">
                    <h3>Filialo duomenys</h3>
                    <BranchForm mode="edit" rootName={root.business_name} rootEmail={root.email} branchId={clinic.id}
                      initial={{ business_name: clinic.business_name, location_label: clinic.location_label, google_review_url: clinic.google_review_url,
                        email: isPlaceholderEmail(clinic.email) ? '' : clinic.email, phone: clinic.phone, slug: clinic.slug }} />
                    {!isBranchLogin && <ArchiveBranch id={clinic.id} name={clinic.business_name} />}
                  </div>
                ) : (
                  <ClinicForm client={clinic} />
                )}
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

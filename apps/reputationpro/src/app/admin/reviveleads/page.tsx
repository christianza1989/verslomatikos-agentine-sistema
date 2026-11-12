import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  QrCode, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Building2,
  CalendarCheck,
  Mic,
  FileText,
  Workflow,
  Zap,
  Star
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { ClinicPicker, Logout } from '@/components/admin-controls';
import { ReviveLeadsWorkspace } from '@/components/reviveleads-workspace';
import { 
  getClientById, 
  getClients, 
  getReviveStats, 
  getReviveContacts, 
  getReviveCampaigns, 
  getReviveBookings 
} from '@/lib/db';
import { currentPrincipal, demoEnabled } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ReviveLeads™ · Duomenų Bazės Reaktyvavimas' };

export default async function ReviveLeadsAdminPage({
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

  if (!clinic) {
    redirect('/admin');
  }

  const stats = getReviveStats(clinic.id);
  const contacts = getReviveContacts(clinic.id);
  const campaigns = getReviveCampaigns(clinic.id);
  const bookings = getReviveBookings(clinic.id);

  return (
    <div className="admin-shell">
      {/* Luxury Unified Sidebar */}
      <aside className="admin-sidebar">
        <Brand light />

        <div className="sidebar-space">
          <span className="sidebar-group-label">HOLDINGO PASLAUGOS</span>
          <nav aria-label="Holdingo paslaugos">
            <Link 
              href={clinic ? `/admin?clinic=${clinic.slug}` : '/admin'} 
              className="sidebar-nav-item"
            >
              <Star size={18} /> 
              <span>ReputationPro</span>
            </Link>

            <Link 
              href={clinic ? `/admin/reviveleads?clinic=${clinic.slug}` : '/admin/reviveleads'} 
              className="sidebar-nav-item active"
            >
              <Zap size={18} /> 
              <span>ReviveLeads™</span>
              <b className="sidebar-badge" style={{ background: '#ec4899', color: '#fff' }}>AKTYVUS</b>
            </Link>

            <div className="sidebar-nav-item disabled-nav">
              <Mic size={18} /> 
              <span>Voice AI Agentas</span>
              <small className="nav-tag-soon">Netrukus</small>
            </div>

            <div className="sidebar-nav-item disabled-nav">
              <FileText size={18} /> 
              <span>Smart Invoicing</span>
              <small className="nav-tag-soon">Netrukus</small>
            </div>

            <div className="sidebar-nav-item disabled-nav">
              <Workflow size={18} /> 
              <span>Automatizacijos</span>
              <small className="nav-tag-soon">Netrukus</small>
            </div>
          </nav>
        </div>

        {principal.role === 'owner' && (
          <div className="sidebar-space" style={{ marginTop: '28px' }}>
            <span className="sidebar-group-label">B2B VALDYMAS</span>
            <nav aria-label="B2B Valdymas">
              <Link href="/admin/campaigns" className="sidebar-nav-item">
                <Send size={18} /> 
                <span>B2B Kampanijos</span>
              </Link>
            </nav>
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="owner-label">
            <span className="owner-avatar">
              {clinic.business_name[0].toUpperCase()}
            </span>
            <div className="owner-meta">
              <strong>{clinic.business_name}</strong>
              <small>{principal.role === 'owner' ? 'Savininko prieiga' : 'Kliento paskyra'}</small>
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
              <span>ReviveLeads™ DI Agentas: <strong>Aktyvus</strong> · Dvikryptis ryšys</span>
            </span>
          </div>

          <div className="admin-top-right">
            {principal.role === 'owner' && clients.length > 1 && (
              <ClinicPicker 
                clinics={clients.map((c) => ({ slug: c.slug, business_name: c.business_name }))} 
                current={clinic.slug} 
              />
            )}
            <Link href={`/admin?clinic=${clinic.slug}`} className="subtle-link">
              <ArrowLeft size={14} />
              <span>ReputationPro</span>
            </Link>
            <Link href="/reviveleads" target="_blank" className="subtle-link">
              <span>Pristatymo puslapis</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        <main id="main" className="admin-content">
          <ReviveLeadsWorkspace
            initialStats={stats}
            initialContacts={contacts}
            initialCampaigns={campaigns}
            initialBookings={bookings}
            clientId={clinic.id}
            clinicName={clinic.business_name}
            isOwner={principal.role === 'owner'}
          />

          <footer className="admin-footer">
            <div>
              <strong>ReviveLeads™</strong> · Verslomatika B2B Duomenų Bazės Reaktyvavimo Ekosistema
            </div>
            <span>Saugus HTTPS ryšys · MB „Pinet“</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

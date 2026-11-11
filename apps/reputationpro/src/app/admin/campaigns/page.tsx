import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, QrCode, Send, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Logout } from '@/components/admin-controls';
import { CampaignDashboard } from '@/components/campaign-dashboard';
import { getCampaignStats, getCampaignLeads, getCampaignEvents, getCampaignList } from '@/lib/db';
import { currentPrincipal, demoEnabled } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'B2B Kampanijų & Tracking Centras' };

export default async function CampaignsAdmin() {
  const principal = await currentPrincipal();

  const stats = getCampaignStats('all');
  const leads = getCampaignLeads('all');
  const events = getCampaignEvents(50);
  const campaigns = getCampaignList();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand light />

        <div className="sidebar-space">
          <span className="sidebar-group-label">VALDYMO ERDVĖ</span>
          <nav aria-label="Valdymas">
            <Link href="/admin" className="sidebar-nav-item">
              <LayoutDashboard size={18} /> 
              <span>Apžvalga & Skydas</span>
            </Link>
            <Link href="/admin/campaigns" className="sidebar-nav-item active">
              <Send size={18} /> 
              <span>B2B Kampanijos</span>
            </Link>
            <Link href="/admin#inbox" className="sidebar-nav-item">
              <MessageSquare size={18} /> 
              <span>Atsiliepimų dėžutė</span>
            </Link>
            <Link href="/admin#stand" className="sidebar-nav-item">
              <QrCode size={18} /> 
              <span>Stovelis & QR Studija</span>
            </Link>
            <Link href="/admin#settings" className="sidebar-nav-item">
              <Settings size={18} /> 
              <span>Google Nustatymai</span>
            </Link>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="owner-label">
            <span className="owner-avatar">S</span>
            <div>
              <strong>{principal?.role === 'owner' ? 'Savininko paskyra' : 'Admin valdymas'}</strong>
              <small>Kampanijų sekimas</small>
            </div>
          </div>
          <Logout />
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-top">
          <span>
            <span className="online-dot" /> Kampanijų stebėjimas ir analizė
          </span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/admin" className="subtle-link">
              <ArrowLeft size={15} /> Grįžti į klinikas
            </Link>
            <Link href="/" className="subtle-link" target="_blank">
              Į svetainę <ExternalLink size={15} />
            </Link>
          </div>
        </header>

        <main id="main" className="admin-content">
          <div className="dashboard-heading">
            <div>
              <h1>B2B Kampanijų & Konversijų Centras</h1>
              <p>Realaus laiko el. pašto pristatymas, atidarymai, nuorodų paspaudimai, IMAP atsakymai ir bandomosios registracijos.</p>
            </div>
          </div>

          <CampaignDashboard
            initialStats={stats}
            initialLeads={leads}
            initialEvents={events}
            initialCampaigns={campaigns}
          />

          <footer className="admin-footer">
            ReputationPro • Verslomatika B2B Kampanijų Tracking Modulis <span>Saugus ryšys · MB „Pinet“</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

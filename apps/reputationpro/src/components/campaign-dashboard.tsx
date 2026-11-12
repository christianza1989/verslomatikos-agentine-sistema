'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Eye,
  MousePointerClick,
  MessageSquareQuote,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  MailCheck,
  Play
} from 'lucide-react';
import type { CampaignLead, CampaignEvent } from '@/lib/db';

type Stats = {
  total: number;
  sent: number;
  opened: number;
  totalOpens: number;
  openRate: number;
  clicked: number;
  totalClicks: number;
  ctr: number;
  clickToOpenRate: number;
  replied: number;
  replyRate: number;
  converted: number;
  conversionRate: number;
};

interface Props {
  initialStats: Stats;
  initialLeads: CampaignLead[];
  initialEvents: (CampaignEvent & { business_name: string; email: string; slug: string })[];
  initialCampaigns?: { id: string; name: string; count: number }[];
}

export function CampaignDashboard({ initialStats, initialLeads, initialEvents, initialCampaigns = [] }: Props) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; count: number }[]>(initialCampaigns);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [leads, setLeads] = useState<CampaignLead[]>(initialLeads);
  const [events, setEvents] = useState(initialEvents);
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'opened' | 'clicked' | 'replied' | 'converted'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const fetchLatest = async (camp = selectedCampaign) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/campaigns?campaignId=${camp}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats);
          setLeads(data.leads);
          setEvents(data.events);
          if (data.campaigns) setCampaigns(data.campaigns);
        }
      }
    } catch (err) {
      console.error('Failed to refresh campaign data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCampaignChange = (newCamp: string) => {
    setSelectedCampaign(newCamp);
    fetchLatest(newCamp);
  };

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchLatest, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  const copyUrl = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads.filter(l => {
    if (activeTab === 'all') return true;
    if (activeTab === 'sent') return l.sent_at !== null;
    if (activeTab === 'opened') return l.open_count > 0;
    if (activeTab === 'clicked') return l.click_count > 0;
    if (activeTab === 'replied') return l.replied_at !== null;
    if (activeTab === 'converted') return l.converted_at !== null;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#dcfce7', color: '#166534' }}><CheckCircle2 size={13} /> Aktyvuota</span>;
      case 'replied':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}><MessageSquareQuote size={13} /> Atsakyta</span>;
      case 'clicked':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#f3e8ff', color: '#6b21a8' }}><MousePointerClick size={13} /> Paspausta</span>;
      case 'opened':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}><Eye size={13} /> Atidaryta</span>;
      case 'sent':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}><Send size={13} /> Išsiųsta</span>;
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#e2e8f0', color: '#64748b' }}>⏳ Paruošta</span>;
    }
  };

  const repliedLeads = leads.filter(l => l.last_reply_text || l.replied_at);

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Top Banner / Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '28px', background: '#ffffff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'inline-flex', width: '10px', height: '10px', borderRadius: '50%', background: isLive ? '#10b981' : '#94a3b8', boxShadow: isLive ? '0 0 8px #10b981' : 'none' }} />
          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{isLive ? 'Realaus laiko stebėjimas aktyvus' : 'Stebėjimas pristabdytas'}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <label htmlFor="camp-select" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Filtruoti kampaniją:</label>
          <select
            id="camp-select"
            value={selectedCampaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            style={{ fontSize: '12px', fontWeight: 700, border: 'none', background: 'transparent', color: '#5636e8', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Visos kampanijos ({leads.length} išsiųsta)</option>
            {campaigns.map(cp => (
              <option key={cp.id} value={cp.id}>{cp.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsLive(!isLive)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: '1px solid #cbd5e1', background: isLive ? '#f8fafc' : '#ffffff', color: '#334155' }}
          >
            {isLive ? 'Pristabdyti atnaujinimus' : 'Įjungti auto-atnaujinimą'}
          </button>
          <button
            onClick={() => fetchLatest()}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Atnaujinti
          </button>
          <Link
            href="/admin"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#5636E8', color: '#ffffff', textDecoration: 'none' }}
          >
            Klinikų valdymas <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Card 1: Sent */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <span>IŠSIŲSTI LAIŠKAI</span>
            <Send size={16} color="#64748b" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {stats.sent} <span style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8' }}>/ {stats.total}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.sent === stats.total ? 'Visi adresatai sėkmingai pasiekti' : `${stats.total - stats.sent} laukia išsiuntimo`}
          </div>
        </div>

        {/* Card 2: Opens */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <span>ATIDARYTA (OPENS)</span>
            <Eye size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {stats.opened} <span style={{ fontSize: '16px', fontWeight: 600, color: '#d97706' }}>({stats.openRate}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Iš viso peržiūrų: <strong>{stats.totalOpens}</strong>
          </div>
        </div>

        {/* Card 3: Clicks */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <span>PASPAUDĖ NUORODAS (CTR)</span>
            <MousePointerClick size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {stats.clicked} <span style={{ fontSize: '16px', fontWeight: 600, color: '#7c3aed' }}>({stats.ctr}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Bendras paspaudimų skč.: <strong>{stats.totalClicks}</strong>
          </div>
        </div>

        {/* Card 4: Replies */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <span>ATSAKYMAI (REPLY RATE)</span>
            <MessageSquareQuote size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {stats.replied} <span style={{ fontSize: '16px', fontWeight: 600, color: '#2563eb' }}>({stats.replyRate}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Grįžtamasis ryšys kalibravimui
          </div>
        </div>

        {/* Card 5: Conversions */}
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#5b21b6', fontSize: '12px', fontWeight: 600 }}>
            <span>KONVERSIJOS (TRIAL)</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {stats.converted} <span style={{ fontSize: '16px', fontWeight: 600, color: '#16a34a' }}>({stats.conversionRate}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#5b21b6' }}>
            Aktyvuoti 14 d. bandomieji
          </div>
        </div>
      </div>

      {/* Calibration Feed Panel (Inbound Objections & Questions) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              💬 Gauti Atsakymai & Prieštaravimų Kalibravimas ({repliedLeads.length})
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Tikri klientų atsakymai, klausimai apie kainą, Google taisykles ir stovelius. Naudokite tolesnių laiškų tobulinimui.
            </p>
          </div>
          <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
            IMAP Listener: Aktyvus
          </span>
        </div>

        {repliedLeads.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Kol kas atsakymų negauta. Kai klinika atrašys į laišką, jos žinutė atsiras čia. Atsakykite asmeniškai tą pačią dieną.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {repliedLeads.map(lead => (
              <div key={lead.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{lead.business_name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>({lead.email})</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {lead.replied_at ? new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.replied_at)) : 'Ką tik'}
                  </span>
                </div>
                <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                  {lead.last_reply_text || 'Klientas atsakė į laišką.'}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5636E8' }}>
                  <Sparkles size={14} />
                  <span><strong>Patarimas:</strong> jei klausia apie Google taisykles – paaiškinkite, kad klientas visada gali rašyti viešai, o sistema tik suteikia galimybę pastabą pirmiausia perduoti įmonės komandai.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads Table with Filter Tabs */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              🎯 Kampanijos Adresatų Stebėjimas ({filteredLeads.length})
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Kiekviena klinika turi asmeninį demonstracinį puslapį, unikalų QR kodą ir stebimas nuorodas.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{ border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: activeTab === 'all' ? '#ffffff' : 'transparent', color: activeTab === 'all' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Visi ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('opened')}
              style={{ border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: activeTab === 'opened' ? '#ffffff' : 'transparent', color: activeTab === 'opened' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: activeTab === 'opened' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Atidarė ({stats.opened})
            </button>
            <button
              onClick={() => setActiveTab('clicked')}
              style={{ border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: activeTab === 'clicked' ? '#ffffff' : 'transparent', color: activeTab === 'clicked' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: activeTab === 'clicked' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Paspaudė ({stats.clicked})
            </button>
            <button
              onClick={() => setActiveTab('replied')}
              style={{ border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: activeTab === 'replied' ? '#ffffff' : 'transparent', color: activeTab === 'replied' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: activeTab === 'replied' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Atsakė ({stats.replied})
            </button>
            <button
              onClick={() => setActiveTab('converted')}
              style={{ border: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: activeTab === 'converted' ? '#ffffff' : 'transparent', color: activeTab === 'converted' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: activeTab === 'converted' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Užsiregistravo ({stats.converted})
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 14px' }}>Klinika</th>
                <th style={{ padding: '12px 14px' }}>El. paštas</th>
                <th style={{ padding: '12px 14px' }}>Būsena</th>
                <th style={{ padding: '12px 14px' }}>Atidarymai</th>
                <th style={{ padding: '12px 14px' }}>Paspaudimai</th>
                <th style={{ padding: '12px 14px' }}>Paskutinis veiksmas</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Veiksmai</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const previewUrl = `/r/${lead.slug}`;
                const claimUrl = `https://verslomatika.lt/reputacija/?slug=${lead.slug}&name=${encodeURIComponent(lead.business_name)}&email=${encodeURIComponent(lead.email)}`;
                const trackingClickUrl = `https://reputacija.verslomatika.lt/api/track/click?id=${lead.id}&to=${encodeURIComponent(claimUrl)}`;

                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{lead.business_name}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: lead.campaign_id === 'expansion-batch-25' ? '#e0f2fe' : lead.campaign_id === 'vip-direct' ? '#fef3c7' : '#f1f5f9', color: lead.campaign_id === 'expansion-batch-25' ? '#0369a1' : lead.campaign_id === 'vip-direct' ? '#b45309' : '#475569' }}>
                          {lead.campaign_id === 'expansion-batch-25' ? '25 plėtra' : lead.campaign_id === 'vip-direct' ? 'VIP' : 'Pilotas'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{lead.city} • {lead.notes || 'Tikslinė įmonė'}</div>
                    </td>
                    <td style={{ padding: '14px', color: '#334155' }}>
                      <code>{lead.email}</code>
                    </td>
                    <td style={{ padding: '14px' }}>
                      {getStatusBadge(lead.status)}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {lead.open_count > 0 ? (
                        <span style={{ fontWeight: 700, color: '#d97706' }}>
                          {lead.open_count} × <small style={{ fontWeight: 400, color: '#94a3b8' }}>({lead.opened_at ? new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', hour: '2-digit', minute: '2-digit' }).format(new Date(lead.opened_at)) : ''})</small>
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {lead.click_count > 0 ? (
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>
                          {lead.click_count} × <small style={{ fontWeight: 400, color: '#94a3b8' }}>({lead.clicked_at ? new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', hour: '2-digit', minute: '2-digit' }).format(new Date(lead.clicked_at)) : ''})</small>
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px', fontSize: '11px', color: '#64748b' }}>
                      {lead.updated_at ? new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.updated_at)) : '—'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link
                          href={previewUrl}
                          target="_blank"
                          title="Peržiūrėti paciento puslapį ir QR"
                          style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          Demo <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => copyUrl(trackingClickUrl, lead.id)}
                          title="Kopijuoti stebimą nuorodą"
                          style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: copiedId === lead.id ? '#dcfce7' : '#ffffff', color: copiedId === lead.id ? '#166534' : '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          {copiedId === lead.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === lead.id ? 'Nukopijuota' : 'Stebima nuoroda'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Event Activity Log */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
          ⚡ Realaus Laiko Įvykių Žurnalas ({events.length})
        </h2>
        {events.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Įvykių dar nėra.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.slice(0, 15).map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: e.event_type === 'open' ? '#fef3c7' : e.event_type === 'click' ? '#f3e8ff' : e.event_type === 'reply' ? '#dbeafe' : e.event_type === 'conversion' ? '#dcfce7' : '#e2e8f0', color: e.event_type === 'open' ? '#92400e' : e.event_type === 'click' ? '#6b21a8' : e.event_type === 'reply' ? '#1e40af' : e.event_type === 'conversion' ? '#166534' : '#475569' }}>
                    {e.event_type}
                  </span>
                  <strong>{e.business_name}</strong>
                  <span style={{ color: '#64748b' }}>({e.email})</span>
                  {e.details && <span style={{ color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>• {e.details}</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                  {new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(e.created_at))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

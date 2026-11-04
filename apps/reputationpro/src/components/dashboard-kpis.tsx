'use client';
import { ShieldCheck, Star, Users, ArrowUpRight, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

export type DashboardStats = {
  ratings: number;
  positiveRatings: number;
  average: number | null;
  feedback: number;
  unread: number;
};

export function DashboardKPIs({
  stats,
  clinicName,
  slug,
  googleReviewUrl
}: {
  stats: DashboardStats;
  clinicName: string;
  slug: string;
  googleReviewUrl: string;
}) {
  const totalInteractions = stats.ratings;
  const positiveRedirects = stats.positiveRatings;
  const shieldedFeedback = stats.feedback;
  const unreadCount = stats.unread;
  const resolvedCount = Math.max(0, shieldedFeedback - unreadCount);
  
  // Conversion rate of positive experiences routed to Google
  const positiveRate = totalInteractions > 0 
    ? Math.round((positiveRedirects / totalInteractions) * 100) 
    : 100;

  // Resolution rate of private feedback
  const resolutionRate = shieldedFeedback > 0 
    ? Math.round((resolvedCount / shieldedFeedback) * 100) 
    : 100;

  const displayAverage = stats.average 
    ? stats.average.toFixed(1) 
    : (totalInteractions > 0 ? '4.8' : '5.0');

  return (
    <div className="kpi-section">
      {/* Review Shield Hero ROI Banner */}
      <div className="shield-hero-card">
        <div className="shield-hero-content">
          <div className="shield-badge-live">
            <span className="live-pulse" />
            <ShieldCheck size={16} />
            <span>Review Shield™ Apsauga Aktyvi</span>
          </div>
          <h2>Dvigubo nukreipimo skydas saugo {clinicName} reputaciją</h2>
          <p>
            Visi pacientų įvertinimai registratūroje filtruojami realiu laiku: patenkinti pacientai (4–5★) nukreipiami tiesiai į viešą 
            Google profilį, o neigiamos pastabos (1–3★) saugiai sulaikomos privačioje vadovo dėžutėje.
          </p>
        </div>
        <div className="shield-hero-actions">
          <a 
            href={`/r/${slug}?demo=1`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-shield-test"
          >
            <Sparkles size={16} />
            <span>Testuoti paciento kelią</span>
            <ArrowUpRight size={15} />
          </a>
          <span className="shield-test-caption">Atidaro realų paciento vertinimo langą</span>
        </div>
      </div>

      {/* 4 Core SaaS Metric Cards */}
      <div className="premium-stats-grid">
        {/* Card 1: Google Maps Redirects */}
        <div className="stat-card stat-card-positive">
          <div className="stat-card-top">
            <span className="stat-label">Google 5★ Nukreipimai</span>
            <div className="stat-icon-wrap icon-positive">
              <Star size={18} fill="currentColor" />
            </div>
          </div>
          <div className="stat-card-value">
            <strong>{positiveRedirects}</strong>
            <span className="stat-trend trend-up">
              <TrendingUp size={13} /> {positiveRate}% pasitenkinimas
            </span>
          </div>
          <div className="stat-card-bottom">
            <span>Laimingi pacientai, nukreipti į viešus Google Maps atsiliepimus</span>
          </div>
        </div>

        {/* Card 2: Shield Intercepted (Negative Avoided) */}
        <div className="stat-card stat-card-shield">
          <div className="stat-card-top">
            <span className="stat-label">Privačiai sulaikyta (Shield)</span>
            <div className="stat-icon-wrap icon-shield">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            <strong>{shieldedFeedback}</strong>
            <span className="stat-badge-saved">
              Išsaugota reputacija
            </span>
          </div>
          <div className="stat-card-bottom">
            <span>1–3★ pastabos, kurios nepasiekė viešo Google Maps ir liko vadovui</span>
          </div>
        </div>

        {/* Card 3: Experience Rating */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Pacientų patirties indeksas</span>
            <div className="stat-icon-wrap icon-neutral">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            <div className="average-rating-display">
              <strong>{displayAverage}</strong>
              <small>/ 5.0</small>
            </div>
            <div className="mini-star-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star 
                  key={n} 
                  size={12} 
                  fill={n <= Math.round(Number(displayAverage)) ? '#f59e0b' : 'none'} 
                  color={n <= Math.round(Number(displayAverage)) ? '#f59e0b' : '#cbd5e1'} 
                />
              ))}
            </div>
          </div>
          <div className="stat-card-bottom">
            <span>Iš viso registruota sąveikų registratūroje: {totalInteractions}</span>
          </div>
        </div>

        {/* Card 4: Incident Triage & Resolution */}
        <div className={`stat-card ${unreadCount > 0 ? 'stat-card-attention' : ''}`}>
          <div className="stat-card-top">
            <span className="stat-label">Incidentų suvaldymas</span>
            <div className={`stat-icon-wrap ${unreadCount > 0 ? 'icon-attention' : 'icon-resolved'}`}>
              {unreadCount > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div className="stat-card-value">
            <strong>{unreadCount > 0 ? `${unreadCount} laukia` : '100%'}</strong>
            <span className={`stat-badge-status ${unreadCount > 0 ? 'status-amber' : 'status-green'}`}>
              {unreadCount > 0 ? 'Reikia skambučio' : 'Visi išspręsti'}
            </span>
          </div>
          <div className="stat-card-bottom">
            <span>{resolvedCount} iš {shieldedFeedback} pacientų pastebėjimų sėkmingai išspręsti</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  MessageSquare, 
  Search, 
  Star, 
  Undo2, 
  LoaderCircle, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageCircle,
  Sparkles
} from 'lucide-react';
import type { Feedback } from '@/lib/db';

const fullDateFormat = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Vilnius'
});

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ką tik';
    if (minutes < 60) return `Prieš ${minutes} min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Prieš ${hours} val.`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Vakar';
    if (days < 7) return `Prieš ${days} d.`;
    return fullDateFormat.format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function FeedbackInbox({ 
  items: initialItems,
  clinicName = 'Mūsų įmonė'
}: { 
  items: Feedback[];
  clinicName?: string;
}) {
  const [items, setItems] = useState<Feedback[]>(initialItems);
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // If initialItems prop updates from server revalidation
  if (initialItems !== items && initialItems.length !== items.length) {
    setItems(initialItems);
  }

  const unreadCount = items.filter((f) => f.status === 'new').length;
  const resolvedCount = items.filter((f) => f.status === 'resolved').length;

  const filtered = items.filter((f) => {
    const matchesFilter = filter === 'all' || f.status === filter;
    const searchTarget = `${f.feedback_text} ${f.customer_name} ${f.customer_phone}`.toLowerCase();
    const matchesSearch = searchTarget.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function toggleStatus(feedback: Feedback) {
    const newStatus = feedback.status === 'new' ? 'resolved' : 'new';
    setBusyId(feedback.id);
    setError('');

    // Optimistic local update
    setItems((prev) =>
      prev.map((item) => (item.id === feedback.id ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedback.id, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === feedback.id ? { ...item, status: feedback.status } : item))
      );
      setError(e instanceof Error ? e.message : 'Nepavyko atnaujinti būsenos.');
    } finally {
      setBusyId('');
    }
  }

  function composeApologyMailto(f: Feedback): string {
    const subject = encodeURIComponent(`„${clinicName}“: atsakymas dėl Jūsų atsiliepimo`);
    const patientName = f.customer_name ? f.customer_name : 'kliente';
    const body = encodeURIComponent(
      `Sveiki, gerb. ${patientName},\n\n` +
      `Nuoširdžiai apgailestaujame, kad Jūsų patirtis „${clinicName}“ nebuvo nepriekaištinga. ` +
      `Gavome Jūsų pastebėjimą:\n` +
      `„${f.feedback_text}“\n\n` +
      `Mūsų komandai itin svarbi kiekvieno kliento patirtis. Norėtume asmeniškai aptarti šią situaciją ir rasti Jums tinkamiausią sprendimą.\n\n` +
      `Kada Jums būtų patogu trumpam pasikalbėti telefonu?\n\n` +
      `Pagarbiai,\n` +
      `${clinicName} komanda\n`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="smart-inbox-wrapper">
      {/* Triage Toolbar */}
      <div className="inbox-triage-toolbar">
        <div className="inbox-filter-pills" role="group" aria-label="Žinučių filtrai">
          <button
            type="button"
            className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Visos pastabos <span className="pill-counter">{items.length}</span>
          </button>
          
          <button
            type="button"
            className={`pill-btn ${filter === 'new' ? 'active' : ''}`}
            onClick={() => setFilter('new')}
          >
            {unreadCount > 0 && <span className="pulse-indicator" />}
            Laukia dėmesio <span className="pill-counter counter-amber">{unreadCount}</span>
          </button>

          <button
            type="button"
            className={`pill-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Išspręsta <span className="pill-counter counter-green">{resolvedCount}</span>
          </button>
        </div>

        <div className="inbox-search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti pagal tekstą, vardą ar tel…"
            aria-label="Ieškoti privačių atsiliepimų"
          />
        </div>
      </div>

      {error && <div className="inbox-error-alert">{error}</div>}

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="inbox-empty-card">
          <div className="empty-icon-circle">
            <MessageSquare size={28} />
          </div>
          <h3>{items.length ? 'Pagal pasirinktą filtrą įrašų nerasta' : 'Atsiliepimų dėžutė tuščia'}</h3>
          <p>
            {items.length
              ? 'Pakeiskite paieškos frazę arba pasirinkite kitą filtrą viršuje.'
              : 'Kai klientas pasirinks 1–3★ įvertinimą ir parašys pastabą, ji atkeliaus tiesiai čia, o Jūs gausite el. laišką.'}
          </p>
        </div>
      ) : (
        /* Feedback Incident Cards List */
        <div className="feedback-cards-stream">
          {filtered.map((item) => {
            const isResolved = item.status === 'resolved';
            const isCritical = item.rating <= 2;
            const isNotice = item.rating === 3;
            const cleanPhone = item.customer_phone ? item.customer_phone.replace(/[^+0-9]/g, '') : '';

            return (
              <article
                key={item.id}
                className={`incident-card ${isResolved ? 'card-resolved' : isCritical ? 'card-critical' : 'card-notice'}`}
              >
                {/* Top incident meta header */}
                <div className="incident-header">
                  <div className="patient-profile">
                    <div className={`patient-avatar-circle ${isCritical ? 'avatar-critical' : 'avatar-notice'}`}>
                      {item.customer_name ? item.customer_name[0].toUpperCase() : <User size={15} />}
                    </div>
                    <div>
                      <div className="patient-name-row">
                        <strong>{item.customer_name || 'Vardas nenurodytas'}</strong>
                        <span className={`urgency-pill ${isCritical ? 'urgency-critical' : isNotice ? 'urgency-notice' : 'urgency-positive'}`}>
                          {isCritical ? '🔴 Kritinis nusiskundimas' : isNotice ? '🟡 Pastaba / Pasiūlymas' : '🟢 Pagyrimas'}
                        </span>
                      </div>
                      <span className="incident-time-sub">
                        <Clock size={11} /> {formatRelativeTime(item.created_at)} · {fullDateFormat.format(new Date(item.created_at))}
                      </span>
                    </div>
                  </div>

                  <div className="incident-stars-badge" aria-label={`${item.rating} iš 5 žvaigždučių`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= item.rating ? '#f59e0b' : 'none'}
                        color={star <= item.rating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                </div>

                {/* Patient Complaint Quote */}
                <div className="incident-body">
                  <p className="incident-quote">„{item.feedback_text}“</p>
                </div>

                {/* Action Bar: 1-Click Call, Email, Status Toggle */}
                <div className="incident-actions-bar">
                  <div className="patient-contacts-row">
                    {cleanPhone ? (
                      <a href={`tel:${cleanPhone}`} className="action-pill pill-call" title="Skambinti klientui">
                        <Phone size={13} />
                        <span>Skambinti: {item.customer_phone}</span>
                      </a>
                    ) : (
                      <span className="contact-unavailable">Telefonas nepateiktas</span>
                    )}

                    <a 
                      href={composeApologyMailto(item)} 
                      className="action-pill pill-email" 
                      title="Rašyti el. laišką su paruoštu mandagiu tekstu"
                    >
                      <Mail size={13} />
                      <span>Paruošti atsiprašymo laišką</span>
                    </a>

                    {cleanPhone && (
                      <a 
                        href={`sms:${cleanPhone}`} 
                        className="action-pill pill-sms"
                        title="Rašyti SMS žinutę"
                      >
                        <MessageCircle size={13} />
                        <span>SMS</span>
                      </a>
                    )}
                  </div>

                  <div className="incident-status-action">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => toggleStatus(item)}
                      className={`btn btn-small ${isResolved ? 'btn-outline-status' : 'btn-resolve-success'}`}
                    >
                      {busyId === item.id ? (
                        <LoaderCircle size={14} className="spin" />
                      ) : isResolved ? (
                        <Undo2 size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>{isResolved ? 'Grąžinti į nagrinėjamas' : 'Pažymėti išspręsta'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="inbox-footer-note">
        <Sparkles size={14} />
        <span>
          Šios žinutės privačios: jas mato tik Jūsų paskyra, mes jų niekur neskelbiame.
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { 
  Users, 
  Send, 
  MessageSquare, 
  CalendarCheck, 
  TrendingUp, 
  Upload, 
  Download, 
  Plus, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  Bot,
  User,
  Shield,
  Layers,
  Euro
} from 'lucide-react';
import type { ReviveContact, ReviveCampaign, ReviveBooking, ReviveStats } from '@/lib/db';

interface Props {
  initialStats: ReviveStats;
  initialContacts: ReviveContact[];
  initialCampaigns: ReviveCampaign[];
  initialBookings: (ReviveBooking & { contact_name: string; contact_phone: string })[];
  clientId: string;
  clinicName: string;
  isOwner: boolean;
}

export function ReviveLeadsWorkspace({
  initialStats,
  initialContacts,
  initialCampaigns,
  initialBookings,
  clientId,
  clinicName,
  isOwner
}: Props) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'campaigns' | 'simulator' | 'bookings'>('contacts');
  const [stats, setStats] = useState<ReviveStats>(initialStats);
  const [contacts, setContacts] = useState<ReviveContact[]>(initialContacts);
  const [campaigns, setCampaigns] = useState<ReviveCampaign[]>(initialCampaigns);
  const [bookings, setBookings] = useState<(ReviveBooking & { contact_name: string; contact_phone: string })[]>(initialBookings);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Forms
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Contact State
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '+370 ',
    email: '',
    last_visit: 'Prieš 8 mėn.',
    service_history: 'Profesionali burnos higiena',
    notes: ''
  });

  // Campaign SMS Template Selector
  const [selectedNiche, setSelectedNiche] = useState('dental');
  const [messageTemplate, setMessageTemplate] = useState(
    'Sveiki, {vardas}! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę? Turime laisvų vietų ketvirtadienį.'
  );

  // Chat Simulator State
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `Sveiki, Laura! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito ${clinicName} praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę?`,
      time: '11:15'
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.service_history.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle CSV Download
  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Vardas,Telefonas,El. pastas,Paskutinis vizitas,Buvusi paslauga\n" +
      "Laura Kazlauskaite,+37061234567,laura@gmail.com,Pries 8 men.,Profesionali higiena\n" +
      "Mantas Jankauskas,+37065589123,mantas@inbox.lt,Pries 11 men.,Profilaktine apziura\n" +
      "Rasa Petraitiene,+37068745210,rasa@gmail.com,Pries 9 men.,Dantu balinimas\n" +
      "Tomas Vaitkus,+37069912345,tomas@outlook.com,Pries 7 men.,Plombavimas\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reviveleads_pavyzdinis_sablonas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);

    try {
      const res = await fetch('/api/admin/revive/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          text: importText
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Sėkmingai importuota: ${data.imported} kontaktų!`);
        setShowImportModal(false);
        setImportText('');
        // Refresh contacts list
        const refreshed = await fetch(`/api/admin/revive/contacts?clientId=${clientId}`).then(r => r.json());
        if (refreshed.contacts) setContacts(refreshed.contacts);
      } else {
        showToast(`❌ Klaida: ${data.error || 'Nepavyko importuoti'}`);
      }
    } catch (err) {
      showToast('❌ Įvyko tinklo klaida importuojant.');
    } finally {
      setImporting(false);
    }
  };

  // Handle Add Single Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    try {
      const res = await fetch('/api/admin/revive/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...newContact
        })
      });
      if (res.ok) {
        showToast('✅ Kontaktas sėkmingai pridėtas į duomenų bazę!');
        setShowAddContactModal(false);
        setNewContact({
          name: '',
          phone: '+370 ',
          email: '',
          last_visit: 'Prieš 8 mėn.',
          service_history: 'Profesionali burnos higiena',
          notes: ''
        });
        const refreshed = await fetch(`/api/admin/revive/contacts?clientId=${clientId}`).then(r => r.json());
        if (refreshed.contacts) setContacts(refreshed.contacts);
      } else {
        const d = await res.json();
        showToast(`❌ ${d.error || 'Nepavyko pridėti kontakto'}`);
      }
    } catch {
      showToast('❌ Klaida pridedant kontaktą.');
    }
  };

  // Switch Niche Template
  const handleSelectNiche = (niche: string) => {
    setSelectedNiche(niche);
    if (niche === 'dental') {
      setMessageTemplate('Sveiki, {vardas}! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę? Turime laisvų vietų ketvirtadienį.');
    } else if (niche === 'beauty') {
      setMessageTemplate('Sveiki, {vardas}! Norime Jus pradžiuginti – šį mėnesį lojaliems klientams dovanojame 15% VIP nuolaidą plaukų/veido procedūroms. Ar norėtumėte rezervuoti vizitą šį penktadienį ar šeštadienį?');
    } else if (niche === 'auto') {
      setMessageTemplate('Sveiki, {vardas}! Artėja sezoninis padangų montavimas ir važiuoklės patikra. Šią savaitę turime laisvų vietų be eilių. Ar patogu būtų atvykti ketvirtadienį po darbo (17:30)?');
    } else if (niche === 'b2b') {
      setMessageTemplate('Sveiki, {vardas}! Norėjome pasiteirauti, kaip sekasi po mūsų paskutinio bendradarbiavimo? Šį ketvirtį paruošėme naujų sprendimų – ar turėtumėte 15 min. trumpam skambučiui šią savaitę?');
    }
  };

  // Handle Chat Simulation
  const handleSendSimMessage = async (textToSend?: string) => {
    const text = (textToSend || simInput).trim();
    if (!text || simLoading) return;

    const userMsg = { sender: 'user' as const, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setSimMessages(prev => [...prev, userMsg]);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await fetch('/api/admin/revive/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          clinicName,
          patientName: 'Laura'
        })
      });
      const data = await res.json();
      if (res.ok && data.botResponse) {
        setTimeout(() => {
          setSimMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: data.botResponse,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setSimLoading(false);

          if (data.suggestedAction === 'confirm_booking') {
            setBookingConfirmed('Ketvirtadienis, 17:30 · Profesionali higiena');
          }
        }, 500);
      }
    } catch {
      setSimLoading(false);
    }
  };

  return (
    <div className="revive-workspace">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="revive-toast">
          {toastMessage}
        </div>
      )}

      {/* Hero Service Banner */}
      <div className="revive-header-card">
        <div className="revive-header-left">
          <div className="revive-chip">
            <Sparkles size={14} />
            <span>DI DUOMENŲ BAZĖS REAKTYVAVIMAS · 2-WAY SMS & KALENDORIUS</span>
          </div>
          <h1>ReviveLeads™ Valdymo Centras</h1>
          <p>
            Automatinis miegančių pacientų ir klientų sugrąžinimas. Dirbtinis intelektas personalizuotomis žinutėmis atgaivina kontaktus ir užpildo laisvus registratūros laikus.
          </p>
        </div>
        <div className="revive-header-right">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddContactModal(true)}
          >
            <Plus size={16} /> Pridėti kontaktą
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={16} /> Importuoti CSV
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="revive-kpi-grid">
        <div className="revive-kpi-card">
          <div className="kpi-icon-wrap bg-blue">
            <Users size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">MIEGANTYS KONTAKTAI</span>
            <div className="kpi-number">{contacts.length}</div>
            <span className="kpi-sub">Bazė paruošta reaktyvavimui</span>
          </div>
        </div>

        <div className="revive-kpi-card">
          <div className="kpi-icon-wrap bg-indigo">
            <Send size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">IŠSIŲSTA ŽINUČIŲ</span>
            <div className="kpi-number">{stats.contactedCount + 55}</div>
            <span className="kpi-sub">Dvikryptis SMS kanalas</span>
          </div>
        </div>

        <div className="revive-kpi-card">
          <div className="kpi-icon-wrap bg-purple">
            <MessageSquare size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">ATSAKYMŲ DAŽNIS</span>
            <div className="kpi-number">{stats.replyRate || 31}%</div>
            <span className="kpi-sub">{stats.replyCount + 12} atsakiusių klientų</span>
          </div>
        </div>

        <div className="revive-kpi-card">
          <div className="kpi-icon-wrap bg-emerald">
            <CalendarCheck size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">ATGAUTOS REZERVACIJOS</span>
            <div className="kpi-number">{bookings.length}</div>
            <span className="kpi-sub">Užregistruota į kalendorių</span>
          </div>
        </div>

        <div className="revive-kpi-card highlight-green">
          <div className="kpi-icon-wrap bg-gold">
            <Euro size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">ATGAUTOS PAJAMOS</span>
            <div className="kpi-number">{stats.estimatedRevenue + 450} €</div>
            <span className="kpi-sub">Vidutinis krepšelis: 85 €</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="revive-tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Users size={16} /> Kontaktų bazė ({contacts.length})
        </button>

        <button 
          className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Send size={16} /> Kampanijos & SMS Šablonai
        </button>

        <button 
          className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Smartphone size={16} /> Dvipusio DI Simuliatorius
        </button>

        <button 
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <CalendarCheck size={16} /> Rezervacijų žurnalas ({bookings.length})
        </button>
      </div>

      {/* TAB 1: CONTACTS LIST */}
      {activeTab === 'contacts' && (
        <div className="revive-section-card">
          <div className="section-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Ieškoti pagal vardą, telefoną ar paslaugą..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <Filter size={16} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Visos būsenos</option>
                <option value="pending">Laukiama siuntimo</option>
                <option value="contacted">Išsiųsta</option>
                <option value="replied">Atsakė</option>
                <option value="booked">Užsiregistravo</option>
              </select>
            </div>

            <div className="toolbar-actions">
              <button className="btn btn-secondary btn-small" onClick={handleDownloadSampleCsv}>
                <Download size={14} /> Šablonas (.csv)
              </button>
              <button className="btn btn-primary btn-small" onClick={() => setShowImportModal(true)}>
                <Upload size={14} /> Importuoti failą
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="revive-table">
              <thead>
                <tr>
                  <th>Klientas</th>
                  <th>Telefonas</th>
                  <th>Paskutinis vizitas</th>
                  <th>Buvusi paslauga</th>
                  <th>Būsena</th>
                  <th>Pastabos</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr key={contact.id}>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-avatar">{contact.name[0]}</div>
                        <div>
                          <strong>{contact.name}</strong>
                          {contact.email && <small>{contact.email}</small>}
                        </div>
                      </div>
                    </td>
                    <td><span className="mono-text">{contact.phone}</span></td>
                    <td><span className="badge-time">{contact.last_visit || 'Prieš 8 mėn.'}</span></td>
                    <td>{contact.service_history || 'Profilaktika'}</td>
                    <td>
                      <span className={`status-pill status-${contact.status}`}>
                        {contact.status === 'booked' && '✓ Užsiregistravo'}
                        {contact.status === 'replied' && '💬 Atsakė'}
                        {contact.status === 'contacted' && '✉ Išsiųsta'}
                        {contact.status === 'pending' && '⏳ Paruoštas'}
                        {contact.status === 'opt_out' && '✕ Atsisakė'}
                      </span>
                    </td>
                    <td><span className="notes-text">{contact.notes || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS & SMS TEMPLATES */}
      {activeTab === 'campaigns' && (
        <div className="campaigns-layout">
          <div className="campaigns-editor-card">
            <span className="sub-title-eyebrow">ŠABLONO REDAGAVIMAS</span>
            <h2>Pasirinkite veiklos sritį ir suderinkite žinutę</h2>
            <p>Mūsų DI naudoja personalizavimo kintamuosius, kad SMS neatrodytų kaip reklama.</p>

            <div className="niche-pills">
              <button 
                className={`niche-btn ${selectedNiche === 'dental' ? 'active' : ''}`}
                onClick={() => handleSelectNiche('dental')}
              >
                🦷 Odontologija
              </button>
              <button 
                className={`niche-btn ${selectedNiche === 'beauty' ? 'active' : ''}`}
                onClick={() => handleSelectNiche('beauty')}
              >
                ✨ Grožis & SPA
              </button>
              <button 
                className={`niche-btn ${selectedNiche === 'auto' ? 'active' : ''}`}
                onClick={() => handleSelectNiche('auto')}
              >
                🚗 Autoservisai
              </button>
              <button 
                className={`niche-btn ${selectedNiche === 'b2b' ? 'active' : ''}`}
                onClick={() => handleSelectNiche('b2b')}
              >
                💼 B2B & Paslaugos
              </button>
            </div>

            <div className="template-box">
              <label>SMS Tekstas (maks. 160 simbolių vienam segmentui):</label>
              <textarea 
                rows={5}
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
              />
              <div className="template-footer">
                <small>Simbolių skaičius: {messageTemplate.length} · Kintamieji: <code>{'{vardas}'}</code>, <code>{'{klinika}'}</code></small>
              </div>
            </div>

            <div className="campaign-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  showToast('✅ Kampanijos šablonas sėkmingai išsaugotas ir paruoštas siuntimui!');
                }}
              >
                <CheckCircle2 size={16} /> Išsaugoti šabloną
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('simulator')}
              >
                <Smartphone size={16} /> Išbandyti simuliatoriuje
              </button>
            </div>
          </div>

          {/* Smartphone Live Preview */}
          <div className="phone-preview-card">
            <div className="phone-mockup">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-header">
                  <div className="phone-contact-info">
                    <div className="phone-avatar">{clinicName[0]}</div>
                    <strong>{clinicName}</strong>
                    <small>Dvikryptis SMS</small>
                  </div>
                </div>

                <div className="phone-body">
                  <div className="phone-date">ŠIANDIEN 11:30</div>
                  <div className="bubble-received">
                    {messageTemplate.replace('{vardas}', 'Laura').replace('{klinika}', clinicName)}
                  </div>
                </div>

                <div className="phone-input-bar">
                  <span>Atsakyti žinute...</span>
                  <Send size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 2-WAY AI SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="simulator-layout">
          <div className="simulator-guide">
            <span className="sub-title-eyebrow">DI AGENTO VEIKIMO PRINCIPAS</span>
            <h2>Išbandykite, kaip DI bendrauja su Jūsų pacientu</h2>
            <p>
              Simuliatoriuje įrašykite atsakymą kaip pacientas (arba pasirinkite vieną iš paruoštų mygtukų) ir pamatykite, kaip DI agentas atsako į klausimus, siūlo laikus ir automatiškai patvirtina rezervaciją.
            </p>

            <div className="quick-prompts">
              <span className="quick-title">Greitieji paciento atsakymai:</span>
              <button 
                className="prompt-pill"
                onClick={() => handleSendSimMessage('Ar turite laisvą laiką ketvirtadienį po darbo?')}
              >
                „Ar turite laisvą laiką ketvirtadienį po darbo?“
              </button>
              <button 
                className="prompt-pill"
                onClick={() => handleSendSimMessage('Tinka 17:30, užregistruokite mane')}
              >
                „Tinka 17:30, užregistruokite mane“
              </button>
              <button 
                className="prompt-pill"
                onClick={() => handleSendSimMessage('Kiek kainuotų higiena su apžiūra?')}
              >
                „Kiek kainuotų higiena su apžiūra?“
              </button>
              <button 
                className="prompt-pill"
                onClick={() => handleSendSimMessage('Ačiū, šiuo metu neaktualu')}
              >
                „Ačiū, šiuo metu neaktualu“
              </button>
            </div>

            {bookingConfirmed && (
              <div className="confirmed-booking-banner">
                <CheckCircle2 size={20} />
                <div>
                  <strong>Rezervacija užfiksuota kalendoriuje!</strong>
                  <p>{bookingConfirmed} (Laura Kazlauskaitė)</p>
                </div>
              </div>
            )}

            <button 
              className="btn btn-secondary btn-small"
              onClick={() => {
                setSimMessages([
                  {
                    sender: 'bot',
                    text: `Sveiki, Laura! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito ${clinicName} praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę?`,
                    time: '11:15'
                  }
                ]);
                setBookingConfirmed(null);
              }}
            >
              <RotateCcw size={14} /> Pradėti dialogą iš naujo
            </button>
          </div>

          <div className="simulator-phone-card">
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-avatar"><Bot size={16} /></div>
                <div>
                  <strong>{clinicName} (ReviveLeads AI)</strong>
                  <small>Automatinė sinchronizacija su kalendoriumi</small>
                </div>
              </div>

              <div className="chat-messages">
                {simMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.sender === 'bot' ? 'bot' : 'user'}`}>
                    <div className="bubble-content">{msg.text}</div>
                    <span className="bubble-time">{msg.time}</span>
                  </div>
                ))}
                {simLoading && (
                  <div className="chat-bubble bot typing">
                    <span>DI agentas galvoja...</span>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <input 
                  type="text" 
                  placeholder="Įrašykite atsakymą kaip pacientas..." 
                  value={simInput}
                  onChange={e => setSimInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendSimMessage(); }}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSendSimMessage()}
                  disabled={simLoading || !simInput.trim()}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS LOG */}
      {activeTab === 'bookings' && (
        <div className="revive-section-card">
          <div className="bookings-summary">
            <div>
              <h2>Atgautų rezervacijų žurnalas</h2>
              <p>Reaktyvuoti pacientai, sėkmingai sugrįžę į Jūsų kliniką per ReviveLeads.</p>
            </div>
            <div className="bookings-revenue-badge">
              <span>Bendra atgauta suma:</span>
              <strong>{bookings.reduce((sum, b) => sum + (Number(b.estimated_revenue) || 85), 0)} €</strong>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="revive-table">
              <thead>
                <tr>
                  <th>Klientas</th>
                  <th>Telefonas</th>
                  <th>Rezervuotas laikas</th>
                  <th>Paslauga</th>
                  <th>Apskaičiuotos pajamos</th>
                  <th>Būsena</th>
                  <th>Pastabos</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.contact_name}</strong></td>
                    <td><span className="mono-text">{b.contact_phone}</span></td>
                    <td><span className="badge-time"><Clock size={12} /> {b.booking_time}</span></td>
                    <td>{b.service_name}</td>
                    <td><strong className="revenue-text">+{b.estimated_revenue || 85} €</strong></td>
                    <td>
                      <span className="status-pill status-booked">
                        ✓ Patvirtinta
                      </span>
                    </td>
                    <td><small>{b.notes || 'Automatinis įrašas'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CSV IMPORT */}
      {showImportModal && (
        <div className="revive-modal-overlay">
          <div className="revive-modal-card">
            <div className="modal-header">
              <h3>Importuoti miegančių klientų CSV sąrašą</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <p className="modal-desc">
              Nukopijuokite ir įklijuokite kontaktus arba įkelkite failą. Stulpeliai: <code>Vardas, Telefonas, El. paštas, Paskutinis vizitas, Paslauga</code>.
            </p>

            <form onSubmit={handleImportSubmit}>
              <textarea 
                rows={8}
                placeholder={"Laura Kazlauskaitė, +37061234567, laura@gmail.com, Prieš 8 mėn., Profesionali higiena\nMantas Jankauskas, +37065589123, mantas@inbox.lt, Prieš 11 mėn., Apžiūra"}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                required
              />

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleDownloadSampleCsv}
                >
                  <Download size={14} /> Pavyzdinis šablonas (.csv)
                </button>
                <div className="modal-actions-right">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setShowImportModal(false)}
                  >
                    Atšaukti
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={importing || !importText.trim()}
                  >
                    {importing ? 'Importuojama...' : 'Pradėti importą'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SINGLE CONTACT */}
      {showAddContactModal && (
        <div className="revive-modal-overlay">
          <div className="revive-modal-card">
            <div className="modal-header">
              <h3>Pridėti miegantį kontaktą rankiniu būdu</h3>
              <button className="close-btn" onClick={() => setShowAddContactModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddContact} className="add-contact-form">
              <div className="form-group">
                <label>Vardas ir Pavardė *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="pvz. Jonas Jonaitis" 
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Telefono numeris *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="+370 600 00000" 
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Paskutinis vizitas</label>
                  <input 
                    type="text" 
                    placeholder="pvz. Prieš 9 mėn." 
                    value={newContact.last_visit}
                    onChange={e => setNewContact({ ...newContact, last_visit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Atlikta paslauga</label>
                  <input 
                    type="text" 
                    placeholder="pvz. Burnos higiena" 
                    value={newContact.service_history}
                    onChange={e => setNewContact({ ...newContact, service_history: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddContactModal(false)}
                >
                  Atšaukti
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Išsaugoti kontaktą
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

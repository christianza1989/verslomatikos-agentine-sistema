'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Send, 
  Clock, 
  User, 
  Building2, 
  ShieldCheck, 
  RefreshCw,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
  Phone,
  Radio
} from 'lucide-react';
import { Brand } from '@/components/brand';

interface AccountingCase {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  company_name: string;
  status: string;
  waiting_for: string;
  call_requested?: number;
  call_briefing?: string;
  call_notes?: string;
  issues_found: number;
  summary_notes: string;
  accountant_feedback: string;
  annual_turnover?: number;
  calculated_price?: number;
  pricing_tier?: string;
  pricing_breakdown?: string;
  doc_count: number;
  msg_count: number;
  created_at: string;
  approved_at?: string;
  invoice_id?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  seller_name: string;
  seller_code: string;
  client_name: string;
  client_company: string;
  client_email?: string;
  service_title: string;
  amount: number;
  status: string;
  pdf_path: string;
  line_items_json?: string;
  created_at: string;
}

export default function BuhalterijaAdmin() {
  const [cases, setCases] = useState<AccountingCase[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCase, setSelectedCase] = useState<AccountingCase | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [callNotesText, setCallNotesText] = useState('');
  const [nextStepSelect, setNextStepSelect] = useState('client_documents');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'invoices'>('cases');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Refs to prevent auto-poll from overwriting in-progress user typing
  const userEditingFeedbackRef = useRef(false);
  const userEditingCallNotesRef = useRef(false);
  const selectedCaseIdRef = useRef<string | null>(null);

  selectedCaseIdRef.current = selectedCase?.id || null;

  const defaultNote = (c: AccountingCase) => {
    return `Gerb. ${c.client_name},\n\nAsmeniškai peržiūrėjau Jūsų įmonės (${c.company_name}) apskaitos duomenis. Esminės pastabos:\n1. 2435 sąskaitoje (Atskaitingi asmenys) esantį likutį būtina uždaryti iki gruodžio 31 d. pateikiant avanso apyskaitas arba įforminant paskolos sutartį su rinkos palūkanomis, kad išvengtumėte VMI FR0711 deklaravimo ir 20% GPM apmokestinimo.\n2. Taip pat atkreipkite dėmesį, kad Jūsų įmonė atitinka lengvatinio pelno mokesčio tarifo reikalavimus (6–7% arba 0% tarifas) – pritaikius lengvatą galima teisėtai sutaupyti apie 2 400 €.\n\nJei reikės pagalbos sutvarkant šiuos įrašus iki metų pabaigos – esu pasiruošusi padėti.`;
  };

  const fetchCases = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/accounting/cases', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        if (data.cases) {
          setCases(data.cases);
          
          const currentId = selectedCaseIdRef.current;
          const found = data.cases.find((c: any) => c.id === currentId) || data.cases[0];
          
          if (found) {
            setSelectedCase(found);
            // Only update draft text if user hasn't typed their own edits or if this is the first load
            if (!userEditingFeedbackRef.current || !feedbackText) {
              setFeedbackText(found.accountant_feedback || defaultNote(found));
            }
            if (!userEditingCallNotesRef.current) {
              setCallNotesText(found.call_notes || '');
            }
          }
        }
        if (data.invoices) {
          setInvoices(data.invoices);
        }
        const now = new Date();
        setLastSyncedTime(now.toLocaleTimeString('lt-LT'));
      }
    } catch (e) {
      console.error('[Live Sync Error]', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Realaus laiko automatinis atnaujinimas kas 2.5 sekundės
  useEffect(() => {
    fetchCases(false);
    const interval = setInterval(() => {
      fetchCases(true);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCase = (c: AccountingCase) => {
    userEditingFeedbackRef.current = false;
    userEditingCallNotesRef.current = false;
    setSelectedCase(c);
    setFeedbackText(c.accountant_feedback || defaultNote(c));
    setCallNotesText(c.call_notes || '');
    setStatusMessage(null);
  };

  const handleApprove = async () => {
    if (!selectedCase) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/accounting/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          caseId: selectedCase.id,
          accountantFeedback: feedbackText
        })
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage('✓ Nemokama priešmetinio audito išvada sėkmingai patvirtinta ir išsiųsta klientui el. paštu!');
        setTimeout(() => fetchCases(true), 1500);
      } else {
        setStatusMessage('Klaida: ' + data.error);
      }
    } catch (e: any) {
      setStatusMessage('Klaida siunčiant: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliverFinal = async () => {
    if (!selectedCase) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/accounting/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deliver_final',
          caseId: selectedCase.id
        })
      });
      const data = await res.json();
      if (data.ok) {
        const amt = selectedCase.calculated_price ? Number(selectedCase.calculated_price).toFixed(2) : '190.00';
        setStatusMessage(`✓ Oficialus 4 psl. finansinės atskaitomybės paketas ir sąskaita-faktūra (${amt} €) išsiųsti klientui el. paštu!`);
        setTimeout(() => fetchCases(true), 1500);
      } else {
        setStatusMessage('Klaida: ' + data.error);
      }
    } catch (e: any) {
      setStatusMessage('Klaida siunčiant: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCallNotes = async () => {
    if (!selectedCase) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/accounting/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_call_notes',
          caseId: selectedCase.id,
          callNotes: callNotesText,
          nextStep: nextStepSelect
        })
      });
      const data = await res.json();
      if (data.ok) {
        userEditingCallNotesRef.current = false;
        setStatusMessage('✓ Pokalbio rezultatas išsaugotas! AI atnaujino tolimesnę eigą.');
        setTimeout(() => fetchCases(true), 1000);
      } else {
        setStatusMessage('Klaida: ' + data.error);
      }
    } catch (e: any) {
      setStatusMessage('Klaida: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (waitingFor: string) => {
    switch (waitingFor) {
      case 'call_required':
        return (
          <span style={{ 
            background: '#fff7ed', 
            color: '#c2410c', 
            border: '1px solid #fed7aa',
            fontSize: '11px', 
            fontWeight: '700', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            <PhoneCall size={12} /> REIKIA SKAMBUČIO
          </span>
        );
      case 'accountant_approval':
        return (
          <span style={{ 
            background: '#fef2f2', 
            color: '#b91c1c', 
            border: '1px solid #fecaca',
            fontSize: '11px', 
            fontWeight: '800', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.15)'
          }}>
            🔴 REIKIA BUHALTERĖS VEIKSMO
          </span>
        );
      case 'client_documents':
        return (
          <span style={{ 
            background: '#fefce8', 
            color: '#a16207', 
            border: '1px solid #fef08a',
            fontSize: '11px', 
            fontWeight: '700', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            🟡 AI padeda / laukia failų
          </span>
        );
      case 'completed':
        return (
          <span style={{ 
            background: '#ecfdf5', 
            color: '#047857', 
            border: '1px solid #a7f3d0',
            fontSize: '11px', 
            fontWeight: '700', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            🟢 UŽBAIGTA (SF IŠSIŲSTA)
          </span>
        );
      case 'client_reply':
      default:
        return (
          <span style={{ 
            background: '#eff6ff', 
            color: '#1d4ed8', 
            border: '1px solid #bfdbfe',
            fontSize: '11px', 
            fontWeight: '700', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            🔵 AI laukia atsakymo
          </span>
        );
    }
  };

  let parsedFindings: any[] = [];
  if (selectedCase?.summary_notes) {
    try {
      parsedFindings = JSON.parse(selectedCase.summary_notes);
    } catch (e) {
      parsedFindings = [];
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Header - Clean Light Verslomatika Style with Live Sync Badge */}
      <header style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '14px 28px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
            <ArrowLeft size={16} /> Grįžti į skydelį
          </Link>
          <div style={{ height: '18px', width: '1px', background: '#cbd5e1' }} />
          <Brand light={false} />
          <span style={{ 
            background: '#ede9fe', 
            color: '#5636e8', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontSize: '11px', 
            fontWeight: '800', 
            textTransform: 'uppercase', 
            letterSpacing: '0.4px' 
          }}>
            Vyr. Buhalterės Portalas
          </span>

          {/* REAL-TIME LIVE INDICATOR */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '11.5px', 
            color: '#047857', 
            background: '#ecfdf5', 
            padding: '4px 10px', 
            borderRadius: '999px', 
            border: '1px solid #a7f3d0',
            fontWeight: '600'
          }}>
            <span style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              background: '#10b981', 
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)' 
            }} />
            Realiu laiku (Live)
            {lastSyncedTime && <span style={{ color: '#059669', fontSize: '10.5px' }}>• {lastSyncedTime}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => setActiveTab('cases')}
              style={{
                background: activeTab === 'cases' ? '#ffffff' : 'transparent',
                color: activeTab === 'cases' ? '#5636e8' : '#64748b',
                boxShadow: activeTab === 'cases' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Audito Bylos ({cases.length})
            </button>
            <button 
              onClick={() => setActiveTab('invoices')}
              style={{
                background: activeTab === 'invoices' ? '#ffffff' : 'transparent',
                color: activeTab === 'invoices' ? '#5636e8' : '#64748b',
                boxShadow: activeTab === 'invoices' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sąskaitos-faktūros ({invoices.length})
            </button>
          </div>

          <button 
            onClick={() => fetchCases(false)} 
            disabled={loading}
            style={{ 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              color: '#334155', 
              padding: '7px 14px', 
              borderRadius: '6px', 
              fontSize: '12.5px', 
              fontWeight: '600',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atnaujinti
          </button>
          
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#475569' }}>
            Ekspertė: <strong style={{ color: '#0f172a' }}>Lilija Zapasnik</strong> <span style={{ color: '#64748b' }}>(IV Nr. 34566444)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
        
        {activeTab === 'invoices' ? (
          /* Invoices Tab View - Clean Light Styling */
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Išrašytos Sąskaitos-Faktūros
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Paslaugų teikėjas: <strong style={{ color: '#1e293b' }}>Lilija Zapasnik (IV pažyma Nr. 34566444)</strong> • Molynės g. 2C, Vilnius
                </p>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '700' }}>
                Viso išrašyta: {invoices.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)} €
              </span>
            </div>

            {invoices.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                Sąskaitų dar nėra. Kai patvirtinsite bylą, sąskaita-faktūra bus sugeneruota ir išsiųsta automatiškai.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>SF Numeris</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>Data</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>Pirkėjas (Įmonė)</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>El. paštas</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>Suma</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>Būsena</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700' }}>Dokumentas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#5636e8' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {inv.invoice_date}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                          {inv.client_company} <span style={{ color: '#64748b', fontWeight: '400' }}>({inv.client_name})</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>
                          {inv.client_email}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '800', color: '#059669', fontSize: '14px' }}>
                          {inv.amount.toFixed(2)} €
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                            ✓ Išsiųsta klientui
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ color: '#5636e8', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={14} /> PDF parengtas
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Cases Review View - Clean Light Styling */
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
            
            {/* Left Column: Cases List */}
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '14px', 
              border: '1px solid #e2e8f0', 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Aktyvios Bylos
                </h3>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700' }}>
                  {cases.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                {cases.length === 0 && !loading && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Nėra gautų bylų. Paleiskite testą arba palaukite kliento failų.
                  </div>
                )}

                {cases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => handleSelectCase(c)}
                      style={{
                        background: isSelected ? '#f5f3ff' : '#ffffff',
                        border: isSelected ? '1.5px solid #5636e8' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(86, 54, 232, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '700' }}>
                          {c.company_name || 'Įmonė'}
                        </strong>
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        {renderStatusBadge(c.waiting_for)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <User size={12} /> {c.client_name} ({c.client_email})
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                        <span>📁 {c.doc_count || 0} failai</span>
                        <span style={{ color: (c.issues_found || 0) > 0 ? '#ea580c' : '#94a3b8', fontWeight: (c.issues_found || 0) > 0 ? '700' : '400' }}>
                          ⚠️ {c.issues_found || 2} anomalijos
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Case Review & Action (Clean Light Styling) */}
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '14px', 
              border: '1px solid #e2e8f0', 
              padding: '28px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)' 
            }}>
              
              {selectedCase ? (
                <>
                  {/* Case Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.4px' }}>
                          {selectedCase.company_name || 'MB Prekybos Sprendimai'}
                        </h2>
                        {renderStatusBadge(selectedCase.waiting_for)}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Klientas: <strong style={{ color: '#0f172a' }}>{selectedCase.client_name}</strong> • El. paštas: <a href={`mailto:${selectedCase.client_email}`} style={{ color: '#5636e8', fontWeight: '500' }}>{selectedCase.client_email}</a>
                        {selectedCase.client_phone && (
                          <span style={{ marginLeft: '14px', color: '#475569' }}>
                            📞 Tel: <a href={`tel:${selectedCase.client_phone}`} style={{ color: '#0284c7', fontWeight: '700' }}>{selectedCase.client_phone}</a>
                          </span>
                        )}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        {selectedCase.pricing_tier ? selectedCase.pricing_tier.split('(')[0].trim() : 'Paslaugos kaina'}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                        {selectedCase.calculated_price ? `${Number(selectedCase.calculated_price).toFixed(2)} €` : '190.00 €'}
                      </div>
                      {selectedCase.annual_turnover && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          9 mėn. apyvarta: <strong>{Number(selectedCase.annual_turnover).toLocaleString('lt-LT')} €</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Notification Message */}
                  {statusMessage && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '14px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                      {statusMessage}
                    </div>
                  )}

                  {/* CALL BRIEFING CARD (Clean warm alert style) */}
                  {(selectedCase.waiting_for === 'call_required' || selectedCase.call_requested === 1) && (
                    <div style={{ 
                      background: '#fff7ed', 
                      border: '1px solid #fed7aa', 
                      borderRadius: '12px', 
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(234, 88, 12, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c2410c', fontWeight: '800', fontSize: '14px', marginBottom: '10px' }}>
                        <PhoneCall size={18} color="#ea580c" />
                        AI SKAMBUČIO INSTRUKTAŽAS VADOVUI / BUHALTEREI:
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #ffedd5', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
                        {selectedCase.call_briefing || 'Klientas prašo skambučio. Kontekstas: nori trumpai pasitarti telefonu. Pasiūlykite atsiųsti bandomąjį balansą arba paskutinių mėnesių banko sąskaitos išrašą.'}
                      </div>

                      {selectedCase.client_phone && (
                        <div style={{ marginBottom: '16px', fontSize: '13.5px', color: '#9a3412', fontWeight: '600' }}>
                          👉 Skambinti klientui: <a href={`tel:${selectedCase.client_phone}`} style={{ color: '#0284c7', fontWeight: '800', fontSize: '15px', marginLeft: '6px' }}>{selectedCase.client_phone}</a>
                        </div>
                      )}

                      {/* Post-Call Notes Form */}
                      <div style={{ borderTop: '1px solid #fed7aa', paddingTop: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#9a3412', marginBottom: '8px' }}>
                          ✍️ Ką sutarėte per skambutį su klientu? (Įrašykite, kad AI žinotų tolimesnius veiksmus):
                        </label>
                        <textarea 
                          rows={3}
                          value={callNotesText}
                          onFocus={() => { userEditingCallNotesRef.current = true; }}
                          onChange={(e) => {
                            userEditingCallNotesRef.current = true;
                            setCallNotesText(e.target.value);
                          }}
                          placeholder="Pvz.: Pakalbėjau su vadove, sutarta dėl apleistos apskaitos sutvarkymo už 950 €. Klientė atsiųs Swedbank išrašą iki rytojaus..."
                          style={{
                            width: '100%',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            color: '#0f172a',
                            padding: '12px 14px',
                            fontSize: '13px',
                            marginBottom: '12px',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#475569' }}>
                            <span>Tolimesnis AI žingsnis:</span>
                            <select 
                              value={nextStepSelect} 
                              onChange={(e) => setNextStepSelect(e.target.value)}
                              style={{ 
                                background: '#ffffff', 
                                color: '#0f172a', 
                                border: '1px solid #cbd5e1', 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                fontSize: '12.5px',
                                outline: 'none'
                              }}
                            >
                              <option value="client_documents">Laukti failų / banko išrašo</option>
                              <option value="accountant_approval">Paruošti ataskaitą peržiūrai</option>
                              <option value="completed">Byla užbaigta</option>
                            </select>
                          </div>

                          <button 
                            onClick={handleSaveCallNotes}
                            disabled={submitting}
                            style={{ 
                              background: '#ea580c', 
                              color: '#ffffff', 
                              border: 'none', 
                              padding: '9px 18px', 
                              borderRadius: '7px', 
                              fontSize: '12.5px', 
                              fontWeight: '700', 
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
                            }}
                          >
                            ✓ IŠSAUGOTI POKALBIO REZULTATĄ
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pre-extracted Findings - Clean Card Style */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} color="#5636e8" /> Nustatytos apskaitos ir mokesčių anomalijos:
                    </h4>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {parsedFindings.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderLeft: item.severity === 'high' ? '4px solid #ef4444' : item.severity === 'opportunity' ? '4px solid #10b981' : '4px solid #f59e0b',
                            padding: '14px 18px',
                            borderRadius: '0 8px 8px 0',
                            fontSize: '13px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{item.name} <span style={{ color: '#64748b', fontWeight: '500' }}>({item.account})</span></strong>
                            <span style={{ 
                              fontWeight: '800', 
                              fontSize: '13.5px', 
                              color: item.severity === 'opportunity' ? '#059669' : '#dc2626',
                              background: item.severity === 'opportunity' ? '#ecfdf5' : '#fef2f2',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {item.value ? `${item.value.toLocaleString('lt-LT')} €` : ''}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '12.5px', lineHeight: '1.5' }}>
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Senior Accountant Personal Comment & Customization */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      ✍️ Vyriausiosios buhalterės asmeninis komentaras ir sprendimas (bus įtrauktas į oficialią ataskaitą):
                    </label>
                    <textarea 
                      rows={6}
                      value={feedbackText}
                      onFocus={() => { userEditingFeedbackRef.current = true; }}
                      onChange={(e) => {
                        userEditingFeedbackRef.current = true;
                        setFeedbackText(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        padding: '14px',
                        fontSize: '13px',
                        lineHeight: '1.55',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    />
                  </div>

                  {/* Action Buttons with Clear 2-Stage Delivery */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '12px',
                    paddingTop: '16px', 
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '420px', lineHeight: '1.4' }}>
                        <strong>1 Etapas:</strong> Nemokama priešmetinio audito ataskaita klientui (sąskaita <strong>nėra</strong> siunčiama).
                      </div>
                      <button 
                        onClick={handleApprove}
                        disabled={submitting}
                        style={{
                          background: '#475569',
                          color: '#ffffff',
                          border: 'none',
                          padding: '11px 20px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: submitting ? 'default' : 'pointer'
                        }}
                      >
                        <Send size={15} /> {submitting ? 'Apdorojama...' : '1. SIŲSTI PIRMINĮ NEMOKAMĄ AUDITĄ'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#334155', maxWidth: '420px', lineHeight: '1.4' }}>
                        <strong style={{ color: '#0f172a' }}>2 Etapas (Finalas):</strong> 4 puslapių VIP finansinės atskaitomybės, PLN204 deklaracijos ir Vadovo veiksmų plano paketas + <strong>Oficiali Sąskaita-Faktūra ({selectedCase.calculated_price ? Number(selectedCase.calculated_price).toFixed(2) : '190.00'} €)</strong>.
                      </div>
                      <button 
                        onClick={handleDeliverFinal}
                        disabled={submitting}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '13px 24px',
                          borderRadius: '9px',
                          fontSize: '13.5px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: submitting ? 'default' : 'pointer',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                        }}
                      >
                        <Send size={16} /> {submitting ? 'Siunčiama...' : `✓ 2. SIŲSTI 4 PSL. PAKETĄ IR SĄSKAITĄ (${selectedCase.calculated_price ? Number(selectedCase.calculated_price).toFixed(2) : '190.00'} €)`}
                      </button>
                    </div>
                  </div>

                </>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  Pasirinkite bylą iš kairiojo sąrašo.
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Award, 
  Lock, 
  ArrowRight, 
  Mail, 
  HelpCircle, 
  Building2, 
  CalendarCheck,
  Calculator,
  ChevronDown,
  Check,
  Zap,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Archive,
  PhoneCall
} from 'lucide-react';
import { Brand } from '@/components/brand';

export default function BuhalterijaLandingPage() {
  // Interaktyvus kainodaros skaičiuoklės būvis
  const [companyType, setCompanyType] = useState<'MB' | 'UAB'>('MB');
  const [turnoverTier, setTurnoverTier] = useState<number>(2); // Default: Smulki (25k-85k)
  const [hasIntlTrade, setHasIntlTrade] = useState<boolean>(true);
  const [hasPayroll, setHasPayroll] = useState<boolean>(false);
  const [hasFixedAssets, setHasFixedAssets] = useState<boolean>(false);

  // Kainodaros pakopos pagal oficialų sisteminį variklį (core/accounting_pricing.py)
  const tiers = [
    { id: 1, name: 'Mikro įmonė', range: 'iki 25 000 €/metus', basePrice: 120, desc: 'Idealu: mažos MB, paslaugų startuoliai, 0 € apyvartos ar miegančios įmonės' },
    { id: 2, name: 'Smulki auganti įmonė', range: '25 000 – 85 000 €/metus', basePrice: 160, desc: 'Populiariausias: e-komercija, B2B paslaugos, prekyba, MB nariai' },
    { id: 3, name: 'Vidutinė įmonė', range: '85 000 – 250 000 €/metus', basePrice: 240, desc: 'PVM mokėtojai, aktyvi prekyba, gausūs tiekėjų ir pirkėjų registrai' },
    { id: 4, name: 'Didelė įmonė', range: '250 000 – 600 000 €/metus', basePrice: 360, desc: 'Didelė operacijų apimtis, intensyvus apyvartinis kapitalas' },
    { id: 5, name: 'Stambi įmonė', range: 'virš 600 000 €/metus', basePrice: 520, desc: 'Pilnas korporatyvinis suderinimas, metinė atskaitomybė ir PLN204' }
  ];

  const currentTier = tiers.find(t => t.id === turnoverTier) || tiers[1];
  
  // Apskaičiuojama galutinė kaina
  let calculatedTotal = currentTier.basePrice;
  if (hasIntlTrade) calculatedTotal += 30;
  if (hasPayroll && companyType === 'UAB') calculatedTotal += 30;
  if (hasFixedAssets) calculatedTotal += 20;

  // DUK akordeono būvis
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (idx: number) => setOpenFaq(openFaq === idx ? null : idx);

  // Formos būvis
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: 'Priešmetinis mokesčių & balanso auditas (Nemokamai)',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div style={{ background: '#f8fafc', color: '#1e293b', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Viršutinė oficiali juosta */}
      <div style={{ background: '#0f172a', color: '#cbd5e1', padding: '10px 20px', fontSize: '12.5px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
        <span>⚖️ <strong>Verslomatika B2B & Vyriausioji buhalterė Lilija Zapasnik</strong> (25 m. patirtis, IV pažyma Nr. 34566444) · Asmeninė atsakomybė Jūsų verslui</span>
      </div>

      {/* Pagrindinė navigacija */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brand />
            <span style={{ background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
              Buhalterija & Mokesčių Auditas
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '14px', fontWeight: '600' }}>
            <a href="#kaip-veikia" style={{ color: '#475569', textDecoration: 'none' }}>2 Etapų Procesas</a>
            <a href="#services" style={{ color: '#475569', textDecoration: 'none' }}>Paslaugos</a>
            <a href="#kainynas" style={{ color: '#475569', textDecoration: 'none' }}>Kainynas</a>
            <a href="#formatai" style={{ color: '#475569', textDecoration: 'none' }}>Palaikomi formatai</a>
            <a href="#duk" style={{ color: '#475569', textDecoration: 'none' }}>DUK</a>
            <a href="#uzsakymas" style={{ background: '#312e81', color: '#ffffff', padding: '9px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 2px 6px rgba(49, 46, 129, 0.2)' }}>
              Nemokamas auditas (0 €)
            </a>
          </nav>
        </div>
      </header>

      {/* Hero sekcija */}
      <section style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', padding: '75px 20px 65px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0e7ff', color: '#3730a3', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', marginBottom: '22px' }}>
            <Award size={16} /> 25 Metų Vyriausiosios Buhalterės Ekspertinis Užnugaris (IV Nr. 34566444)
          </div>

          <h1 style={{ fontSize: '44px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', letterSpacing: '-1px', margin: '0 auto 22px', maxWidth: '920px' }}>
            Nepriklausomas mokesčių auditas, finansinė atskaitomybė ir apskaitos gelbėjimas
          </h1>

          <p style={{ fontSize: '18px', color: '#475569', maxWidth: '780px', margin: '0 auto 36px', lineHeight: '1.6' }}>
            Ne eilinė duomenų suvedimo kontora, o <strong>vyriausiosios buhalterės su 25 m. patirtimi</strong> asmeninė civilinė atsakomybė. Nustatome permokas, eliminuojame VMI rizikas ir saugiai uždarome metus be streso.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a href="#uzsakymas" style={{ background: '#312e81', color: '#ffffff', padding: '15px 30px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(49, 46, 129, 0.25)' }}>
              Gauti nemokamą audito išvadą (0 €) <ArrowRight size={18} />
            </a>
            <a href="#kainynas" style={{ background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', padding: '15px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' }}>
              Peržiūrėti skaidrų kainyną
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '45px', color: '#64748b', fontSize: '13.5px', fontWeight: '600', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={18} color="#10b981" /> 100% Konfidencialu (Jokio jungimosi prie Mano VMI)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={18} color="#10b981" /> Teisinė materialinė atsakomybė</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} color="#10b981" /> Oficiali išvada per 24 valandas</span>
          </div>

        </div>
      </section>

      {/* 2 ETAPŲ PROCESAS (Kaip veikia mūsų sistema) */}
      <section id="kaip-veikia" style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: '#4338ca', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SKAIDRUMAS IR SAUGUMAS
          </span>
          <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#0f172a', margin: '8px 0 12px' }}>
            Mūsų 2 Etapų Aptarnavimo Standartas
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
            Jokių nemalonių staigmenų: pirminis mokesčių patikrinimas yra 100% nemokamas, o oficiali sąskaita-faktūra pateikiama tik galutiniame etape.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          
          {/* 1 ETAPAS */}
          <div style={{ background: '#ffffff', border: '2px solid #e0e7ff', borderRadius: '16px', padding: '32px', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '28px', background: '#10b981', color: '#ffffff', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
              1 ETAPAS · 100% NEMOKAMAI
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '14px 0 12px' }}>
              Express Mokesčių & Balanso Auditas
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
              Atsiųskite savo bandomąjį balansą arba banko išrašą. Vyriausioji buhalterė asmeniškai atlieka 15 punktų reviziją ir paruošia oficialią išvadą.
            </p>
            <ul style={{ padding: 0, listStyle: 'none', margin: '0 0 24px', fontSize: '13.5px', color: '#334155' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#10b981" /> <strong>Oficiali Audito PDF ataskaita</strong> su tikrais KPI
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Klaidų, PVM permokų ir kasos likučių revizija
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Mokesčių taupymo galimybės pagal PMĮ 5 str.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> <strong>0,00 € kaina · Sąskaita NESIUNČIAMA</strong>
              </li>
            </ul>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0' }}>
              ⏱️ Rezultatas: išvada Jūsų el. pašte per 24 valandas.
            </div>
          </div>

          {/* 2 ETAPAS */}
          <div style={{ background: '#ffffff', border: '2px solid #312e81', borderRadius: '16px', padding: '32px', position: 'relative', boxShadow: '0 6px 20px rgba(49, 46, 129, 0.08)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '28px', background: '#312e81', color: '#ffffff', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
              2 ETAPAS · FINALINIS PAKETAS
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '14px 0 12px' }}>
              Finansinė Atskaitomybė & PLN204
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
              Jei pageidaujate, kad nustatytas klaidas ištaisytume ir saugiai priduotume atskaitomybę, suformuojamas pilnas 4 puslapių vadovo paketas.
            </p>
            <ul style={{ padding: 0, listStyle: 'none', margin: '0 0 24px', fontSize: '13.5px', color: '#334155' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#4338ca" /> <strong>Sutrumpintas Balansas</strong> pagal LR VAS reikalavimus
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#4338ca" /> <strong>Pelno (nuostolių) ataskaita</strong> vadovui ir Registrų centrui
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="#4338ca" /> <strong>PLN204 Pelno mokesčio deklaracijos</strong> suvestinė VMI
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#4338ca" /> <strong>Vadovo Finansinis Skydas & 3 žingsnių planas</strong> (Nemokama VIP vertė)
              </li>
            </ul>
            <div style={{ background: '#eef2ff', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: '600' }}>
              🧾 Kartu pateikiama skaidri 1 psl. sąskaita-faktūra (Serija LZ).
            </div>
          </div>

        </div>
      </section>

      {/* SKAIDRUS KAINYNAS & SKAIČIUOKLĖ */}
      <section id="kainynas" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '85px 20px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ color: '#4338ca', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OFICIALŪS ĮKAINIAI
            </span>
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#0f172a', margin: '8px 0 12px' }}>
              Skaidrus Kainynas Pagal Įmonės Dydį
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
              Jokių paslėptų eilučių. Įkainis apskaičiuojamas griežtai pagal Jūsų metinę apyvartą ir realią operacijų specifiką.
            </p>
          </div>

          {/* 5 Kainų kortelės */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '45px' }}>
            {tiers.map((t) => {
              const isSelected = turnoverTier === t.id;
              return (
                <div 
                  key={t.id}
                  onClick={() => setTurnoverTier(t.id)}
                  style={{ 
                    border: isSelected ? '2px solid #312e81' : '1px solid #e2e8f0', 
                    borderRadius: '14px', 
                    padding: '22px 18px', 
                    background: isSelected ? '#f8faff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 6px 18px rgba(49, 46, 129, 0.08)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? '#4338ca' : '#64748b', textTransform: 'uppercase' }}>
                        Tier {t.id}
                      </span>
                      {isSelected && <span style={{ background: '#312e81', color: '#ffffff', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: '700' }}>Pasirinkta</span>}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>{t.name}</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>{t.range}</p>
                    
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                      {t.basePrice} €
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}> / bazė</span>
                    </div>

                    <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                      {t.desc}
                    </p>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Balansas, PNA & PLN204
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interaktyvi Skaičiuoklė */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Calculator size={22} color="#312e81" />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Interaktyvi Jūsų Įmonės Paslaugos Skaičiuoklė
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Juridinė forma
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => setCompanyType('MB')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: companyType === 'MB' ? '2px solid #312e81' : '1px solid #cbd5e1', background: companyType === 'MB' ? '#e0e7ff' : '#ffffff', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Mažoji bendrija (MB)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCompanyType('UAB')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: companyType === 'UAB' ? '2px solid #312e81' : '1px solid #cbd5e1', background: companyType === 'UAB' ? '#e0e7ff' : '#ffffff', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    UAB
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Apyvartos pakopa
                </label>
                <select 
                  value={turnoverTier} 
                  onChange={(e) => setTurnoverTier(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', color: '#0f172a', fontWeight: '600' }}
                >
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.range}) – {t.basePrice} €</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priedų varnelės */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>
                SPECIFIKOS MODULIAI (PAGAL DOKUMENTUS):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasIntlTrade} onChange={(e) => setHasIntlTrade(e.target.checked)} />
                  <span>Tarptautinė prekyba / ES pirkimai / OSS (+30 €)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasPayroll} onChange={(e) => setHasPayroll(e.target.checked)} />
                  <span>Darbuotojų DU ir Sodros registrų suderinimas (+30 €)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasFixedAssets} onChange={(e) => setHasFixedAssets(e.target.checked)} />
                  <span>Ilgalaikio turto nusidėvėjimo patikra (+20 €)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                  <Check size={16} color="#166534" />
                  <span>Vadovo Finansinis Skydas & 3 žingsnių planas (0 € VIP Vertė)</span>
                </label>
              </div>
            </div>

            {/* Rezultato suvestinė */}
            <div style={{ background: '#ffffff', border: '2px solid #312e81', borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>GALUTINĖ SĄSKAITOS SUMA</span>
                <div style={{ fontSize: '14px', color: '#475569', marginTop: '2px' }}>
                  {companyType} · {currentTier.name} su visais suderinimais
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '34px', fontWeight: '900', color: '#0f172a' }}>{calculatedTotal},00 €</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>vienkartinis mokestis</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* PALAIKOMI DOKUMENTŲ FORMATAI */}
      <section id="formatai" style={{ padding: '80px 20px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <span style={{ color: '#4338ca', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            UNIVERSALUMAS IR PATOGUMAS
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 12px' }}>
            Priimame Bet Kurio Formato Jūsų Įmonės Failus
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
            Nereikia nieko rankiniu būdu perrašinėti. Mūsų automatizuota sistema priima bet kokį eksportą iš Jūsų banko ar buhalterinės programos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <FileSpreadsheet size={32} color="#16a34a" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>Excel (.xlsx, .xls)</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Rivilė, Stekas, Pragma, Centas, Finvalda</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <FileText size={32} color="#2563eb" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>Banko CSV (.csv)</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Swedbank, SEB, Revolut, Luminor, Paysera</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <FileCode size={32} color="#d97706" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>ISO 20022 XML</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Oficialūs CAMT.053 / CAMT.052 banko išrašai</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <FileText size={32} color="#dc2626" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>PDF Ataskaitos</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Bandomieji balansai (net jei koduoti slaptažodžiu)</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <Archive size={32} color="#9333ea" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>ZIP Archyvai</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Automatiškai išpakuojami visi vidiniai failai</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <Sparkles size={32} color="#0284c7" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>Skenai ir Foto</h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Kuro ir pirminių kvitų skubus sutikrinimas</p>
          </div>

        </div>
      </section>

      {/* 4 PAGRINDINĖS PASLAUGŲ KRYPTYS */}
      <section id="services" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ color: '#4338ca', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              EKSPERTINĖS KOMPETENCIJOS
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 12px' }}>
              4 Paslaugų Kryptys Vadovams, Siekiantiems Ramybės
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '26px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: '16px' }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                1. Priešmetinis Mokesčių Auditas
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px' }}>
                Nepriklausomas 15 punktų bandomojo balanso patikrinimas prieš uždarant metus. Nustatome permokas, pritaikome lengvatas ir eliminuojame VMI patikrinimo rizikas.
              </p>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.7' }}>
                <li>Lengvatinio 6–7% ar 0% PMĮ tarifo patikra</li>
                <li>Atskaitingų asmenų (2435 s-ta) ir kasos revizija</li>
                <li>Privalomi sprendimai iki gruodžio 31 d.</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '26px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '16px' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                2. Apleistos Apskaitos Gelbėjimas
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px' }}>
                Skubus apskaitos atkūrimas ir perėmimas, jei buhalterė dingo, susirgo ar paliko klaidų. Sutvarkome pirminius dokumentus, banką ir priduodame deklaracijas.
              </p>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.7' }}>
                <li>Greitas balanso atkūrimas per kelias dienas</li>
                <li>Vėluojančių deklaracijų patikslinimas VMI / Sodrai</li>
                <li>Saugus metinės atskaitomybės pridavimas</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '26px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '16px' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                3. MB Vadovų Mokesčių Optimizavimas
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px' }}>
                Saugios ir teisėtos pinigų išsiėmimo schemos Mažųjų bendrijų vadovams ir nariams, užtikrinančios mažiausią legalią mokesčių naštą.
              </p>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.7' }}>
                <li>Civilinių vadovavimo sutarčių optimizavimas</li>
                <li>02 kodas (GPM+Sodra) vs 26 kodas (tik 15% GPM)</li>
                <li>Sodros VSD/PSD lubų valdymas iki 43 VDU</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '26px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', marginBottom: '16px' }}>
                <Building2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                4. Nuolatinė Vyr. Buhalterės Priežiūra
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px' }}>
                Pilnas kasmėnesinis įmonės buhalterinės apskaitos vedimas, ataskaitos vadovui ir atstovavimas mokesčių administratoriaus patikrinimuose.
              </p>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.7' }}>
                <li>Darbo užmokesčio, PVM, pelno deklaravimas</li>
                <li>Mėnesinės finansinės įžvalgos vadovui</li>
                <li>Asmeninis vyriausiosios buhalterės ryšys</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* DUK (Dažniausiai užduodami mokesčių klausimai) */}
      <section id="duk" style={{ padding: '80px 20px', maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <span style={{ color: '#4338ca', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ATSAKYMAI Į KLAUSIMUS
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 12px' }}>
            Dažniausiai Užduodami Mokesčių Klausimai
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            Praktiniai atsakymai į situacijas, su kuriomis susiduria dauguma Lietuvos įmonių vadovų.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {[
            {
              q: 'Ar apie priešmetinį auditą sužinos mano esama buhalterė ar VMI?',
              a: 'Tikrai NE. Tai yra 100% konfidencialus nepriklausomas auditas („Second Opinion“). Mes nesijungiame prie Jūsų Mano VMI paskyros ir nieko neinformuojame. Jūs tiesiog atsiunčiate bandomojo balanso ar banko išrašo failą, o mes pateikiame nešališką išvadą.'
            },
            {
              q: 'Kada yra geriausias laikas pakeisti buhalterį ar apskaitos įmonę?',
              a: 'Pats geriausias ir švariausias metas – nuo sausio 1 d. Pagal LR įstatymus esamai buhalterei pateikiamas 30 dienų pranešimas apie sutarties nutraukimą, pasirašomas bylų perdavimo-priėmimo aktas (su Didžiąja knyga ir ilgalaikio turto kortelėmis), o mes perimame apskaitą be jokių trikdžių.'
            },
            {
              q: 'Mūsų MB nėra PVM mokėtoja, bet perkame Google Ads / Meta reklamą. Ar kyla mokesčių prievolė?',
              a: 'Taip! Tai vieni dažniausių spąstų Lietuvoje. Pirkdama paslaugas iš Airijos tiekėjų su 0% PVM, net ir ne PVM mokėtoja įmonė privalo deklaruoti ir sumokėti 21% PVM į Lietuvos biudžetą (deklaracija FR0608 iki kito mėn. 25 d.). Tačiau šis PVM tampa 100% leidžiamomis sąnaudomis pelno mokesčiui mažinti.'
            },
            {
              q: 'Kaip MB vadovui teisėtai išsimokėti pinigus su mažiausiais mokesčiais?',
              a: 'Pagal LR MBĮ galimi du pagrindiniai būdai: 1) Pagal civilinę vadovavimo sutartį (apmokestinama 15% GPM ir Sodra iki 43 VDU lubų, išmokos yra leidžiami atskaitymai MB pelnui mažinti); 2) Avansinis pelnas / dividendai (26 kodas – TIK 15% GPM be Sodros mokesčių). Vyriausioji buhalterė padeda rasti optimaliausią balansą.'
            },
            {
              q: 'Automobilio pirkimas įmonėje – ar galima atskaityti PVM ir kaip skaičiuojamos pajamos natūra?',
              a: 'Pagal PVMĮ 62 str. lengvojo automobilio (M1 klasės) pirkimo ir nuomos PVM atskaita draudžiama (išskyrus nuomą ar taksi veiklą). Jei auto naudojamas ir asmeniniams poreikiams, vadovui/darbuotojui atsiranda pajamos natūra pagal GPMĮ 9 str. (dažniausiai 0,75% automobilio tikrosios rinkos vertės per mėnesį).'
            },
            {
              q: 'Ką daryti gavus VMI paklausimą ar pranešimą metų pabaigoje?',
              a: 'Pirmiausia – nepanikuoti! VMI paklausimas dar nereiškia baudos. Administratorius paprastai suteikia 10–14 dienų terminą paaiškinimams. Mūsų vyriausioji buhalterė sutikrina deklaracijas (FR0600, i.SAF, PLN204) su Didžiąja knyga ir paruošia teisiškai motyvuotą atsakymą VMI inspektoriui.'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}
            >
              <div 
                onClick={() => toggleFaq(idx)}
                style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: openFaq === idx ? '#f8faff' : '#ffffff' }}
              >
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.q}</strong>
                <ChevronDown size={18} color="#64748b" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {openFaq === idx && (
                <div style={{ padding: '0 22px 20px', fontSize: '14px', color: '#475569', lineHeight: '1.6', borderTop: '1px solid #f1f5f9' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* UŽSAKYMO IR DOKUMENTŲ PATEIKIMO SEKCIJA */}
      <section id="uzsakymas" style={{ padding: '80px 20px', maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', border: '2px solid #cbd5e1', borderRadius: '20px', padding: '44px 36px', boxShadow: '0 10px 35px rgba(0,0,0,0.06)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
              NEMOKAMAS 1 ETAPO AUDITAS (0 €)
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '12px 0 8px' }}>
              Užsakykite Priešmetinį Mokesčių Vertinimą
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Gaukite vyriausiosios buhalterės asmeninę išvadą per 24 valandas. Visiškai konfidencialu.
            </p>
          </div>

          {formSubmitted ? (
            <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#166534', margin: '0 0 8px' }}>
                Užklausa Sėkmingai Gauta!
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }}>
                Vyriausioji buhalterė Lilija Zapasnik asmeniškai peržiūrės Jūsų pateiktą informaciją. Oficialią išvadą arba atsakymą atsiųsime Jums el. paštu per 24 valandas.
              </p>
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px dashed #16a34a', fontSize: '13px', color: '#166534' }}>
                📎 Norėdami pagreitinti auditą, savo bandomąjį balansą (Excel, CSV ar PDF) galite tiesiogiai atsiųsti į: <strong>tomas@verslomatika.lt</strong>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                    Jūsų vardas, pavardė *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Vardas Pavardė" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                    Įmonės pavadinimas (MB ar UAB) *
                  </label>
                  <input 
                    type="text" 
                    placeholder="MB Prekybos Sprendimai" 
                    required 
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                    El. pašto adresas išvadai gauti *
                  </label>
                  <input 
                    type="email" 
                    placeholder="vadovas@imone.lt" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                    Telefono numeris (tik esant skubiems klausimams)
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+370 600 00000" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Kokia paslauga šiuo metu aktualiausia?
                </label>
                <select 
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#ffffff', color: '#0f172a' }}
                >
                  <option>Priešmetinis mokesčių & balanso auditas (Nemokamai)</option>
                  <option>Metinės finansinės atskaitomybės sudarymas & PLN204 deklaracija</option>
                  <option>Apleistos buhalterijos skubus atkūrimas ir perėmimas</option>
                  <option>MB vadovo mokesčių optimizavimas (Civilinė sutartis / Dividendai)</option>
                  <option>Nuolatinė vyr. buhalterės priežiūra nuo sausio 1 d.</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Trumpas situacijos aprašymas ar klausimas (neprivaloma)
                </label>
                <textarea 
                  rows={3} 
                  placeholder="Pvz.: Norime pasitikrinti prieš uždarant metus, ar neturime permokų / Buhalterė dingo, reikia priduoti atskaitomybę / Planuojame keisti buhalterį nuo sausio 1 d..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#475569' }}>
                📁 <strong>Kaip pateikti dokumentus auditui?</strong><br />
                Galite tiesiogiai atsiųsti savo bandomojo balanso ar banko išrašo failą (Excel, CSV, PDF, XML ar ZIP) el. paštu: <strong style={{ color: '#312e81' }}>tomas@verslomatika.lt</strong>. Taip pat pateikus šią formą gausite tiesioginį patvirtinimą.
              </div>

              <button 
                type="submit" 
                style={{ background: '#312e81', color: '#ffffff', border: 'none', padding: '16px 28px', borderRadius: '10px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '6px', boxShadow: '0 4px 12px rgba(49, 46, 129, 0.25)' }}
              >
                Gauti Nemokamą Audito Išvadą (0 €)
              </button>
            </form>
          )}

        </div>
      </section>

      {/* Poraštė */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '45px 20px', borderTop: '1px solid #1e293b', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <strong style={{ color: '#ffffff', fontSize: '16px' }}>Verslomatika Buhalterija</strong><br />
            Vyriausiosios buhalterės Lilijos Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444) ir Tomo (Verslomatika B2B) mokesčių priežiūros tarnyba.<br />
            MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva • tomas@verslomatika.lt
          </div>

          <div style={{ display: 'flex', gap: '22px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>ReputationPro</Link>
            <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privatumo politika</Link>
            <a href="mailto:tomas@verslomatika.lt" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '700' }}>tomas@verslomatika.lt</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

'use client';
// "Kas vyksta toliau" – the owner demo's motion panel (ROADMAP Etapas H). It never plays on its
// own: it reacts to the real phone next to it (or to the automatic demonstration of that phone),
// so there is one focal point. Pure SVG/CSS, personalised (name, platform, channels by industry).
import type React from 'react';
import { ArrowRight, Check, Mail, MessageSquare, Phone, RotateCcw, ShieldCheck, Star } from 'lucide-react';

export type Stage = 'idle' | 'good' | 'care';
export type DemoMessage = { rating: number; text: string; name: string; phone: string };

type Channel = { key: string; label: string; Icon: () => React.JSX.Element };

// ---- tiny vector icons (36×36) ------------------------------------------------------------
const G = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">{children}</svg>;
const QR = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <g transform={`translate(${x} ${y}) scale(${s})`} fill="#312e81">
  <rect width="4" height="4"/><rect x="6" width="2" height="2"/><rect x="10" width="4" height="4"/><rect y="10" width="4" height="4"/><rect x="6" y="6" width="3" height="3"/><rect x="10" y="10" width="2" height="2"/><rect x="12" y="7" width="2" height="2"/><rect x="5" y="11" width="2" height="3"/>
</g>;
const IconStand = () => <G><path d="M9 31 L12 6 H24 L27 31 Z" fill="#ede9fe" stroke="#a78bfa"/><rect x="13" y="10" width="10" height="10" rx="1.5" fill="#fff"/><QR x={14.5} y={11.5} s={0.5}/><path d="M28 9 a5 5 0 0 1 0 7 M30.5 7 a8 8 0 0 1 0 11" fill="none" stroke="#7357ff" strokeWidth="1.6" strokeLinecap="round" className="hm-nfc"/><rect x="7" y="30" width="22" height="3" rx="1.5" fill="#c4b5fd"/></G>;
const IconReceipt = () => <G><path d="M9 4 H27 V31 l-3 -2 -3 2 -3 -2 -3 2 -3 -2 -3 2 Z" fill="#fff" stroke="#cbd5e1"/><rect x="12" y="8" width="12" height="1.6" rx=".8" fill="#cbd5e1"/><rect x="12" y="12" width="8" height="1.6" rx=".8" fill="#cbd5e1"/><rect x="13" y="16.5" width="10" height="10" rx="1.5" fill="#f5f3ff"/><QR x={14.5} y={18} s={0.5}/></G>;
const IconPackage = () => <G><path d="M5 12 L18 6 L31 12 V27 L18 33 L5 27 Z" fill="#fde68a" stroke="#d97706" strokeWidth=".8"/><path d="M5 12 L18 18 L31 12 M18 18 V33" fill="none" stroke="#d97706" strokeWidth=".8"/><rect x="20.5" y="18" width="8" height="8" rx="1.2" fill="#fff"/><QR x={21.6} y={19.1} s={0.42}/></G>;
const IconSms = () => <G><rect x="9" y="3" width="18" height="30" rx="4" fill="#13112e"/><rect x="11" y="7" width="14" height="22" rx="2" fill="#fff"/><rect x="12.5" y="10" width="10" height="5" rx="2.5" fill="#e2e8f0"/><rect x="14" y="17" width="10" height="7" rx="3" fill="#7357ff"/><path d="M16 20.5 h6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></G>;
const IconEmail = () => <G><rect x="4" y="8" width="28" height="20" rx="3" fill="#fff" stroke="#a78bfa"/><path d="M5 10 L18 19 L31 10" fill="none" stroke="#7357ff" strokeWidth="1.6"/></G>;
const IconSignature = () => <G><rect x="3" y="6" width="30" height="24" rx="3" fill="#fff" stroke="#cbd5e1"/><rect x="7" y="11" width="14" height="1.8" rx=".9" fill="#cbd5e1"/><rect x="7" y="15" width="10" height="1.8" rx=".9" fill="#cbd5e1"/><rect x="7" y="20" width="18" height="6" rx="3" fill="#7357ff"/><path d="M10 23 h3" stroke="#fde047" strokeWidth="1.6" strokeLinecap="round"/></G>;
const IconCard = () => <G><rect x="3" y="9" width="30" height="18" rx="3" fill="#13112e"/><rect x="21" y="12" width="9" height="9" rx="1.5" fill="#fff"/><QR x={22} y={13} s={0.45}/><rect x="7" y="14" width="10" height="2" rx="1" fill="#a78bfa"/><rect x="7" y="18.5" width="7" height="1.6" rx=".8" fill="#64748b"/></G>;

function channelsFor(industry: string): Channel[] {
  const i = (industry || '').toLowerCase();
  if (['clinic', 'dental', 'odontologija', 'veterinarija', 'beauty'].includes(i)) return [
    { key: 'stand', label: 'Stovelis registratūroje', Icon: IconStand },
    { key: 'sms', label: 'SMS po vizito', Icon: IconSms },
    { key: 'receipt', label: 'QR sąskaitoje', Icon: IconReceipt },
  ];
  if (['ecommerce', 'ecom', 'baldai', 'dovanos'].includes(i)) return [
    { key: 'package', label: 'Lipdukas ant siuntinio', Icon: IconPackage },
    { key: 'email', label: 'Laiškas po užsakymo', Icon: IconEmail },
    { key: 'signature', label: 'El. pašto parašas', Icon: IconSignature },
  ];
  if (['horeca', 'restoranai'].includes(i)) return [
    { key: 'receipt', label: 'QR ant kvito', Icon: IconReceipt },
    { key: 'stand', label: 'Stovelis prie kasos', Icon: IconStand },
    { key: 'sms', label: 'SMS po apsilankymo', Icon: IconSms },
  ];
  if (['auto', 'autoservisai'].includes(i)) return [
    { key: 'receipt', label: 'QR sąskaitoje', Icon: IconReceipt },
    { key: 'sms', label: 'SMS atsiėmus automobilį', Icon: IconSms },
    { key: 'stand', label: 'Stovelis prie kasos', Icon: IconStand },
  ];
  return [
    { key: 'stand', label: 'Stovelis prie kasos', Icon: IconStand },
    { key: 'sms', label: 'SMS po apsilankymo', Icon: IconSms },
    { key: 'card', label: 'Vizitinė kortelė', Icon: IconCard },
  ];
}

// Lithuanian: 1/21 atsiliepimas, 2–9/22 atsiliepimai, 10–20/30 atsiliepimų.
const reviewsWord = (n: number) => n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19) ? 'atsiliepimų' : n % 10 === 1 ? 'atsiliepimas' : 'atsiliepimai';
const fmt1 = (n: number) => n.toLocaleString('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---- scenes ----------------------------------------------------------------------------------
// Each scene is a 3-column grid: source (left) · animated connector (middle) · result card (right),
// with the explanation below. No absolute positioning, so nothing overlaps at any width.
function Link({ d, className = '', children }: { d: string | string[]; className?: string; children?: React.ReactNode }) {
  return <div className="hm-link" aria-hidden="true">
    <svg className="hm-flows" viewBox="0 0 100 100" preserveAspectRatio="none">
      {(Array.isArray(d) ? d : [d]).map((path, i) => <path key={i} className={`hm-flow ${className}`} style={{ animationDelay: `${i * 0.25}s` }} d={path} vectorEffect="non-scaling-stroke"/>)}
    </svg>
    {children}
  </div>;
}

function IdleScene({ industry }: { industry: string }) {
  const ch = channelsFor(industry);
  return <div className="hm-scene hm-idle"><div className="hm-visual">
    <div className="hm-target"><span className="hm-target-dot"/> Jūsų puslapis</div>
    <Link d={[17, 50, 83].map((y) => `M100 ${y} C 55 ${y}, 45 50, 0 50`)}/>
    <ul className="hm-channels">
      {ch.map(({ key, label, Icon }, i) => <li key={key} className="hm-pop" style={{ animationDelay: `${0.15 + i * 0.18}s` }}><span className="hm-ch-icon"><Icon/></span>{label}</li>)}
    </ul>
  </div></div>;
}

function GoodScene({ name, platform, rating, reviews, opened }: { name: string; platform: 'google' | 'rekvizitai'; rating: number | null; reviews: number | null; opened: boolean }) {
  const P = platform === 'rekvizitai' ? 'Rekvizitai.lt' : 'Google';
  return <div className="hm-scene hm-good"><div className="hm-visual">
    <div className="hm-badge hm-badge-good hm-pop"><Star size={14} fill="currentColor" strokeWidth={0}/> 5★</div>
    <Link d="M0 50 C 35 12, 65 12, 100 50" className="hm-flow-good"/>
    <div className="hm-review hm-pop" style={{ animationDelay: '.35s' }}>
      <div className="hm-review-head"><span className="hm-platform">{P}</span><span className="hm-plus">+1</span></div>
      <b>{name}</b>
      <div className="hm-review-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={15} fill="currentColor" strokeWidth={0} className="hm-star" style={{ animationDelay: `${0.6 + i * 0.12}s` }}/>)}</div>
      <i/><i/>
      {rating && reviews ? <small>{fmt1(rating)}★ · {reviews} → <b className="hm-count">{reviews + 1}</b> {reviewsWord(reviews + 1)}</small> : <small><b className="hm-count">+1</b> naujas atsiliepimas</small>}
    </div>
  </div>
    <p className="hm-note">{opened
      ? <><Check size={15}/> Atsidarė tikra Jūsų {platform === 'rekvizitai' ? 'Rekvizitai.lt atsiliepimų forma' : 'Google atsiliepimų forma'}. Taip klientas ją pasiekia vienu paspaudimu. <em>Patys atsiliepimo nerašykite: tai tik patikrinimui.</em></>
      : <>Telefone paspauskite žalią mygtuką: atsidarys tikra Jūsų {platform === 'rekvizitai' ? 'Rekvizitai.lt' : 'Google'} atsiliepimų forma. Nuoroda jau paruošta.</>}</p>
  </div>;
}

function CareScene({ name, message, typing, ownerEmail, showPublicLow }: { name: string; message: DemoMessage | null; typing: boolean; ownerEmail: string | null; showPublicLow: boolean }) {
  return <div className="hm-scene hm-care"><div className="hm-visual">
    <div className="hm-badge hm-badge-care hm-pop"><Star size={14} fill="currentColor" strokeWidth={0}/> {message ? `${message.rating}★` : '2★'}</div>
    <Link d="M0 50 C 35 88, 65 88, 100 50" className={`hm-flow-care${message ? '' : ' hm-flow-wait'}`}>
      {message && <span className="hm-envelope"><Mail size={18}/></span>}
    </Link>
    <div className={`hm-mail${message ? ' is-in' : ''}`}>
      {message ? <>
        <div className="hm-mail-head"><span><Mail size={14}/> Naujas laiškas · ką tik</span><small>Kam: {ownerEmail || 'Jūsų el. paštas'}</small></div>
        <b className="hm-mail-subj">Nauja pastaba ({message.rating}★) – {name}</b>
        <p className="hm-mail-text">„{message.text || '…'}“</p>
        <div className="hm-mail-actions"><span><Phone size={13}/> {[message.name, message.phone || 'Paskambinti'].filter(Boolean).join(' · ')}</span><span><MessageSquare size={13}/> Atsakyti</span></div>
      </> : <div className="hm-typing">{typing ? <><span/><span/><span/> Klientas rašo pastabą…</> : 'Klientas gali parašyti Jūsų komandai'}</div>}
    </div>
  </div>
    <p className="hm-note">{message
      ? <><ShieldCheck size={15}/> Pastaba iškart ateina Jūsų komandai el. paštu ir į skydelį: darbuotojas gali paskambinti ir išspręsti. {showPublicLow ? 'Po žemo įvertinimo klientas mato ir viešo atsiliepimo nuorodą.' : 'Klientas visada gali parašyti ir viešai.'}</>
      : <>Po 1–3★ klientas pirmiausia gali parašyti Jūsų komandai.</>}</p>
  </div>;
}

// ---- panel -----------------------------------------------------------------------------------
export function HeroMotion(p: {
  stage: Stage; name: string; platform: 'google' | 'rekvizitai'; industry: string;
  googleRating: number | null; googleReviews: number | null; showPublicLow: boolean;
  typing: boolean; message: DemoMessage | null; publicOpened: boolean; seen: { good: boolean; care: boolean };
  ownerEmail: string | null; claimHref: string; ctaLabel: string; ghost: boolean;
  onShow: (n: 0 | 5 | 2) => void; onCta: () => void;
}) {
  const tabs: { n: 0 | 5 | 2; label: string; on: boolean; done: boolean }[] = [
    { n: 0, label: 'Kaip pasiekia', on: p.stage === 'idle', done: false },
    { n: 5, label: 'Patenkintas (5★)', on: p.stage === 'good', done: p.seen.good },
    { n: 2, label: 'Nepatenkintas (2★)', on: p.stage === 'care', done: p.seen.care },
  ];
  const both = p.seen.good && p.seen.care;
  return <section className="hm" data-stage={p.stage} aria-live="polite">
    <div className="hm-head">
      <span className="hm-kicker">Kas vyksta toliau</span>
      {p.ghost && <span className="hm-live"><span/> Demonstracija</span>}
    </div>
    <div className="hm-tabs" role="tablist">
      {tabs.map((t) => <button key={t.n} type="button" role="tab" aria-selected={t.on} className={`${t.on ? 'is-on' : ''}${t.done ? ' is-done' : ''}`} onClick={() => p.onShow(t.n)}>
        {t.done ? <Check size={13}/> : t.n === 0 ? <RotateCcw size={13}/> : <Star size={13} fill="currentColor" strokeWidth={0}/>} {t.label}
      </button>)}
    </div>
    <div className="hm-stage">
      {p.stage === 'idle' && <IdleScene key="idle" industry={p.industry}/>}
      {p.stage === 'good' && <GoodScene key="good" name={p.name} platform={p.platform} rating={p.googleRating} reviews={p.googleReviews} opened={p.publicOpened}/>}
      {p.stage === 'care' && <CareScene key={p.message ? 'care-mail' : 'care'} name={p.name} message={p.message} typing={p.typing} ownerEmail={p.ownerEmail} showPublicLow={p.showPublicLow}/>}
    </div>
    <div className="hm-foot">
      {both
        ? <><span><Check size={15}/> Pamatėte abu kelius. Su tikrais klientais viskas vyks lygiai taip pat.</span><a className="btn btn-primary btn-small" href={p.claimHref} onClick={p.onCta}>{p.ctaLabel} <ArrowRight size={15}/></a></>
        : p.stage === 'idle'
          ? <span className="hm-prompt"><span className="hm-arrow" aria-hidden="true">←</span> Išbandykite: paspauskite žvaigždutę telefone</span>
          : <span className="hm-prompt">{p.stage === 'good' ? 'Dabar pabandykite 2★: pamatysite, kas nutinka su pastaba.' : 'Dabar pabandykite 5★: pamatysite kelią į viešą atsiliepimą.'}</span>}
    </div>
  </section>;
}

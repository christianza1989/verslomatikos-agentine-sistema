'use client';
// "Owner mode" of /r/{slug} for pre-provisioned outbound leads (clients.is_demo=1).
// Goal: in ~30 seconds the business owner sees both sides at once – what their customer
// sees on the phone (left) and what lands in their own inbox the same second (right) –
// and can activate with one click. Nothing typed here is stored or emailed.
import { useState } from 'react';
import { ArrowRight, BatteryFull, Bell, CheckCircle2, Inbox, Lock, Mail, MessageSquare, QrCode, Send, Signal, Star, TrendingUp, Wifi } from 'lucide-react';
import { ReviewGate, type DemoEvent } from './review-gate';

type Props = {
  slug: string;
  name: string;
  googleUrl: string;
  showPublicLow: boolean;
  claimHref: string;
  personal: boolean;
  qr: string;
  pageUrl: string;
  industry: string;
  googleRating: number | null;
  googleReviews: number | null;
};

function audience(industry: string) {
  if (industry === 'clinic') return { one: 'pacientas', many: 'pacientai', gen: 'paciento', dat: 'pacientui', genPl: 'pacientų' };
  if (industry === 'ecommerce') return { one: 'pirkėjas', many: 'pirkėjai', gen: 'pirkėjo', dat: 'pirkėjui', genPl: 'pirkėjų' };
  return { one: 'klientas', many: 'klientai', gen: 'kliento', dat: 'klientui', genPl: 'klientų' };
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const fmt = (n: number) => n.toLocaleString('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function OwnerDemo(p: Props) {
  const who = audience(p.industry);
  const [events, setEvents] = useState<(DemoEvent & { at: number })[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const appHost = p.pageUrl.replace(/^https?:\/\//, '').split('/')[0];
  const restart = () => setResetKey((k) => k + 1);
  // Only the latest star click is shown (repeated clicks would clutter the inbox); private messages stack.
  const add = (e: DemoEvent) => setEvents((list) => [{ ...e, at: Date.now() }, ...(e.kind === 'rating' ? list.filter((x) => x.kind !== 'rating') : list)].slice(0, 5));
  const privateCount = events.filter((e) => e.kind === 'private').length;

  // Honest projection for 3 months. The monthly pace scales with the business's current
  // Google volume, so a small shop is not promised the pace of a busy clinic.
  const monthly = !p.googleReviews ? 0 : p.googleReviews >= 150 ? 15 : p.googleReviews >= 40 ? 8 : 5;
  const added = monthly * 3;
  const projection = p.googleRating && p.googleReviews
    ? { reviews: p.googleReviews + added, rating: Math.min(5, (p.googleRating * p.googleReviews + 5 * added) / (p.googleReviews + added)) }
    : null;

  return <div className="od-shell">
    <header className="od-bar">
      <div className="od-bar-text">
        <strong>{p.personal ? `Sveiki, ${p.name}!` : 'ReputationPro demonstracija'}</strong>
        <span>{p.personal ? 'Tai Jūsų jau paruoštas atsiliepimų puslapis. Išbandykite jį kaip klientas.' : `Pavyzdinis „${p.name}“ atsiliepimų puslapis.`}</span>
      </div>
      <a className="btn btn-primary od-bar-cta" href={p.claimHref}>{p.personal ? 'Aktyvuoti nemokamai' : 'Išbandyti nemokamai'} <ArrowRight size={16}/></a>
    </header>

    <section className="od-hero">
      <h1>Taip atrodytų <span>{p.name}</span> atsiliepimų sistema</h1>
      <p>Kairėje matote, ką mato Jūsų {who.one} telefone. Dešinėje matote, ką <b>tą pačią sekundę</b> gaunate Jūs. Paspauskite žvaigždutę ir išbandykite.</p>
    </section>

    <div className="od-split">
      <div className="od-phone-col">
        <div className="od-phone" role="img" aria-label={`${p.name} atsiliepimų puslapis kliento telefone`}>
          <div className="od-phone-screen">
            <div className="od-phone-island"/>
            <div className="od-phone-status" aria-hidden="true"><span>9:41</span><span className="od-phone-icons"><Signal size={13}/><Wifi size={13}/><BatteryFull size={17}/></span></div>
            <div className="od-phone-url" aria-hidden="true"><Lock size={11}/> {appHost}</div>
            <div className="od-phone-scroll">
              <ReviewGate key={resetKey} slug={p.slug} name={p.name} googleUrl={p.googleUrl} showPublicLow={p.showPublicLow} mode="demo" embedded onDemoEvent={add}/>
            </div>
            <div className="od-phone-home" aria-hidden="true"/>
          </div>
        </div>
        <p className="od-caption"><Star size={14}/> Pabandykite: paspauskite <b>2★</b> ir parašykite pastabą. Tada <b>5★</b>: mygtukas atvers Jūsų tikrą Google atsiliepimų formą. {events.length > 0 && <button type="button" onClick={restart}>Iš naujo</button>}</p>
      </div>

      <aside className="od-owner" aria-live="polite">
        <div className="od-owner-head"><span><Inbox size={17}/> Jūsų vadovo dėžutė</span><span className="od-live"><i/> gyvai</span></div>
        {events.length === 0 && <div className="od-empty">
          <Bell size={26}/>
          <p><b>Kol kas tuščia.</b> Įvertinkite kairėje 1–3★ ir parašykite pastabą: ji atsiras čia ir Jūsų el. pašte tą pačią sekundę.</p>
        </div>}
        <ul className="od-events">
          {events.map((e) => <li key={e.at} className={`od-event od-event-${e.kind}`}>
            {e.kind === 'rating' && (e.rating >= 4
              ? <p><CheckCircle2 size={16} className="ok"/><span><b>{e.rating}★</b> – {who.dat} rodoma padėka ir mygtukas į Jūsų <b>Google atsiliepimų formą</b>. Taip renkasi nauji vieši atsiliepimai.</span></p>
              : <p><MessageSquare size={16} className="warn"/><span><b>{e.rating}★</b> – {who.dat} rodoma privati forma vadovui{p.showPublicLow ? ' (su galimybe rašyti ir viešai)' : ''}.</span></p>)}
            {e.kind === 'private' && <div className="od-msg">
              <div className="od-msg-top"><span className="od-stars">{stars(e.rating)}</span><span className="od-new">Nauja</span></div>
              <p className="od-msg-text">„{e.text}“</p>
              <p className="od-msg-meta">{e.name || 'Vardas nenurodytas'}{e.phone ? ` · ${e.phone}` : ''}</p>
              <div className="od-mail"><Mail size={15}/><div><b>El. laiškas Jums:</b> „Naujas privatus atsiliepimas ({e.rating}★) – {p.name}“<span>Patarimas: paskambinkite per 15 min. ir išspręskite situaciją, kol {who.one} dar neparašė viešai.</span></div></div>
            </div>}
          </li>)}
        </ul>
        {privateCount > 0 && <a className="btn btn-primary btn-full od-owner-cta" href={p.claimHref}>Noriu taip gauti pastabas <ArrowRight size={16}/></a>}
      </aside>
    </div>

    {projection && <section className="od-section od-numbers">
      <div><span className="od-kicker"><TrendingUp size={15}/> Jūsų Google profilis šiandien</span><strong>{fmt(p.googleRating!)}★</strong><small>iš {p.googleReviews} atsiliepimų</small></div>
      <ArrowRight size={26} className="od-numbers-arrow"/>
      <div><span className="od-kicker">Po 3 mėn. (prognozė)</span><strong>{fmt(projection.rating)}★</strong><small>iš {projection.reviews} atsiliepimų</small></div>
      <p>Jei kas mėnesį tik {monthly} patenkinti {who.many} paliktų atsiliepimą. Daugiau atsiliepimų reiškia didesnį pasitikėjimą tų, kurie Jus renkasi Google Maps.</p>
    </section>}

    <section className="od-section od-steps">
      <h2>Pradėti paprasta</h2>
      <ol>
        <li><span>1</span><div><b>Aktyvuokite (1 min.)</b><p>Puslapis, QR kodas ir Google nuoroda jau paruošti. Liko sugalvoti slaptažodį.</p></div></li>
        <li><span>2</span><div><b>Pasidalinkite nuoroda</b><p>Pastatykite QR prie kasos ar registratūros arba nusiųskite nuorodą SMS ar el. laišku po apsilankymo.</p></div></li>
        <li><span>3</span><div><b>Gaukite atsiliepimus</b><p>Patenkinti {who.many} rašo Google, o pastabos ateina Jums, kol dar galite jas išspręsti.</p></div></li>
      </ol>
    </section>

    <section className="od-section od-stand">
      <div className="od-stand-card">
        <small>{p.name}</small>
        <b>Įvertinkite mus</b>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.qr} alt={`${p.name} QR kodas`} width={150} height={150}/>
        <span><QrCode size={13}/> Nuskenuokite telefonu</span>
      </div>
      <div className="od-stand-text">
        <h2>Jūsų QR kodas jau sugeneruotas</h2>
        <p>Atsispausdinkite jį patys iš valdymo skydelio arba užsisakykite akrilinį stovelį. Tas pats kodas tinka sąskaitoms, vizitinėms ir lipdukams.</p>
        <code>{p.pageUrl.replace(/^https?:\/\//, '')}</code>
      </div>
    </section>

    <section className="od-section od-final">
      <h2>Pradėkite šiandien – 14 dienų nemokamai</h2>
      <ul>
        <li><CheckCircle2 size={17}/> Be banko kortelės</li>
        <li><CheckCircle2 size={17}/> Paruošta per 1 minutę</li>
        <li><CheckCircle2 size={17}/> Atšaukiama bet kada, be sutarčių</li>
      </ul>
      <a className="btn btn-primary od-final-cta" href={p.claimHref}>{p.personal ? 'Aktyvuoti mano paskyrą' : 'Išbandyti nemokamai'} <ArrowRight size={18}/></a>
      <p className="od-alt">Turite klausimų? <a href={`mailto:tomas@verslomatika.lt?subject=${encodeURIComponent(`ReputationPro – ${p.name}`)}`}><Send size={13}/> Parašykite Tomui</a> – atsakome tą pačią darbo dieną.</p>
    </section>

    <footer className="od-footer">Šį demonstracinį puslapį paruošė Verslomatika (MB Pinet). Čia įvesti duomenys niekur nesaugomi ir niekam nesiunčiami.</footer>

    <div className="od-mobile-cta"><a className="btn btn-primary btn-full" href={p.claimHref}>{p.personal ? 'Aktyvuoti nemokamai' : 'Išbandyti nemokamai'} <ArrowRight size={16}/></a></div>
  </div>;
}

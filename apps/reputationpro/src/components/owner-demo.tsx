'use client';
// "Owner mode" of /r/{slug} for pre-provisioned outbound leads (clients.is_demo=1).
// Goal: in ~30 seconds the business owner sees both sides at once – what their customer
// sees on the phone (left) and what lands in their own inbox the same second (right) –
// and can activate with one click. Nothing typed here is stored or emailed.
import { useState } from 'react';
import { ArrowRight, BatteryFull, CheckCircle2, Lock, QrCode, Send, Signal, Star, TrendingUp, Wifi } from 'lucide-react';
import { ReviewGate } from './review-gate';

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

const fmt = (n: number) => n.toLocaleString('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function OwnerDemo(p: Props) {
  const who = audience(p.industry);
  const [resetKey, setResetKey] = useState(0);
  const appHost = p.pageUrl.replace(/^https?:\/\//, '').split('/')[0];
  const restart = () => setResetKey((k) => k + 1);

  // Honest projection for 3 months. The monthly pace scales with the business's current
  // Google volume, so a small shop is not promised the pace of a busy clinic.
  const monthly = !p.googleReviews ? 0 : p.googleReviews >= 150 ? 15 : p.googleReviews >= 40 ? 8 : 5;
  const added = monthly * 3;
  const projection = p.googleRating && p.googleReviews
    ? { reviews: p.googleReviews + added, rating: Math.min(5, (p.googleRating * p.googleReviews + 5 * added) / (p.googleReviews + added)) }
    : null;

  return <div className="od-shell">
    {/* Verslomatika site header (same brand and menu as verslomatika.lt) */}
    <header className="vm-header">
      <a href="https://verslomatika.lt/" className="vm-brand" aria-label="Verslomatika pradžia">
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M1.8 7.5h9.4l6.2 18.6-2.5 5H9.7z" fill="#6545ca"/>
          <path d="M13 5h9.6l5.4 15.7h-9.5z" fill="#4d31b0"/>
          <path d="M22.5 1.8h7.4l2.9 8.2h-7.3z" fill="#8c72ea"/>
        </svg>
        <strong>Verslomatika</strong><i/><b>ReputationPro</b>
      </a>
      <nav className="vm-nav" aria-label="Verslomatika">
        <a href="https://verslomatika.lt/sprendimai/">Sprendimai</a>
        <a href="https://verslomatika.lt/industrijos/">Veiklos sritys</a>
        <a href="https://verslomatika.lt/verslo-augimo-irankiai/">Augimo įrankiai</a>
        <a href="https://verslomatika.lt/kontaktai/">Kontaktai</a>
      </nav>
      <a className="btn btn-primary vm-header-cta" href={p.claimHref}>{p.personal ? 'Aktyvuoti nemokamai' : 'Išbandyti nemokamai'} <ArrowRight size={16}/></a>
    </header>

    <section className="od-hero">
      <span className="od-greeting">{p.personal ? `Sveiki, ${p.name}! Tai Jūsų jau paruoštas atsiliepimų puslapis.` : `Pavyzdinis „${p.name}“ atsiliepimų puslapis`}</span>
      <h1>Taip atrodytų <span>{p.name}</span> atsiliepimų sistema</h1>
      <p>Taip Jūsų atsiliepimų puslapį matys {who.one} telefone. Paspauskite žvaigždutę ir išbandykite.</p>
    </section>

    <div className="od-split od-split-single">
      <div className="od-phone-col">
        <div className="od-phone" role="img" aria-label={`${p.name} atsiliepimų puslapis kliento telefone`}>
          <div className="od-phone-screen">
            <div className="od-phone-island"/>
            <div className="od-phone-status" aria-hidden="true"><span>9:41</span><span className="od-phone-icons"><Signal size={13}/><Wifi size={13}/><BatteryFull size={17}/></span></div>
            <div className="od-phone-url" aria-hidden="true"><Lock size={11}/> {appHost}</div>
            <div className="od-phone-scroll">
              <ReviewGate key={resetKey} slug={p.slug} name={p.name} googleUrl={p.googleUrl} showPublicLow={p.showPublicLow} mode="demo" embedded/>
            </div>
            <div className="od-phone-home" aria-hidden="true"/>
          </div>
        </div>
        <p className="od-caption"><Star size={14}/> Pabandykite <b>1–3★</b> ir <b>4–5★</b>: 5★ mygtukas atvers Jūsų tikrą Google atsiliepimų formą. <button type="button" onClick={restart}>Iš naujo</button></p>
      </div>

    </div>

    {/* Why it matters: the problem in one glance */}
    <section className="od-section od-why">
      <span className="od-eyebrow">Kodėl tai svarbu</span>
      <h2>Patenkinti {who.many} tyli. Nepatenkinti – rašo.</h2>
      <div className="od-why-grid">
        <div className="od-why-card"><b>Pirmas žvilgsnis</b><p>renkantis paslaugų teikėją dažniausiai krenta į Google reitingą ir atsiliepimų skaičių.</p></div>
        <div className="od-why-card"><b>Tylūs</b><p>patenkinti {who.many} retai patys sugalvoja parašyti atsiliepimą – jų tiesiog niekas nepaprašo.</p></div>
        <div className="od-why-card"><b>Garsūs</b><p>nusivylę rašo dažniau, todėl Jūsų Google reitingas atspindi ne tikrą darbo kokybę.</p></div>
      </div>
    </section>

    {/* How it works: two paths */}
    <section className="od-section od-how">
      <span className="od-eyebrow">Kaip veikia</span>
      <h2>Vienas puslapis – du keliai</h2>
      <div className="od-how-grid">
        <div className="od-how-card od-how-good">
          <span className="od-how-badge">4–5 ★</span>
          <h3>Daugiau 5★ atsiliepimų Google</h3>
          <p>Patenkintam {who.dat} padėkojame ir vienu mygtuku nukreipiame į Jūsų Google atsiliepimų formą. Užtrunka mažiau nei minutę.</p>
        </div>
        <div className="od-how-card od-how-care">
          <span className="od-how-badge">1–3 ★</span>
          <h3>Pastabos pirmiausia ateina Jums</h3>
          <p>{who.one.charAt(0).toUpperCase() + who.one.slice(1)} gali parašyti tiesiai vadovui. Žinutė ir el. laiškas Jus pasiekia iškart – galite paskambinti ir išspręsti situaciją.</p>
        </div>
      </div>
    </section>

    {/* What you get */}
    <section className="od-section od-get">
      <span className="od-eyebrow">Ką gaunate</span>
      <h2>Viskas paruošta – tereikia pasidalinti nuoroda</h2>
      <ul className="od-get-list">
        <li><CheckCircle2 size={18}/><div><b>Asmeninis atsiliepimų puslapis</b><span>Su Jūsų pavadinimu, veikia telefone be programėlių.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>QR kodas ir nuoroda</b><span>Registratūrai, kasai, sąskaitoms, SMS ar el. laiškams po vizito.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Momentinis pranešimas</b><span>Kai {who.one} palieka pastabą, iškart gaunate el. laišką su kontaktu.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Valdymo skydelis</b><span>Visos pastabos, įvertinimai ir paruošti tekstai klientams vienoje vietoje.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Lietuviškai ir paprastai</b><span>Nereikia jokių nustatymų – Google nuoroda jau susieta.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Jūsų sprendimas</b><span>Skydelyje pasirinksite, ar po žemo įvertinimo rodyti ir viešą Google nuorodą.</span></div></li>
      </ul>
    </section>

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

    <section className="od-section od-faq">
      <span className="od-eyebrow">Dažni klausimai</span>
      <h2>Prieš pradedant</h2>
      <details><summary>Ar klientams reikia programėlės?</summary><p>Ne. Puslapis atsidaro telefone nuskenavus QR kodą arba paspaudus nuorodą SMS ar el. laiške.</p></details>
      <details><summary>Kiek laiko užtrunka pradėti?</summary><p>Apie minutę: puslapis, QR kodas ir Google nuoroda jau paruošti. Liko sugalvoti slaptažodį.</p></details>
      <details><summary>Kas mato privačias pastabas?</summary><p>Tik Jūs – savo valdymo skydelyje ir el. pašte. Niekur viešai jos neskelbiamos.</p></details>
      <details><summary>Ar klientas vis tiek gali parašyti Google?</summary><p>Taip, visada. Sistema tik paprašo atsiliepimo tinkamu momentu ir duoda galimybę pirmiausia parašyti Jums.</p></details>
      <details><summary>Kas bus po 14 dienų?</summary><p>Nieko automatiškai neapmokestiname. Jei sistema patiks, pasiūlysime planą nuo 29 €/mėn., be ilgalaikių sutarčių.</p></details>
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

    {/* Verslomatika site footer */}
    <footer className="vm-footer">
      <div className="vm-footer-inner">
        <div className="vm-footer-brand">
          <a href="https://verslomatika.lt/" className="vm-brand vm-brand-light">
            <svg width="28" height="28" viewBox="0 0 34 34" aria-hidden="true">
              <path d="M1.8 7.5h9.4l6.2 18.6-2.5 5H9.7z" fill="#8c72ea"/>
              <path d="M13 5h9.6l5.4 15.7h-9.5z" fill="#6545ca"/>
              <path d="M22.5 1.8h7.4l2.9 8.2h-7.3z" fill="#b8a6ff"/>
            </svg>
            <strong>Verslomatika</strong>
          </a>
          <p>Verslo procesų automatizavimas ir augimo įrankiai Lietuvos įmonėms.</p>
          <a href="mailto:info@pinet.lt">info@pinet.lt</a>
        </div>
        <div className="vm-footer-col"><b>Produktai</b>
          <a href="https://verslomatika.lt/reputacija/">ReputationPro</a>
          <a href="https://verslomatika.lt/verslo-augimo-irankiai/">Verslo augimo įrankiai</a>
          <a href="https://verslomatika.lt/agentai/">Agentai</a>
        </div>
        <div className="vm-footer-col"><b>Įmonė</b>
          <a href="https://verslomatika.lt/sprendimai/">Sprendimai</a>
          <a href="https://verslomatika.lt/apie-mus/">Apie mus</a>
          <a href="https://verslomatika.lt/kontaktai/">Kontaktai</a>
        </div>
        <div className="vm-footer-col"><b>Informacija</b>
          <a href="https://verslomatika.lt/privatumas/">Privatumas</a>
          <a href="https://verslomatika.lt/salygos/">Naudojimo sąlygos</a>
        </div>
      </div>
      <div className="vm-footer-bottom">© {new Date().getFullYear()} Verslomatika · MB Pinet, įm. k. 306067365. Šiame demonstraciniame puslapyje įvesti duomenys niekur nesaugomi ir niekam nesiunčiami.</div>
    </footer>

    <div className="od-mobile-cta"><a className="btn btn-primary btn-full" href={p.claimHref}>{p.personal ? 'Aktyvuoti nemokamai' : 'Išbandyti nemokamai'} <ArrowRight size={16}/></a></div>
  </div>;
}

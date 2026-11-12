'use client';
// "Owner mode" of /r/{slug} for pre-provisioned outbound leads (clients.is_demo=1).
// Goal: in ~30 seconds the business owner sees both sides at once – what their customer
// sees on the phone (left) and what lands in their own inbox the same second (right) –
// and can activate with one click. Nothing typed here is stored or emailed.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BatteryFull, CheckCircle2, Clock, HeartHandshake, Lock, MapPinned, MessageSquareWarning, PhoneCall, QrCode, Send, ShieldCheck, Signal, Sprout, Star, TrendingUp, Wifi } from 'lucide-react';
import { reviewPlatform } from '@/lib/review-platforms';
import { ReviewGate, type DemoEvent, type GateControl } from './review-gate';
import { HeroMotion, type DemoMessage, type Stage } from './hero-motion';
import { USAGE_SCENES, GoodPathArt, CarePathArt } from './usage-scenes';
import { VmFooter, VmHeader } from './vm-chrome';

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
  /** Shown in the sample notification email ("Kam: …"); only for the personal (token) demo. */
  ownerEmail?: string | null;
  /** Etapas N: all locations of the company (main profile first) – one offer for every branch. */
  branches?: { slug: string; name: string; label: string }[];
  accountName?: string;
  tokenQuery?: string;
};

type DemoTrackEvent = 'star_good' | 'star_care' | 'private_sent' | 'public_open' | 'tab' | 'ghost_done' | 'cta';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Sample complaint typed into the phone after 1–3★ (clearly fictional, matches the business type).
function complaintFor(industry: string) {
  const i = (industry || '').toLowerCase();
  const text = ['clinic', 'dental', 'odontologija', 'veterinarija', 'beauty'].includes(i)
    ? 'Ilgai laukiau registratūroje, nors buvau užsiregistravęs. Norėčiau, kad apie vėlavimą praneštų iš anksto.'
    : ['ecommerce', 'ecom', 'baldai', 'dovanos'].includes(i)
      ? 'Siuntinys vėlavo 3 dienas ir niekas apie tai nepranešė. Prekė gera, bet norėtųsi daugiau informacijos.'
      : ['horeca', 'restoranai'].includes(i)
        ? 'Patiekalo laukėme beveik valandą, o padavėjas nepasakė, kad vėluoja virtuvė.'
        : ['auto', 'autoservisai'].includes(i)
          ? 'Automobilį grąžino diena vėliau nei žadėjo ir niekas nepaskambino.'
          : 'Ilgai teko laukti atsakymo ir niekas nepaaiškino, kodėl vėluojama.';
  return { text, name: 'Rūta', phone: '+370 600 00000' };
}

// Owner decision 2026-11-11: always "klientai" – the same page is sent to every kind of business.
function audience(_industry: string) {
  return { one: 'klientas', many: 'klientai', gen: 'kliento', dat: 'klientui', genPl: 'klientų' };
}

const fmt = (n: number) => n.toLocaleString('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Lithuanian number agreement (same rules as core/email_copy.py): 10–20 and round tens take the genitive plural.
// Lithuanian: 1/21 atsiliepimas, 2–9/22 atsiliepimai, 10–20/30 atsiliepimų.
const reviewsWord = (n: number) => n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19) ? 'atsiliepimų' : n % 10 === 1 ? 'atsiliepimas' : 'atsiliepimai';
const genPl = (n: number) => n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19);
const ofReviews = (n: number) => `iš ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'atsiliepimo' : 'atsiliepimų'}`;
const satisfiedClients = (n: number) => genPl(n) ? `${n} patenkintų klientų` : `${n} patenkinti klientai`;

export function OwnerDemo(p: Props) {
  const who = audience(p.industry);
  const [resetKey, setResetKey] = useState(0);
  const appHost = p.pageUrl.replace(/^https?:\/\//, '').split('/')[0];
  const restart = () => setResetKey((k) => k + 1);
  // Etapas R: businesses without a Google profile collect reviews on Rekvizitai.lt until they create one.
  const rk = reviewPlatform(p.googleUrl) === 'rekvizitai';
  const P = rk ? 'Rekvizitai.lt' : 'Google';
  const target = rk ? 'Rekvizitai.lt atsiliepimų puslapį' : 'Google atsiliepimų formą';
  const guideHref = `/google-profilis?imone=${encodeURIComponent(p.slug)}`;

  // Honest projection for 3 months. The monthly pace scales with the business's current
  // Google volume, so a small shop is not promised the pace of a busy clinic.
  const monthly = !p.googleReviews ? 0 : p.googleReviews >= 150 ? 15 : p.googleReviews >= 40 ? 8 : 5;
  const added = monthly * 3;
  const projection = p.googleRating && p.googleReviews
    ? { reviews: p.googleReviews + added, rating: Math.min(5, (p.googleRating * p.googleReviews + 5 * added) / (p.googleReviews + added)) }
    : null;

  // ---- Hero orchestration (ROADMAP Etapas H): the real phone is the single focal point,
  // the "Kas vyksta toliau" panel reacts to it. Nothing here is stored or emailed.
  const control = useRef<GateControl | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState<DemoMessage | null>(null);
  const [publicOpened, setPublicOpened] = useState(false);
  const [seen, setSeen] = useState({ good: false, care: false });
  const [nudge, setNudge] = useState(false);
  const [ghost, setGhost] = useState<{ x: number; y: number; tap: boolean } | null>(null);
  const [ghostRunning, setGhostRunning] = useState(false);
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const acted = useRef(false), ghostDone = useRef(false), run = useRef(0), ghostOn = useRef(false);
  const sample = complaintFor(p.industry);
  const multi = (p.branches?.length ?? 0) > 1;
  const ctaLabel = p.personal ? (multi ? 'Aktyvuoti visus filialus' : 'Aktyvuoti nemokamai') : 'Išbandyti nemokamai';

  const track = useCallback((event: DemoTrackEvent) => {
    fetch('/api/track/demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: p.slug, event }), keepalive: true }).catch(() => undefined);
  }, [p.slug]);

  const resetPhone = useCallback(() => {
    setResetKey((k) => k + 1); setStage('idle'); setMessage(null); setTyping(false); setPublicOpened(false);
  }, []);

  const stopGhost = useCallback((byVisitor: boolean) => {
    if (byVisitor) acted.current = true;
    if (ghostOn.current) control.current?.stop();
    run.current++; ghostOn.current = false;
    setGhost(null); setGhostRunning(false); setNudge(false);
  }, []);

  const onGate = useCallback((e: DemoEvent) => {
    if (e.kind === 'rating') {
      setNudge(false); setMessage(null); setTyping(false); setPublicOpened(false);
      setStage(e.rating >= 4 ? 'good' : 'care');
      if (e.rating >= 4) setSeen((s) => ({ ...s, good: true }));
      if (!e.auto) {
        stopGhost(true);
        track(e.rating >= 4 ? 'star_good' : 'star_care');
        // Owner's idea (2026-11-11): after 1–3★ the complaint types itself and is "sent",
        // so the panel can show the email arriving. Touching the form takes over.
        if (e.rating <= 3) setTimeout(() => { control.current?.fillAndSend(sample); }, 700);
      }
    } else if (e.kind === 'typing') {
      setTyping(true);
    } else if (e.kind === 'private') {
      setTyping(false);
      setMessage({ rating: e.rating, text: e.text, name: e.name, phone: e.phone });
      setSeen((s) => ({ ...s, care: true }));
      if (!ghostOn.current) track('private_sent');
    } else if (e.kind === 'public_click') {
      setPublicOpened(true); stopGhost(true); track('public_open');
    }
  }, [sample, stopGhost, track]);

  // Automatic demonstration: a touch dot taps 5★, then 2★ (the complaint types itself), once.
  const runGhost = useCallback(async () => {
    const id = ++run.current; const alive = () => run.current === id;
    ghostOn.current = true; setGhostRunning(true); setNudge(false);
    const tap = async (n: number) => {
      const phone = phoneRef.current, star = phone?.querySelector(`.rating-stars [data-star="${n}"]`);
      if (!phone || !star) return false;
      const pr = phone.getBoundingClientRect(), sr = star.getBoundingClientRect();
      const x = sr.left - pr.left + sr.width / 2, y = sr.top - pr.top + sr.height / 2;
      setGhost({ x: pr.width * 0.78, y: pr.height * 0.82, tap: false }); await sleep(60);
      setGhost({ x, y, tap: false }); await sleep(950); if (!alive()) return false;
      setGhost({ x, y, tap: true }); await sleep(220);
      await control.current?.rate(n);
      await sleep(450); if (!alive()) return false;
      setGhost(null);
      return true;
    };
    resetPhone(); await sleep(450); if (!alive()) return;
    if (!await tap(5)) return;
    await sleep(5200); if (!alive()) return;
    resetPhone(); await sleep(450); if (!alive()) return;
    if (!await tap(2)) return;
    await sleep(500);
    const ok = await control.current?.fillAndSend(sample);
    if (!alive() || !ok) return;
    await sleep(5600); if (!alive()) return;
    ghostDone.current = true; ghostOn.current = false; setGhostRunning(false);
    resetPhone(); track('ghost_done');
  }, [resetPhone, sample, track]);

  // Nudge after ~2.5 s in view, demonstrate after ~9 s, only if the visitor has not acted.
  useEffect(() => {
    const el = phoneRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t1: ReturnType<typeof setTimeout> | undefined, t2: ReturnType<typeof setTimeout> | undefined, inView = false;
    const io = new IntersectionObserver(([entry]) => {
      const now = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (now === inView) return;
      inView = now; clearTimeout(t1); clearTimeout(t2);
      if (!now || acted.current || ghostDone.current || ghostOn.current) { if (!ghostOn.current) setNudge(false); return; }
      t1 = setTimeout(() => { if (!acted.current && !ghostOn.current) setNudge(true); }, 2500);
      t2 = setTimeout(() => { if (!acted.current && !ghostDone.current && !ghostOn.current) runGhost(); }, 9000);
    }, { threshold: [0, 0.5, 1] });
    io.observe(el);
    // Any real tap or key press stops the demonstration and leaves the page to the visitor.
    const stop = (e: Event) => { if (e.isTrusted && ghostOn.current) stopGhost(true); };
    document.addEventListener('pointerdown', stop, true);
    document.addEventListener('keydown', stop, true);
    return () => { io.disconnect(); clearTimeout(t1); clearTimeout(t2); document.removeEventListener('pointerdown', stop, true); document.removeEventListener('keydown', stop, true); };
  }, [runGhost, stopGhost]);

  // The nudge bubble points at the stars wherever they are on this phone size.
  useEffect(() => {
    if (!nudge) { setTipPos(null); return; }
    const phone = phoneRef.current, star = phone?.querySelector('.rating-stars [data-star="3"]');
    if (!phone || !star) return;
    const pr = phone.getBoundingClientRect(), sr = star.getBoundingClientRect();
    setTipPos({ x: sr.left - pr.left + sr.width / 2, y: sr.top - pr.top - 12 });
  }, [nudge]);

  // Panel buttons drive the phone, so the phone and the panel always tell the same story.
  const onShow = useCallback(async (n: 0 | 5 | 2) => {
    stopGhost(true); track('tab'); resetPhone();
    if (n === 0) return;
    await sleep(380);
    await control.current?.rate(n);
    if (n <= 3) { await sleep(600); control.current?.fillAndSend(sample); }
  }, [resetPhone, sample, stopGhost, track]);

  return <div className="od-shell">
    {/* Verslomatika site header (same brand and menu as verslomatika.lt) */}
    <VmHeader cta={{ href: p.claimHref, label: ctaLabel }}/>

    <section className="odh">
      <div className="odh-text">
        <span className="od-greeting">{multi
          ? `Sveiki, ${p.accountName || p.name}! Paruošėme puslapius visiems ${p.branches!.length} Jūsų filialams.`
          : p.personal ? `Sveiki, ${p.name}! Tai Jūsų jau paruoštas atsiliepimų puslapis.` : `Pavyzdinis „${p.name}“ atsiliepimų puslapis`}</span>
        {multi && <nav className="od-branches" aria-label="Jūsų filialai">
          {p.branches!.map((b) => <a key={b.slug} href={`/r/${encodeURIComponent(b.slug)}${p.tokenQuery || ''}`} className={b.slug === p.slug ? 'is-on' : ''} aria-current={b.slug === p.slug ? 'page' : undefined}>
            {b.label || b.name}</a>)}
        </nav>}
        <h1>{rk ? 'Daugiau gerų atsiliepimų' : 'Daugiau 5★ atsiliepimų'} <span>{p.name}</span></h1>
        <p className="odh-sub">Patenkinti {who.many} palieka atsiliepimą {P}, o pastabos pirmiausia ateina Jūsų komandai. <b>Išbandykite telefone:</b> paspauskite žvaigždutę.</p>
        {rk
          ? <span className="odh-chip is-warn"><MapPinned size={15}/> Google žemėlapiuose Jūsų dar nėra: pradėsime nuo Rekvizitai.lt</span>
          : p.googleRating && p.googleReviews
            ? <span className="odh-chip"><Star size={15} fill="currentColor" strokeWidth={0}/> Google šiandien: <b>{fmt(p.googleRating)}★</b> · {p.googleReviews} {reviewsWord(p.googleReviews)}</span>
            : null}
        <div className="odh-cta-row">
          <a className="btn btn-primary" href={p.claimHref} onClick={() => track('cta')}>{ctaLabel} <ArrowRight size={18}/></a>
          <ul className="odh-trust">
            <li><CheckCircle2 size={15}/> 14 d. nemokamai</li>
            <li><CheckCircle2 size={15}/> Be banko kortelės</li>
            <li><CheckCircle2 size={15}/> Nemokamas QR + NFC stovelis</li>
          </ul>
        </div>
      </div>

      <div className="odh-phone">
        <div ref={phoneRef} className={`od-phone${nudge ? ' od-nudge' : ''}`} aria-label={`${p.name} atsiliepimų puslapis kliento telefone`}>
          <div className="od-phone-screen">
            <div className="od-phone-island"/>
            <div className="od-phone-status" aria-hidden="true"><span>9:41</span><span className="od-phone-icons"><Signal size={13}/><Wifi size={13}/><BatteryFull size={17}/></span></div>
            <div className="od-phone-url" aria-hidden="true"><Lock size={11}/> {appHost}</div>
            <div className="od-phone-scroll">
              <ReviewGate key={resetKey} slug={p.slug} name={p.name} googleUrl={p.googleUrl} showPublicLow={p.showPublicLow} mode="demo" embedded
                control={control} onDemoEvent={onGate} highlightPublic={stage === 'good' && !publicOpened}/>
            </div>
            <div className="od-phone-home" aria-hidden="true"/>
          </div>
          {nudge && <span className="od-tip" style={tipPos ? { left: tipPos.x, top: tipPos.y } : undefined} aria-hidden="true">Paspauskite žvaigždutę</span>}
          {ghost && <span className={`od-ghost${ghost.tap ? ' is-tap' : ''}`} style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)` }} aria-hidden="true"/>}
        </div>
        <p className="odh-phone-tools">
          <button type="button" onClick={() => { stopGhost(true); resetPhone(); }}>Iš naujo</button>
          <button type="button" className="odh-next-link" onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Kas vyksta toliau ↓</button>
        </p>
      </div>

      <div className="odh-panel" ref={panelRef}>
        <HeroMotion stage={stage} name={p.name} platform={rk ? 'rekvizitai' : 'google'} industry={p.industry}
          googleRating={p.googleRating} googleReviews={p.googleReviews} showPublicLow={p.showPublicLow}
          typing={typing} message={message} publicOpened={publicOpened} seen={seen}
          ownerEmail={p.ownerEmail ?? null} claimHref={p.claimHref} ctaLabel={ctaLabel} ghost={ghostRunning}
          onShow={onShow} onCta={() => track('cta')}/>
      </div>
    </section>

    {/* Why it matters: the problem in one glance */}
    <section className="od-section od-why">
      <span className="od-eyebrow">Kodėl tai svarbu</span>
      <h2>Patenkinti {who.many} tyli. Nepatenkinti – rašo.</h2>
      <div className="od-why-grid">
        <div className="od-why-card"><b>Pirmas žvilgsnis</b><p>renkantis paslaugų teikėją dažniausiai krenta į {rk ? 'įvertinimus ir atsiliepimus internete' : 'Google reitingą ir atsiliepimų skaičių'}.</p></div>
        <div className="od-why-card"><b>Tylūs</b><p>patenkinti {who.many} retai patys sugalvoja parašyti atsiliepimą – jų tiesiog niekas nepaprašo.</p></div>
        <div className="od-why-card"><b>Garsūs</b><p>nusivylę rašo dažniau, todėl Jūsų {rk ? 'viešas' : 'Google'} reitingas atspindi ne tikrą darbo kokybę.</p></div>
      </div>
    </section>

    {/* How it works: two paths */}
    <section className="od-section od-how">
      <span className="od-eyebrow">Kaip veikia</span>
      <h2>Vienas puslapis – du keliai</h2>
      <div className="od-how-grid">
        <div className="od-how-card od-how-good">
          <div className="od-how-art"><GoodPathArt platform={P}/></div>
          <span className="od-how-badge">4–5 ★</span>
          <h3>{rk ? 'Daugiau gerų atsiliepimų Rekvizitai.lt' : 'Daugiau 5★ atsiliepimų Google'}</h3>
          <p>Patenkintam {who.dat} padėkojame ir vienu mygtuku nukreipiame į Jūsų {target}. Užtrunka {rk ? 'apie minutę, registruotis nereikia' : 'mažiau nei minutę'}.</p>
        </div>
        <div className="od-how-card od-how-care">
          <div className="od-how-art"><CarePathArt/></div>
          <span className="od-how-badge">1–3 ★</span>
          <h3>Pastabos pirmiausia ateina Jūsų komandai</h3>
          <p>{who.one.charAt(0).toUpperCase() + who.one.slice(1)} gali parašyti tiesiai Jums. Žinutė ir el. laiškas komandą pasiekia iškart: darbuotojas gali paskambinti ir išspręsti situaciją.</p>
        </div>
      </div>
    </section>

    {/* Less stress for the staff (owner decision 2026-11-11, ROADMAP K4): the team, not "the boss" */}
    <section className="od-section od-staff">
      <span className="od-eyebrow">Jūsų komandai</span>
      <h2>Mažiau streso Jūsų darbuotojams</h2>
      <p className="od-staff-lead">Kiekvienas kartais suklysta, ypač naujas darbuotojas. Nusivylęs {who.one} pirmiausia gali parašyti Jūsų komandai, o ne {P}, todėl darbuotojas turi progą viską ištaisyti, kol {who.one} skubotai neparašė viešai.</p>
      <ol className="od-staff-flow" aria-label="Kaip pastaba virsta išspręsta situacija">
        <li className="is-care"><span className="od-staff-dot"><MessageSquareWarning size={20}/></span><b>Pastaba komandai</b><small>2★ ir keli žodžiai, ne viešas įrašas</small></li>
        <li className="is-call"><span className="od-staff-dot"><PhoneCall size={20}/></span><b>Darbuotojas paskambina</b><small>Tą pačią dieną, ramiai, be viešo spaudimo</small></li>
        <li className="is-fixed"><span className="od-staff-dot"><CheckCircle2 size={20}/></span><b>Problema išspręsta</b><small>{who.one.charAt(0).toUpperCase() + who.one.slice(1)} jaučiasi išgirstas</small></li>
        <li className="is-good"><span className="od-staff-dot"><Star size={20} fill="currentColor" strokeWidth={0}/></span><b>Gera rekomendacija</b><small>Greitai išspręsta problema dažnai virsta padėka</small></li>
      </ol>
      <div className="od-staff-grid">
        <div className="od-staff-card"><ShieldCheck size={22}/><b>Klaida – ne viešas skandalas</b><p>Vienas nesusipratimas tampa žinute Jūsų komandai, o ne 1★ įrašu, kuris kabo internete metų metus.</p></div>
        <div className="od-staff-card"><Clock size={22}/><b>Išspręskite tą pačią dieną</b><p>Pastaba ateina el. paštu iškart: darbuotojas gali paskambinti, atsiprašyti ir pasiūlyti sprendimą.</p></div>
        <div className="od-staff-card"><Sprout size={22}/><b>Ramiau naujiems darbuotojams</b><p>Nauji žmonės mokosi iš pastabų ramiai, be baimės būti viešai sukritikuoti.</p></div>
        <div className="od-staff-card"><HeartHandshake size={22}/><b>Padėkas mato visa komanda</b><p>Gerus atsiliepimus galite parodyti komandai: tai motyvuoja labiau nei bet kokia instrukcija.</p></div>
      </div>
      <p className="od-staff-fine">{who.one.charAt(0).toUpperCase() + who.one.slice(1)} visada gali parašyti ir viešai. Sistema tik suteikia progą išspręsti pirmiems.</p>
    </section>

    {/* What you get */}
    <section className="od-section od-get">
      <span className="od-eyebrow">Ką gaunate</span>
      <h2>Viskas paruošta – tereikia pasidalinti nuoroda</h2>
      <ul className="od-get-list">
        <li><CheckCircle2 size={18}/><div><b>Asmeninis atsiliepimų puslapis</b><span>Su Jūsų pavadinimu, veikia telefone be programėlių.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>QR kodas ir nuoroda</b><span>Registratūrai, kasai, sąskaitoms, SMS ar el. laiškams po vizito.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Nemokamas QR + NFC stovelis</b><span>Aktyvavę nurodote adresą skydelyje, o mes atsiunčiame stovelį kasai ar registratūrai.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Pastaba iškart Jūsų komandai</b><span>El. laiškas su kontaktu registratūrai, administratoriui ar vadovui (iki 3 adresų).</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Valdymo skydelis</b><span>Visos pastabos, įvertinimai ir paruošti tekstai klientams vienoje vietoje.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Lietuviškai ir paprastai</b><span>Nereikia jokių nustatymų – {P} nuoroda jau susieta.</span></div></li>
        <li><CheckCircle2 size={18}/><div><b>Jūsų sprendimas</b><span>Skydelyje pasirinksite, ar po žemo įvertinimo rodyti ir viešą {P} nuorodą.</span></div></li>
      </ul>
    </section>

    {rk && <section className="od-section od-gbp">
      <div className="od-gbp-icon"><MapPinned size={26}/></div>
      <div>
        <span className="od-eyebrow">Google žemėlapiai</span>
        <h2>Dar neturite Google profilio? Pradėsime be jo.</h2>
        <p>Kol kas geri atsiliepimai keliaus į Rekvizitai.lt, kur Jūsų įmonė jau turi profilį. Paruošėme paprastą instrukciją, kaip nemokamai susikurti Google verslo profilį. Kai jį turėsite, nuorodą įklijuosite skydelyje, ir tas pats QR kodas bei nuoroda ims vesti į Google.</p>
        <a className="btn btn-secondary" href={guideHref} target="_blank" rel="noopener noreferrer">Kaip susikurti Google profilį <ArrowRight size={16}/></a>
      </div>
    </section>}

    {projection && <section className="od-section od-numbers">
      <div><span className="od-kicker"><TrendingUp size={15}/> Jūsų Google profilis šiandien</span><strong>{fmt(p.googleRating!)}★</strong><small>{ofReviews(p.googleReviews!)}</small></div>
      <ArrowRight size={26} className="od-numbers-arrow"/>
      <div><span className="od-kicker">Po 3 mėn. (prognozė)</span><strong>{fmt(projection.rating)}★</strong><small>{ofReviews(projection.reviews)}</small></div>
      <p>Prognozė, jei kas mėnesį atsiliepimą paliktų tik {satisfiedClients(monthly)}. Daugiau atsiliepimų reiškia didesnį pasitikėjimą tų, kurie Jus renkasi Google Maps.</p>
    </section>}

    <section className="od-section od-steps">
      <h2>Pradėti paprasta</h2>
      <ol>
        <li><span>1</span><div><b>Aktyvuokite (1 min.)</b><p>Puslapis, QR kodas ir {P} nuoroda jau paruošti. Liko sugalvoti slaptažodį.</p></div></li>
        <li><span>2</span><div><b>Pasidalinkite nuoroda</b><p>Pastatykite QR prie kasos ar registratūros arba nusiųskite nuorodą SMS ar el. laišku po apsilankymo.</p></div></li>
        <li><span>3</span><div><b>Gaukite atsiliepimus</b><p>Patenkinti {who.many} rašo {P}, o pastabos ateina Jums, kol dar galite jas išspręsti.</p></div></li>
      </ol>
    </section>

    {/* Where the QR / link works: personalized vector scenes with the business's real QR */}
    <section className="od-section od-uses">
      <span className="od-eyebrow">Naudokite visur</span>
      <h2>Jūsų QR kodas ir nuoroda jau paruošti</h2>
      <p className="od-uses-lead">Tas pats kodas tinka bet kur, kur bendraujate su klientais. Žemiau – tikras <b>{p.name}</b> QR kodas.</p>
      <div className="od-uses-grid">
        {USAGE_SCENES.map(({ key, title, text, Scene }) => <figure key={key} className="od-use">
          <div className="od-use-art"><Scene qr={p.qr} name={p.name} platform={rk ? '' : 'Google'}/></div>
          <figcaption><b>{title}</b><span>{text}</span></figcaption>
        </figure>)}
      </div>
      <p className="od-uses-fit">Tinka klinikoms, salonams, autoservisams, el. parduotuvėms, restoranams, viešbučiams ir visiems, kam svarbūs atsiliepimai internete.</p>
      <code className="od-uses-url">{p.pageUrl.replace(/^https?:\/\//, '')}</code>
    </section>

    <section className="od-section od-faq">
      <span className="od-eyebrow">Dažni klausimai</span>
      <h2>Prieš pradedant</h2>
      <details><summary>Ar klientams reikia programėlės?</summary><p>Ne. Puslapis atsidaro telefone nuskenavus QR kodą arba paspaudus nuorodą SMS ar el. laiške.</p></details>
      <details><summary>Kiek laiko užtrunka pradėti?</summary><p>Apie minutę: puslapis, QR kodas ir {P} nuoroda jau paruošti. Liko sugalvoti slaptažodį.</p></details>
      <details><summary>Kas mato privačias pastabas?</summary><p>Tik Jūsų komanda: el. pašto adresai, kuriuos nurodysite (iki 3), ir valdymo skydelis. Niekur viešai jos neskelbiamos.</p></details>
      <details><summary>Ar darbuotojai nebijos šios sistemos?</summary><p>Priešingai. Pastaba pirmiausia ateina komandai, todėl darbuotojas gali pats išspręsti situaciją, kol klientas neparašė viešai. Pranešimus gali gauti ir registratūra ar administratorius, ne tik vadovas.</p></details>
      {rk && <details><summary>Kodėl Rekvizitai.lt, o ne Google?</summary><p>Jūsų įmonė dar neturi Google verslo profilio. Kol jį susikursite, gerus atsiliepimus kaupsite Rekvizitai.lt, kur jie jau matomi ieškantiems. Susikūrę Google profilį (<a href={guideHref} target="_blank" rel="noopener noreferrer">instrukcija</a>), įklijuosite nuorodą skydelyje, ir puslapis ims vesti į Google.</p></details>}
      <details><summary>Ar stovelis tikrai nemokamas?</summary><p>Taip. Aktyvavę paskyrą skydelyje nurodote pristatymo adresą, ir QR + NFC stovelį atsiunčiame nemokamai.</p></details>
      <details><summary>Ar klientas vis tiek gali parašyti {P}?</summary><p>Taip, visada. Sistema tik paprašo atsiliepimo tinkamu momentu ir duoda galimybę pirmiausia parašyti Jums.</p></details>
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
    <VmFooter note="Šiame demonstraciniame puslapyje įvesti duomenys niekur nesaugomi ir niekam nesiunčiami."/>

    <div className="od-mobile-cta"><a className="btn btn-primary btn-full" href={p.claimHref}>{p.personal ? 'Aktyvuoti nemokamai' : 'Išbandyti nemokamai'} <ArrowRight size={16}/></a></div>
  </div>;
}

'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, ArrowLeft, ShieldCheck, Check, LoaderCircle, MessageSquare, Heart, Info } from 'lucide-react';
import { platformCopy } from '@/lib/review-platforms';

export type DemoEvent =
  | { kind: 'rating'; rating: number; auto: boolean }
  | { kind: 'typing' }
  | { kind: 'private'; rating: number; text: string; name: string; phone: string; auto: boolean }
  | { kind: 'public_click' };

/** Owner demo drives the phone (automatic demonstration, panel buttons, auto-filled complaint). */
export type GateControl = {
  rate: (n: number) => Promise<void>;
  /** Types the sample into the private form, ticks consent and presses "send". false = the visitor took over. */
  fillAndSend: (sample: { text: string; name: string; phone: string }) => Promise<boolean>;
  /** Stops any automation (the visitor started doing it themselves). */
  stop: () => void;
};

type Props = {
  slug: string;
  name: string;
  /** Public review destination: Google, or Rekvizitai.lt for businesses without a Google profile (copy adapts). */
  googleUrl: string;
  /** Owner's choice (dashboard setting `show_public_link_low`): show the public review link after 1–3★. */
  showPublicLow: boolean;
  /** Sharing channel from the link (?s=kvitas …), stored with the rating to show which channel works. */
  source?: string | null;
  /** 'demo' = prospect exploring their prepared page: nothing leaves the page and no emails are sent. */
  mode?: 'live' | 'demo';
  /** Render only the card (used inside the owner demo's phone frame). */
  embedded?: boolean;
  onDemoEvent?: (event: DemoEvent) => void;
  /** Owner demo only: lets the page drive the phone. Content stays 1:1 with what customers see. */
  control?: { current: GateControl | null };
  /** Owner demo only: a soft glow on the public review button (no extra text inside the phone). */
  highlightPublic?: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ReviewGate({ slug, name, googleUrl, showPublicLow, source = null, mode = 'live', embedded = false, onDemoEvent, control, highlightPublic = false }: Props) {
  const demo = mode === 'demo';
  const [rating, setRating] = useState<number | null>(null), [hover, setHover] = useState(0), [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(''), [sent, setSent] = useState(false), [showForm, setShowForm] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const cardRef = useRef<HTMLElement>(null), optionsRef = useRef<HTMLElement>(null), formRef = useRef<HTMLFormElement>(null);
  const auto = useRef({ running: false, stopped: false, mounted: true });
  const ratingRef = useRef<number | null>(null); // current rating for the automation's closures

  // Inside the demo phone the screen scrolls on its own (like a real phone). Bring what just
  // appeared into view: the outcome/form after a star click, the top after sending.
  useEffect(() => {
    if (!embedded) return;
    const box = cardRef.current?.closest('.od-phone-scroll') as HTMLElement | null;
    if (!box) return;
    if (sent) { box.scrollTo({ top: 0 }); return; }
    const target = optionsRef.current;
    if (!target) return;
    const offset = target.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (offset > box.clientHeight * 0.45) box.scrollTo({ top: box.scrollTop + offset - 16 });
  }, [embedded, rating, showForm, sent]);

  async function choose(n: number, isAuto = false) {
    if (busy) return;
    if (!isAuto) auto.current.stopped = true;
    setProblem(''); setBusy(true);
    try {
      // Demo (owner exploring the prepared page, automatic demonstration): nothing is sent or stored.
      if (!demo) {
        const res = await fetch('/api/rating', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, rating: n, source: source || undefined }) });
        if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error); }
      }
      setRating(n); ratingRef.current = n;
      onDemoEvent?.({ kind: 'rating', rating: n, auto: isAuto });
      // 4–5★: a thank-you and a clear request with a button to the business's real Google review form.
      // No automatic redirect – the customer decides (same behaviour live, in preview and in the demo phone).
      setShowForm(n <= 3);
    } catch (e) { setProblem(e instanceof Error && e.message ? e.message : 'Nepavyko išsaugoti įvertinimo.'); }
    finally { setBusy(false); }
  }

  function deliver(f: HTMLFormElement, isAuto: boolean) {
    const rating = ratingRef.current;
    if (rating === null) return;
    const data = new FormData(f);
    const text = String(data.get('feedback_text') || ''), customerName = String(data.get('customer_name') || ''), phone = String(data.get('customer_phone') || '');
    // Demo: show the prospect what their inbox would receive, without storing or emailing anything.
    onDemoEvent?.({ kind: 'private', rating, text, name: customerName, phone, auto: isAuto });
    setSent(true);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (rating === null) return;
    if (demo) { deliver(e.currentTarget, auto.current.running); return; }
    const f = new FormData(e.currentTarget);
    const text = String(f.get('feedback_text') || ''), customerName = String(f.get('customer_name') || ''), phone = String(f.get('customer_phone') || '');
    setBusy(true); setProblem('');
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, rating, submission_id: submissionId, feedback_text: text, customer_name: customerName, customer_phone: phone, consent: f.get('consent') === 'on', website: f.get('website') || '' }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error); setSent(true);
    } catch (err) { setProblem(err instanceof Error ? err.message : 'Nepavyko pateikti žinutės.'); }
    finally { setBusy(false); }
  }

  // Scroll an element into view inside the phone screen only (never the page itself).
  function reveal(el: Element | null) {
    const box = cardRef.current?.closest('.od-phone-scroll') as HTMLElement | null;
    if (!box || !el) return;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.bottom > b.bottom - 24 || r.top < b.top) box.scrollTo({ top: box.scrollTop + (r.top - b.top) - b.height * 0.35 });
  }

  // Imperative control for the owner demo (only registered in demo mode).
  useEffect(() => {
    if (!demo || !control) return;
    auto.current.mounted = true;
    const alive = () => auto.current.mounted && !auto.current.stopped;
    control.current = {
      rate: async (n) => { auto.current.stopped = false; await choose(n, true); },
      stop: () => { auto.current.stopped = true; },
      fillAndSend: async (sample) => {
        auto.current.stopped = false; auto.current.running = true;
        try {
          let f: HTMLFormElement | null = null;
          for (let i = 0; i < 40 && !(f = formRef.current); i++) await sleep(25);
          if (!f || !alive()) return false;
          // The visitor already started writing: leave the form to them.
          if ((f.querySelector('textarea') as HTMLTextAreaElement | null)?.value || f.contains(document.activeElement)) return false;
          onDemoEvent?.({ kind: 'typing' });
          const type = async (el: HTMLInputElement | HTMLTextAreaElement | null, text: string, ms: number) => {
            if (!el) return;
            reveal(el);
            for (let i = 1; i <= text.length; i++) { if (!alive()) return; el.value = text.slice(0, i); await sleep(ms); }
          };
          await sleep(350);
          await type(f.querySelector('textarea[name="feedback_text"]'), sample.text, 26);
          await type(f.querySelector('input[name="customer_name"]'), sample.name, 45);
          await type(f.querySelector('input[name="customer_phone"]'), sample.phone, 35);
          if (!alive()) return false;
          const consent = f.querySelector<HTMLInputElement>('input[name="consent"]');
          if (consent) { reveal(consent); await sleep(250); consent.checked = true; }
          const btn = f.querySelector('button[type="submit"]');
          reveal(btn); await sleep(500);
          if (!alive()) return false;
          setPressing(true); await sleep(260); setPressing(false);
          if (!alive()) return false;
          deliver(f, true);
          return true;
        } finally { auto.current.running = false; }
      },
    };
    return () => { auto.current.mounted = false; control.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, control]);

  // The visitor touching the form takes over from the automation.
  const takeOver = (e: React.SyntheticEvent) => { if (e.nativeEvent.isTrusted && auto.current.running) auto.current.stopped = true; };

  const copy = platformCopy(googleUrl);
  const publicLink = <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => onDemoEvent?.({ kind: 'public_click' })}>{copy.button} <ArrowUpRight size={14}/></a>;
  const monogram = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const card = <main ref={cardRef} id={embedded ? undefined : 'main'} className={embedded ? 'gate-card gate-card-embedded' : 'gate-card'}>
    <div className="clinic-monogram">{monogram}</div><p className="clinic-name">{name}</p>
    {sent ? <div className="gate-success" role="status">
      <span className="success-circle"><Check size={30}/></span>
      <h1>Ačiū, kad parašėte.</h1>
      <p>Jūsų žinutė perduota. Jei palikote telefono numerį, su Jumis susisieks.</p>
      <div className="private-note"><ShieldCheck size={17}/> Ši žinutė viešai neskelbiama.</div>
    </div> : <>
      <h1>Kaip vertinate savo patirtį?</h1>
      <p className="gate-description">Jūsų nuomonė mums svarbi. Skirkite akimirką ir įvertinkite.</p>
      <fieldset className="rating-fieldset"><legend className="sr-only">Įvertinkite patirtį nuo 1 iki 5 žvaigždučių</legend>
        <div className="rating-stars" onMouseLeave={() => setHover(0)}>{[1, 2, 3, 4, 5].map((n) =>
          <button type="button" key={n} disabled={busy} data-star={n} className={(hover || rating || 0) >= n ? 'selected' : ''} aria-label={`${n} ${n === 1 ? 'žvaigždutė' : 'žvaigždutės'}`} aria-pressed={rating === n} onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)} onClick={() => choose(n)}>
            <Star size={embedded ? 34 : 43} strokeWidth={1.4} fill={(hover || rating || 0) >= n ? 'currentColor' : 'none'}/>
          </button>)}
        </div>
        <div className="rating-scale"><span>Galime geriau</span><span>Puikiai</span></div>
      </fieldset>
      {rating !== null && <section ref={optionsRef} className="gate-options" aria-label="Kaip norėtumėte pasidalinti?">
        {rating >= 4 ? <div className="gate-positive">
          <span className="gate-positive-icon" aria-hidden="true"><Heart size={26} fill="currentColor" strokeWidth={0}/></span>
          <strong>Ačiū! Labai džiaugiamės.</strong>
          <span>{copy.ask}</span>
          <a className={`btn btn-primary btn-full gate-google-btn${highlightPublic ? ' gate-btn-glow' : ''}`} href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => onDemoEvent?.({ kind: 'public_click' })}><Star size={18} fill="currentColor" strokeWidth={0}/> {copy.button}</a>
          {copy.hint && <small className="gate-platform-hint"><Info size={14}/> {copy.hint}</small>}
          <button type="button" className="gate-secondary-link" onClick={() => setShowForm(!showForm)}><MessageSquare size={14}/> {showForm ? 'Uždaryti formą' : 'Arba parašyti mums asmeniškai'}</button>
        </div> : <div className="gate-negative">
          <strong><ShieldCheck size={18}/> Mums svarbu tai išspręsti</strong>
          <span>Apgailestaujame, kad patirtis nebuvo ideali. Parašykite mums – atsakingas darbuotojas susisieks ir padės išspręsti.</span>
        </div>}
        {showForm && <form ref={formRef} id="private-feedback" onSubmit={submit} onKeyDown={takeOver} onPointerDown={takeOver} className="feedback-form">
          <label htmlFor="feedback_text">Jūsų pastaba <span>(privaloma)</span></label>
          <textarea id="feedback_text" name="feedback_text" required minLength={10} maxLength={3000} rows={embedded ? 3 : 4} placeholder="Kas nutiko ir kaip galėtume pasitaisyti?"/>
          <small>Žinutę gaus įmonės komanda. Viešai ji neskelbiama.</small>
          <div className="form-row">
            <label>Vardas <span>(nebūtina)</span><input name="customer_name" autoComplete="given-name" maxLength={100} placeholder="Jūsų vardas"/></label>
            <label>Telefonas <span>(nebūtina)</span><input name="customer_phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+370"/></label>
          </div>
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
          <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>Sutinku, kad įmonės atstovas perskaitytų šią žinutę ir, jei palikau kontaktą, su manimi susisiektų. <Link href="/privacy">Apie duomenis</Link></span></label>
          <button disabled={busy} className={`btn btn-primary btn-full${pressing ? ' is-pressing' : ''}`} type="submit">{busy ? <LoaderCircle size={18} className="spin"/> : <MessageSquare size={18}/>} {busy ? 'Siunčiama…' : 'Siųsti žinutę'}</button>
        </form>}
        {rating <= 3 && showPublicLow && <p className="gate-public-link">Norite pasidalinti viešai? {publicLink}</p>}
      </section>}
      {problem && <p role="alert" className="form-error">{problem}</p>}
    </>}
    {sent && showPublicLow && <div className="google-option"><span>Norite pasidalinti viešai?</span>{publicLink}</div>}
  </main>;

  if (embedded) return card;
  return <div className="gate-shell">
    <div className="gate-top"><Link href="/" className="subtle-link"><ArrowLeft size={16}/> ReputationPro</Link></div>
    {card}
    <p className="gate-footer"><ShieldCheck size={14}/> Sukurta su ReputationPro</p>
  </div>;
}

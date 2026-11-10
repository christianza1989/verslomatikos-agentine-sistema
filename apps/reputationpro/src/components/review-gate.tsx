'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, ArrowLeft, ShieldCheck, Check, LoaderCircle, MessageSquare, Heart } from 'lucide-react';

export type DemoEvent =
  | { kind: 'rating'; rating: number }
  | { kind: 'private'; rating: number; text: string; name: string; phone: string };

type Props = {
  slug: string;
  name: string;
  googleUrl: string;
  /** Owner's choice (dashboard setting `show_public_link_low`): show the public Google link after 1–3★. */
  showPublicLow: boolean;
  /** 'demo' = prospect exploring their prepared page: nothing leaves the page and no emails are sent. */
  mode?: 'live' | 'demo';
  /** Render only the card (used inside the owner demo's phone frame). */
  embedded?: boolean;
  onDemoEvent?: (event: DemoEvent) => void;
};

export function ReviewGate({ slug, name, googleUrl, showPublicLow, mode = 'live', embedded = false, onDemoEvent }: Props) {
  const demo = mode === 'demo';
  const [rating, setRating] = useState<number | null>(null), [hover, setHover] = useState(0), [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(''), [sent, setSent] = useState(false), [showForm, setShowForm] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const cardRef = useRef<HTMLElement>(null), optionsRef = useRef<HTMLElement>(null);

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

  async function choose(n: number) {
    if (busy) return;
    setProblem(''); setBusy(true);
    try {
      const res = await fetch('/api/rating', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, rating: n }) });
      if (!res.ok && !demo) { const data = await res.json().catch(() => ({})); throw new Error(data.error); }
      setRating(n);
      onDemoEvent?.({ kind: 'rating', rating: n });
      // 4–5★: a thank-you and a clear request with a button to the business's real Google review form.
      // No automatic redirect – the customer decides (same behaviour live, in preview and in the demo phone).
      setShowForm(n <= 3);
    } catch (e) { setProblem(e instanceof Error && e.message ? e.message : 'Nepavyko išsaugoti įvertinimo.'); }
    finally { setBusy(false); }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (rating === null) return;
    const f = new FormData(e.currentTarget);
    const text = String(f.get('feedback_text') || ''), customerName = String(f.get('customer_name') || ''), phone = String(f.get('customer_phone') || '');
    if (demo) {
      // Demo: show the prospect what their inbox would receive, without storing or emailing anything.
      onDemoEvent?.({ kind: 'private', rating, text, name: customerName, phone });
      setSent(true);
      return;
    }
    setBusy(true); setProblem('');
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, rating, submission_id: submissionId, feedback_text: text, customer_name: customerName, customer_phone: phone, consent: f.get('consent') === 'on', website: f.get('website') || '' }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error); setSent(true);
    } catch (err) { setProblem(err instanceof Error ? err.message : 'Nepavyko pateikti žinutės.'); }
    finally { setBusy(false); }
  }

  const publicLink = <a href={googleUrl} target="_blank" rel="noopener noreferrer">Rašyti atsiliepimą Google <ArrowUpRight size={14}/></a>;
  const monogram = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const card = <main ref={cardRef} id={embedded ? undefined : 'main'} className={embedded ? 'gate-card gate-card-embedded' : 'gate-card'}>
    <div className="clinic-monogram">{monogram}</div><p className="clinic-name">{name}</p>
    {sent ? <div className="gate-success" role="status">
      <span className="success-circle"><Check size={30}/></span>
      <h1>Ačiū, kad parašėte.</h1>
      <p>Jūsų žinutė perduota vadovui. Jei palikote telefono numerį, su Jumis susisieks.</p>
      <div className="private-note"><ShieldCheck size={17}/> Ši žinutė viešai neskelbiama.</div>
    </div> : <>
      <h1>Kaip vertinate savo patirtį?</h1>
      <p className="gate-description">Jūsų nuomonė mums svarbi. Skirkite akimirką ir įvertinkite.</p>
      <fieldset className="rating-fieldset"><legend className="sr-only">Įvertinkite patirtį nuo 1 iki 5 žvaigždučių</legend>
        <div className="rating-stars" onMouseLeave={() => setHover(0)}>{[1, 2, 3, 4, 5].map((n) =>
          <button type="button" key={n} disabled={busy} className={(hover || rating || 0) >= n ? 'selected' : ''} aria-label={`${n} ${n === 1 ? 'žvaigždutė' : 'žvaigždutės'}`} aria-pressed={rating === n} onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)} onClick={() => choose(n)}>
            <Star size={embedded ? 34 : 43} strokeWidth={1.4} fill={(hover || rating || 0) >= n ? 'currentColor' : 'none'}/>
          </button>)}
        </div>
        <div className="rating-scale"><span>Galime geriau</span><span>Puikiai</span></div>
      </fieldset>
      {rating !== null && <section ref={optionsRef} className="gate-options" aria-label="Kaip norėtumėte pasidalinti?">
        {rating >= 4 ? <div className="gate-positive">
          <span className="gate-positive-icon" aria-hidden="true"><Heart size={26} fill="currentColor" strokeWidth={0}/></span>
          <strong>Ačiū! Labai džiaugiamės.</strong>
          <span>Ar galėtumėte pasidalinti savo patirtimi „Google“? Tai užtruks mažiau nei minutę, o Jūsų atsiliepimas padės kitiems mus atrasti.</span>
          <a className="btn btn-primary btn-full gate-google-btn" href={googleUrl} target="_blank" rel="noopener noreferrer"><Star size={18} fill="currentColor" strokeWidth={0}/> Rašyti atsiliepimą Google</a>
          <button type="button" className="gate-secondary-link" onClick={() => setShowForm(!showForm)}><MessageSquare size={14}/> {showForm ? 'Uždaryti formą' : 'Arba parašyti asmeninę žinutę vadovui'}</button>
        </div> : <div className="gate-negative">
          <strong><ShieldCheck size={18}/> Jūsų nuomonė svarbi vadovui</strong>
          <span>Apgailestaujame, kad patirtis nebuvo ideali. Parašykite tiesiai vadovui – jis galės asmeniškai išspręsti situaciją.</span>
        </div>}
        {showForm && <form id="private-feedback" onSubmit={submit} className="feedback-form">
          <label htmlFor="feedback_text">Jūsų pastaba <span>(privaloma)</span></label>
          <textarea id="feedback_text" name="feedback_text" required minLength={10} maxLength={3000} rows={embedded ? 3 : 4} placeholder="Kas nutiko ir kaip galėtume pasitaisyti?"/>
          <small>Žinutė bus perduota tiesiogiai įmonės vadovui.</small>
          <div className="form-row">
            <label>Vardas <span>(nebūtina)</span><input name="customer_name" autoComplete="given-name" maxLength={100} placeholder="Jūsų vardas"/></label>
            <label>Telefonas <span>(nebūtina)</span><input name="customer_phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+370"/></label>
          </div>
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
          <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>Sutinku, kad įmonės vadovas perskaitytų šią žinutę ir, jei palikau kontaktą, su manimi susisiektų. <Link href="/privacy">Apie duomenis</Link></span></label>
          <button disabled={busy} className="btn btn-primary btn-full" type="submit">{busy ? <LoaderCircle size={18} className="spin"/> : <MessageSquare size={18}/>} {busy ? 'Siunčiama…' : 'Siųsti tiesiai vadovui'}</button>
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

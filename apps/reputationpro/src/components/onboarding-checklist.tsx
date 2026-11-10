'use client';
// First-run checklist (id="onboarding"): the goal of the trial's first 72 hours is the
// first real customer rating. Steps 2–3 cannot be detected server-side, so they are
// remembered per browser (localStorage, best effort).
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Copy, Check, Download, Printer, ExternalLink, PartyPopper } from 'lucide-react';

type Local = { qr?: boolean; shared?: boolean };
const key = (slug: string) => `rp-onboarding-${slug}`;
function readLocal(slug: string): Local { try { return JSON.parse(localStorage.getItem(key(slug)) || '{}'); } catch { return {}; } }
function writeLocal(slug: string, v: Local) { try { localStorage.setItem(key(slug), JSON.stringify(v)); } catch { /* storage unavailable */ } }

function CopyButton({ text, onCopied, label }: { text: string; onCopied: () => void; label: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="btn btn-secondary btn-small" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); onCopied(); setTimeout(() => setDone(false), 2000); } catch { /* user can select manually */ }
  }}>{done ? <Check size={14}/> : <Copy size={14}/>} {done ? 'Nukopijuota' : label}</button>;
}

export function OnboardingChecklist({ slug, businessName, pageUrl, qr, googleOk, ratings }: {
  slug: string; businessName: string; pageUrl: string; qr: string; googleOk: boolean; ratings: number;
}) {
  const [local, setLocal] = useState<Local>({});
  useEffect(() => { setLocal(readLocal(slug)); }, [slug]);
  const mark = (patch: Local) => setLocal((cur) => { const next = { ...cur, ...patch }; writeLocal(slug, next); return next; });

  const sms = `Ačiū, kad apsilankėte ${businessName}! Būtume dėkingi už trumpą įvertinimą: ${pageUrl}`;
  const email = `Laba diena,\n\ndėkojame, kad pasirinkote ${businessName}. Būtume labai dėkingi, jei skirtumėte 10 sekundžių ir įvertintumėte savo patirtį:\n${pageUrl}\n\nPagarbiai,\n${businessName}`;

  const steps = [googleOk, !!local.qr, !!local.shared, ratings > 0];
  const done = steps.filter(Boolean).length;

  if (done === steps.length) {
    return <section id="onboarding" className="dashboard-panel onboarding onboarding-done">
      <PartyPopper size={20}/> <span><b>Pradžia baigta.</b> Puslapis veikia ir renka įvertinimus. Toliau tiesiog dalinkitės nuoroda po kiekvieno apsilankymo.</span>
    </section>;
  }

  const Icon = ({ ok }: { ok: boolean }) => ok ? <CheckCircle2 size={20} className="onb-ok"/> : <Circle size={20} className="onb-todo"/>;

  return <section id="onboarding" className="dashboard-panel onboarding">
    <div className="onb-head">
      <div><h2>Pirmi žingsniai</h2><p>Tikslas: pirmas tikras kliento įvertinimas per 3 dienas.</p></div>
      <div className="onb-progress" aria-label={`Atlikta ${done} iš ${steps.length}`}><i style={{ width: `${(done / steps.length) * 100}%` }}/><span>{done}/{steps.length}</span></div>
    </div>
    <ol className="onb-steps">
      <li className={googleOk ? 'is-done' : ''}><Icon ok={googleOk}/><div>
        <b>Patikrinkite Google nuorodą</b>
        <p>{googleOk ? 'Nuoroda atveria Jūsų Google atsiliepimų formą.' : 'Nuoroda dar neveda tiesiai į Jūsų atsiliepimų formą. Google verslo profilyje spauskite „Prašyti atsiliepimų“ ir įklijuokite nuorodą nustatymuose.'}</p>
        {!googleOk && <a className="btn btn-secondary btn-small" href="#settings">Atidaryti nustatymus</a>}
      </div></li>
      <li className={local.qr ? 'is-done' : ''}><Icon ok={!!local.qr}/><div>
        <b>Paruoškite QR kodą</b>
        <p>Pastatykite jį prie kasos ar registratūros, įdėkite į sąskaitas ar vizitines.</p>
        <div className="onb-actions">
          <a className="btn btn-secondary btn-small" href={qr} download={`${slug}-qr.png`} onClick={() => mark({ qr: true })}><Download size={14}/> Atsisiųsti QR</a>
          <a className="btn btn-secondary btn-small" href={`/admin/stand-print?slug=${encodeURIComponent(slug)}`} onClick={() => mark({ qr: true })}><Printer size={14}/> Spausdinti stovelį</a>
        </div>
      </div></li>
      <li className={local.shared ? 'is-done' : ''}><Icon ok={!!local.shared}/><div>
        <b>Nusiųskite nuorodą 10 paskutinių klientų</b>
        <p>Greičiausias būdas gauti pirmus atsiliepimus. Tekstai paruošti, belieka nukopijuoti:</p>
        <div className="onb-template"><code>{sms}</code><CopyButton text={sms} label="Kopijuoti SMS" onCopied={() => mark({ shared: true })}/></div>
        <div className="onb-template"><code>{email.split('\n').slice(0, 3).join(' ')}…</code><CopyButton text={email} label="Kopijuoti el. laišką" onCopied={() => mark({ shared: true })}/></div>
      </div></li>
      <li className={ratings > 0 ? 'is-done' : ''}><Icon ok={ratings > 0}/><div>
        <b>Gaukite pirmą įvertinimą</b>
        <p>{ratings > 0 ? `Jau gauta įvertinimų: ${ratings}.` : 'Kol kas laukiame. Pažiūrėkite, ką mato Jūsų klientai.'}</p>
        {ratings === 0 && <a className="btn btn-secondary btn-small" href={`/r/${slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Atverti mano puslapį</a>}
      </div></li>
    </ol>
  </section>;
}

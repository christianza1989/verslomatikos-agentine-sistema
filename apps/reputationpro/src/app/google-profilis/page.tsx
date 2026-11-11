import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Building2, Camera, CheckCircle2, ClipboardCopy, Info, MapPin, MapPinned, Phone, Search, ShieldAlert, Star, Users } from 'lucide-react';
import { getClient } from '@/lib/db';
import { VmFooter, VmHeader } from '@/components/vm-chrome';

// Public guide (ROADMAP R4): how a business without a Google profile creates one and then
// switches its ReputationPro page from Rekvizitai.lt to Google. Lives on the app host on
// purpose: verslomatika.lt is still answered by the old edge worker (AGENTS.md invariant 6).
// Steps checked against Google's help pages on 2026-11-11 (support.google.com/business
// answers 2911778, 7107242, 16816815). Re-check when Google changes its menus.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Kaip susikurti Google verslo profilį · ReputationPro',
  description: 'Paprasta instrukcija: nemokamas Google verslo profilis, patvirtinimas ir atsiliepimų nuoroda.',
};

function HeroArt() {
  return <svg viewBox="0 0 360 260" role="img" aria-label="Google žemėlapio kortelė su įmonės įvertinimu">
    <defs>
      <linearGradient id="gp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5f3ff"/><stop offset="1" stopColor="#e0e7ff"/></linearGradient>
      <linearGradient id="gp-brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7357ff"/><stop offset="1" stopColor="#4325d4"/></linearGradient>
      <filter id="gp-sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1e1b4b" floodOpacity=".18"/></filter>
    </defs>
    <rect width="360" height="260" rx="24" fill="url(#gp-bg)"/>
    <g opacity=".55" stroke="#c7d2fe" strokeWidth="10" strokeLinecap="round" fill="none">
      <path d="M-10 70 C 80 90, 140 40, 230 70 S 330 120, 380 90"/>
      <path d="M40 270 C 70 190, 130 170, 170 120 S 230 40, 260 -10"/>
      <path d="M-10 190 C 90 170, 220 210, 380 180"/>
    </g>
    <g fill="#ddd6fe" opacity=".8"><rect x="24" y="110" width="40" height="30" rx="5"/><rect x="292" y="26" width="44" height="34" rx="5"/><rect x="286" y="206" width="48" height="30" rx="5"/></g>
    <g filter="url(#gp-sh)">
      <path d="M180 34 c-26 0 -46 20 -46 45 c0 34 46 79 46 79 s46 -45 46 -79 c0 -25 -20 -45 -46 -45 z" fill="url(#gp-brand)"/>
      <circle cx="180" cy="79" r="17" fill="#fff"/>
      <text x="180" y="85" textAnchor="middle" fontSize="16" fill="#f59e0b">★</text>
    </g>
    <g filter="url(#gp-sh)">
      <rect x="70" y="160" width="220" height="74" rx="14" fill="#fff"/>
      <rect x="84" y="174" width="40" height="40" rx="10" fill="#ede9fe"/>
      <path d="M96 202 v-12 l8 -6 l8 6 v12 z" fill="#7357ff"/>
      <rect x="136" y="176" width="110" height="9" rx="4.5" fill="#312e81"/>
      <text x="136" y="203" fontSize="12" fill="#f59e0b">★★★★★</text>
      <rect x="206" y="194" width="40" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="136" y="212" width="80" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="252" y="200" width="26" height="22" rx="11" fill="#dcfce7"/>
      <path d="M259 211 l4 4 l8 -8" stroke="#16a34a" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>;
}

const STEPS = [
  { icon: Search, title: 'Atidarykite Google verslo profilį', body: <>Eikite į <a href="https://business.google.com/add" target="_blank" rel="noopener noreferrer">business.google.com/add</a> ir prisijunkite Google paskyra. Tinka ir paskyra, sukurta su įmonės el. paštu (ne Gmail). Spauskite „Pridėti įmonę prie „Google“.</> },
  { icon: Building2, title: 'Pavadinimas ir veiklos kategorija', body: <>Įrašykite tikrą įmonės ar prekės ženklo pavadinimą, tokį, kokį mato klientai, be papildomų raktažodžių. Pasirinkite artimiausią kategoriją, pvz. „Baldų parduotuvė“ ar „Odontologijos klinika“.</> },
  { icon: MapPin, title: 'Vieta arba aptarnavimo zona', body: <>Jei klientai atvyksta pas Jus, nurodykite adresą. Jei dirbate internetu ar pas klientą, pasirinkite aptarnavimo zoną (pvz. Vilnius ar visa Lietuva): tuomet adresas viešai nerodomas.</> },
  { icon: Phone, title: 'Kontaktai', body: <>Įveskite telefoną ir svetainę. Telefonas svarbus: juo Google gali siųsti patvirtinimo kodą.</> },
  { icon: BadgeCheck, title: 'Patvirtinkite, kad įmonė Jūsų', body: <>Google pats pasiūlys būdą: SMS ar skambutį, el. laišką, vaizdo įrašą, vaizdo skambutį arba atviruką su kodu. Būdo pakeisti negalima, bet jei siūlomi keli, rinkitės greičiausią. Peržiūra paprastai užtrunka iki 5 darbo dienų.</> },
  { icon: ClipboardCopy, title: 'Nukopijuokite atsiliepimų nuorodą', body: <>Kompiuteryje atidarykite <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">business.google.com</a> → „Skaityti apžvalgas“ → „Sulaukite daugiau apžvalgų“ → „Kopijuoti“. Šią nuorodą įklijuokite ReputationPro skydelyje (Nustatymai).</> },
];

export default async function GoogleProfileGuide({ searchParams }: { searchParams: Promise<{ imone?: string }> }) {
  const { imone } = await searchParams;
  const slug = typeof imone === 'string' && /^[a-z0-9-]{3,70}$/.test(imone) ? imone : null;
  const client = slug ? getClient(slug) : undefined;
  const name = client?.business_name;

  return <div className="od-shell gp">
    <VmHeader cta={{ href: '/admin#settings', label: 'Į skydelį' }}/>

    <section className="gp-hero">
      <div className="gp-hero-copy">
        <span className="od-eyebrow"><MapPinned size={14}/> Google žemėlapiai</span>
        <h1>{name ? <><span>{name}</span> Google žemėlapiuose</> : 'Kaip susikurti Google verslo profilį'}</h1>
        <p>{name ? 'Paprasta instrukcija, kaip nemokamai susikurti Google verslo profilį ir prijungti jį prie Jūsų atsiliepimų puslapio.' : 'Nemokama. Užpildyti užtrunka apie 15 minučių, o Google patvirtina per kelias darbo dienas.'}</p>
        <ul className="gp-hero-points">
          <li><CheckCircle2 size={17}/> Nemokamai, be jokių mokesčių Google</li>
          <li><CheckCircle2 size={17}/> Užpildymas apie 15 minučių</li>
          <li><CheckCircle2 size={17}/> Tas pats QR kodas ir nuoroda toliau veikia</li>
        </ul>
        <a className="btn btn-primary" href="https://business.google.com/add" target="_blank" rel="noopener noreferrer">Pradėti Google verslo profilyje <ArrowRight size={17}/></a>
      </div>
      <div className="gp-hero-art"><HeroArt/></div>
    </section>

    <section className="od-section gp-why">
      <span className="od-eyebrow">Kodėl verta</span>
      <h2>Klientai pirmiausia ieško Google</h2>
      <div className="od-why-grid">
        <div className="od-why-card"><b><Search size={16}/> Jus randa</b><p>ieškant „baldai Vilniuje“ ar Jūsų pavadinimo, profilis rodomas paieškoje ir žemėlapyje.</p></div>
        <div className="od-why-card"><b><Star size={16}/> Atsiliepimai matomi</b><p>įvertinimas ir atsiliepimai rodomi šalia Jūsų pavadinimo, dar prieš paspaudžiant ant svetainės.</p></div>
        <div className="od-why-card"><b><Users size={16}/> Konkurentai jau ten</b><p>be profilio žmogus žemėlapyje mato tik kitas įmones, net jei Jūs dirbate geriau.</p></div>
      </div>
    </section>

    <section className="od-section gp-steps">
      <span className="od-eyebrow">6 žingsniai</span>
      <h2>Kaip susikurti profilį</h2>
      <ol>
        {STEPS.map(({ icon: Icon, title, body }, i) => <li key={title}>
          <span className="gp-step-num">{i + 1}</span>
          <div className="gp-step-body"><h3><Icon size={18}/> {title}</h3><p>{body}</p></div>
        </li>)}
      </ol>
    </section>

    <section className="od-section gp-tips">
      <div className="gp-tip-card">
        <h3><Camera size={18}/> Jei Google paprašys vaizdo įrašo</h3>
        <ul>
          <li>Filmuokite vienu kartu, be montažo, telefono Google Maps programėle.</li>
          <li>Parodykite aplinką ar iškabą, darbo vietą ir kad valdote verslą (pvz. raktai, kasos aparatas, įrankiai).</li>
          <li>Venkite žmonių veidų ir asmeninių dokumentų.</li>
        </ul>
      </div>
      <div className="gp-tip-card gp-tip-warn">
        <h3><ShieldAlert size={18}/> Ko daryti nereikia</h3>
        <ul>
          <li>Nesiūlykite nuolaidų ar dovanų už atsiliepimus: Google tai draudžia.</li>
          <li>Neįrašykite raktažodžių į pavadinimą, pvz. „Baldai Vilnius pigiai“.</li>
          <li>Jei profilis jau yra (jį sukūrė kažkas kitas), nekurkite naujo: Google Maps atidarykite įmonę ir spauskite „Pareikšti teises į šią įmonę“.</li>
        </ul>
      </div>
    </section>

    <section className="od-section gp-switch">
      <div className="gp-switch-icon"><Info size={24}/></div>
      <div>
        <h2>Kas nutiks Jūsų atsiliepimų puslapyje?</h2>
        <p>Kol Google profilio nėra, patenkinti klientai nukreipiami į Rekvizitai.lt. Kai įklijuosite Google atsiliepimų nuorodą skydelyje, tas pats QR kodas, stovelis ir nuoroda nuo tos akimirkos ves į Google. Nieko perspausdinti nereikia.</p>
        <div className="gp-switch-actions">
          <a className="btn btn-primary" href="/admin#settings">Įklijuoti nuorodą skydelyje <ArrowRight size={16}/></a>
          <a className="btn btn-secondary" href={`mailto:tomas@verslomatika.lt?subject=${encodeURIComponent(`Google profilis${name ? ` – ${name}` : ''}`)}`}>Reikia pagalbos? Parašykite</a>
        </div>
      </div>
    </section>

    <section className="od-section od-faq">
      <span className="od-eyebrow">Dažni klausimai</span>
      <h2>Prieš pradedant</h2>
      <details><summary>Ar Google verslo profilis mokamas?</summary><p>Ne. Profilis, patvirtinimas ir atsiliepimai Google yra nemokami.</p></details>
      <details><summary>Kiek laiko užtrunka?</summary><p>Užpildyti apie 15 minučių. Patvirtinimą Google paprastai peržiūri per kelias darbo dienas, retais atvejais ilgiau. Atvirukas su kodu dažniausiai ateina per 14 dienų.</p></details>
      <details><summary>Neturime fizinės parduotuvės. Ar galima?</summary><p>Taip. Pasirinkite aptarnavimo zoną vietoje adreso. Tinka el. parduotuvėms, meistrams ir paslaugoms pas klientą.</p></details>
      <details><summary>Ar klientui reikės Google paskyros atsiliepimui?</summary><p>Taip, Google atsiliepimui reikia prisijungti. Paskyrą galima susikurti ir su bet kuriuo el. paštu.</p></details>
      <details><summary>Ar dings Rekvizitai.lt atsiliepimai?</summary><p>Ne. Jie lieka Rekvizitai.lt. Pasikeičia tik tai, kur nukreipiami nauji patenkinti klientai.</p></details>
    </section>

    <VmFooter/>
  </div>;
}

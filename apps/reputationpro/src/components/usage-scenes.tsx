// Personalized vector scenes: the business's REAL QR code and name on everyday surfaces,
// so the owner sees "this works anywhere" with their own material. Pure SVG, no images.
type SceneProps = { qr: string; name: string };

const STARS = '★★★★★';
const short = (name: string, max = 24) => (name.length > max ? name.slice(0, max - 1).trimEnd() + '…' : name);

function Defs() {
  return <defs>
    <linearGradient id="us-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f5f3ff"/><stop offset="1" stopColor="#ede9fe"/></linearGradient>
    <linearGradient id="us-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6b38a"/><stop offset="1" stopColor="#b88a5c"/></linearGradient>
    <linearGradient id="us-acryl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".95"/><stop offset="1" stopColor="#e0e7ff" stopOpacity=".85"/></linearGradient>
    <linearGradient id="us-brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d4dff"/><stop offset="1" stopColor="#4325d4"/></linearGradient>
    <linearGradient id="us-kraft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8c9a0"/><stop offset="1" stopColor="#cfa673"/></linearGradient>
    <filter id="us-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1e1b4b" floodOpacity=".18"/></filter>
  </defs>;
}

function Stand({ qr, name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR stovelis prie registratūros: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <circle cx="262" cy="52" r="34" fill="#c4b5fd" opacity=".35"/>
    <rect x="0" y="168" width="320" height="52" fill="url(#us-wood)"/>
    <rect x="0" y="168" width="320" height="6" fill="#e9cfa9"/>
    <rect x="36" y="128" width="56" height="40" rx="6" fill="#fff" opacity=".8"/>
    <rect x="44" y="112" width="40" height="18" rx="9" fill="#a7f3d0"/>
    <g filter="url(#us-shadow)">
      <path d="M118 172 L130 40 H214 L226 172 Z" fill="url(#us-acryl)" stroke="#c7d2fe"/>
      <text x="172" y="60" textAnchor="middle" fontSize="7.2" fontWeight="700" fill="#4338ca">{short(name, 21)}</text>
      <text x="172" y="78" textAnchor="middle" fontSize="13" fontWeight="800" fill="#13112e">Įvertinkite mus</text>
      <rect x="140" y="86" width="64" height="64" rx="6" fill="#fff"/>
      <image href={qr} x="143" y="89" width="58" height="58"/>
      <text x="172" y="164" textAnchor="middle" fontSize="10" fill="#f59e0b">{STARS}</text>
    </g>
    <rect x="236" y="138" width="44" height="30" rx="5" fill="#13112e" opacity=".85"/>
    <rect x="252" y="130" width="12" height="8" rx="2" fill="#13112e" opacity=".85"/>
  </svg>;
}

function BusinessCard({ qr, name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kodas vizitinėje kortelėje: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <g transform="rotate(-8 110 110)" filter="url(#us-shadow)">
      <rect x="36" y="58" width="150" height="90" rx="8" fill="url(#us-brand)"/>
      <text x="52" y="92" fontSize="11" fontWeight="800" fill="#fff">{short(name, 22)}</text>
      <rect x="52" y="104" width="70" height="4" rx="2" fill="#c4b5fd"/>
      <rect x="52" y="114" width="54" height="4" rx="2" fill="#c4b5fd" opacity=".7"/>
      <rect x="52" y="124" width="62" height="4" rx="2" fill="#c4b5fd" opacity=".5"/>
    </g>
    <g transform="rotate(6 220 120)" filter="url(#us-shadow)">
      <rect x="146" y="74" width="150" height="90" rx="8" fill="#fff"/>
      <rect x="158" y="86" width="66" height="66" rx="5" fill="#f8fafc"/>
      <image href={qr} x="161" y="89" width="60" height="60"/>
      <text x="232" y="106" fontSize="10.5" fontWeight="800" fill="#13112e">Įvertinkite</text>
      <text x="232" y="120" fontSize="10.5" fontWeight="800" fill="#13112e">mus</text>
      <text x="232" y="138" fontSize="10" fill="#f59e0b">{STARS}</text>
    </g>
  </svg>;
}

function Package({ qr, name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kortelė siuntinyje: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <g filter="url(#us-shadow)">
      <path d="M60 92 L150 66 L240 92 L150 118 Z" fill="#f1d7b2"/>
      <path d="M60 92 L150 118 L150 196 L60 170 Z" fill="url(#us-kraft)"/>
      <path d="M240 92 L150 118 L150 196 L240 170 Z" fill="#c99a62"/>
      <path d="M105 79 L195 105 L195 120 L105 94 Z" fill="#fff" opacity=".35"/>
    </g>
    <path d="M150 118 C 170 112, 200 100, 214 86" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
    <g transform="rotate(10 236 82)" filter="url(#us-shadow)">
      <rect x="198" y="34" width="84" height="104" rx="8" fill="#fff"/>
      <circle cx="214" cy="46" r="4" fill="#e2e8f0"/>
      <text x="240" y="62" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#13112e">Ačiū už pirkinį!</text>
      <image href={qr} x="214" y="68" width="52" height="52"/>
      <text x="240" y="132" textAnchor="middle" fontSize="9" fill="#f59e0b">{STARS}</text>
    </g>
    <text x="104" y="150" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7c4a1e" opacity=".7">{short(name, 18)}</text>
  </svg>;
}

function EmailSignature({ qr, name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`Atsiliepimo nuoroda el. laiško paraše: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <g filter="url(#us-shadow)">
      <rect x="30" y="26" width="260" height="170" rx="12" fill="#fff"/>
      <rect x="30" y="26" width="260" height="26" rx="12" fill="#f1f5f9"/>
      <rect x="30" y="40" width="260" height="12" fill="#f1f5f9"/>
      <circle cx="46" cy="39" r="4" fill="#fca5a5"/><circle cx="58" cy="39" r="4" fill="#fde68a"/><circle cx="70" cy="39" r="4" fill="#bbf7d0"/>
      <rect x="48" y="66" width="150" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="48" y="78" width="200" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="48" y="90" width="120" height="6" rx="3" fill="#e2e8f0"/>
      <line x1="48" y1="108" x2="272" y2="108" stroke="#e2e8f0"/>
      <text x="48" y="126" fontSize="10.5" fontWeight="800" fill="#13112e">{short(name, 26)}</text>
      <text x="48" y="140" fontSize="8.5" fill="#64748b">Pagarbiai, komanda</text>
      <rect x="48" y="150" width="150" height="26" rx="13" fill="url(#us-brand)"/>
      <text x="123" y="167" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">Įvertinkite mus Google  <tspan fill="#fde047">★★★★★</tspan></text>
      <image href={qr} x="222" y="118" width="54" height="54"/>
    </g>
  </svg>;
}

function Receipt({ qr, name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kodas sąskaitoje ar kvite: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <g filter="url(#us-shadow)" transform="rotate(-4 160 110)">
      <path d="M100 18 H220 V200 l-10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 Z" fill="#fff"/>
      <text x="160" y="40" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#13112e">{short(name, 20)}</text>
      <text x="160" y="52" textAnchor="middle" fontSize="7" fill="#94a3b8">SĄSKAITA / KVITAS</text>
      <line x1="112" y1="60" x2="208" y2="60" stroke="#e2e8f0" strokeDasharray="3 2"/>
      {[72, 84, 96, 108].map((y) => <g key={y}><rect x="112" y={y} width="58" height="5" rx="2.5" fill="#e2e8f0"/><rect x="186" y={y} width="22" height="5" rx="2.5" fill="#e2e8f0"/></g>)}
      <line x1="112" y1="120" x2="208" y2="120" stroke="#e2e8f0" strokeDasharray="3 2"/>
      <image href={qr} x="133" y="126" width="54" height="54"/>
      <text x="160" y="190" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#6d4dff">Įvertinkite mus ★★★★★</text>
    </g>
  </svg>;
}

function Sms({ name }: SceneProps) {
  return <svg viewBox="0 0 320 220" role="img" aria-label={`Atsiliepimo nuoroda SMS žinutėje: ${name}`}>
    <Defs/>
    <rect width="320" height="220" fill="url(#us-bg)"/>
    <g filter="url(#us-shadow)">
      <rect x="104" y="14" width="112" height="196" rx="20" fill="#0b1020"/>
      <rect x="110" y="20" width="100" height="184" rx="15" fill="#f8fafc"/>
      <rect x="140" y="24" width="40" height="9" rx="4.5" fill="#0b1020"/>
      <text x="160" y="50" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#13112e">{short(name, 20)}</text>
      <rect x="116" y="60" width="84" height="56" rx="10" fill="#e2e8f0"/>
      <text x="122" y="74" fontSize="6.8" fill="#13112e">Ačiū, kad apsilankėte!</text>
      <text x="122" y="85" fontSize="6.8" fill="#13112e">Būsime dėkingi už</text>
      <text x="122" y="96" fontSize="6.8" fill="#13112e">trumpą įvertinimą:</text>
      <text x="122" y="108" fontSize="6.8" fontWeight="700" fill="#4325d4" textDecoration="underline">reputacija.lt/r/…</text>
      <rect x="138" y="124" width="66" height="22" rx="10" fill="url(#us-brand)"/>
      <text x="171" y="139" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">Ačiū, įvertinsiu!</text>
      <text x="160" y="170" textAnchor="middle" fontSize="12" fill="#f59e0b">{STARS}</text>
    </g>
    <g transform="translate(232 40)"><rect width="58" height="26" rx="13" fill="#16a34a"/><text x="29" y="17" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">SMS</text></g>
    <g transform="translate(30 140)"><rect width="66" height="26" rx="13" fill="#fff" stroke="#c7d2fe"/><text x="33" y="17" textAnchor="middle" fontSize="9" fontWeight="800" fill="#4325d4">El. paštas</text></g>
  </svg>;
}

export const USAGE_SCENES: { key: string; title: string; text: string; Scene: (p: SceneProps) => React.JSX.Element }[] = [
  { key: 'stand', title: 'Prie registratūros ar kasos', text: 'Akrilinis stovelis – klientas nuskenuoja laukdamas ar atsiskaitydamas.', Scene: Stand },
  { key: 'card', title: 'Vizitinėje kortelėje', text: 'QR kodas nugarėlėje – atsiliepimas po susitikimo.', Scene: BusinessCard },
  { key: 'package', title: 'Siuntinyje ar ant prekės', text: 'Padėkos kortelė pakuotėje – el. parduotuvėms ir gamintojams.', Scene: Package },
  { key: 'email', title: 'El. laiško paraše', text: 'Mygtukas kiekviename laiške – nereikia nieko papildomai siųsti.', Scene: EmailSignature },
  { key: 'receipt', title: 'Sąskaitoje ar kvite', text: 'QR kodas apačioje – kai darbas atliktas ir klientas patenkintas.', Scene: Receipt },
  { key: 'sms', title: 'SMS ar el. laiške po vizito', text: 'Nuoroda žinutėje – paprasčiausias būdas surinkti daugiau atsiliepimų.', Scene: Sms },
];

// Small illustrations for the "two paths" cards.
export function GoodPathArt() {
  return <svg viewBox="0 0 280 120" role="img" aria-label="4–5 žvaigždutės veda į Google atsiliepimą">
    <rect x="18" y="14" width="64" height="96" rx="12" fill="#0b1020"/><rect x="22" y="18" width="56" height="88" rx="9" fill="#fff"/>
    <text x="50" y="52" textAnchor="middle" fontSize="13" fill="#f59e0b">★★★★★</text>
    <rect x="30" y="66" width="40" height="14" rx="7" fill="#16a34a"/><text x="50" y="76" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">Google</text>
    <path d="M96 62 H170" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7"/><path d="M164 54 L176 62 L164 70" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="186" y="26" width="80" height="72" rx="12" fill="#fff" stroke="#bbf7d0"/>
    <text x="226" y="48" textAnchor="middle" fontSize="11" fontWeight="800" fill="#13112e">Google</text>
    <text x="226" y="66" textAnchor="middle" fontSize="12" fill="#f59e0b">★★★★★</text>
    <rect x="200" y="74" width="52" height="5" rx="2.5" fill="#e2e8f0"/><rect x="206" y="84" width="40" height="5" rx="2.5" fill="#e2e8f0"/>
  </svg>;
}
export function CarePathArt() {
  return <svg viewBox="0 0 280 120" role="img" aria-label="1–3 žvaigždutės: pastaba vadovui ir el. laiškas">
    <rect x="18" y="14" width="64" height="96" rx="12" fill="#0b1020"/><rect x="22" y="18" width="56" height="88" rx="9" fill="#fff"/>
    <text x="50" y="40" textAnchor="middle" fontSize="12" fill="#f59e0b">★★<tspan fill="#cbd5e1">★★★</tspan></text>
    <rect x="30" y="50" width="40" height="22" rx="4" fill="#fffbeb" stroke="#fde68a"/><rect x="34" y="56" width="30" height="3" rx="1.5" fill="#fcd34d"/><rect x="34" y="63" width="22" height="3" rx="1.5" fill="#fcd34d"/>
    <rect x="30" y="80" width="40" height="12" rx="6" fill="#4325d4"/>
    <path d="M96 62 H170" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7"/><path d="M164 54 L176 62 L164 70" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="186" y="34" width="80" height="56" rx="10" fill="#fff" stroke="#fde68a"/>
    <path d="M186 40 L226 66 L266 40" fill="none" stroke="#f59e0b" strokeWidth="2"/>
    <circle cx="262" cy="34" r="11" fill="#ef4444"/><text x="262" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">1</text>
    <text x="226" y="106" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#92400e">Vadovui iškart</text>
  </svg>;
}

// Personalized vector scenes for the owner demo (/r/{slug}). Every scene shows the business's
// REAL QR code and name, taken from the client record of the link being viewed – each prospect
// sees their own material. Pure SVG (no image files, no third-party logos).
import type React from 'react';

type SceneProps = { qr: string; name: string };

/** Split a business name into at most `max` lines of ~`perLine` characters; ellipsis only if it truly doesn't fit. */
function nameLines(name: string, perLine: number, max = 2) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let i = 0;
  while (i < words.length && out.length < max) {
    let line = words[i++];
    while (i < words.length && (line + ' ' + words[i]).length <= perLine) line += ' ' + words[i++];
    out.push(line);
  }
  if (i < words.length && out.length) out[out.length - 1] = out[out.length - 1].slice(0, perLine - 1).trimEnd() + '…';
  return out.map((l) => (l.length > perLine ? l.slice(0, perLine - 1).trimEnd() + '…' : l));
}
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function Lines({ x, y, lines, size, lh, anchor = 'start', weight = 700, fill }: { x: number; y: number; lines: string[]; size: number; lh: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; fill: string }) {
  return <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}>
    {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>{l}</tspan>)}
  </text>;
}

const BRAND = <linearGradient id="vm-brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7357ff"/><stop offset="1" stopColor="#4325d4"/></linearGradient>;
const SHADOW = <filter id="vm-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#1e1b4b" floodOpacity=".18"/></filter>;
const BG = <linearGradient id="vm-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8f6ff"/><stop offset="1" stopColor="#ebe6ff"/></linearGradient>;

function Sparkle({ x, y, s = 1, c = '#c4b5fd' }: { x: number; y: number; s?: number; c?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -6 C1 -1 1 -1 6 0 C1 1 1 1 0 6 C-1 1 -1 1 -6 0 C-1 -1 -1 -1 0 -6 Z" fill={c}/>;
}

// 1. Acrylic stand at the reception / checkout
function Stand({ qr, name }: SceneProps) {
  const nl = nameLines(name, 14, 3);
  const qy = 66 + nl.length * 7;
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR stovelis prie registratūros: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}
      <linearGradient id="s1-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c99a62"/><stop offset="1" stopColor="#a4733f"/></linearGradient>
      <linearGradient id="s1-acryl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".92"/><stop offset="1" stopColor="#dbe4ff" stopOpacity=".78"/></linearGradient>
    </defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <g transform="translate(238 22)"><rect width="56" height="44" rx="5" fill="#fff" stroke="#ddd6fe"/><path d="M8 36 L21 20 L31 30 L39 22 L49 36 Z" fill="#c4b5fd"/><circle cx="41" cy="12" r="4" fill="#fde68a"/></g>
    <Sparkle x={92} y={38} s={1.1}/><Sparkle x={222} y={96} s={.8} c="#a5b4fc"/>
    <g transform="translate(22 94)">
      <ellipse cx="20" cy="22" rx="8" ry="21" fill="#34d399" transform="rotate(-26 20 22)"/>
      <ellipse cx="36" cy="18" rx="8" ry="23" fill="#10b981" transform="rotate(14 36 18)"/>
      <ellipse cx="28" cy="12" rx="6" ry="19" fill="#6ee7b7"/>
      <path d="M12 42 H44 L40 66 H16 Z" fill="#fff" stroke="#e2e8f0"/>
    </g>
    <rect x="0" y="160" width="320" height="9" fill="#ead2ad"/>
    <rect x="0" y="169" width="320" height="51" fill="url(#s1-wood)"/>
    <rect x="0" y="169" width="320" height="3" fill="#000" opacity=".08"/>
    <g transform="translate(262 134)"><rect width="24" height="26" rx="4" fill="#312e81"/><path d="M24 7 h5 a5 5 0 0 1 0 12 h-5" fill="none" stroke="#312e81" strokeWidth="3"/></g>
    <ellipse cx="170" cy="161" rx="60" ry="4.5" fill="#1e1b4b" opacity=".14"/>
    <g filter="url(#vm-shadow)">
      <path d="M128 154 L136 26 H204 L212 154 Z" fill="url(#s1-acryl)" stroke="#c7d2fe"/>
      <rect x="142" y="34" width="56" height="114" rx="6" fill="#fff"/>
      <path d="M142 40 a6 6 0 0 1 6 -6 h44 a6 6 0 0 1 6 6 v14 h-56 Z" fill="url(#vm-brand)"/>
      <text x="170" y="48.5" textAnchor="middle" fontSize="7.4" fontWeight="800" fill="#fff">Įvertinkite mus</text>
      <Lines x={170} y={64} lines={nl} size={6} lh={7} anchor="middle" fill="#312e81"/>
      <rect x="148" y={qy} width="44" height="44" rx="4" fill="#fff" stroke="#ede9fe"/>
      <image href={qr} x="150" y={qy + 2} width="40" height="40"/>
      <text x="170" y="141" textAnchor="middle" fontSize="8" fill="#f59e0b">★★★★★</text>
      <path d="M152 26 H166 L140 154 H128 Z" fill="#fff" opacity=".2"/>
      <rect x="122" y="150" width="96" height="10" rx="3" fill="#e0e7ff" stroke="#c7d2fe"/>
    </g>
  </svg>;
}

// 2. Business card (front + back with the QR)
function BusinessCard({ qr, name }: SceneProps) {
  const nl = nameLines(name, 16, 3);
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kodas vizitinėje kortelėje: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}</defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <ellipse cx="166" cy="194" rx="140" ry="13" fill="#c4b5fd" opacity=".28"/>
    <Sparkle x={34} y={34} s={1.2}/><Sparkle x={292} y={44} s={.8} c="#a5b4fc"/>
    <g transform="rotate(-26 272 176)"><rect x="236" y="172" width="70" height="7" rx="3.5" fill="#1e1b4b"/><path d="M306 172 l11 3.5 -11 3.5 z" fill="#fbbf24"/><rect x="244" y="172" width="5" height="7" fill="#a78bfa"/></g>
    <g transform="rotate(-9 104 106)" filter="url(#vm-shadow)">
      <rect x="26" y="58" width="156" height="94" rx="10" fill="url(#vm-brand)"/>
      <circle cx="50" cy="84" r="13" fill="#fff" opacity=".2"/>
      <text x="50" y="88" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{initials(name)}</text>
      <Lines x={70} y={nl.length > 2 ? 78 : 82} lines={nl} size={8.2} lh={9.6} weight={800} fill="#fff"/>
      <rect x="38" y="114" width="66" height="4" rx="2" fill="#ddd6fe" opacity=".85"/>
      <rect x="38" y="123" width="84" height="4" rx="2" fill="#ddd6fe" opacity=".6"/>
      <rect x="38" y="132" width="54" height="4" rx="2" fill="#ddd6fe" opacity=".45"/>
      <circle cx="166" cy="138" r="22" fill="#fff" opacity=".07"/>
    </g>
    <g transform="rotate(5 222 118)" filter="url(#vm-shadow)">
      <rect x="144" y="70" width="156" height="94" rx="10" fill="#fff"/>
      <rect x="154" y="80" width="72" height="74" rx="7" fill="#f5f3ff"/>
      <image href={qr} x="159" y="86" width="62" height="62"/>
      <text x="234" y="100" fontSize="9.6" fontWeight="800" fill="#13112e">Įvertinkite</text>
      <text x="234" y="112" fontSize="9.6" fontWeight="800" fill="#13112e">mus Google</text>
      <text x="234" y="127" fontSize="9.5" fill="#f59e0b">★★★★★</text>
      <text x="234" y="142" fontSize="6.6" fill="#64748b">Nuskenuokite</text>
    </g>
  </svg>;
}

// 3. Parcel with a thank-you card
function Package({ qr, name }: SceneProps) {
  const nl = nameLines(name, 22);
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kortelė siuntinyje: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}
      <linearGradient id="s3-left" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3b980"/><stop offset="1" stopColor="#cf9d62"/></linearGradient>
    </defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <circle cx="44" cy="44" r="4" fill="#fbbf24"/><rect x="70" y="26" width="6" height="6" rx="1.5" fill="#a78bfa" transform="rotate(20 73 29)"/><circle cx="290" cy="168" r="3.5" fill="#34d399"/><Sparkle x={36} y={150} s={1}/>
    <ellipse cx="150" cy="198" rx="104" ry="10" fill="#1e1b4b" opacity=".11"/>
    <g filter="url(#vm-shadow)">
      <path d="M54 98 L148 72 L242 98 L148 124 Z" fill="#f2d6ab"/>
      <path d="M98 86 L190 112 L198 110 L106 84 Z" fill="#fff" opacity=".45"/>
      <path d="M54 98 L148 124 L148 198 L54 172 Z" fill="url(#s3-left)"/>
      <path d="M242 98 L148 124 L148 198 L242 172 Z" fill="#bd8a50"/>
      <path d="M144 123 L152 123 L152 197 L144 197 Z" fill="#fff" opacity=".25"/>
      <g transform="matrix(1 0.28 0 1 66 120)">
        <rect width="52" height="30" rx="3" fill="#fff"/>
        <text x="5" y="10" fontSize="5.4" fontWeight="800" fill="#7c4a1e">{nameLines(name, 14, 1)[0]}</text>
        {[0, 3, 5, 9, 11, 14, 18, 20, 23, 27, 29, 32, 36, 39].map((bx, k) => <rect key={k} x={5 + bx} y="15" width={k % 3 === 0 ? 2 : 1} height="10" fill="#1e1b4b"/>)}
      </g>
    </g>
    <g transform="rotate(9 240 76)" filter="url(#vm-shadow)">
      <rect x="196" y="18" width="90" height="120" rx="9" fill="#fff"/>
      <path d="M196 27 a9 9 0 0 1 9 -9 h72 a9 9 0 0 1 9 9 v12 h-90 Z" fill="url(#vm-brand)"/>
      <text x="241" y="34" textAnchor="middle" fontSize="7.8" fontWeight="800" fill="#fff">Ačiū už pirkinį!</text>
      <Lines x={241} y={50} lines={nl} size={5.8} lh={7} anchor="middle" fill="#4338ca"/>
      <image href={qr} x="214" y={nl.length > 1 ? 62 : 56} width="54" height="54"/>
      <text x="241" y="129" textAnchor="middle" fontSize="8.5" fill="#f59e0b">★★★★★</text>
    </g>
  </svg>;
}

// 4. Email signature with a review button
function EmailSignature({ qr, name }: SceneProps) {
  const nl = nameLines(name, 22);
  const subY = 133 + nl.length * 9;
  return <svg viewBox="0 0 320 220" role="img" aria-label={`Atsiliepimo nuoroda el. laiško paraše: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}</defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <Sparkle x={300} y={24} s={1}/><Sparkle x={14} y={196} s={.9} c="#a5b4fc"/>
    <g filter="url(#vm-shadow)">
      <rect x="24" y="16" width="272" height="190" rx="13" fill="#fff"/>
      <path d="M24 29 a13 13 0 0 1 13 -13 h246 a13 13 0 0 1 13 13 v11 h-272 Z" fill="#f1f5f9"/>
      <circle cx="40" cy="28" r="4" fill="#fca5a5"/><circle cx="52" cy="28" r="4" fill="#fde68a"/><circle cx="64" cy="28" r="4" fill="#bbf7d0"/>
      <text x="40" y="56" fontSize="6.6" fill="#94a3b8">Kam: klientas@pastas.lt</text>
      <text x="40" y="69" fontSize="8" fontWeight="800" fill="#13112e">Ačiū, kad pasirinkote mus!</text>
      <rect x="40" y="78" width="186" height="5" rx="2.5" fill="#e2e8f0"/>
      <rect x="40" y="88" width="214" height="5" rx="2.5" fill="#e2e8f0"/>
      <rect x="40" y="98" width="140" height="5" rx="2.5" fill="#e2e8f0"/>
      <line x1="40" y1="112" x2="280" y2="112" stroke="#e2e8f0"/>
      <circle cx="52" cy="132" r="12" fill="url(#vm-brand)"/>
      <text x="52" y="135.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">{initials(name)}</text>
      <Lines x={70} y={130} lines={nl} size={7.8} lh={9} weight={800} fill="#13112e"/>
      <text x="70" y={subY} fontSize="6.4" fill="#64748b">Klientų aptarnavimas</text>
      <rect x="40" y="164" width="156" height="26" rx="13" fill="url(#vm-brand)"/>
      <text x="118" y="180.5" textAnchor="middle" fontSize="8.4" fontWeight="800" fill="#fff"><tspan fill="#fde047">★</tspan> Įvertinkite mus Google</text>
      <path d="M186 184 l0 15 l4.5 -4 l3 7 l3.5 -1.5 l-3 -7 l6 0 z" fill="#13112e" stroke="#fff" strokeWidth="1"/>
      <rect x="212" y="122" width="70" height="70" rx="8" fill="#f5f3ff"/>
      <image href={qr} x="217" y="127" width="60" height="60"/>
    </g>
  </svg>;
}

// 5. Invoice / receipt next to a card terminal
function Receipt({ qr, name }: SceneProps) {
  const nl = nameLines(name, 22);
  const zig = Array.from({ length: 7 }, () => 'l-8 -6 l-8 6').join(' ');
  const top = 32 + (nl.length - 1) * 9;
  return <svg viewBox="0 0 320 220" role="img" aria-label={`QR kodas sąskaitoje ar kvite: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}</defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <Sparkle x={30} y={40} s={1.1}/><Sparkle x={300} y={196} s={.8} c="#a5b4fc"/>
    <g transform="rotate(-5 120 110)" filter="url(#vm-shadow)">
      <path d={`M64 14 H176 V200 ${zig} Z`} fill="#fff"/>
      <Lines x={120} y={30} lines={nl} size={7.2} lh={9} anchor="middle" weight={800} fill="#13112e"/>
      <text x="120" y={top + 10} textAnchor="middle" fontSize="5.6" letterSpacing=".6" fill="#94a3b8">SĄSKAITA · KVITAS</text>
      <line x1="76" y1={top + 16} x2="164" y2={top + 16} stroke="#e2e8f0" strokeDasharray="3 2"/>
      {[0, 10, 20].map((d) => <g key={d}><rect x="76" y={top + 24 + d} width="60" height="4.5" rx="2.2" fill="#e2e8f0"/><rect x="146" y={top + 24 + d} width="18" height="4.5" rx="2.2" fill="#e2e8f0"/></g>)}
      <line x1="76" y1={top + 56} x2="164" y2={top + 56} stroke="#e2e8f0" strokeDasharray="3 2"/>
      <text x="76" y={top + 67} fontSize="7" fontWeight="800" fill="#13112e">IŠ VISO</text>
      <text x="164" y={top + 67} textAnchor="end" fontSize="7" fontWeight="800" fill="#13112e">45,00 €</text>
      <rect x="93" y={top + 74} width="54" height="54" rx="5" fill="#fff" stroke="#ede9fe"/>
      <image href={qr} x="96" y={top + 77} width="48" height="48"/>
      <text x="120" y={top + 140} textAnchor="middle" fontSize="6.6" fontWeight="800" fill="#5636e8">Įvertinkite mus <tspan fill="#f59e0b">★★★★★</tspan></text>
    </g>
    <g transform="translate(206 66)" filter="url(#vm-shadow)">
      <rect width="80" height="122" rx="15" fill="#1e1b4b"/>
      <rect x="8" y="10" width="64" height="42" rx="7" fill="#d1fae5"/>
      <text x="40" y="26" textAnchor="middle" fontSize="7.6" fontWeight="800" fill="#065f46">Apmokėta</text>
      <circle cx="40" cy="39" r="6.5" fill="#10b981"/><path d="M36.5 39 l2.4 2.4 l4.6 -4.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={22 + c * 18} cy={68 + r * 16} r="5" fill="#312e81"/>))}
    </g>
  </svg>;
}

// 6. SMS after the visit
function Sms({ name }: SceneProps) {
  const nl = nameLines(name, 21);
  return <svg viewBox="0 0 320 220" role="img" aria-label={`Atsiliepimo nuoroda SMS žinutėje: ${name}`}>
    <defs>{BG}{BRAND}{SHADOW}</defs>
    <rect width="320" height="220" fill="url(#vm-bg)"/>
    <circle cx="160" cy="112" r="92" fill="#ddd6fe" opacity=".35"/>
    <Sparkle x={70} y={40} s={1.1}/><Sparkle x={262} y={110} s={.9} c="#a5b4fc"/>
    <g filter="url(#vm-shadow)">
      <rect x="102" y="8" width="116" height="206" rx="22" fill="#0b1020"/>
      <rect x="108" y="14" width="104" height="194" rx="17" fill="#f8fafc"/>
      <rect x="142" y="19" width="36" height="9" rx="4.5" fill="#0b1020"/>
      <circle cx="125" cy="46" r="9.5" fill="url(#vm-brand)"/>
      <text x="125" y="49" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">{initials(name)}</text>
      <Lines x={139} y={nl.length > 1 ? 44 : 49} lines={nl} size={5.8} lh={7} fill="#13112e"/>
      <line x1="112" y1="60" x2="208" y2="60" stroke="#e2e8f0"/>
      <rect x="114" y="68" width="88" height="62" rx="11" fill="#e2e8f0"/>
      <text x="121" y="81" fontSize="6.3" fill="#13112e">Ačiū, kad apsilankėte!</text>
      <text x="121" y="91" fontSize="6.3" fill="#13112e">Būsime dėkingi už</text>
      <text x="121" y="101" fontSize="6.3" fill="#13112e">trumpą įvertinimą:</text>
      <rect x="121" y="107" width="74" height="16" rx="8" fill="#fff"/>
      <text x="158" y="118" textAnchor="middle" fontSize="6.6" fontWeight="800" fill="#4325d4"><tspan fill="#f59e0b">★</tspan> Įvertinti</text>
      <rect x="140" y="140" width="66" height="24" rx="11" fill="url(#vm-brand)"/>
      <text x="173" y="155.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">Ačiū! <tspan fill="#fde047">★★★★★</tspan></text>
      <rect x="138" y="198" width="44" height="3" rx="1.5" fill="#0b1020"/>
    </g>
    <g transform="translate(232 40)" filter="url(#vm-shadow)"><rect width="62" height="24" rx="12" fill="#16a34a"/><text x="31" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">SMS</text></g>
    <g transform="translate(22 146)" filter="url(#vm-shadow)"><rect width="72" height="24" rx="12" fill="#fff"/><text x="36" y="16" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#4325d4">El. paštas</text></g>
    <g transform="translate(236 150)" filter="url(#vm-shadow)"><rect width="62" height="24" rx="12" fill="#fff"/><text x="31" y="16" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#b45309">Po vizito</text></g>
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

// Two-path illustrations for the "Kaip veikia" cards.
export function GoodPathArt() {
  return <svg viewBox="0 0 280 124" role="img" aria-label="4–5 žvaigždutės veda į Google atsiliepimą">
    <defs>{BRAND}{SHADOW}</defs>
    <circle cx="52" cy="62" r="50" fill="#dcfce7" opacity=".7"/><circle cx="228" cy="62" r="50" fill="#dcfce7" opacity=".5"/>
    <g filter="url(#vm-shadow)">
      <rect x="22" y="10" width="62" height="104" rx="13" fill="#0b1020"/><rect x="26" y="14" width="54" height="96" rx="10" fill="#fff"/>
      <rect x="44" y="18" width="18" height="5" rx="2.5" fill="#0b1020"/>
      <text x="53" y="46" textAnchor="middle" fontSize="11.5" fill="#f59e0b">★★★★★</text>
      <rect x="33" y="56" width="40" height="5" rx="2.5" fill="#e2e8f0"/>
      <rect x="31" y="70" width="44" height="16" rx="8" fill="#16a34a"/>
      <text x="53" y="81" textAnchor="middle" fontSize="6.6" fontWeight="800" fill="#fff"><tspan fill="#fde047">★</tspan> Google</text>
    </g>
    <path d="M98 62 C 130 40, 150 40, 176 58" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7"/>
    <path d="M168 50 L178 59 L165 63" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <g filter="url(#vm-shadow)">
      <rect x="184" y="24" width="84" height="78" rx="12" fill="#fff"/>
      <circle cx="200" cy="42" r="8" fill="url(#vm-brand)"/>
      <text x="214" y="40" fontSize="7" fontWeight="800" fill="#13112e">Google</text>
      <text x="214" y="49" fontSize="6.6" fill="#f59e0b">★★★★★</text>
      <rect x="194" y="58" width="64" height="4.5" rx="2.2" fill="#e2e8f0"/><rect x="194" y="67" width="50" height="4.5" rx="2.2" fill="#e2e8f0"/>
      <rect x="194" y="80" width="46" height="13" rx="6.5" fill="#dcfce7"/><text x="217" y="89" textAnchor="middle" fontSize="6.2" fontWeight="800" fill="#15803d">Paskelbta ✓</text>
    </g>
  </svg>;
}
export function CarePathArt() {
  return <svg viewBox="0 0 280 124" role="img" aria-label="1–3 žvaigždutės: pastaba vadovui ir el. laiškas">
    <defs>{BRAND}{SHADOW}</defs>
    <circle cx="52" cy="62" r="50" fill="#fef3c7" opacity=".8"/><circle cx="228" cy="62" r="50" fill="#fef3c7" opacity=".6"/>
    <g filter="url(#vm-shadow)">
      <rect x="22" y="10" width="62" height="104" rx="13" fill="#0b1020"/><rect x="26" y="14" width="54" height="96" rx="10" fill="#fff"/>
      <rect x="44" y="18" width="18" height="5" rx="2.5" fill="#0b1020"/>
      <text x="53" y="42" textAnchor="middle" fontSize="11" fill="#f59e0b">★★<tspan fill="#cbd5e1">★★★</tspan></text>
      <rect x="32" y="50" width="42" height="26" rx="5" fill="#fffbeb" stroke="#fde68a"/>
      <rect x="37" y="56" width="30" height="3.5" rx="1.7" fill="#fcd34d"/><rect x="37" y="63" width="22" height="3.5" rx="1.7" fill="#fcd34d"/>
      <rect x="32" y="84" width="42" height="14" rx="7" fill="url(#vm-brand)"/><text x="53" y="93.5" textAnchor="middle" fontSize="6.2" fontWeight="800" fill="#fff">Siųsti</text>
    </g>
    <path d="M98 62 C 130 84, 150 84, 176 66" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7"/>
    <path d="M165 61 L178 65 L170 76" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <g filter="url(#vm-shadow)">
      <rect x="186" y="34" width="80" height="56" rx="10" fill="#fff"/>
      <path d="M190 40 L226 66 L262 40" fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinejoin="round"/>
      <circle cx="262" cy="34" r="11" fill="#ef4444"/><text x="262" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">1</text>
    </g>
    <text x="226" y="110" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#92400e">Vadovui iškart</text>
  </svg>;
}

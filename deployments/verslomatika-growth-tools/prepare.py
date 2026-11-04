from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
source = Path(r'C:\Users\Lenovo\Documents\Agentai\verslomatika_verslo_augimo_irankiai.html').read_text(encoding='utf-8')
replacements = {
    'Pilnai Autonomiški.</span> <span>Paruošti Paleidimui.': 'Idėjos augimui.</span> <span>Sprendimai Jūsų verslui.',
    'Kiekvienas mūsų holdingo mikro-SaaS produktas sprendžia vieną konkrečią, brangią Lietuvos verslo problemą:\n        nuo Google 5★ atsiliepimų apsaugos iki miegančių klientų bazių atgaivinimo. Nulis teorijos – tik veikianti programinė įranga su tiesioginiais subdomenais.': 'Atraskite ReputationPro demonstraciją ir susipažinkite su planuojamais verslo automatizavimo įrankiais. Dėl jų galimybių ir prieinamumo kviečiame susisiekti.',
    'Cloudflare Enterprise Tunnel & SSL': 'HTTPS per Cloudflare',
    'Pirmieji įrankiai veikia gyvai': 'ReputationPro demonstracija',
    '● AKTYVUS / GYVAI VEIKIANTIS SAAS': '● REPUTATIONPRO DEMONSTRACIJA',
    'ReputationPro • Google Reviews 5★ Apsaugos ir Augimo Sistema': 'ReputationPro • klientų atsiliepimų demonstracija',
    'Pritaikyta Lietuvos odontologijos klinikoms, autoservisams ir grožio salonams. Vienas neigiamas 1★ atsiliepimas Google Maps atbaido iki 35% naujų klientų. ReputationPro užtikrina, kad patenkinti pacientai parašytų 5★ viešai, o nusivylę – parašytų tiesiai vadovui.': 'Demonstracija parodo atsiliepimų formą ir vadovo skydelį. Sprendimas dar rengiamas naudojimui. Google taisyklės neleidžia atrankinio viešų atsiliepimų prašymo pagal įvertinimą, todėl šis demonstracinis būdas turi būti pakeistas prieš naudojimą.',
    'Registratūros QR stovelis arba SMS po vizito': 'Paciento atsiliepimo puslapis',
    'Klientas telefoną nukreipia į QR kodą. Atsidaro per 3 sekundes be jokių programėlių.': 'Atsiliepimo puslapį galima atverti telefone per nuorodą.',
    'Reitingo šuolis į 4.8★–4.9★ ir nulis viešų skundų': 'Pastabos vadovo skydelyje',
    'Klinikos vadovas mato atsiliepimus asmeniniame valdymo pulte ir išsaugo lojalų klientą.': 'Demonstraciniame skydelyje galima peržiūrėti privačius atsiliepimus.',
    'Privatus pranešimas vadovui. Į Google Maps NEPATENKA.': 'Atveriama privataus pranešimo forma; viešą atsiliepimą pacientas taip pat gali palikti.',
    'Kainodara: <strong>29 € / 49 € / 290 €</strong>': 'Planuojamas pasiūlymas: <strong>49 € / mėn.</strong>',
    '✓ 14 dienų nemokamas bandymas': 'Mokėjimai dar neaktyvūs',
    'Kiekvienas įrankis veikia kaip nepriklausoma mikro-aplikacija su integruotu Cloudflare tuneliu, atskira duomenų baze ir specializuotu AI varikliu.': 'Žemiau pateiktos kuriamų ir svarstomų įrankių idėjos. Funkcijos, kainos ir paleidimo datos dar derinamos.',
    'Automatiškai pakviečia buvusius klientus sugrįžti ir užregistruoja vizitą į kalendorių.': 'Planuojama galimybė pakviesti buvusius klientus sugrįžti ir registruoti vizitus.',
    'Nulinis darbuotojų laiko eikvojimas skambučiams': 'Planuojamas kontaktų automatizavimas',
    'bei automatinio atitikties užtikrinimo valdiklis': 'ir prieinamumo gerinimo įrankio idėja',
    'Apsauga nuo baudų ir teisinių skundų': 'Atitiktį ir teisinius reikalavimus būtina įvertinti atskirai',
    'Nulis praleistų skambučių savaitgaliais ir vakarais': 'Planuojamas atsakymas ne darbo metu',
    'Sumažina atsiskaitymo vėlavimus iki 70%.': 'Planuojama padėti sekti vėluojančius mokėjimus.',
    'Išlaikomi puikūs santykiai su klientu': 'Mandagūs priminimai klientams',
    'Visi naudojami įrankiai traukiami į vieną apskaitą per MB Pinet be valiutų konvertavimo mokesčių.': 'Dėl paslaugų teikimo ir atsiskaitymo sąlygų susisiekite su MB Pinet.',
    '📄 Viena PVM Sąskaita': '📄 Aiškios sąlygos',
    'Visi subdomenai apsaugoti Enterprise lygio Cloudflare šifravimu, apsauga nuo DDoS ir greitais serveriais.': 'Šis puslapis pasiekiamas per HTTPS naudojant Cloudflare.',
    'Visi tekstai, SMS žinutės, vartotojo sąsajos ir teisiniai BDAR dokumentai parengti pagal Lietuvos įstatymus.': 'Įrankiai pristatomi lietuvių kalba ir orientuojami į Lietuvos verslus.',
    'Jokio laukimo užsienio pagalbos eilėse. Tiesioginis palaikymas el. paštu ir telefonu iš Vilniaus komandos.': 'Dėl įrankių ir individualių sprendimų galite parašyti el. paštu.',
    'Galime pritaikyti bet kurį iš mūsų holdingo įrankių specifinei Jūsų veiklai arba sukurti individualų autonominį AI agentų procesą.': 'Papasakokite apie savo veiklą ir aptarkime galimus automatizavimo sprendimus.',
    'Apsaugota per Cloudflare Enterprise SSL': 'Ryšys apsaugotas HTTPS',
    '<h5>Veikiantys Įrankiai</h5>': '<h5>ReputationPro demonstracija</h5>',
    '>14 d. Bandymas</a>': '>Mokėjimų būsena</a>',
    'TIESIOGINIS DEMO SIMULIATORIUS': 'DEMONSTRACIJOS SCHEMA',
    'Užsakyti pilotą ↗': 'Teirautis ↗',
    'Užsakyti auditą ↗': 'Teirautis ↗',
    'Užsakyti atranką ↗': 'Teirautis ↗',
    'Išbandyti demo ↗': 'Teirautis ↗',
}
for old, new in replacements.items():
    if old not in source:
        raise ValueError(f'Expected source missing: {old[:90]}')
    source = source.replace(old, new)
source = re.sub(r'<span class="tool-status-tag status-(?:pipeline|spec)">.*?</span>', '<span class="tool-status-tag status-spec">PLANUOJAMA</span>', source)
source = re.sub(r'<div class="tool-price">.*?</div>', '<div class="tool-price">Sąlygos derinamos</div>', source)
source = re.sub(r'<div class="tool-subdomain">.*?</div>', '<div class="tool-subdomain">Idėja / kūrimo etapas</div>', source)
source = source.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"')
source = source.replace('<div class="brand-icon">V</div>', '<div class="brand-icon"><svg width="28" height="29" viewBox="0 0 31 32" aria-hidden="true"><path d="M3 6L14 16 3 26M14 16L24 6M14 16L24 26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="6" r="3.5" fill="#5636e8"/><circle cx="25" cy="26" r="3.5" fill="#157a57"/></svg></div>')
source = source.replace('<div class="brand-icon" style="width: 32px; height: 32px; font-size: 16px;">V</div>', '<div class="brand-icon"><svg width="28" height="29" viewBox="0 0 31 32" aria-hidden="true"><path d="M3 6L14 16 3 26M14 16L24 6M14 16L24 26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="6" r="3.5" fill="#5636e8"/><circle cx="25" cy="26" r="3.5" fill="#157a57"/></svg></div>')
source = source.replace('<meta name="viewport"', '<link rel="canonical" href="https://verslomatika.lt/verslo-augimo-irankiai/">\n  <meta name="viewport"', 1)
style = '''
    /* Verslomatika design system */
    :root { --bg:#fff; --card-bg:#fff; --card-inner:#f8fafc; --card-border:#e2e8f0; --card-border-hover:#a89af5; --primary:#5636e8; --primary-dark:#4324d6; --primary-glow:rgba(86,54,232,.12); --text:#0f172a; --text-muted:#475569; --text-dim:#64748b; }
    header { background:rgba(255,255,255,.96); }
    .brand-icon { background:transparent; box-shadow:none; color:#0f172a; }
    .hero::before { background:radial-gradient(circle,rgba(86,54,232,.10),transparent 70%); }
    .hero h1 span,.hero h1 .highlight { background:none; -webkit-text-fill-color:initial; color:var(--text); }
    .hero h1 .highlight { color:var(--primary); }
    .flagship-box { background:#f5f3ff; border-color:#ded8fd; box-shadow:none; }
    .flagship-tag,.status-active { color:#157a57; background:#eaf7ef; border-color:#b7e3c8; }
    .status-pipeline,.status-spec { color:#5636e8; background:#f5f3ff; border-color:#ded8fd; }
    .flagship-url-pill { color:#4324d6; background:#fff; }
    .workflow-mini-step,.benefit-item { background:#fff; }
    .btn-main { color:white; } .btn-main:hover { background:#4324d6; color:white; }
    .btn-nav { color:#4324d6; background:#f5f3ff; border-color:#ded8fd; }
    .btn-nav:hover { color:white; background:#5636e8; }
    .mockup-screen { background:white; } .split-positive strong { color:#157a57; } .split-negative strong { color:#865600; }
    .ecosystem-banner { background:#f8fafc; }
    .cta-banner { background:#f5f3ff; border-color:#ded8fd; }
    .footer-bottom { border-color:#e2e8f0; }
    :focus-visible { outline:3px solid #5636e8; outline-offset:3px; }
    ::selection { background:#ded8fd; color:#0f172a; }
    @media(max-width:560px) { .container { padding-left:18px; padding-right:18px; } .flagship-box,.ecosystem-banner,.cta-banner { padding:26px 20px; } .ecosystem-benefits,.mockup-split { grid-template-columns:1fr; } .mockup-top { flex-wrap:wrap; gap:8px; } .flagship-content h2,.section-title-wrap h2,.cta-banner h2 { font-size:28px; } .tool-footer { gap:12px; flex-wrap:wrap; } }
'''
source = source.replace('  </style>', style + '\n  </style>', 1)
ROOT.joinpath('index.html').write_text(source, encoding='utf-8', newline='\n')
worker = '''const HTML = %s;
export default { async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/verslo-augimo-irankiai') { url.pathname += '/'; return Response.redirect(url.toString(), 308); }
  if (url.pathname !== '/verslo-augimo-irankiai/') return new Response('Not found', {status:404});
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status:405,headers:{Allow:'GET, HEAD'}});
  return new Response(request.method === 'HEAD' ? null : HTML, {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}};
''' % json.dumps(source, ensure_ascii=False)
ROOT.joinpath('worker.mjs').write_text(worker, encoding='utf-8', newline='\n')
print(f'Prepared {len(source)} characters')

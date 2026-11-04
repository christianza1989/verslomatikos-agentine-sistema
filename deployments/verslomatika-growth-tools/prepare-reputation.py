from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
original = (root.parent.parent / 'verslomatika_reputacija_landing.html').read_text(encoding='utf-8')
head = original.split('</head>', 1)[0]
head = head.replace('ReputationPro • Google Reviews 5★ Apsaugos ir Augimo Sistema • Verslomatika', 'ReputationPro: klientų atsiliepimų demonstracija | Verslomatika')
head = head.replace('Oficialus Verslomatika ReputationPro įrankis: automatinis 5★ atsiliepimų rinkimas Google Maps tinkle ir privatus neigiamų skundų sulaikymas klinikoms bei servisams.', 'Susipažinkite su kuriamu ReputationPro įrankiu ir klientų atsiliepimų demonstracija. Mokėjimai dar neįjungti.')
head += '''<link rel="canonical" href="https://verslomatika.lt/reputacija/">
<style>
  :root { --bg:#fff; --card-bg:#fff; --card-inner:#f8fafc; --card-border:#e2e8f0; --card-border-hover:#a89af5; --text:#0f172a; --text-muted:#475569; --text-dim:#64748b; }
  header {background:rgba(255,255,255,.97)} .brand-title span.sub,.hero h1 span.highlight,.step-num {color:#5636e8}
  .container.hero,.container.section-space {padding-left:24px;padding-right:24px}
  .badge-pill,.sim-badge {color:#4324d6;background:#f5f3ff;border-color:#ddd6fe} .hero-simulator-wrap {background:#f8fafc;box-shadow:none}
  .star-btn {color:#64748b} .star-btn:hover,.star-btn.active {color:#a15c00} .price-box.featured {background:#13112e;color:white;box-shadow:none}
  .btn-ghost:hover {background:#f5f3ff} footer a {color:#4324d6}
  .demo-notice { padding: 18px 20px; background:#fff8e9; border:1px solid #e5c17d; border-radius:12px; color:#433217; margin-top:22px; line-height:1.6 }
  .note { color:#475569; font-size:14px; line-height:1.65 } .section-space { padding-top:70px; padding-bottom:70px }
  .calculator { max-width:760px; margin:0 auto; padding:28px; border:1px solid #e2e8f0; border-radius:14px; background:#fff }
  .calc-inputs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin:20px 0 }
  .calculator label { display:grid; gap:8px; font-weight:700; font-size:14px } .calculator input { width:100%; padding:12px; border:1px solid #94a3b8; border-radius:8px; font:inherit }
  .calculator output { display:block; font-size:21px; font-weight:800; color:#5636e8; margin:14px 0 }
  .star-btn:focus-visible, a:focus-visible, input:focus-visible { outline:3px solid #5636e8; outline-offset:3px }
  .star-btn { cursor:pointer } .sim-result { min-height:60px; color:#334155; line-height:1.6 }
  .price-box.featured a {color:white} .price-cycle {line-height:1.6} .footer-inner {gap:18px;flex-wrap:wrap}
  @media(max-width:650px) { .calc-inputs {grid-template-columns:1fr} .hero {padding-top:48px} .hero-simulator-wrap {padding:22px} }
</style></head>'''
body = '''
<body><header><div class="container nav-wrap">
<a href="https://verslomatika.lt/" class="brand-logo" aria-label="Verslomatika pradžia"><svg class="brand-svg" width="28" height="29" viewBox="0 0 31 32" aria-hidden="true"><path d="M3 6L14 16 3 26M14 16L24 6M14 16L24 26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="6" r="3.5" fill="#5636e8"/><circle cx="25" cy="26" r="3.5" fill="#157a57"/></svg><span class="brand-title"><span>verslomatika<span class="dot">.</span></span><span class="sep">|</span><span class="sub">ReputationPro</span></span></a>
<nav aria-label="Puslapio navigacija"><ul class="nav-links"><li><a href="/verslo-augimo-irankiai/">Visi įrankiai</a></li><li><a href="#kaip-veikia">Kaip veikia</a></li><li><a href="#kainos">Kainos</a></li><li><a href="#duk">DUK</a></li></ul></nav>
<a href="mailto:tomas@verslomatika.lt?subject=ReputationPro" class="btn-nav">Susisiekti ↗</a></div></header>
<main><section class="container hero"><div><div class="badge-pill"><span>DEMONSTRACINĖ VERSIJA</span></div>
<h1>Klientų atsiliepimai, <span class="highlight">kuriuos lengva išgirsti.</span></h1>
<p class="lead">ReputationPro demonstracija pristato paciento atsiliepimo puslapį ir privačių pastabų peržiūrą vadovo skydelyje. Sprendimas dar rengiamas naudojimui.</p>
<div class="hero-actions"><a href="https://reputacija.verslomatika.lt/" class="btn-main">Atverti demonstraciją ↗</a><a href="#kaip-veikia" class="btn-ghost">Sužinoti daugiau</a></div>
<div class="demo-notice"><strong>Svarbu prieš naudojimą:</strong> dabartinė demonstracija nukreipia lankytojus pagal žvaigždučių įvertinimą. „Google“ draudžia atrankinį viešų atsiliepimų prašymą, todėl ši funkcija turi būti pakeista prieš naudojant su tikrais klientais.</div></div>
<div class="hero-simulator-wrap"><div class="sim-header"><span class="sim-badge">ILIUSTRACINĖ SIMULIACIJA</span></div><h2 style="font-size:20px;text-align:center">Kaip praėjo Jūsų vizitas?</h2><p class="note" style="text-align:center">Pasirinkite įvertinimą. Tai demonstracija be duomenų siuntimo.</p>
<div class="stars-interactive" id="simStars"><button class="star-btn" data-rating="1" aria-label="1 žvaigždutė">★</button><button class="star-btn" data-rating="2" aria-label="2 žvaigždutės">★</button><button class="star-btn" data-rating="3" aria-label="3 žvaigždutės">★</button><button class="star-btn" data-rating="4" aria-label="4 žvaigždutės">★</button><button class="star-btn" data-rating="5" aria-label="5 žvaigždutės">★</button></div><p id="simOutcome" class="sim-result" aria-live="polite">Jūsų nuomonė svarbi nepriklausomai nuo įvertinimo.</p></div></section>
<section id="kaip-veikia" class="container section-space"><div class="section-title"><h2>Kaip atrodo demonstracija</h2><p>Įrankis skirtas parodyti, kaip klientas galėtų pateikti grįžtamąjį ryšį.</p></div>
<div class="workflow-grid"><div class="step-card"><div class="step-num">01</div><h3>Nuoroda</h3><p>Klientas atveria puslapį telefono ar kompiuterio naršyklėje.</p></div><div class="step-card"><div class="step-num">02</div><h3>Įvertinimas</h3><p>Klientas pasirenka įvertinimą ir gali pateikti privačią pastabą.</p></div><div class="step-card"><div class="step-num">03</div><h3>Vadovo skydelis</h3><p>Demonstracijoje vadovas gali peržiūrėti pateiktas pastabas.</p></div><div class="step-card"><div class="step-num">04</div><h3>Tolimesnis parengimas</h3><p>Prieš komercinį naudojimą bus peržiūrėtos atsiliepimų taisyklės, privatumas ir mokėjimai.</p></div></div></section>
<section class="container section-space" style="padding-top:0"><div class="section-title"><h2>Apskaičiuokite hipotetinį scenarijų</h2><p>Įveskite savo prielaidas. Skaičiuoklė nerodo prognozės ar garantuojamos naudos.</p></div><div class="calculator"><div class="calc-inputs"><label>Klientų skaičius per mėnesį<input id="count" type="number" min="0" max="100000" value="1" inputmode="numeric"></label><label>Vieno kliento vertė (€)<input id="value" type="number" min="0" max="1000000" value="100" inputmode="decimal"></label></div><p class="note">Hipotetinis skirtumas = klientų skaičius × kliento vertė − 49 € planuojamas mėnesio mokestis. Neįtraukiamos kitos išlaidos ir mokesčiai.</p><output id="result" aria-live="polite"></output></div></section>
<section id="kainos" class="container section-space"><div class="section-title"><h2>Planuojami pasiūlymai</h2><p>Registracija ir mokėjimai dar neaktyvūs. Funkcijos, kainos bei 14 dienų bandymo sąlygos dar derinamos.</p></div><div class="pricing-grid">
<div class="price-box"><h3>Startas</h3><div class="price-val">29 € <span>/ mėn.</span></div><div class="price-cycle">Svarstomas planas</div><p class="note">Dėl funkcijų ir prieinamumo teiraukitės.</p><a href="mailto:tomas@verslomatika.lt?subject=ReputationPro%20Startas" class="btn-ghost">Teirautis ↗</a></div>
<div class="price-box featured"><h3>Pro</h3><div class="price-val" style="color:white">49 € <span style="color:#ddd6fe">/ mėn.</span></div><div class="price-cycle" style="color:#ddd6fe">Planuojamas 14 dienų bandymas</div><p style="color:#ddd6fe">Bandomasis laikotarpis ir prenumerata dar neįjungti.</p><a href="mailto:tomas@verslomatika.lt?subject=ReputationPro%20Pro" class="btn-main">Teirautis ↗</a></div>
<div class="price-box"><h3>Metinis</h3><div class="price-val">290 € <span>/ metus</span></div><div class="price-cycle">Svarstomas planas</div><p class="note">Dėl funkcijų ir prieinamumo teiraukitės.</p><a href="mailto:tomas@verslomatika.lt?subject=ReputationPro%20metinis" class="btn-ghost">Teirautis ↗</a></div></div></section>
<section id="duk" class="container section-space" style="padding-top:0"><div class="section-title"><h2>Dažniausi klausimai</h2></div><div class="faq-list"><details class="faq-item"><summary>Ar galima užsiregistruoti ir mokėti? <span>▼</span></summary><p>Kol kas ne. Mokėjimai ir prenumeratos dar neįjungti.</p></details><details class="faq-item"><summary>Ar dabartinis demonstracinis srautas atitinka „Google“ taisykles? <span>▼</span></summary><p>Ne. Atrankinis prašymas palikti viešą atsiliepimą pagal įvertinimą draudžiamas. Funkcija turi būti pakeista prieš naudojant su tikrais klientais.</p></details><details class="faq-item"><summary>Ar galiu jau išbandyti paciento puslapį? <span>▼</span></summary><p>Galite peržiūrėti demonstraciją. Nesiųskite tikrų pacientų ar sveikatos duomenų.</p></details></div></section></main>
<footer><div class="container footer-inner"><span>verslomatika. | ReputationPro</span><span>Operatorius: MB Pinet • Vilnius, Lietuva • info@pinet.lt</span><a href="/verslo-augimo-irankiai/">Visi įrankiai</a><a href="mailto:tomas@verslomatika.lt">Susisiekti</a></div></footer>
<script>
const result=document.getElementById('result'), count=document.getElementById('count'), value=document.getElementById('value');
function calculate(){const n=Number(count.value),v=Number(value.value); if(count.value===''||value.value===''||!Number.isFinite(n)||!Number.isFinite(v)||n<0||v<0||n>100000||v>1000000){result.textContent='Įveskite leistinas neneigiamas reikšmes.';return;} result.textContent='Hipotetinis skirtumas: '+new Intl.NumberFormat('lt-LT',{style:'currency',currency:'EUR'}).format(n*v-49)+' / mėn.';}
count.addEventListener('input',calculate);value.addEventListener('input',calculate);calculate();
document.querySelectorAll('#simStars button').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.rating);document.querySelectorAll('#simStars button').forEach((s,i)=>{s.classList.toggle('active',i<n);s.setAttribute('aria-pressed',String(i===n-1));});document.getElementById('simOutcome').textContent='Pasirinkote '+n+' iš 5. Visų įvertinimų nuomonė yra svarbi; viešo atsiliepimo galimybė turi būti vienoda.';}));
</script></body></html>'''
html = head + body
tools = (root / 'index.html').read_text(encoding='utf-8')
old = '<div class="flagship-actions">'
new = '<div class="flagship-actions">\n              <a href="/reputacija/" class="btn-ghost"><span>Apie ReputationPro ↗</span></a>'
assert tools.count(old) == 1
tools = tools.replace(old, new)
(root / 'reputation-reviewed.html').write_text(html, encoding='utf-8', newline='\n')
(root / 'tools-reviewed.html').write_text(tools, encoding='utf-8', newline='\n')
worker = '''const TOOLS_HTML = %s;
const REPUTATION_HTML = %s;
export default { async fetch(request) {
  const u = new URL(request.url);
  if (u.pathname === '/verslo-augimo-irankiai' || u.pathname === '/reputacija') {u.pathname += '/'; return Response.redirect(u.toString(),308);}
  let html = u.pathname === '/verslo-augimo-irankiai/' ? TOOLS_HTML : u.pathname === '/reputacija/' ? REPUTATION_HTML : null;
  if (html === null) return new Response('Not found',{status:404});
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}};
''' % (json.dumps(tools, ensure_ascii=False), json.dumps(html, ensure_ascii=False))
(root / 'worker-reviewed.mjs').write_text(worker, encoding='utf-8', newline='\n')
for name, contents in [('tools',tools),('reputation',html)]: print(name,len(contents.encode()),hashlib.sha256(contents.encode()).hexdigest())

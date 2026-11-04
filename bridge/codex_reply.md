# ReputationPro saugumo pataisa — 2026-10-28

Paskelbta `.next-safety3-20261028`: nauja registracija ir senos registracijos nuorodos uždarytos, demonstracinių paskyrų slaptažodžiai, jau išduoti seansai ir slaptažodžio atkūrimas laikinai neveikia, nes ankstesnis kodas neužtikrino savininko tapatybės. Savininko prieiga patikrinta, Stripe lieka išjungtas; `/checkout` tai aiškiai rodo, API POST grąžina 503. 16 testų, izoliuota DB / senų seansų / savininko / tenant patikra, build ir vieši HTTP bei desktop/mobile testai praėjo. SQLite backup patikrinta ir duomenys identiški; saugios išleidimo detalės `apps/reputationpro/DEPLOYMENT.md`. Keturių esamų demo prisijungimų kilmė nepatvirtinta: jų prieiga sustabdyta, bet ankstesnio galimo naudojimo šis pakeitimas nei paneigia, nei įrodo. Nė vienai iš šių 4 paskyrų patikros metu nesusieta privati žinutė. Esamos informacijos netrinti ir senos pažeidžiamos versijos negrąžinti; prireiks atskiro saugaus savininkų tikrinimo. Tikrų profilių perėmimo bandymo neatlikta.

---

# TASK-005 papildymas — produkto puslapio nuoroda

- Pagrindinė sesija paskelbė `https://verslomatika.lt/reviveleads/`. Atnaujintoje subdomeno versijoje pridėta nuoroda „Apie ReviveLeads“ į šį puslapį, išlaikant demonstracinį statusą. Aktyvus build `.next-product-20261027`, ankstesnis `.next` išsaugotas. 3 unit testai, atskiras build, localhost ir tikro HTTPS desktop/mobile naršyklės patikros praėjo. Vieši /, /demo, /checkout, health – 200; admin – 404; ReputationPro sveikatos patikra – 200. SQLite kopija prieš perjungimą patikrinta; detali grąžinimo procedūra `apps/reviveleads/DEPLOYMENT.md`.

---

# TASK-005 — ReviveLeads pradinis prototipas paskelbtas (2026-10-27)

- Sukurtas `apps/reviveleads`, Next.js 15.5.28, TypeScript, Tailwind, SQLite; vietinis serveris veikia 127.0.0.1:3002, viešas adresas https://reviveleads.verslomatika.lt/ . Po kompiuterio perkrovimo serverį ir esamą tunelį reikės paleisti iš naujo.
- `/demo` interaktyviai parodo iš anksto nustatytus atsakymus ir pavyzdinį laiką. `/checkout` parodo svarstomus 29 €/mėn., 49 €/mėn., 290 €/metus ir 14 d. bandymą; **registracija ir mokėjimai išjungti**. SMS, DI ir kalendoriaus integracijos neveikia; tai aiškiai nurodyta sąsajoje.
- `/admin` ir jos API veikia tik lokaliai, viešame subdomene grąžina 404. Lokalus skydelis leidžia sukurti įmonę, importuoti CSV/XLSX ir sukurti kampanijos juodraštį, bet nesiunčia SMS. Įmonės / kontaktai / kampanijos / rezervacijos SQLite lentelės sukurtos ir po testų tuščios. Naudoti tik testinius kontaktus. Lokalus slaptažodis sugeneruotas `.env.local`, failas ir data katalogas apsaugoti Windows ACL; slaptažodžio neviešinti.
- Prie esamo `reputationpro-lenovo` Cloudflare Tunnel pridėtas atskiras 3002 ingress, CNAME `c3032cdf745ad1b9202fd46959ec63a3` ir hostname apribota HTTPS 308 taisyklė `199d11a79f2f4d918ba1824b39ebf1f8`. Kiti DNS ir pašto įrašai nepakito, reputacija ir pagrindinė svetainė veikia. Detalus saugus atšaukimas ir ID: `apps/reviveleads/DEPLOYMENT.md`.
- `npm run build`, 3 unit testai, izoliuota lokali HTTP / CSV / prisijungimo / mobilios naršyklės priėmimo patikra bei tikros viešos HTTPS demonstracijos desktop/mobile patikra praėjo. `npm audit --omit=dev` 0 žinomų pažeidžiamumų. `/api/health` 200 lokaliai ir viešai; viešas `/admin`, slaptažodis ir SQLite HTTP keliuose – 404.
- `https://verslomatika.lt/reviveleads/` kol kas 404; pagrindinės svetainės sesijai perduota suderinti puslapį su architektūra ir tikra produkto būsena. Pradinis Antigravity HTML klaidinančiai aprašo dar neprijungtus SMS / AI / mokėjimus ir nurodo nepatikrintą PVM; nepateikti kaip jau veikiančio produkto.
- Iki komercinio starto trūksta tikrų SMS / kalendoriaus / DI integracijų, klientų saugių paskyrų, teisėto kontaktų bei sutikimų tvarkymo, duomenų saugojimo / trynimo, operacinio patikimumo ir mokėjimų. Ankstesnis savininko nurodymas **kol kas nekurti gyvo Stripe rakto** galioja; Stripe raktai šiai programai nekurti.

---

# TASK-003 papildymas: klinikų prieigos ir Stripe parengimas — 2026-10-27

- Savininkas aiškiai nurodė **kol kas nekurti gyvo Stripe rakto**. Rakto kūrimo forma atšaukta; gyvas API raktas ir webhook paslaptis nenustatyti, registracija ir mokėjimai neįjungti. Neinterpretuoti kaip sutikimo kurti raktą vėliau.
- Šaltiniuose ir atskirame build `.next-clinic-access-20261027` parengtos nepriklausomos klinikų paskyros: scrypt slaptažodžiai, atskiri seansai, konkrečios klinikos duomenų ir API autorizacija, el. pašto nuosavybės patvirtinimas, vienkartinis 30 min. slaptažodžio atkūrimas, senų seansų panaikinimas. Esamas savininko prisijungimas išlaikytas.
- Stripe registracija naudotų 14 dienų bandymą ir 49 EUR/mėn. kainą, aktyvinimą iš pasirašyto webhook, kartojamų checkout užklausų idempotentiškumą, prenumeratos būsenos tikrinimą ir Stripe savitarną. Nauji įvertinimai leidžiami trialing/active/past_due; canceled/unpaid/paused naujų nesurenka, bet klinika gali prisijungti prie savo duomenų ir prenumeratos valdymo. Verslomatikos esama demonstracija išsaugota. Mokėjimai įjungiami tik nustačius gyvą raktą, webhook, SMTP, savitarnos konfigūraciją ir atskirą STRIPE_LIVE_READY.
- MB „Memocasting“ paskyroje sukurta `bpc_1UVFRvL0g8f3vxfNjsqpUcBf` ReputationPro savitarna: sąskaitų istorija, mokėjimo būdo keitimas, atšaukimas laikotarpio pabaigoje. Kadangi prieš sukuriant paskyroje savitarnos konfigūracijų nebuvo, Stripe ją pažymėjo numatytąja visoje paskyroje; ji nėra prijungta prie programos. Kitų esamų paskyros konfigūracijų nekeista.
- Rasta esama Domenai.lt / Oradomail pašto konfigūracija, SMTP autentifikacija patvirtinta be laiško siuntimo. Programai reikalingos konfigūracijos kopija įrašyta privačiame Windows ACL apsaugotame `apps/reputationpro/data/operations/reputation-private` aplanke. Nepublikuoti, nesidalinti, nespausdinti paslapčių.
- 15 vienetinių testų ir izoliuotas sukompiliuotos programos HTTP / mobilios naršyklės testas praėjo. Registracija, vietinis SMTP, vienkartinės nuorodos, bandomas vietinis Stripe API imitatorius, pasirašytas webhook, prisijungimas, duomenų atskyrimas ir savitarna išbandyti su atskira laikina baze; realių duomenų ar mokėjimų testas neatliktas. Ankstesnis tikras Stripe sandbox testas atliktas prieš šiuos pakeitimus; per jį atskleisti **tik bandomosios aplinkos** du raktai turi būti savininko pakeisti / panaikinti.
- Naujas build **nepaskelbtas**: aktyvus `.next-memocasting2-20261027`, vieša demonstracija, homepage ir checkout grąžina 200. Gyvų klinikų registracija neprieinama. Tik prieš paleidžiant reikia išspręsti patikimų Stripe kredencialų klausimą, patikrinti naują pilną kelią tikroje izoliuotoje sandbox, parengti komercines ir BDAR sąlygas, klinikų duomenų pašalinimą ir atsarginių kopijų atkūrimo procedūrą. Programa šiuo metu priklauso nuo naudotojo kompiuterio veikimo.
- Automatinio naujos prenumeratos užsakymo po galutinio atšaukimo dar nėra; past_due malonės laikotarpio trukmė nenustatyta. Šių dalykų nežadėti kaip veikiančių.
- Kitos Verslomatikos sesijos ruošinys peržiūrai: `C:/Users/Lenovo/Documents/verslomatika-v2-website/artifacts/reputation-provider-20261027/REPUTATIONPRO-KOMERCINES-IR-DUOMENU-SALYGOS-PROJEKTAS.md`. Vaidmenys, saugojimo terminai ir subrangovų sutartys nepatvirtinti. Nežymėti parengto kodo ar Stripe savitarnos kaip gyvų mokėjimų paleidimo.

---

# TASK-003 — Verslo augimo įrankių puslapis ir Stripe

## TASK-003 pakartotinė patikra — dalinai atlikta

- Naujausiame užduoties faile prašoma įjungti gyvus Stripe mokėjimus. Savininko parinkta MB „Memocasting“ gyva paskyra prieinama per Stripe jungtį; aktyvi 49 EUR per mėnesį kaina patikrinta. 14 d. bandymas ir sėkmingo / nesėkmingo atnaujinimo bei atšaukimo webhook ciklai ankstesniame darbe patikrinti izoliuotame Stripe sandbox.
- Naujos patikros metu gyvos paskyros 4 esami webhook endpointai išvardyti tik skaitymui; `reputacija.verslomatika.lt` webhook tarp jų nėra. `.env.local` Stripe API raktas ir webhook paslaptis tušti, kainos ID nustatytas. Viešas `/checkout` rodo, kad registracija neprieinama, ir Stripe gyvai neįjungta. Gyvo webhook į dar neparuoštą 503 atsakantį serverį nesukurti, kad netrikdyti kitų MB „Memocasting“ prenumeratos įvykių.
- Patikrinta esama programos apsauga: `src/app/admin/page.tsx` per `isAdmin()` suteikia vienam sistemos savininkui visų klinikų pasirinkimą, o `src/app/api/auth/login/route.ts` autentiﬁkuoja tik bendrą `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Klientams nėra atskirų paskyrų ar prieigos atskyrimo; atsiliepimų, QR ir eksporto endpointai taip pat remiasi vien šia bendra administratoriaus sesija. Prenumeratos būsena nevaldo klinikos prieigos. Realių klientų nereikėtų registruoti ar apmokestinti, kol šie konkretūs darbai ir paslaugos bei privatumo sąlygos neparengtos ir nepatikrintos.
- Rekomenduojama kito darbo apimtis: atskiros klinikų paskyros ir seansai, visų skaitymo ir keitimo API serverinis apribojimas pagal kliniką, saugus prisijungimo atkūrimas, bandomų prenumeratos būsenų ir klientų portalo srautų testai; tuomet atskirai sukurti minimaliai apribotą gyvą raktą, pasirašytą webhook, patikrinti paslaugos teikėjo / mokesčių nustatymus ir tik tada įjungti mokėjimus. Nespausdinti ir nesiųsti gyvų raktų į tiltą ar pokalbį.
- 2026-10-27 pakartotinai: visi 12 unit testų ir `tsc --noEmit --incremental false` praėjo. Abu pagrindinės svetainės puslapiai, ReputationPro sveikatos endpointas ir checkout HTTP 200; checkout registracija išjungta. Aktyvus paketas `.next-memocasting2-20261027`. Google demonstracijai savininkas vėliau pasirinko patikrintą Memocasting profilį; atskiras Verslomatikos profilis lieka nepatvirtintas. Konkuruojančio Worker maršruto pridėti nereikia: pagrindinės svetainės sesija abu maršrutus jau integravo į savo bendrą Worker.
- Saugumo incidentas išlieka atviras: savininkas dar nepatvirtino, kad pakeitė / panaikino abu bandomosios Stripe sandbox aplinkos raktus, atskleistus įrankio išvestyje. Gyvi Stripe raktai nebuvo atskleisti.

## „Memocasting“ demonstracija — paskelbta

- Savininkas paprašė naudoti jo esamą „Rankų Liejimo Rinkinys – Memocasting“ Google profilį vietoje naujai kuriamo Verslomatikos profilio. Sukurtas atskiras demonstracinis klientas ir paskelbtas https://reputacija.verslomatika.lt/r/memocasting ; pagrindinio produkto puslapio demonstraciniai mygtukai veda į šį adresą. Ankstesnis `/r/verslomatika` ir jo įrašas išsaugoti.
- Google atsiliepimo vietos ID gautas iš tikro savininko nurodyto profilio Google atsiliepimų lango. Patikrinus atskira Google paskyra atsidarė būtent „Rankų Liejimo Rinkinys – Memocasting“ atsiliepimo forma. Atsiliepimas nerašytas ir neskelbtas. Demo aiškiai žymi tikrą profilį, paprašo viešai atsiliepti tik turėjus tikrą patirtį; privati forma išlieka demonstracinė.
- Visi 1–5 vertinimai toliau pateikia vienodą neprivalomą privataus / Google pasirinkimą; 12 unit testų ir izoliuota Playwright patikra praėjo. Aktyvus `.next-memocasting2-20261027`, SQLite kopijos padarytos, gyvi keliai ir admin apsauga patikrinti. Tikri Stripe mokėjimai toliau išjungti. Leidimo ir grąžinimo duomenys `apps/reputationpro/data/operations/memocasting-release.json`, `DEPLOYMENT.md`.
- Stripe sandbox standartinį ir ribotą API raktus, kurie buvo parodyti įrankio išvestyje, savininkui vis dar reikia pakeisti / panaikinti; apie atlikimą patvirtinimo negauta.

## 2026-10-27 — ReputationPro pasiekiamumas atkurtas

- Po serverio ir Cloudflare Tunnel procesų sustojimo vėl paleistas tas pats aktyvus `.next-equal-choice-20261027` paketas ir jo tunelis. Viešai `/api/health`, `/`, `/r/verslomatika` ir `/checkout` grąžina HTTP 200; anoniminis `/admin` — 307. Stripe nustatymai nekeisti, mokėjimai neįjungti. Sistema priklauso nuo įjungto kompiuterio ir aktyvių procesų.

## Stripe — sandbox patikrintas, komercinis paleidimas dar neatliktas

- Savininkas patvirtino sandbox ribotą API raktą, papildomą Debugging Tools teisę ir įvedė Stripe reikalautą autentifikavimo kodą. Atskiras `ReputationPro Sandbox` naudojamas su atskira SQLite; gyva DB bandymo įvykiais neužteršta.
- Tikrame Stripe sandbox per Checkout ir pasirašytus CLI webhook įvykius patikrinti: 14 d. bandomoji prenumerata, bandomas atšaukimas, sėkmingas 49 EUR pirmasis atnaujinimas po testinio laikrodžio persukimo (`active`) ir atmestas atnaujinimas (`invoice.payment_failed`, `past_due`). Jokia tikra kortelė ar tikri pinigai nenaudoti. 12/12 unit testų, TypeScript, atskiras build, 5/5 izoliuotos naršyklės regresijos ir parašų / dubliuotų įvykių testai praėjo.
- Gyvai paskelbtas `.next-stripe-prep2-20261027`, ankstesnis `.next-equal-choice-20261027` išsaugotas. Viešas checkout nurodo MB „Memocasting“ ir kad registracija išjungta; pagrindinis, demo ir checkout HTTP 200, anoniminis admin 307. Prieš perjungimą padaryta SQLite backup API kopija, vientisumas patikrintas, pagrindinių lentelių turinys po perjungimo atitiko kopiją. Žr. `apps/reputationpro/data/operations/stripe-prep2-release.json` ir `DEPLOYMENT.md`.
- Tikri mokėjimai dar neaktyvūs: nėra gyvo API rakto ir webhook, klinikų atskiros saugios prieigos, prenumeratos prieigos taikymo, išbaigtų paslaugos / privatumo sąlygų ir mokesčių patikros. `STRIPE_LIVE_READY` apsaugo nuo atsitiktinio įjungimo. Nelaikyti 49 EUR kainos paskyroje įrodymu, kad mokėjimai veikia.
- Incidentas: per Stripe sandbox API keys puslapio prieinamumo išvestį buvo atskleisti du bandomosios aplinkos raktai: standartinis ir ribotas integracijos raktas. Gyvos paskyros raktai neatskleisti. Savininkas turi Stripe dashboard pakeisti / panaikinti abu paveiktus sandbox raktus; jų reikšmių neįrašyti į ataskaitą ar žinutes. Bandomasis serveris ir CLI sustabdyti.

## Stripe — atnaujinimas 2026-10-27

- Savininkas patvirtino: sutartinė ReputationPro paslaugos teikėja ir sąskaitų išrašytoja yra MB „Memocasting“; ji nėra PVM mokėtoja. Checkout viršuje turi būti prekės ženklas „Verslomatika“. Pagrindinės svetainės sesijai perduota suderinti juridinius tekstus, nevaizduojant mokėjimų aktyviais.
- MB „Memocasting“ Stripe gyvoje paskyroje sukurtas ir pakartotinai patikrintas produktas `Verslomatika ReputationPro – Pro` (`prod_VWGTbrEGB7JEYS`) su 49 EUR / mėn. kaina `price_1UVDwhL0g8f3vxfN9UoPU5V1`. Kainos ID įrašytas į vietinį `.env.local`; pats kainos sukūrimas mokėjimo nepradeda. 14 dienų bandymas nustatomas Checkout sesijoje, ne kainos objekte. API raktas ir webhook paslaptis vis dar tušti; gyvi mokėjimai neišbandyti ir neįjungti.
- Parengti šaltinio pakeitimai: Checkout sesijos `branding_settings.display_name=Verslomatika` nekeičia visos Stripe paskyros ženklo; aiškiai rodoma sutartinė paslaugos teikėja. Sąskaitos ir kvitai naudoja atskirus Stripe paskyros nustatymus. Webhook apdoroja prenumeratos ir sąskaitų sėkmės / nesėkmės įvykius, būseną pririšdamas prie Stripe prenumeratos ID ir ribodamas metadata atsarginį naudojimą tik laukiančiai naujai prenumeratai.
- 11/11 izoliuotų Node testų, TypeScript ir atskiro paketo `.next-stripe-prep-20261027` build praėjo. Atskirame procese su laikina DB ir fiktyviomis paslaptimis HTTP webhook atmetė blogą parašą, priėmė pasirašytą įvykį ir pakartojimą įrašė vieną kartą. Tai nėra tikros Stripe sandbox Checkout, mokesčių, webhook pristatymo ar prenumeratos ciklo patvirtinimas. Parengtas paketas nėra aktyvuotas; veikiantis `.next-equal-choice-20261027` liko nepakeistas.
- Tęsimui būtina prisijungti atskirą Stripe sandbox, saugiai gauti tik tam skirtus ribotus API ir webhook kredencialus (jų nesiųsti tilte ar pokalbyje), atlikti pilną checkout ir prenumeratos ciklo patikrą. Prieš realius klientus taip pat reikia išspręsti savarankišką klientų prieigą / prenumeratos būsenos taikymą, paslaugų ir privatumo sąlygas, faktines mokesčių prievoles bei suderinti Stripe paskyros kontaktus ir veiklos aprašymą; dabartinis paskyros aprašymas nurodo dovanų veiklą.
- Senesnės Stripe pastabos žemiau yra ankstesnė būklė; jų nenaudoti kaip naujausios ataskaitos.

## Google Business Profile — sukurtas, laukia patvirtinimo

- Savininkas patvirtino, kad klientus priima gyvai. Sukurtas profilis `Verslomatika`, kategorija `Software company`, svetainė `https://verslomatika.lt/`. Išsaugotas savininko nurodytas adresas **Konstitucijos pr. 15, Vilnius, LT-09319**; formoje aptikta namo numerio klaida ištaisyta ir patikrinta profilio valdyme. Nenurodyti neišgalvoti darbo laikai ir telefono numeris.
- Google valdymo skydelyje rodo, kad profilis **nepatvirtintas ir klientams nematomas**. Atsiliepimų skydelis nurodo, kad reikia patvirtinti profilį. Paspaudus `Get verified` forma neužsikrovė, todėl Google pasiūlytas būdas dar nežinomas; SMS negarantuota. Reikia tęsti patvirtinimą pačioje Google paskyroje, kai forma užsikraus.
- Nėra patikrintos tiesioginės atsiliepimų nuorodos. `clients.slug=verslomatika` esamas `google_review_url` tėra Maps paieška; šio darbo metu duomenų bazė nekeista. Gavus realią veikiančią nuorodą, prieš tikslinį vieno lauko atnaujinimą padaryti SQLite backup ir išsaugoti kitus duomenis. Nevadinti esamos eilutės apmokėta vien dėl `subscription_status=active`: Stripe ID nėra.
- Profilio aptarnavimo zona `Lithuania`; savininkas patvirtino, kad vyksta pas klientus visoje Lietuvoje. Kitos svetainės sesija informuota, kad profilis dar nepatvirtintas, o atsiliepimų nuoroda negauta.
- Pagrindinės svetainės puslapiai integruoti į pagrindinę architektūrą. Stripe mokėjimai dar neįjungti: trūksta aplikacijos Stripe rakto, webhook paslapties ir 49 EUR kainos ID; realus Checkout neišbandytas.
- Google šaltiniai: https://support.google.com/business/answer/13763036 ir https://support.google.com/business/answer/16816815 .

## Vienodas atsiliepimų pasirinkimas — paskelbta

- Savininko paleistame izoliuotame 3001 serveryje praėjo visi 3 atrinkti Playwright testai: 1–5★ pasirinkimai vienodi ir be automatinio nukreipimo, 5★ privati žinutė išsaugoma ir matoma prisijungusiam savininkui, neleistinas įvertinimas / trūkstamas sutikimas atmetami. Anksčiau praėjo 10/10 izoliuotų unit testų, build, API testas ir senos bazės kopijos migracijos patikra.
- Viešai perjungtas `.next-equal-choice-20261027` paketas; senas `.next-product-link-20261027` išsaugotas. Gyva SQLite prieš perjungimą saugiai nukopijuota SQLite backup API; 1 esama žinutė išliko nepakitusi, CHECK leidžia 1–5, integrity_check OK. Kopijos vieta ir įrodymų metaduomenys `apps/reputationpro/data/operations/equal-choice-release.json`.
- Po perjungimo viešai patikrinti `/`, `/api/health`, `/r/vilniaus-denta`, `/checkout`, `/privacy` — 200; anoniminis `/admin` — 307. Pagrindinės Verslomatika sesijos paprašyta atnaujinti produkto puslapyje galimai pasenusį paaiškinimą apie automatinį nukreipimą.
- Senoji pastaba žemiau, kad pataisa dar nepaskelbta, yra ankstesnė chronologinė būsena. Stripe mokėjimai vis dar neįjungti. Grąžinimo eiga ir įspėjimas nenaikinti naujų duomenų atstatant seną kopiją — `apps/reputationpro/DEPLOYMENT.md`.

## Vienodas atsiliepimų pasirinkimas — paruošta, dar nepaskelbta

- Savininkas tiesiogiai patvirtino vienodą neprivalomą pasirinkimą visiems 1–5★. Paruošta nauja sąsaja, pašalinanti automatinį Google nukreipimą ir po kiekvieno įvertinimo pateikianti privačios žinutės bei viešos Google nuorodos pasirinkimą. Serveris priima privačias žinutes visiems penkiems įvertinimams, admin 4–5★ statistika nebevadinama Google paspaudimais.
- SQLite migracija iš 1–3 į 1–5 parengta kaip transakcinis lentelės atkūrimas su schemos ir priklausomybių patikra. Ji išlaiko esamas žinutes, būsenas ir laikus. Patikrinta su laikina tikros DB kopija (išsaugota 1 esama žinutė, naujas 5★ įrašas priimtas, integrity_check OK); tikroji DB dar nemigruota.
- Atskirame `.next-equal-choice-20261027` build TypeScript praėjo, 10/10 testų praėjo; sukompiliuotų API handlerių testas su atskira SQLite baze patvirtino, kad visi 1–5★ grąžina sėkmę be nukreipimo, priima privačias žinutes, o 6★ atmetamos.
- Viešai nauja versija **dar nepaskelbta**. Automatinė leidimų patikra atmetė izoliuoto testinio serverio paleidimą, nurodydama tik „blocked by policy“; todėl naršyklės patikra dar neatlikta. Parengtas `scripts/start-equal-choice-test.ps1`, kurį savininkas gali paleisti savo PowerShell lange: jis naudoja atskirą laikiną testinę bazę ir 3001 portą. Po to agentas gali paleisti atitinkamus izoliuotus Playwright testus, padaryti realios bazės SQLite backup, saugiai perjungti paketą ir patikrinti.
- Gyva programa vis dar naudoja `.next-product-link-20261027`; jos ankstesnis srauto skirstymas nepasikeitęs. Pagrindinės svetainės sesija informuota; DNS, pagrindinio domeno maršrutai ir gyvos DB turinys dėl šios užduoties nepakeisti.

## Pagrindinės svetainės integracija — naujausia būsena

- Pagrindinės Verslomatika sesijos pranešimu `/reputacija/` ir `/verslo-augimo-irankiai/` integruoti į `verslomatika-v2-website`, bendrą navigaciją, sitemap ir llms indeksus. Ji išsaugojo suplanuotų straipsnių grafiką; šiuos pakeitimus atliko ta sesija.
- Nepriklausomai patikrinta: abu adresai su galiniu `/` grąžina 200, be jo — 308 į kanoninį adresą. Cloudflare zonos Worker routes sąrašas dabar tuščias, todėl ankstesni laikini du tikslūs growth Worker maršrutai nebeaktyvūs. `reputacija.verslomatika.lt/api/health` grąžina 200.
- Tolimesnius pagrindinio domeno puslapių pakeitimus koordinuoti su savininko paskirta Verslomatika sesija. Nekurti atskirų konkuruojančių Worker maršrutų. Žemiau senesniame chronologiniame įraše buvęs `/reputacija/` 404 bei du augimo įrankių Worker maršrutai aprašo ankstesnę, jau pasikeitusią būseną.

## Po perkrovimo: serveris atkurtas, produkto tekstai patikslinti

- `reputacija.verslomatika.lt` vėl pasiekiama; buvo 530, nes po Windows perkrovimo neveikė vietinis serveris ir tunelis. Vėl paleistas Next.js serveris ir `reputationpro-lenovo` tunelis, Cloudflare būklė healthy. Šiuo metu `/`, `/api/health`, `/r/vilniaus-denta`, `/checkout` ir `/privacy` grąžina 200, anoniminis `/admin` — 307 į prisijungimą. Serveris veikia tik kol kompiuteris ir procesai veikia; automatinio paleidimo nėra.
- Produkto viešuose tekstuose pašalinti nepagrįsti oficialios nepriklausomos priežiūros, BDAR atitikties, momentinių laiškų ir fizinių stovelių pažadai. Klaidinantis klinikų paieškos laukas pakeistas aiškia testinės anketos nuoroda. Mokėjimai ir planai įvardyti pagal esamą būklę.
- Pataisyta programa pirma surinkta į atskirą `.next-review-20261027`, patikrinta 3001 porte, o paskui perjungta į 3000 portą. Ankstesnis `.next` paketas išsaugotas. Aktyvi versija saugoma `data/operations/active-build`, paleidimo ir grąžinimo eiga — `apps/reputationpro/DEPLOYMENT.md`. SQLite ir esami nustatymai neperrašyti.
- `npm test`: 9/9. Atskiras Next.js build su TypeScript praėjo. Visos trys viešos planų peržiūros patikrintos: jose nėra pašalintų neįgyvendintų paslaugų pažadų, mokėjimai nurodyti kaip neaktyvūs.
- Buvusi žvaigždučių nukreipimo logika nepakeista: 4–5★ vis dar nukreipia, 1–3★ atveria privačią formą. Tiesioginio savininko paprašyta pasirinkti, ar pakeisti ją į vienodą neprivalomą pasirinkimą visiems, nes taip keičiamas ankstesnis aiškus jo reikalavimas. Google draudžia atrankinį viešų atsiliepimų prašymą.
- MB Memocasting Stripe jungtis prieinama, bet programos Stripe API ir webhook paslaptys bei kainos ID nenustatyti, 49 EUR/mėn. kainos ir realaus mokėjimo veikimas nepatikrinti. Užsakymų ir tikrų prenumeratų neaktyvinome.
- Savininko paskirta pagrindinės Verslomatika svetainės sesija perėmė `/reputacija/`, `/verslo-augimo-irankiai/`, bendros navigacijos ir SEO/GEO integravimą. Peržiūrėtas puslapio šaltinis jai perduotas. Šio darbo metu pagrindinio domeno failai ir maršrutai nekeisti; iki jų integravimo `/reputacija/` grąžino 404.

## 2026-10-27 atnaujinimas — sustabdyta prieš kompiuterio perkrovimą

- Naujoji Antigravity užduotis prašo įkelti `/reputacija/`. **Viešas Worker ir maršrutai dar nepakeisti**, nes savininkas nurodė perkrauti kompiuterį. `/reputacija/` šio darbo pradžioje buvo 404.
- Vietoje paruošti `deployments/verslomatika-growth-tools/reputation-reviewed.html`, `tools-reviewed.html`, `worker-reviewed.mjs` ir atkartojamas rengimo kodas `prepare-reputation.py`. Antigravity originalūs `verslomatika_reputacija_landing.html` ir `worker.mjs` nepakeisti. Worker SHA-256 `66195b2f8fcf84ac54ad7580d34cc940dbefbddbeaf9045b87d0a3eda14985c6`, Reputation HTML `bd58346bb30523cf4af8129a4add7d4445c7b48a708ec24fc4ae565022666c2b`.
- Viešinimo kopijoje pašalinti nepagrįsti reitingų ir pajamų pažadai, aiškiai pažymėta neaktyvi prenumerata ir atsiliepimų atrankos neatitiktis Google taisyklėms; veikia iliustracinė žvaigždučių demonstracija ir hipotetinių prielaidų skaičiuoklė. 29/290 planai pažymėti svarstomais.
- Node lokaliai patikrino abiejų puslapių GET, HEAD, 308 nukreipimą ir 405/404 atsakymus. Naršyklėje patikrintas dizainas, įvertinimas ir skaičiuoklė (2 × 100 − 49 = 151 €). Naršyklėje patikrintas tik darbalaukio dydis; mobilią peržiūrą ir viešą patikrą reikia baigti po perkrovimo.
- Iki pakeitimo gyvas `verslomatika-growth-tools` etag buvo `6d4ae87bcf63176662837b91b8d194681ea1b77030b521bf7176947b45e94458`. Prieš įkeliant būtina iš naujo patikrinti Cloudflare Worker ir maršrutus, nes kita savininko sesija rengia integraciją į pagrindinę svetainę. Pridėti tik tikslius `/reputacija` ir `/reputacija/` maršrutus, išsaugoti kitus maršrutus, patikrinti viešą turinį bei seno puslapio veikimą, prireikus atšaukti tik šio darbo pakeitimus.
- Stripe jungtis dabar veikia ir grąžina savininko pasirinktą gyvą MB Memocasting paskyrą. Paskyroje rastos tik dvi aktyvios USD kainos, tinkamos 49 EUR/mėn. kainos nėra. Aplikacijoje vis dar trūksta Stripe API rakto, webhook paslapties ir kainos ID; realūs mokėjimai nei įjungti, nei išbandyti. Bandomoji aplinka kol kas nepatvirtinta. Tęsti po perkrovimo, prieš aktyvuojant patikrinti paslaugos teikėjo ir sąskaitų duomenis.
- `reputacija.verslomatika.lt` aptarnaujama per vietinį kompiuterį ir tunelį; perkrovus reikia patikrinti bei prireikus vėl paleisti aplikaciją ir tunelį pagal `apps/reputationpro/DEPLOYMENT.md`. Nežudyti ir nekeisti kitų procesų.

Data: 2026-10-27. Būsena: **IŠ DALIES ATLIKTA — puslapis paskelbtas; Stripe laukia autorizacijos.**

## Puslapis

- Viešas adresas: https://verslomatika.lt/verslo-augimo-irankiai/ — HTTP 200; variantas be galinio `/` grąžina 308 į kanoninį adresą.
- Originalus Antigravity HTML išsaugotas. Skelbimo kopija, pritaikyta prie šviesios violetinės Verslomatika dizaino sistemos ir oficialaus ženklo, yra `C:\Users\Lenovo\Documents\Agentai\deployments\verslomatika-growth-tools\index.html`; atkūrimo kodas yra to paties aplanko `prepare.py`, Worker šaltinis `worker.mjs`.
- Viešo HTML SHA-256: `2f3df1c003188a27f4ccb17c88a9a0d2c922799cd50b6af014c574c57d81cf90`; terminalu palygintas su skelbimo kopija — identiškas.
- Kuriami įrankiai pažymėti kaip planuojami, nepatvirtintos kainos ir garantijos pašalintos, mokėjimai pažymėti kaip neaktyvūs. Įspėta, kad atrankinis viešų atsiliepimų prašymas pagal įvertinimą neatitinka Google taisyklių ir prieš naudojimą turi būti pakeistas.
- Puslapį pateikia atskiras Cloudflare Worker `verslomatika-growth-tools`, tik dviem tiksliais maršrutais `verslomatika.lt/verslo-augimo-irankiai` ir `verslomatika.lt/verslo-augimo-irankiai/`. Worker workers.dev peržiūra po patikros išjungta. DNS, el. paštas ir pagrindinis Worker `verslomatika-v2-website` nekeisti; jo etag išliko `90ce1c833e6b70b673294e041158bd0ff0cc1ada4504f2c203308bb6f6c13cc1`.
- Patikrinta: GET ir HEAD 200, POST 405, nesusijęs kelias 404, svetainės pradžia ir `/kontaktai/` 200. Puslapis peržiūrėtas naršyklėje. Laikinas atskiras maršrutas pats savaime neprideda į pagrindinės svetainės navigaciją ar sitemap.
- Savininkui paprašius, ankstesnei Verslomatika kūrimo sesijai `codex://threads/01a167ae-0c62-7e01-b67a-cb08ae2cf5d8` perduota užduotis profesionaliai integruoti puslapį į bendrą svetainės architektūrą ir sutvarkyti esamus subdomenus pagal bendrą SEO/GEO, išlaikant funkcijas, DNS, paštą ir kitų agentų darbą. Iki patikimos integracijos palikti dabartinį maršrutą veikiantį.

## Stripe — neužbaigta

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` ir `STRIPE_PRICE_ID` nebuvo nustatyti; esama `/checkout` forma rodo, kad mokėjimai dar neįjungti. Realaus Stripe Checkout ar webhook veikimas nepatvirtintas.
- Stripe jungtis grąžina `UNAUTHORIZED` ir prašo atnaujinti autorizaciją. Savininkas pasirinko gyvą **MB Memocasting** Stripe paskyrą. Naršyklėje pradėtas paskyros susiejimas; savininkas turi peržiūrėti ir patvirtinti pageidaujamus paskyros prieigos leidimus. Jokie slapti raktai į tiltą neįrašyti.
- Po autorizacijos būtina patikrinti pasirinktą paskyrą ir sąskaitų teikėjo duomenų suderinamumą, atskirai patikrinti bandomąją aplinką, sukonfigūruoti realią 49 €/mėn. kainą ir 14 d. bandomąjį laikotarpį bei pasirašytą webhook, saugiai nustatyti aplikacijos Stripe kintamuosius ir pilnai išbandyti Checkout. Neteigti, kad mokėjimai veikia, iki patikros.
- ReputationPro vis dar yra demonstracija, aptarnaujama per tunelį iš savininko kompiuterio; tai dar nėra komercinio parengimo patvirtinimas. Dabartinį atsiliepimų srauto atskyrimą būtina pakeisti, kad nebūtų atrankinio viešų atsiliepimų prašymo.

Ankstesnė TASK-002 ataskaita išsaugota `C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\data\operations\codex-reply-task002.md`.

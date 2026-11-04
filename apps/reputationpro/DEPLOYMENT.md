## Saugumo pataisa: registracija sustabdyta — 2026-10-28

Gyvas aktyvus build `.next-safety3-20261028`, BUILD_ID `2z94JKISwn2zthDEkghdV`, `data/operations/active-build` sutvarkytas, PID ir starto laikas `logs/server.json`. Anksčiau aptarnauta `.next` versija turėjo nesaugų `is_demo` profilio priskyrimą pagal viešą slug arba el. paštą ir nepatvirtintą registraciją; ankstesnis active-build / PID įrašas buvo pasenęs. Atsarginiai originalūs šaltiniai saugomi ACL apribotame `data/operations/security-20261028/source-before`. Negrąžinti senų versijų į viešą aplinką, nes jos vėl atvertų spragą; bet koks atstatymas tik į saugų peržiūrėtą paketą.

- `/api/checkout` ir `/api/auth/verify-email` POST be DB pakeitimų grąžina 503; `/checkout` bei `/checkout/success` nebežada aktyvuotos paskyros. Billing lieka disabled nepriklausomai nuo aplinkos raktų. Pagrindinis ir demonstracijos CTA nebežada aktyvavimo ar selektyvaus atsiliepimų nukreipimo.
- Visų `is_demo=1` klinikų prisijungimas, jau išduotų klinikos sesijų panaudojimas ir senų demo slaptažodžio atkūrimo tokenų naudojimas laikinai atmesti. Savininko prieiga nekeičiama. Registruotų demo paskyrų savininkų tapatybė ankstesniame kode nebuvo patvirtinama; 4 demonstracinių paskyrų kredencialų įrašai išsaugoti, bet jų teisėtumo vien ši pataisa neįrodo. Būtina atskirai patikrinti nuosavybę prieš vėl suteikiant prieigą. Nė vienai iš šių 4 demonstracinių paskyrų DB patikros metu nesusieta privati žinutė; negalima iš to spręsti apie ankstesnį prieigos panaudojimą. Šiuo metu DB nėra ne-demo kliento su Stripe prenumeracijos ID.
- Prieš perjungimą SQLite backup API kopija `data/operations/security-20261028/before-release.db`, ACL apsaugota; integrity_check OK. Keturių pagrindinių lentelių (`clients`, `internal_feedback`, `review_events`, `clinic_credentials`) turinys ir eilutės po perjungimo identiški kopijai, integrity_check OK; hash ir sumos privačiame `backup-receipt.json`. Senos kopijos negalima atkurti ant vėlesnių klientų duomenų.
- `npm test` 16/16, atskiras build ir `node --experimental-strip-types scripts/test-registration-lock.mjs` praėjo: izoliuotoje bazėje neleistinas claim bei nauja registracija 503, demo sesija / login / reset atmesti, imituoti pradiniai įrašai nepasikeitė, savininko ir tinkamai patvirtinto ne-demo kliento prieiga, tenant atskyrimas bei 1–5★ vienodas pasirinkimas veikia. Viešai /api/health, /checkout, /r/memocasting 200; POST checkout ir verify-email 503; anoniminis /admin 307; desktop/mobile rodinys be horizontalios slinkties; owner login / admin / logout lokaliai 200. ReviveLeads health 200. Jokio realaus profilio perėmimo nebandyta.
- Esamas SQLite, duomenys, mokėjimų raktai, Cloudflare, DNS ir el. paštas nekeisti; nauji mokėjimai / registracija išjungti. Vėlesniam grąžinimui reikia patikrinti nuosavybę, saugiai atskirti paskyras, sutvarkyti BDAR / sutartis ir atskirai peržiūrėti mokėjimų įjungimą bei savininko nurodymą nekurti gyvo Stripe rakto.

# ReputationPro — Cloudflare ir Domenai.lt, 2026-10-27

## „Memocasting“ demonstracija — 2026-10-27

Aktyvus paketas `.next-memocasting2-20261027`, ankstesnis `.next-stripe-prep2-20261027` išsaugotas. Produkto pradžios demonstracinės nuorodos veda į `/r/memocasting`; atskiras demonstracinis `clients` įrašas pažymėtas `is_demo=1`, `subscription_status=demo_trial`, jokios tikros prenumeratos nevaizduoja. Anksčiau buvę klientai ir `/r/verslomatika` išsaugoti. Google atsiliepimo nuorodos Place ID paimtas iš konkretaus savininko parodyto Google profilio atsiliepimo lango; atidarius ją atskira paskyra parodyta to paties profilio atsiliepimų forma, atsiliepimas neteiktas. Nurodyta rašyti viešą atsiliepimą tik turint tikrą patirtį. Po visų 1–5★ siūlomas toks pats neprivalomas privatus / Google pasirinkimas.

12 unit testų, galutinis build ir izoliuotas visų penkių įvertinimų Playwright testas praėjo. Po paskelbimo `/`, `/r/memocasting`, `/r/verslomatika`, `/checkout` grąžina 200, anoniminis `/admin` 307; checkout registracija vis dar išjungta. Prieš duomenų pakeitimą ir galutinį kodo perjungimą padarytos SQLite backup API kopijos; įrašai ir versijos `data/operations/memocasting-release.json`. Testinės duomenų bazės rezultatai nebuvo rašomi į gyvą DB.

Grąžinant kodą, patikrinti aktyvų build ir savo serverio PID / 3000 portą; per `data/operations/active-build` grąžinti `.next-stripe-prep2-20261027` ir paleisti `scripts/start-local.ps1`. Ankstesnis build neparodo naujo demonstracinio teksto; DB kopijos neatkurti automatiškai ir netrinti naujų žinučių. Stripe ir kiti domenai nekeisti.

## Stripe parengiamoji laida — 2026-10-27

Aktyvus paketas `.next-stripe-prep2-20261027`; ankstesnis `.next-equal-choice-20261027` išsaugotas. `/checkout` nurodo sutartinę teikėją MB „Memocasting“. Mokėjimai ir registracija išjungti. Gyvų Stripe kredencialų nėra; net juos įvedus naujas paketas neleidžia atsiskaityti, kol neatlikta komercinio paleidimo patikra ir aiškiai nenustatyta `STRIPE_LIVE_READY=true`. Testiniai Stripe raktai priimami tik loopback demonstracijoje su atskiru `DATABASE_PATH`.

Savininko patvirtintame Stripe sandbox per tikrą testinį Checkout ir pasirašytus Stripe CLI webhook įvykius patikrinti: 14 d. trial, atšaukimas, 49 EUR sėkmingas pirmasis atnaujinimas bei atmestas pirmasis atnaujinimas (`past_due`), naudojant testinius laikrodžius ir atskirą testinę SQLite bazę. Praėjo 12 unit testų, TypeScript, atskiras build, 5 izoliuotos UI regresijos ir parašų / kartotinių įvykių patikra. Gyvas serveris po perjungimo grąžino 200 pagrindiniame, checkout ir demo puslapiuose; neautentifikuotas admin — 307. Prieš perjungimą SQLite backup API kopija patikrinta `integrity_check`; pagrindinių lentelių turinys po perjungimo atitiko kopiją. Ataskaita ir kopijos vieta: `data/operations/stripe-prep2-release.json`.

Atšaukimas: palyginti `data/operations/active-build` su `.next-stripe-prep2-20261027`, įsitikinti pagal `logs/server.json` ir portą 3000, kad stabdomas tik šios programos procesas, pakeisti active-build į `.next-equal-choice-20261027` ir paleisti `scripts/start-local.ps1`. Tai grąžina kodą, neatkuria DB ir neištrina naujų duomenų. Senesnis paketas neturi naujos `STRIPE_LIVE_READY` apsaugos; neatlikti šio grąžinimo, jei tuo metu Stripe gyvos paslaptys jau nustatytos.

Komercinė parengtis nepatvirtinta: būtina individuali saugi prieiga klinikoms, prenumeratos teisių taikymas, privatumo ir paslaugos sąlygos, mokesčių bei Stripe paskyros informacijos patikra ir gyvas webhook. Per testavimą į įrankio išvestį pateko standartinis ir ribotas sandbox slapti raktai; juos savininkas turi pakeisti / panaikinti Stripe valdymo lange. Gyvos paskyros raktai nebuvo naudojami.

## Vienodas 1–5★ pasirinkimas — naujausias leidimas

Savininko patvirtinimu po bet kurio įvertinimo pateikiamos tos pačios neprivalomos alternatyvos: privati žinutė arba nuoroda į Google; automatinis nukreipimas pašalintas. Naujas paketas `.next-equal-choice-20261027` aktyvuotas per `data/operations/active-build`; ankstesnis `.next-product-link-20261027` išsaugotas. Ankstesnės leidimų dalys žemiau yra chronologinė istorija, todėl jose minėtas srauto atskyrimas nebėra dabartinė būsena.

SQLite `internal_feedback` CHECK apribojimas migracijos transakcijoje pakeistas iš 1–3 į 1–5; eilutės ir jų būsenos, kontaktai bei laikas išsaugoti. Prieš perjungimą naudojant SQLite backup API išsaugota vientisa ankstesnė bazė privačiame `data/operations/backups` aplanke; tikslus kelias ir iki migracijos duomenų kontrolinė suma nurodyti `data/operations/equal-choice-release.json`. Po perjungimo patikrinta: esamų žinučių kontrolinė suma sutampa, bazės integrity_check OK. Atsarginės kopijos neatkurti automatiškai virš naujų duomenų — po migracijos gautos žinutės būtų prarastos.

Patikros: 10/10 izoliuotų unit testų, atskiro build TypeScript patikra, senos schemos migracija su bandomais duomenimis, migracija izoliuotoje tikros bazės kopijoje, visų 5 įvertinimų sukompiliuotų API ir neleistino 6★ patikra, 3 Playwright testai savininko paleistame 3001 serveryje su atskira laikina baze (vienodi pasirinkimai, 5★ privati žinutė ir jos peržiūra admin skydelyje, klaidų patikra). Vieši pagrindiniai keliai ir admin apsauga patikrinti po perjungimo.

Norint grąžinti ankstesnį programos paketą, patikrinti `active-build` reikšmę `.next-equal-choice-20261027`, patikrinti `logs/server.json` PID ir 3000 porto procesą, sustabdyti tik tą procesą, įrašyti `.next-product-link-20261027` į `active-build` ir paleisti `scripts/start-local.ps1`. Senas paketas grąžintų ankstesnę žvaigždučių nukreipimo elgseną. Toks kodo grąžinimas nėra bazės atkūrimas; prieš galimus schemos ar bazės pakeitimus būtina apsaugoti naujus duomenis.

## Produkto pristatymo nuoroda — naujausias leidimas

Demonstracijos puslapyje pridėta matoma nuoroda į `https://verslomatika.lt/reputacija/` ir išsaugota katalogo nuoroda su kanoniniu galiniu brūkšniu. `noindex, nofollow` nepakeista. Nauja versija atskirai surinkta į `.next-product-link-20261027`, patikrinta 3001 porte ir perjungta į 3000; ankstesnė `.next-review-20261027` versija liko neperrašyta. Aktyvų paketą nurodo `data/operations/active-build`; vėlesnėje ankstesnio leidimo skiltyje minimas aktyvus failas yra to laiko būklė.

Patikrinta: abi nuorodos ir `noindex, nofollow` pateikiamos viešame HTML, `api/health`, paciento puslapis, checkout ir privatumas grąžina 200, anoniminis admin 307. Norint grįžti prie ankstesnės versijos, patikrinti, kad aktyvus paketas vis dar `.next-product-link-20261027`, nustatyti `active-build` į `.next-review-20261027` ir iš naujo paleisti tik patikrintą programos procesą pagal toliau nurodytą procedūrą.

## Atnaujinimas po perkrovimo — produkto tekstai

Po perkrovimo 530 klaida pašalinta vėl paleidus tik šios aplikacijos Next.js serverį ir `reputationpro-lenovo` tunelį. Vėliau viešai įkelta atskirai surinkta `.next-review-20261027` versija: pašalinti nepagrįsti oficialios ir nepriklausomos priežiūros, BDAR atitikties, momentinių pranešimų ir fizinio stovelio pažadai; neveikiantis klinikų paieškos laukelis pakeistas demonstracine nuoroda. Mokėjimų peržiūros aiškiai rodo, kad planai ir sąlygos dar derinami. Įvertinimų nukreipimo logika šiuo leidimu nebuvo keičiama.

Veikiantis ankstesnis `.next` paketas išsaugotas. `data/operations/active-build` nurodo `.next-review-20261027`; `scripts/start-local.ps1` patikrina šį failą, leidžia tik vietinį `.next` tipo vardą ir paleidžia atitinkamą paketą. Paleidimo metu aplinka perduoda `REPUTATION_BUILD_DIR`; tuo tarpu įprastas `npm run build` be šio kintamojo kuria `.next`. `next.config.ts` palaiko atskiro paketo kūrimą su `REPUTATION_BUILD_DIR`.

Grąžinant ankstesnį leidimą: patikrinti, kad `data/operations/active-build` vis dar rodo `.next-review-20261027`, o `logs/server.json` PID atitinka šios aplikacijos 3000 porto Node procesą. Tuomet sustabdyti tik tą procesą, pakeisti `active-build` turinį į `.next` ir paleisti `scripts/start-local.ps1`. Neperrašyti SQLite, `.env.local`, tunelio ar kitų procesų. Prieš vėlesnį `.next` paketų perrašymą šis grąžinimo taškas nebegalios.

Patikra: atskiro paketo `next build` su TypeScript praėjo; 9/9 vienetinių testų; atskirame 3001 porte ir po perjungimo viešai patikrinti `/`, `/api/health`, `/r/vilniaus-denta`, `/checkout`, `/privacy` (200) ir anoniminis `/admin` (307). Viešos visų trijų planų peržiūros nebežada momentinių pranešimų ar fizinio stovelio. Tunelis ir DNS pakeitimų nereikalavo. Procesų ID po paleidimo yra dinamiški; tikrinti naujausius `logs/*.json`.

## Dabartinė būsena

Vieša **MVP demonstracija**: https://reputacija.verslomatika.lt. Naudotojas šioje Codex gijoje tiesiogiai pasirinko tęsti Cloudflare, pašto ir subdomeno prijungimą. Pradžioje `bridge/codex_task.md` rodė seną TASK-001; Antigravity vėliau jį atnaujino į TASK-002. Atnaujintas failas perskaitytas prieš galutinį perdavimą.

Cloudflare Tunnel perduoda tik šio hostname srautą į `http://127.0.0.1:3000`; likusiems vardams taikomas 404. Vercel nenaudojamas. Vietinis portas liko pasiekiamas tik per loopback. Kompiuteriui užmigus, išsijungus ar sustojus Node / cloudflared, svetainė neveiks. Automatinis paleidimas po Windows perkrovimo neįdiegtas.

## Tiksli leidimo tapatybė

- Zona: `verslomatika.lt`, aktyvi, `6168ac20a500dfb3687f20dec1783195`.
- Cloudflare paskyra: `d102163f74a45ab6d33bca786ce281ec`.
- Tunnel: `reputationpro-lenovo`, `1ac51e02-2ae5-46e1-9c25-cf3a4223d12f`.
- Pridėtas vienas proxied CNAME: `reputacija.verslomatika.lt` → `1ac51e02-2ae5-46e1-9c25-cf3a4223d12f.cfargotunnel.com`, TTL Auto.
- Naujo DNS įrašo ID: `ab0d2d714e85e866e426bb6971b9865f`.
- Tik šiam hostname pridėta HTTP → HTTPS 308 taisyklė `f78590be0a8f42a2a2f6dd54fa9fa0c4` esamame ruleset `15c454109ccd4117926fc6bc27309340`. Kelias ir query išsaugomi; ankstesnė Verslomatika V2 apex / www taisyklė nepakeista.
- `cloudflared` 2026.10.5 iš oficialaus Cloudflare GitHub leidimo; SHA-256 sutikrintas su leidimo digest. Binaras `tools/cloudflared.exe` nekeliamas į Git.
- Next.js build ID užfiksuotas galutiniame `data/operations/release-2026-10-27.json`; pirminis prieš Antigravity vizualinį atnaujinimą buvo `JFvxQsG4J2Yu5PfPELdon`.
- Runtime šaltinių SHA-256 manifestas: `data/operations/release-2026-10-27.json`.
- Šis aplankas nėra Git repozitorija; commit ar PR nebuvo kuriamas.

Veikiantys šio leidimo procesai: Node PID 8584; mūsų cloudflared PID 21244. Procesų ID po perkrovimo keičiasi: tikrinti `logs/server.json` ir `logs/tunnel-process.json`. Metrikos / ready tik lokaliai `127.0.0.1:20242`. Kitas kompiuteryje rastas cloudflared procesas ir jo portas 20241 nebuvo keisti; paleidimo skriptas parenka laisvą metrikų portą.

## Paštas

Prisijungusioje Domenai.lt paskyroje patikrinta aktyvi `@verslomatika.lt` paslauga ir esama `tomas@verslomatika.lt` dėžutė. Oficialus „Prijungti domeną“ ekranas rodė **„Domenas prijungtas“**, o abi DNS grupės — **„Įrašai teisingi“**.

| Tipas | Vardas | Reikšmė | Prioritetas | TTL |
| --- | --- | --- | --- | --- |
| MX | @ | mx.oradomail.com | 10 | 600 |
| TXT / SPF | @ | v=spf1 a mx include:_spf.oradomail.com ~all | — | 600 |

Šie įrašai jau buvo teisingi ir nepakeisti. Išsaugoti visi 12 ankstesnių zonos įrašų, įskaitant pagrindinę svetainę, Google patvirtinimą, DMARC ir `pranesimai` pašto sritį. Vienintelis skirtumas — naujas ReputationPro CNAME. Vardų serveriai ir DNSSEC būsena nekeisti.

Patikrintas viešas MX ir SPF atsakas. `imap.oradomail.com:993` ir `smtp.oradomail.com:465` TLS 1.3 handshake ir sertifikato vardo patikra praėjo. Tai **ne autentifikuoto laiško pristatymo įrodymas**: laiškai nesiųsti, dėžutės turinys neskaitytas ir slaptažodžiai nekeisti. Domenai.lt prijungimo ekrane DKIM įrašo nebuvo pateikta; jo reikšmė nebuvo spėjama.

## Programos pakeitimai

- `.env.local` `APP_URL` ir TASK-002 paprašytas `NEXT_PUBLIC_APP_URL` nustatyti į viešą HTTPS adresą. Serverio generuojamos nuorodos šiame kode naudoja `APP_URL`. Duomenų bazė liko `data/reputation.db`; savininko prisijungimas ir paslaptys išsaugoti.
- Seansas per HTTPS turi Secure ir HttpOnly. CSRF tikrina tikslų viešą Origin; tiesioginiam localhost naudojimui leidžiamas tik sutampantis loopback Host / Origin su 3000 portu.
- QR ir dalinimosi nuorodos naudoja viešą adresą.
- Be Stripe raktų ir webhook viešas `/checkout` aiškiai rodo, kad registracija / mokėjimai neįjungti; API grąžina 503. Vietinė demo registracija toliau galima tik su loopback `APP_URL`.

## Patikros įrodymai

- 9/9 Node testai, įskaitant naujas HTTPS / loopback / svetimo Origin regresines patikras.
- `npm run build` su TypeScript patikra praėjo.
- Tunnel Cloudflare API būsena healthy; lokalus `/ready` — 200.
- Authoritative Cloudflare NS, 1.1.1.1 ir 9.9.9.9 grąžino subdomeno IP; įprasta Chrome naršyklė atvėrė HTTPS adresą be sertifikato išimčių.
- Vieši `/`, `/r/vilniaus-denta`, `/checkout`, `/privacy`, `/api/health` — 200.
- Anoniminis `/admin` nukreipia į prisijungimą; savininko prisijungimas, saugus seanso slapukas, QR / CSV ir atsijungimas patikrinti tikrame HTTPS hostname.
- Viena aiškiai pažymėta techninė žinutė per viešą API išsaugota SQLite ir perskaityta savininko skydelyje. Pašalintas tik jos tikslus UUID / žymeklis; kiti duomenys nekeisti.
- Svetimas Origin atmestas 403; po logout privatus eksportas atmestas 401.
- `.env.local`, SQLite ir Tunnel tokeno keliai per viešą HTTP serverį grąžino 404.

Detalės: `data/operations/public-acceptance-2026-10-27.json`, `cloudflare-before-2026-10-27.json`, `cloudflare-after-2026-10-27.json`, `cloudflared-release.json`. Ekrano įrodymai toje pačioje privačioje direktorijoje. Šių operacinių failų, DB ir tokeno neviešinti.

## Paleisti iš naujo

```powershell
cd C:\Users\Lenovo\Documents\Agentai\apps\reputationpro
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
powershell -ExecutionPolicy Bypass -File scripts/start-tunnel.ps1
```

Jei pakeistas programos kodas, sustabdyti tik savo patvirtintą serverio procesą ir paleisti `npm run build` prieš startą. Skriptai nekeičia DNS ir nesustabdo svetimų procesų. Tunnel tokenas saugomas `data/operations/tunnel-token`, tik dabartinio Windows naudotojo ACL; jis perduodamas failu, ne atviru komandų argumentu. Naujas kompiuteris turi gauti atskirą privatų konfigūravimą, vien Git kopijos nepakanka.

## Grąžinimo planas

1. Perskaityti gyvą `reputacija.verslomatika.lt` įrašą. Tik jei jo ID ir turinys vis dar sutampa su šio leidimo įrašu, pašalinti tik `ab0d2d714e85e866e426bb6971b9865f`. Jei savininkas jau pakeitė turinį, jo neperrašyti.
2. Pagal `logs/tunnel-process.json` patvirtinti PID / vykdomąjį failą ir sustabdyti tik šį ReputationPro tunnel procesą. DNS pašalinimas pats proceso nesustabdo.
   Jei grąžinama ir HTTP politika, pašalinti tik taisyklę `f78590be0a8f42a2a2f6dd54fa9fa0c4`, patikrinus jos dabartinį turinį. Viso bendro ruleset nešalinti ir neatkurti per naujesnius pakeitimus.
3. Paštui, apex, www, `pranesimai` ar visos zonos snapshot atkūrimo nereikia — jie nebuvo keisti. Neatkurti visos senos zonos per naujesnius pakeitimus.
4. Node ir SQLite galima palikti veikti lokaliai. Norint pilnai grįžti prie ankstesnės vietinės demo konfigūracijos, `APP_URL` grąžinti į `http://127.0.0.1:3000`, perkompiliuoti ir perkrauti savo serverį. Pacientų duomenų neatstatinėti iš senos kopijos.

## Likusios MVP ribos

Tai viešai pasiekiama demonstracija, ne užbaigta kelių klinikų komercinė SaaS sistema. Stripe kredencialų nėra, tikras Google review URL nepateiktas, automatiniai laiškai / SMS / AI neįdiegti. Google selektyvaus teigiamų atsiliepimų prašymo apribojimas ir privatumo / realių pacientų naudojimo ribos lieka aprašytos README. Vien pasiekiamas domenas šių ribų neišsprendžia.

TASK-002 siūlytą laikiną `trycloudflare.com` tikslą pakeitė paskyroje valdomas vardinis Tunnel; tikro hostname HTTPS ir formos patikrintos su juo. Ankstesnis kito proceso Quick Tunnel nebuvo stabdytas ar keistas. Antigravity praneštas ankstesnis „SMTP prisijungimas patvirtintas“ yra jos atliktos patikros teiginys; Codex šiame etape nepriklausomai patikrino DNS, teikėjo prijungimo ekraną ir TLS, ne autentifikuotą laiško pristatymą.

Oficialūs šaltiniai: [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/), [cloudflared atsisiuntimas](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/), [Domenai.lt domeno prijungimas](https://paskyra.domenai.lt/email/connect-domain/verslomatika.lt).

## Antigravity vizualinio leidimo sinchronizavimas

Paskutinio perdavimo metu išsaugotas jos naujas homepage ir trijų planų peržiūros. Pataisytas `plan=constructor/toString` 500 ir naujų nepalaikomų planų formos nesutapimas su 49 EUR backend. Galutinis build su TypeScript praėjo, minėti HTTPS maršrutai grąžina 200 ir registracijos išjungimo pranešimą. Naujo homepage reklaminiai teiginiai ir naujų planų komercinis parengimas nepatvirtinti.

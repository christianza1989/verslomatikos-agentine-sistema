# ReputationPro MVP

Vietinė Next.js 16 aplikacija klinikos pacientų atsiliepimams. Node.js **24+** būtinas dėl integruoto `node:sqlite`. TypeScript, Tailwind CSS 4, SQLite WAL, savininko seansai ir Stripe Checkout.

## Dabartinis viešas MVP — 2026-10-27

**https://reputacija.verslomatika.lt** prijungtas per Cloudflare Tunnel prie šio kompiuterio `127.0.0.1:3000`. Vercel nenaudojamas. Svetainė veikia tik kol kompiuteris įjungtas, nemiega ir abu procesai veikia; Windows paslauga ar automatinis paleidimas po perkrovimo neįdiegti.

`APP_URL` vietiniame `.env.local` dabar yra viešas HTTPS adresas. Savininko seanso slapukas Secure ir HttpOnly. QR kodai bei nukopijuotos nuorodos naudoja viešą adresą. Demo klinika palikta, tikrų mokėjimų nėra; viešas `/checkout` aiškiai rodo, kad registracija ir mokėjimai neįjungti. API grąžina 503, kol neparuoštas Stripe. Vietinis demonstracinis registravimas išlieka prieinamas tik kai `APP_URL` yra loopback adresas.

Pakartotinai paleisti:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
powershell -ExecutionPolicy Bypass -File scripts/start-tunnel.ps1
```

Pakeitus programos kodą prieš paleidžiant vykdykite `npm run build`. Privatus Tunnel raktas yra `data/operations/tunnel-token`, apribotas dabartiniam Windows naudotojui; jis perduodamas per `--token-file`, ne argumento reikšme. Šio failo neviešinti. `tools/cloudflared.exe` atsisiųstas iš oficialaus Cloudflare leidimo, digest patikrintas; versija ir SHA-256 įrašyti `data/operations/cloudflared-release.json`.

Operacinis planas, grąžinimas ir DNS įrodymai: [DEPLOYMENT.md](DEPLOYMENT.md). Toliau pateiktos originalios vietinio kūrimo instrukcijos lieka taikomos su vietiniam darbui parinktu `APP_URL`.

## Paleidimas

```powershell
cd C:\Users\Lenovo\Documents\Agentai\apps\reputationpro
npm ci
npm run setup:local
npm run dev
```

Atverti http://127.0.0.1:3000. Arba po `npm run build` paleisti `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1`: serveris veiks fone, žurnalai bus `logs/`.

`setup:local` sukuria `.env.local` tik jei jo dar nėra. Jame yra `ADMIN_EMAIL` ir atsitiktinis `ADMIN_PASSWORD`. **Tai savininko prisijungimas į `/admin`**; slaptažodis neskelbiamas viešoje sąsajoje. Generuojamas ir atsitiktinis `SESSION_SECRET`. Pavyzdinius parametrus rasite `.env.example`.

## Maršrutai

| Maršrutas | Paskirtis |
| --- | --- |
| `/` | Lietuviškas pardavimo puslapis, 49 €/mėn. pasiūlymas |
| `/r/vilniaus-denta` | Testinė klinika; po 1–5★ galima pasirinkti privačią formą arba Google nuorodą |
| `/admin` | Prisijungimu apsaugoti atsiliepimai, suvestinė, filtrai, būsenos, nustatymai |
| `/checkout` | Klinikos registracija; vietinis testas arba Stripe Checkout |
| `/privacy` | MVP duomenų naudojimo paaiškinimas |
| `/api/health` | Serverio ir SQLite veikimo patikra |

Valdymo skydelyje galima keisti klinikos Google nuorodą, pridėti kliniką, kopijuoti paciento nuorodą, atsisiųsti QR SVG ir iki 200 naujausių privačių žinučių CSV. Suvestinėje rodomi vietiniai žvaigždučių pasirinkimai, **ne paskelbtų Google atsiliepimų skaičius**. Tai vieno sistemos savininko MVP, ne kelių nepriklausomų savininkų paskyrų SaaS.

## SQLite ir privatūs duomenys

Pagal nutylėjimą: `data/reputation.db`. Pagrindinės lentelės: `clients`, `internal_feedback`; papildomos: `review_events`, `admin_sessions`, `rate_limits`, `stripe_events`. Schema ir demonstracinė klinika sukuriamos automatiškai. Tik `DEMO_MODE=true` kuria pavyzdinę kliniką. Duomenys išlieka perkrovus serverį.

Privačiai formai reikia sutikimo; vardas ir telefonas neprivalomi. Formoje nurodyta neteikti sveikatos duomenų. Privačių duomenų API, QR ir eksportas reikalauja seanso. Slapukas HttpOnly, SameSite=Lax, su HTTPS – Secure; būseną keičiančioms užklausoms tikrinamas Origin. Užklausų dydžiai ir dažnis ribojami; SQL parametrizuotas, tekstą ekranuoja React, CSV apsaugotas nuo formulių įterpimo. Paciento pakartotinis to paties pateikimo siuntimas nesukuria antros žinutės.

Neįkelkite `.env.local`, `data/`, DB WAL/SHM ar žurnalų į Git. Atsarginei veikiančios SQLite bazės kopijai naudokite SQLite backup API arba sustabdykite savą serverį ir kopijuokite bazę; vieno aktyvios WAL bazės failo kopijavimo nepakanka.

## Stripe

Be Stripe raktų, jei `DEMO_MODE=true` ir `APP_URL` yra loopback adresas, `/checkout` sukuria `demo_trial` kliniką. Kortelė neprašoma, pinigai nenuskaitomi, savininko prieiga nesuteikiama. Išjungus demonstracinį režimą, be mokėjimo konfigūracijos atsiskaitymas grąžina 503.

Tikram **sandbox** bandymui į `.env.local` įrašykite savo Stripe sandbox restricted API raktą į `STRIPE_SECRET_KEY` ir webhook paslaptį į `STRIPE_WEBHOOK_SECRET`, tada perkraukite serverį. Raktui reikia Checkout sesijų kūrimo, prenumeratų skaitymo ir, jei naudojamas `STRIPE_PRICE_ID`, kainų skaitymo teisių. Vietinis demonstracinis režimas atmeta live raktus.

Checkout siunčia `mode=subscription`, `trial_period_days=14`, kainą **4900 EUR centų / mėnesį**, dinaminius mokėjimo būdus ir idempotencijos raktą. `STRIPE_PRICE_ID` neprivalomas; jei pateikiamas, serveris tikrina, kad tai būtų 49 EUR mėnesinė kaina.

Webhook adresas: `POST /api/stripe/webhook`. Stripe CLI persiuntimo pavyzdys:

```powershell
stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
```

Prenumeratos būseną valdo **privalomas pasirašytas webhook**, ne sėkmės puslapis. Apdorojami `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Abonemento atnaujinimams perskaitoma dabartinė Stripe būsena; pasikartojantys įvykiai saugiai atpažįstami SQLite transakcijoje. Nesėkmės grąžina 500, kad Stripe pakartotų siuntimą. Neapmokėta Checkout sesija neaktyvina plano. Įvykiai su neteisingu parašu atmetami.

Šio pristatymo metu **nebuvo Stripe kredencialų**, todėl tikras sandbox Checkout ir Stripe → localhost pristatymas nėra patikrinti. Patikrinti generuojami prenumeratos parametrai ir vietinis webhook būsenų apdorojimas. Automatinis mokestis/Stripe Tax neįjungtas; viešo komercinio paleidimo mokesčių ir sutarties sąlygos nesuformuotos.

## Testai

```powershell
npm test
npm run typecheck
npm run build
# Veikiant vietiniam serveriui:
npm run test:e2e
```

Vienetiniai testai naudoja atskirą laikiną SQLite failą. Playwright naudoja kompiuteryje įdiegtą Chrome ir savininko duomenis iš `.env.local`. E2E įrašo aiškiai pažymėtus testinius duomenis; juos leiskite serveriui su atskiru `DATABASE_PATH=./data/qa.db`, ne realių pacientų baze. Patikros: abi vertinimo šakos, žinutės išsaugojimas ir išsprendimas, apsaugoti API, CSV, QR, demonstracinė registracija ir nustatymų išlikimas. Ekrano kopijos: `.impeccable/review/`.

## Viešo paleidimo ribos

Šis pristatymas yra **vietinis MVP**, ne paskelbta produkcinė SaaS sistema. Demonstracinės klinikos Google URL atveria Maps paiešką, nes tikras klinikos review URL nepateiktas. Prieš naudojant tikrai klinikai reikia jos tikros nuorodos, duomenų valdytojo kontaktų ir saugojimo taisyklių, HTTPS bei atsarginių kopijų, realaus Stripe patikrinimo ir atskiros klientų autentifikacijos, jei sistema aptarnaus nepriklausomus savininkus. Automatiniai el. laiškai, SMS, AI atsakymai, Gmail ir Google Business Profile atsiliepimų sinchronizavimas neįgyvendinti ir nesiūlomi kaip veikiantys.

Google draudžia atgrasyti neigiamus atsiliepimus ir selektyviai prašyti teigiamų. Po bet kurio įvertinimo rodoma tokia pati galimybė pasirinkti privačią žinutę arba Google nuorodą; automatinio nukreipimo pagal įvertinimą nėra. Tai savaime negarantuoja visos paslaugos atitikties politikai. Šaltinis: [Google Maps turinio politika](https://support.google.com/contributionpolicy/answer/7400114).

Stripe nuorodos: [Checkout su bandymu](https://docs.stripe.com/payments/checkout/free-trials), [Checkout sesijos kūrimas](https://docs.stripe.com/api/checkout/sessions/create).

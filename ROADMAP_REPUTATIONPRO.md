# ROADMAP: ReputationPro konversijos piltuvas

> **Kam skirta:** bet kuriam LLM agentui (Claude, Codex, GPT, Cursor) arba žmogui, kuris tęsia darbą.
> **Taisyklė:** užbaigęs punktą, pažymėk `[x]`, prirašyk datą ir trumpą pastabą. Jei punktą pakeitei ar atmetei, nebraukyk jo, o parašyk kodėl.
> **Pilnas auditas su argumentais:** [`data/reports/REPUTATIONPRO_AUDITAS_2026-11-05.md`](data/reports/REPUTATIONPRO_AUDITAS_2026-11-05.md)
> **Sukurta:** 2026-11-05

---

## 0. Savininko sprendimai (nekeisti be savininko sutikimo)

1. **Vieša Google nuoroda po 1–3★ nėra privaloma.** Kiekvienas klientas pats renkasi skydelyje (Nustatymai → „Rodyti viešo Google atsiliepimo nuorodą po 1–3★“). Numatytoji reikšmė: **išjungta**. Šalia jungiklio rodomas trumpas paaiškinimas apie Google politiką, kad klientas apsispręstų žinodamas riziką.
2. **Apmokėjimai paskutiniame etape.** Kol jo nėra, 14 d. bandymas techniškai nesibaigia (`trialing` lieka aktyvus), o tęsimą tvarkome rankiniu būdu.
3. **Serveris yra šis PC** (`E:\Verslomatika`), veikia 24/7. `reputacija.verslomatika.lt` per Cloudflare Tunnel rodo į šį PC (Next.js, portas 3000). VPS nebus.
4. **Pagrindinė piltuvo logika gyvena Next.js aplikacijoje** (`apps/reputationpro`), ne Cloudflare edge worker'yje. Laiškų nuorodos veda į `https://reputacija.verslomatika.lt/...`, nes ten yra DB, sekimas ir aktyvavimas.

---

## 1. Kaip veikia piltuvas (tikslinė būsena)

```
[core/morning_campaign_runner.py]
  provision_lead_in_db() → clients(is_demo=1, subscription_status='demo_trial')
  issue_claim_token()    → claim_tokens(token_hash, client_id, expires_at)   (galioja 30 d.)
  laiškas: 1 CTA → https://reputacija.verslomatika.lt/api/track/click?id={lead_id}&to=/r/{slug}?k={token}
                    pikselis → https://reputacija.verslomatika.lt/api/track/open?id={lead_id}
        │
        ▼
[/r/{slug}?k={token}]  (apps/reputationpro/src/app/r/[slug]/page.tsx)
  is_demo=1 → „savininko režimas“: kairėje kliento telefono vaizdas, dešinėje „ką matote Jūs“
              (gyvas pranešimo vadovui simuliavimas), sticky „Aktyvuoti nemokamai“ → /aktyvuoti/{token}
  is_demo=0 → įprastas kliento atsiliepimų puslapis
        │
        ▼
[/aktyvuoti/{token}]  (src/app/aktyvuoti/[token]/page.tsx + /api/claim)
  rodo paruoštus duomenis + 1 laukas (slaptažodis) → clients: is_demo=0, 'trialing', +14 d.
  el. paštas pažymimas patvirtintu (tokenas atėjo į tą dėžutę), sesija, → /admin#onboarding
        │
        ▼
[/admin]  onboarding checklist → pirmas tikras įvertinimas → (vėliau) apmokėjimas
```

---

## 2. Etapai ir užduotys

### ⚡ PIRMAS ŽINGSNIS: įdiegti (kodas paruoštas, bet gyvas serveris dar veikia su sena versija)

- [ ] **Z1. Įdiegti naują versiją į gyvą serverį.** Visi A–E pakeitimai ir `.env.local` pataisa (A0) įsigalioja tik po build'o ir perkrovimo. Automatinis agento bandymas sustabdyti gyvą procesą buvo užblokuotas saugumo taisyklės, todėl tai daro savininkas:
  ```powershell
  powershell -ExecutionPolicy Bypass -File E:\Verslomatika\apps\reputationpro\scripts\deploy-live.ps1
  ```
  Patikra po diegimo: `https://reputacija.verslomatika.lt/r/vilniaus-denta` rodo „savininko režimo“ demo. Žvaigždutės paspaudimas neberodo „Netinkama užklausos kilmė“.
- [ ] **Z1b. Po diegimo grąžinti Memory Casting prognozę.** 2026-11-05 23:15 išsiųstas tikras laiškas į `info@memorycasting.lt` (tyrimas: `data/leads/research/memory-casting.json`). Kol neįdiegta nauja `owner-demo.tsx` (prognozės tempas pagal verslo dydį), `clients.google_rating/google_reviews_count` šiam klientui laikinai NULL, kad demo nerodytų „15 per mėn. → 4,7★“. Po `deploy-live.ps1` paleisti (nieko nesiunčia, tik atnaujina duomenis):
  `python core/morning_campaign_runner.py research data/leads/research/memory-casting.json`
- [x] **Z1c. Savininko testo pastabos (2026-11-06), laukia diegimo.** (1) Aktyvavimo puslapio „Atsiliepimų puslapis → Peržiūrėti“ rodė savininko demo, o ne tai, ką mato klientai. Dabar veda į `/r/{slug}?view=klientas` (tikras kliento vaizdas, demo režimu: niekas nesaugoma ir nesiunčiama, 5★ neišveda). (2) Prisijungimo el. paštą aktyvuojant galima pakeisti (pakeitus prašoma pakartoti). Užimtas adresas atmetamas, o senam adresui siunčiamas pranešimas (`sendLoginEmailChangedNotice`). Failai: `src/lib/claim.ts`, `src/app/api/claim/route.ts`, `src/components/claim-form.tsx`, `src/app/aktyvuoti/[token]/page.tsx`, `src/app/r/[slug]/page.tsx`. Testai 20/20.
- [ ] **D4. El. pašto keitimas skydelyje** (jau aktyvuotiems klientams). Dabar `api/admin/clients` klientui to neleidžia („susisiekite su paslaugos teikėju“). Reikia srauto: naujas adresas → patvirtinimo nuoroda (`clinic_email_tokens` purpose 'verify') → pakeitimas + pranešimas senam adresui.
- [x] **Z1d. Incidentas 2026-11-10 (Gemini, „tik sukurti agentus“).** Commit 944e410 pakeitė visas laiškų nuorodas į `https://verslomatika.lt/...`, kur atsako SENAS edge worker'is (senas demo, netikra forma), todėl savininkas matė seną versiją (`verslomatika.lt/r/buivydiskiu-veterinarijos-klinika?k=DEMO`). 9f43a55 nuorodas grąžino. Be to, Gemini dirbo KITAME kompiuteryje su atskira DB, todėl jo lead'ų demo/tokenų gyvame serveryje nėra. Pridėtos AGENTS.md taisyklės Nr. 6 ir 7. Memory Casting skaičiai grąžinti (Z1b), nes prognozės pataisa jau gyva.
- [ ] **Z1e. Marius agento pašto konfigas šiame PC.** Nukopijuoti `configs/reputation_agents/agent_marius.json` (Git ignoruoja) iš kompiuterio, kuriame dirbo Gemini, į `E:\Verslomatika\configs\reputation_agents\`. Be jo Marius naudoja `.example.json` ir negali siųsti. Patikra: `python test_multi_agent_smtp.py`.
- [ ] **Z1f. Įdiegti 11-06 pataisas** (kliento peržiūra `?view=klientas`, keičiamas el. paštas aktyvuojant): `deploy-live.ps1`. Gyva versija sukurta 11-05 23:16.
- [x] **Z1g. Demo telefonas 1:1 kaip mato klientas (2026-11-10, laukia diegimo).** Standartinės iPhone proporcijos (9:19,5), vidinis slinkimas, Dynamic Island, naršyklės adreso juosta. Po 4–5★ naujame skirtuke atsidaro TIKRA įmonės Google atsiliepimų forma (Google neleidžia jos rodyti kitos svetainės viduje, todėl maketo nebenaudojame); telefone lieka pasirinktos žvaigždutės. Paaiškinimai tik dešinėje, vadovo dėžutėje. `?view=klientas` po 5★ nukreipia į tikrą Google formą.
- [x] **Z1h. Neveikiančios Google nuorodos `writereview?q=…` (Google: „400. That's an error.“).** Resolveris (`core/google_place_resolver.py`) be Place ID dabar grąžina Maps paiešką. Programėlė kiekvieną kliento įrašą normalizuoja (`usableReviewUrl` per `toClient()` `src/lib/db.ts`), todėl seni įrašai niekada nerodo 400. Įrašytas patikrintas Buivydiškių veterinarijos klinikos ID.
- [ ] **Z2. Peržiūrėti laiškus ir įjungti kampaniją.** `python core/morning_campaign_runner.py preview 5` → peržiūrėti `data/reports/email_previews/*.html` → tada `python core/morning_campaign_runner.py daemon` ir `python core/email_reply_listener.py` (arba atkomentuoti `start_all_services.ps1` 6 skyrelyje).
- [ ] **Z3. Automatinis paleidimas po perkrovimo:** kaip administratorius paleisti `scripts/register-windows-tasks.ps1` (E1).


### Etapas A: saugumas ir nutrūkusios grandys (P0)

- [x] **A0. Gyva aplikacija atmetė VISAS formas (403 „Netinkama užklausos kilmė“).** `apps/reputationpro/.env.local` turėjo `APP_URL=http://127.0.0.1:3000`, todėl `sameOrigin()` atmetė `https://reputacija.verslomatika.lt` užklausas (žvaigždutės, privačios žinutės, registracija, prisijungimas), o QR kodai skydelyje rodė į localhost. Pataisyta 2026-11-05: `APP_URL` ir `NEXT_PUBLIC_APP_URL` = `https://reputacija.verslomatika.lt` (atsarginė kopija scratchpad'e). ⚠️ Įsigalioja tik po `npm run build` ir serverio perkrovimo.
- [x] **A0b. Programėlė nesiuntė jokių laiškų** (nei pranešimų vadovui apie 1–3★, nei sveikinimo), nes nebuvo SMTP konfigo. Pataisyta: `src/lib/clinic-mail.ts::getSmtpConfig()` dabar naudoja ir bendrą `configs/email_credentials.json`.
- [x] **A0c. Landing „Peržiūrėti demonstraciją“ (`/r/memocasting`) grąžino 404.** Pridėtas alias'as → `/r/vilniaus-denta` (`src/app/r/[slug]/page.tsx`). Landing'e verta pakeisti nuorodą tiesiogiai (F1).

- [x] **A1. Uždaryti paskyros perėmimą per `/api/checkout`.**
  Failai: `apps/reputationpro/src/app/api/checkout/route.ts`, `src/app/checkout/page.tsx`.
  Priėmimo kriterijai: egzistuojantis `is_demo=0` klientas niekada neatnaujinamas per checkout (409 „Paskyra jau yra – prisijunkite“). `is_demo=1` slug'as be tokeno neperimamas: siunčiama aktyvavimo nuoroda į lead'o el. paštą (rate limit). `/checkout?slug=` daugiau neužpildo el. pašto iš DB.
- [x] **A2. Prisijungimas reikalauja patvirtinto el. pašto ir `is_demo=0`.** `demo_trial` negali prisijungti.
  Failai: `src/lib/clinic-access.ts` (`authenticateClinic`, `clinicSession`).
  Patikra: `npm test`, kur abu anksčiau krentantys testai `tests/clinic-access.test.ts` praeina.
- [x] **A3. Claim tokenai.** _(2026-11-05: Node `src/lib/claim.ts` + Python `core/claim_tokens.py`, lentelės `claim_tokens`, `campaign_suppressions`, testai `tests/claim.test.ts`.)_ Lentelė `claim_tokens(token_hash PK, client_id, expires_at, used_at, created_at)`. Kuria Python (siunčiant) ir Node (pakartotinis siuntimas). Saugomas tik SHA-256 hash.
  Failai: `src/lib/db.ts`, naujas `src/lib/claim.ts`, `core/claim_tokens.py`.
- [x] **A4. Aktyvavimo puslapis `/aktyvuoti/{token}` ir `POST /api/claim`.** Vienas laukas (slaptažodis ×2). Rodo įmonės pavadinimą, el. paštą ir Google nuorodos patikrinimą. Tokenas vienkartinis.
  Failai: `src/app/aktyvuoti/[token]/page.tsx`, `src/components/claim-form.tsx`, `src/app/api/claim/route.ts`, `src/app/api/claim/resend/route.ts`.
- [x] **A5. `provision_lead_in_db()` niekada neperrašo jau aktyvuoto kliento.** UPDATE tik kai `is_demo=1`.
  Failas: `core/dental_lead_pool.py`.
- [~] **A6. Edge worker (`verslomatika.lt`): XSS, atviras redirect'as, `/checkout` nukreipimas.** ⚠️ Šaltinis NE šioje repo (`verslomatika-v2-website/worker/`). Paruošta instrukcija su tiksliu kodu: `deployments/edge-patch/README.md` (edge tik nukreipia `/r/*`, `/api/track/*`, `/api/qr`, `/checkout`, `/aktyvuoti/*` į aplikaciją). Liko pritaikyti `verslomatika-v2-website` repo ir deploy'inti. Kol neįdiegta, nauji laiškai edge'o nenaudoja (žr. sprendimą Nr. 4).
- [~] **A7. Sekimas veikia.** _(Kodas paruoštas 2026-11-05: nuorodos per `reputacija.verslomatika.lt`, sutvarkytas `lead_id` sutapimas su `campaign_leads.id`, tokenas nesaugomas sekimo lentelėse. Liko patikrinti su tikru laišku po serverio perkrovimo.)_ Laiškų nuorodos veda per `reputacija.verslomatika.lt/api/track/*` (Next.js versija įrašo į DB ir turi allowlist).
  Patikra: išsiuntus testinį laišką, `campaign_leads.opened_at` / `clicked_at` užsipildo.

### Etapas B: demonstracija, kuri parduoda (P1)

- [x] **B1. Demo „savininko režimas“ (`is_demo=1`).** Sticky juosta „Sveiki, {Įmonė}! Tai Jūsų paruoštas atsiliepimų puslapis“ + „Aktyvuoti nemokamai“. Dviejų pusių vaizdas: kliento telefonas | vadovo dėžutė su gyvu pranešimu ir el. laiško peržiūra. 5★ demo režime neišveda iš puslapio (rodo, kas įvyktų). QR stovelio maketas su pavadinimu. 3 žingsniai „Kaip pradėti“. Atsarginis CTA (el. laiškas Tomui). Rizikos pašalinimo eilutė.
  Failai: `src/app/r/[slug]/page.tsx`, naujas `src/components/owner-demo.tsx`, `src/components/review-gate.tsx`, `src/app/globals.css`.
- [x] **B2. Jungiklis „Vieša Google nuoroda po 1–3★“** (savininko sprendimas Nr. 1). Stulpelis `clients.show_public_link_low INTEGER NOT NULL DEFAULT 0`. Jungiklis skydelyje su paaiškinimu. `ReviewGate` jo laikosi (ir sėkmės ekrane po privačios žinutės).
  Failai: `src/lib/db.ts`, `src/app/api/admin/clients/route.ts` (arba naujas `api/admin/settings`), `src/app/admin/page.tsx`, `src/components/review-gate.tsx`.
- [ ] **B3. Google duomenys personalizacijai.** Stulpeliai `clients.google_place_id`, `google_rating`, `google_reviews_count`. Pildo resolveris. Demo rodo prognozę tik jei duomenys yra.
  ⚠️ Patikimam variantui reikia **Google Places API rakto** (`GOOGLE_PLACES_API_KEY` aplinkoje), kurį turi suteikti savininkas. Be rakto veikia dabartinis skrapinimas, o laiškas siunčiamas be skaičių.
  Failai: `core/google_place_resolver.py`, `core/dental_lead_pool.py`, `src/lib/db.ts`.

### Etapas C: laiškai (P1)

- [x] **C1. Nauji šablonai pagal nišą:** `clinic`, `ecommerce`, `services`. 80–130 žodžių, „paprasto laiško“ išvaizda, vienas CTA, taisyklingas kreipinys („Laba diena,“), be „100%“ ir „niekada“, aiškus atsisakymas.
  Failas: `core/morning_campaign_runner.py` → `build_tracked_email()`.
- [x] **C2. Nesiųsti, jei Google nuoroda nepatikrinta** (be `placeid`). Leadas pažymimas `needs_review` ir praleidžiamas.
- [x] **C3. Follow-up agentas (be skambučių, savininko sprendimas 2026-11-05).** Failas: `core/followup_runner.py` (aprašas ir logika failo viršuje), testai `test_followups.py` (53/53).
  Agentas pagal elgseną po pirmo laiško (E0) pats parašo kitą laišką toje pačioje gijoje:
  | Segmentas | Signalas | Laiškas | Kada |
  |---|---|---|---|
  | Karštas | paspaudė demo nuorodą ≥2 min. po išsiuntimo (ne pašto skeneris) **arba** spaudė žvaigždutes demo puslapyje | **H1** „Kaip pradėti šiandien“: 2 būdai pagal nišą + paruoštas SMS tekstas + aktyvavimo nuoroda | ≥20 val. po peržiūros, kitą darbo dieną |
  | Karštas, neaktyvavo | po H1 | **H2** „3 dažniausi klausimai“ (kaina / laikas / ar klientai naudos) + „atsakykite taip“ | +3 darbo d. nuo H1 |
  | Šaltas | demo neatidarė | **B1** „Ar teisingam žmogui rašau?“ (prašymas persiųsti) + demo nuoroda | +3 darbo d. nuo E0 |
  | Visi neaktyvavę | po paskutinio | **F** uždarymas su tikra aktyvavimo nuorodos galiojimo data | +5 d.d. (karštiems) / +7 d.d. (šaltiems) |
  Taisyklės: daugiausia 3 follow-up'ai, F paskutinis; STOP, jei aktyvavo, atsakė, bounced ar `campaign_suppressions`. Siunčiama tik Pr–Pn 08:30–16:30. Viena bendra 25/d. kvota su naujais laiškais, follow-up'ai (karšti) pirmiau. Laiškuose nerašome „matėme, kad atidarėte“: elgsena tik parenka turinį.
  Komandos: `python core/followup_runner.py status` (kas priklausytų, nieko nesiunčia), `preview` (šablonai → `data/reports/email_previews/followups/`), `once`. Demonas `morning_campaign_runner.py daemon` jį kviečia automatiškai.
  Kartu pataisyta: `core/smtp_sender.py` dabar prideda `Date` ir `Message-ID` (pristatomumas, gijos), `List-Unsubscribe`. Nepavykęs siuntimas nebežymimas „sent“ (`send_email` grąžina False, o ne klaidą). Nauji laiškai savaitgaliais nesiunčiami. Lentelė `campaign_messages` (E0/B1/H1/H2/F, message_id).
  - [ ] **C3b (vėliau).** LLM personalizacijos sakinys follow-up'uose (pvz. pagal įmonės svetainę), griežtai be skaičių ir pažadų. Šablonai lieka pagrindu.
  - [ ] **C3c (vėliau).** Kai bus 30+ išsiųstų follow-up'ų: palyginti atsakymų / aktyvavimų dalį pagal žingsnį ir pakoreguoti laiką bei tekstą.
- [x] **C4. „Atsisakau“ / „ne“ atsakymai** → `campaign_leads.status='opt_out'`, tokiems niekada nesiunčiama.
  Failas: `core/email_reply_listener.py`. _(2026-11-05: `is_opt_out()` + `campaign_suppressions`. Papildomai pataisyta: kampanijos atsakymai su žodžiais „kaina“, „UAB“ anksčiau keliavo į buhalterijos srautą.)_

### Etapas D: skydelis ir pirmos 14 dienų (P1)

- [x] **D1. Onboarding checklist** (`id="onboarding"`): Google nuoroda patikrinta → QR atsisiųstas → nuoroda išsiųsta klientams (paruoštas SMS/el. laiško tekstas su „Kopijuoti“) → pirmas įvertinimas gautas. Progreso juosta.
  Failai: naujas `src/components/onboarding-checklist.tsx`, `src/app/admin/page.tsx`.
- [x] **D2. Sąžiningumas:** „Susietas“ rodomas tik su `placeid`/`g.page` nuoroda. Vidurkis be duomenų: „Dar nėra įvertinimų“. Terminai „Klinikos“ → „Įmonės“.
- [ ] **D3. Bandymo laiškų seka** (1 / 3 / 7 / 11 / 13 d.), 11 d. su rezultatų suvestine.
  Failas: naujas `core/trial_nurture_runner.py`.

### Etapas E: serveris = šis PC (patikimumas)

- [~] **E1. Automatinis paleidimas po perkrovimo:** Next.js (3000), Cloudflare Tunnel, `morning_campaign_runner.py daemon`, `email_reply_listener.py` (Windows Task Scheduler „At startup“ arba NSSM servisai).
  Failai: `start_all_services.ps1`, naujas `scripts/register-windows-tasks.ps1`. _(2026-11-05: skriptas paruoštas, bet NEPALEISTAS, nes keičia Windows Task Scheduler. Savininkas paleidžia kaip administratorius. Į abu paleidimo skriptus pridėtas budėtojas. Kampanijos demonai paleidimo skripte užkomentuoti: įjungti po laiškų peržiūros.)_
- [x] **E2. Kasdienė SQLite atsarginė kopija** (`sqlite3.backup()` → `backups/reputation-YYYYMMDD.db`, saugoti 30 d., papildomai kopija į debesį).
  Failas: `core/backup_db.py` → `data/operations/backups/` (30 d.). Kasdien ~03:00 kviečia budėtojas. Kopija į debesį dar nesukonfigūruota.
- [x] **E3. Sveikatos stebėjimas:** kas 1 min. `GET http://127.0.0.1:3000/api/health` ir viešas `https://reputacija.verslomatika.lt/api/health`. Jei krenta 3 kartus, perkrauti procesą ir pranešti el. paštu.
  Failas: `core/health_watchdog.py` (`python core/health_watchdog.py once` diagnostikai). Įspėjimai siunčiami į `VERSLOMATIKA_ALERT_EMAIL` (numatyta tomas@verslomatika.lt).
- [ ] **E4. Windows nustatymai:** išjungti miego režimą, automatinį perkrovimą po atnaujinimų nustatyti naktiniam laikui, UPS (rekomendacija).

### Etapas F: landing ir pozicionavimas

- [ ] **F1. `verslomatika.lt/reputacija/` pažadai = realus produktas.** Integracijos (Shopify, Woo, PrestaShop, OpenCart, Omniva/DPD, Webhook API), SMS ir Trustpilot pažymėti „Netrukus“ arba pašalinti. Skaičiuoklės skaičiai tikroviški. ⚠️ Šaltinis edge worker'io repo.
- [ ] **F2. Socialinis įrodymas:** 3–5 pilotiniai klientai (nemokamai 2 mėn. mainais į atsiliepimą ir skaičius).

### Etapas G: apmokėjimai (PASKUTINIS, savininko sprendimas Nr. 2)

- [ ] **G1. Kainodaros supaprastinimas** (rekomendacija audite §P1-6: vienas planas 49 €/mėn. arba 490 €/m.).
- [ ] **G2. Stripe ir/ar Paysera/Montonio** prenumerata. Kodas jau yra: `src/lib/stripe.ts`, `src/lib/clinic-checkout.ts`, `src/app/api/stripe/webhook/route.ts`. Įjungti `src/lib/billing-mode.ts`.
- [ ] **G3. Bandymo pabaiga:** `trial_ends_at < now` → 7 d. grace, skydelyje „Pratęskite“, po grace `/r/{slug}` rodo neutralų puslapį. Failai: `src/lib/entitlements.ts`, `src/lib/clinic-access.ts`.

---

## 3. Kaip tikrinti (komandos)

```bash
cd apps/reputationpro
npm test            # unit testai (node:test), turi praeiti visi
npm run typecheck   # TypeScript
npm run build       # produkcinis build'as
```

Lokaliai su atskira DB, neliečiant gyvos:
```powershell
$env:DATABASE_PATH="E:\Verslomatika\apps\reputationpro\data\dev-copy.db"; npm run dev
```

Python sintaksė:
```bash
python -m py_compile core/morning_campaign_runner.py core/dental_lead_pool.py core/claim_tokens.py
```

Laiško peržiūra be siuntimo: `python test_email_preview.py`.

---

## 4. Pastabos perėmėjui (gotchas)

- **Gyva DB:** `apps/reputationpro/data/reputation.db` (WAL). Ją naudoja ir Next.js, ir Python skriptai. Schemos pakeitimai turi būti idempotentiški (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN` tik jei stulpelio nėra) ir vienodi Node (`src/lib/db.ts`) bei Python (`core/claim_tokens.py::ensure_schema`) pusėse.
- **Gyvas serveris** veikia iš `npm run build` + `npm run start`. Kodo pakeitimai gyvai neatsiranda, kol nepadarytas build'as ir neperkrautas procesas.
- **Edge worker** (`verslomatika.lt/r/*`, `/api/track/*`, `/api/qr`, `/checkout`) yra kitoje repo. Gyvo kodo kopija: `verslomatika_v2_live.js` (bundle). Šaltinis ištrauktas iš sourcemap'o.
- **Git Bash** keičia kelius, prasidedančius `/` (pvz. `/r/x` → `C:/Program Files/Git/r/x`). Naudok `MSYS_NO_PATHCONV=1` arba PowerShell.
- **Šio PC DNS** kartais neišsprendžia `reputacija.verslomatika.lt`. Testuok su `curl --resolve reputacija.verslomatika.lt:443:104.21.35.136 ...`.
- **Lietuviškos raidės:** Python skriptuose `sys.stdout.reconfigure(encoding='utf-8')`. Su `python -I` `PYTHONIOENCODING` neveikia.

---

## 5. Darbų žurnalas

| Data | Kas | Ką padarė |
|---|---|---|
| 2026-11-05 | Claude (Opus 5.5) | Auditas, šis roadmap'as |
| 2026-11-05 | Claude (Opus 5.5) | A0–A2, A4, B1, B2, D1 (Next.js pusė). 19/19 testų praeina, `tsc` švarus |
| 2026-11-05 | Claude (Opus 5.5) | Tyrimo kelias (`research` komanda, `data/leads/research/*.json`), pirmas tikras laiškas Memory Casting. Pataisyti Google ID: Denticija (naujas), Memocasting (senas buvo neteisingas). |
| 2026-11-05 | Claude (Opus 5.5) | C3 follow-up agentas (B1/H1/H2/F), SMTP antraštės, bendra kvota. Patikrinta DB kopijoje: karšti → H1, skeneris/šalti → B1, aktyvavę ir atsisakę – stop. |
| 2026-11-05 | Claude (Opus 5.5) | D2, E2, E3, A6 instrukcija, AGENTS.md atnaujintas. Patikrinta naršyklėje su DB kopija: demo → aktyvavimas → skydelis → jungiklis. |
| 2026-11-05 | Claude (Opus 5.5) | A3, A5, C1, C2, C4 (Python). `python core/morning_campaign_runner.py preview 4` sugeneruoja peržiūras į `data/reports/email_previews/`. `python test_email_preview.py` 8/8 OK |

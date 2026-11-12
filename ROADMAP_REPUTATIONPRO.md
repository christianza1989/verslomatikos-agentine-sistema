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
5. **Įmonės be Google profilio nepraleidžiamos (2026-11-11).** Jų klientai nukreipiami į Rekvizitai.lt atsiliepimus, o laiške pateikiama nuoroda į mūsų instrukciją, kaip susikurti Google profilį. Plačiau: Etapas R.

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

### 🧭 Perėmėjui: nuo ko pradėti (atnaujinta 2026-11-11)

Būsena: visas kodas yra GitHub `main` (paskutiniai commit'ai `0c9d207`, `bc006ac`, `4b16873`). Gyva versija paskutinį kartą įdiegta su demo hero (Etapas H). Etapai R, S, K, M, N kode padaryti, bet **gyvai atsiras tik po diegimo** (Z1i). Testai: `npm test` 38/38, `python test_company_groups.py` 17/17.

Prioritetai:
1. **Z1i:** savininkas paleidžia `deploy-live.ps1` ir greitai patikrina: skydelio „Filialai“, `/google-profilis`, demo hero, `/admin/klientai`.
2. **R8:** Ergonomic.lt laiškas, kai savininkas duos tikslų gavėjo adresą (`data/leads/research/ergonomic-lt.json`, laukas `email`).
3. **S5:** savininkas patvirtina, ar VIC ir „Vilniaus Šypsena Pro“ yra tikri klientai.
4. **Z1e, Z2, Z3, E4:** Marius konfigas, kampanijos įjungimas, automatinis paleidimas, Windows nustatymai (daro savininkas šiame PC).
5. **D3, D4, B3:** bandymo laiškų seka, el. pašto keitimas skydelyje, Google duomenys.
6. **A6 + K7 + F:** `verslomatika.lt` edge worker'is (kitas repo, reikia savininko leidimo diegti).
7. **G + M8:** apmokėjimai ir filialų kainodara (paskutinis etapas, savininko sprendimas Nr. 2).

Darbo taisyklės: AGENTS.md invariantai 1–11. Nekeisti gyvos DB testams; tikrinti su DB kopija (žr. 4 skyrių). Gyvo serverio agentas sustabdyti negali: diegia savininkas.

### ⚡ Diegimas

- [x] **Z1. Įdiegti naują versiją į gyvą serverį.** _(Savininkas diegė kelis kartus 11-05–11-11.)_ Visi A–E pakeitimai ir `.env.local` pataisa (A0) įsigalioja tik po build'o ir perkrovimo. Automatinis agento bandymas sustabdyti gyvą procesą buvo užblokuotas saugumo taisyklės, todėl tai daro savininkas:
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
- [x] **Z1f. Įdiegti 11-06 pataisas** (kliento peržiūra `?view=klientas`, keičiamas el. paštas aktyvuojant): `deploy-live.ps1`. Gyva versija sukurta 11-05 23:16.
- [x] **Z1g. Demo telefonas 1:1 kaip mato klientas (2026-11-10, laukia diegimo).** Standartinės iPhone proporcijos (9:19,5), vidinis slinkimas, Dynamic Island, naršyklės adreso juosta. Po 4–5★ (gyvai, peržiūroje ir demo telefone vienodai) rodoma padėka su prašymu ir vienu mygtuku „Rašyti atsiliepimą Google“, kuris atveria TIKRĄ įmonės Google atsiliepimų formą naujame skirtuke. Automatinio nukreipimo nebėra (savininko sprendimas 2026-11-10). Google formos kitos svetainės viduje rodyti neįmanoma, todėl maketo nenaudojame. Paaiškinimai tik dešinėje, vadovo dėžutėje. `?view=klientas` po 5★ nukreipia į tikrą Google formą.
- [x] **Z1h. Neveikiančios Google nuorodos `writereview?q=…` (Google: „400. That's an error.“).** Resolveris (`core/google_place_resolver.py`) be Place ID dabar grąžina Maps paiešką. Programėlė kiekvieną kliento įrašą normalizuoja (`usableReviewUrl` per `toClient()` `src/lib/db.ts`), todėl seni įrašai niekada nerodo 400. Įrašytas patikrintas Buivydiškių veterinarijos klinikos ID.
- [ ] **Z1i. Įdiegti 2026-11-11 vakaro pakeitimus** (Etapai R, S, K, M, N, platesnis hero): `deploy-live.ps1`. Po diegimo Python ir Next.js pusės pačios prideda naujus stulpelius/lenteles (`parent_id`, `location_label`, `archived_at`, `notify_emails`, `stand_orders` stulpeliai, `campaign_companies`, `branch_invites`).
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
- [x] **C5. Pirmo laiško temų A/B/C variantai (2026-11-11, laukia savininko patvirtinimo ir diegimo).** 4 atvejai × 3 variantai: `core/morning_campaign_runner.py::build_subject()` (`SUBJECT_CASES`, `subject_case()`). Variantas stabilus pagal lead'ą: `subject_variant(lead_id)` = `crc32(lead_id) % 3`, follow-up'ai ir taip ima E0 temą iš DB („Re: …“). Įrašoma `campaign_messages.variant` = `"atvejis:raidė"` (pvz. `google_stats:B`), stulpelis pridedamas idempotentiškai abiejose pusėse (`core/claim_tokens.py::ensure_schema`, `src/lib/db.ts::ensureCampaignMessages`). `research` laiškai (individuali tema) varianto neturi ir statistikoje nerodomi. Rezultatai: `/admin/klientai` → „Laiškų temų rezultatai“ (`getSubjectVariantStats()`: išsiųsta, atidaryta %, paspausta %, aktyvavo; < 30 išsiuntimų → „per mažai duomenų“). Testai: `python test_email_preview.py` (visi 12 variantų pagal taisykles), `python test_subject_variants.py`, `tests/subject-variants.test.ts`. Kartu pataisyta gramatika: „iš 21 atsiliepimo“, „395 atsiliepimai“.
  - [ ] **C5b (kai bus ≥ 30 išsiuntimų kiekvienam variantui).** Palyginti paspaudimus ir aktyvavimus (atidarymai nepatikimi dėl Apple Mail Privacy), prastesnį variantą pakeisti nauju.

- [x] **C6. Pirmo laiško tekstai pagal segmentą (savininko sprendimas 2026-11-12).** `core/email_copy.py`: segmentai top (≥4,8: skaičius ir šviežumas prieš konkurentus), mid (4,5–4,79: iki 4,8★), low (<4,5: patenkinti tyli), few (<30 atsiliepimų: keičiasi greitai), be Google (Rekvizitai.lt + instrukcija). Kiekviename: faktas apie juos, paskaičiuota prognozė (tas pats tempas kaip demo 15/8/5 per mėn., taisyklinga skaičių gramatika), blokas „Kaip tai veikia“ (3 žingsniai, 1–3★ pirmiausia komandai), mygtukas su įmonės pavadinimu, „14 d. nemokamai, be kortelės ir įsipareigojimų, planą pasirinksite patys“ + stovelis. Tyrimo laukai `research.praise_theme` ir `research.competitor` naudojami tik jei yra (lead dict). Liko: automatiškai rinkti konkurentus ir giriamą temą (dabar tik tyrimo JSON).

### Etapas D: skydelis ir pirmos 14 dienų (P1)

- [x] **D1. Onboarding checklist** (`id="onboarding"`): Google nuoroda patikrinta → QR atsisiųstas → nuoroda išsiųsta klientams (paruoštas SMS/el. laiško tekstas su „Kopijuoti“) → pirmas įvertinimas gautas. Progreso juosta.
  Failai: naujas `src/components/onboarding-checklist.tsx`, `src/app/admin/page.tsx`.
- [x] **D2. Sąžiningumas:** „Susietas“ rodomas tik su `placeid`/`g.page` nuoroda. Vidurkis be duomenų: „Dar nėra įvertinimų“. Terminai „Klinikos“ → „Įmonės“.
- [ ] **D3. Bandymo laiškų seka** (1 / 3 / 7 / 11 / 13 d.), 11 d. su rezultatų suvestine.
  Failas: naujas `core/trial_nurture_runner.py`.

- [x] **D5. „QR kodai ir nuorodos“ rinkinys skydelyje (2026-11-11).** Klientas vienoje vietoje paruošia QR/nuorodą kiekvienam būdui.
  - [x] D5.1 Kanalai `src/lib/qr-channels.ts`: `stovelis`, `kvitas`, `vizitine`, `lipdukai`, `parasas`, `sms`, `svetaine`, `nuoroda`. Kiekvieno nuoroda `/r/{slug}?s={kanalas}`.
  - [x] D5.2 `GET /api/admin/qr?slug&s&format=png|svg&size&style=brand|black`: atsisiuntimas su aiškiu failo vardu (`{slug}-{kanalas}-qr.png`). Juodai baltas skirtas terminiams kvitų spausdintuvams.
  - [x] D5.3 Spausdinimo lapai `/admin/print?type=stand|poster|labels`: A6 stovelio įdėklas, A4 plakatas, A4 lapas su 12 lipdukų.
  - [x] D5.4 Kopijuojami dalykai: el. pašto parašas (rich HTML į Gmail/Outlook), SMS tekstas, svetainės mygtuko HTML, nuoroda.
  - [x] D5.5 Kanalų matavimas: `review_events.source`, `/api/rating` priima `source`, skydelyje rodoma „Iš kur ateina įvertinimai“.
  - [x] D5.6 `src/components/qr-kit.tsx` pakeičia `StandStudio` skydelyje, šoninis meniu „QR kodai ir nuorodos“ (`#qr`).

### Etapas R: įmonės be Google profilio → Rekvizitai.lt atsiliepimai (savininko sprendimas 2026-11-11)

Kontekstas: Ergonomic.lt (2026-11-11) neturi Google Maps profilio, bet Rekvizitai.lt turi 8,3/10 (19 įvertinimų, 9 atsiliepimai). Iki šiol tokie leadai buvo praleidžiami (`needs_review`, C2). Dabar jiems siunčiame atskirą laišką, o jų klientus nukreipiame į Rekvizitai.lt atsiliepimų formą. Ta forma veikia be registracijos: vardas, el. paštas, tekstas, įvertinimas 1–10 (patikrinta 2026-11-11).

- [x] **R1. Atsiliepimų platforma kliento profilyje.** _(Padaryta 2026-11-11, paprasčiau nei planuota: be naujų stulpelių.)_ Vieša nuoroda lieka `clients.google_review_url` (istorinis pavadinimas = „viešų atsiliepimų nuoroda“), o platforma nustatoma iš pačios nuorodos: `src/lib/review-platforms.ts` (`rekvizitaiReviewUrl`, `reviewPlatform`, `PLATFORM_COPY`), Python veidrodis `core/claim_tokens.py::rekvizitai_review_url`. Baltasis sąrašas: tik `https://rekvizitai.vz.lt/imone/{įmonė}/atsiliepimai/` (įklijuota įmonės nuoroda paverčiama šia). `validReviewUrl` / `normalizeReviewUrl` naudoja aktyvavimas, nustatymai ir registracija. Klientui įklijavus Google nuorodą, viskas persijungia į Google automatiškai.
- [x] **R2. Kliento puslapis `/r/{slug}`.** 4–5★: „Rašyti atsiliepimą Rekvizitai.lt“ ir užuomina „Atsidariusiame puslapyje spauskite „Parašykite savo atsiliepimą“. Registruotis nereikia.“ (Rekvizitai forma atsiveria tik paspaudus tą mygtuką.) Žodžio „Google“ Rekvizitai klientams nėra. `#rating=10` Rekvizitai formoje įvertinimo NEPAŽYMI (patikrinta), todėl nenaudojama.
- [x] **R3. Savininko demo ir skydelis.** Demo tekstai, iliustracijos (`usage-scenes.tsx` `platform` parametras), blokas „Dar neturite Google profilio? Pradėsime be jo.“, DUK „Kodėl Rekvizitai.lt“. Skydelyje: kortelė „Rekvizitai.lt ryšys“ + nuoroda į instrukciją, jungiklio tekstai, onboarding 1 žingsnis, QR rinkinio etiketės, aktyvavimo puslapis ir formos laukas „Google arba Rekvizitai.lt“.
- [x] **R4. Instrukcijos puslapis `https://reputacija.verslomatika.lt/google-profilis`** (`src/app/google-profilis/page.tsx`, `?imone={slug}` personalizuoja antraštę). Žingsniai sutikrinti su Google pagalba 2026-11-11 (support.google.com/business 2911778, 7107242, 16816815). Header/footer bendri: `src/components/vm-chrome.tsx`. Nukreipimas iš `verslomatika.lt/google-profilis` – kartu su A6.
- [x] **R5. Agentų tyrimas.** `core/google_place_resolver.py`: `fetch_rekvizitai`, `verify_rekvizitai` (atitikimas tik pagal telefoną ar svetainės domeną), `find_rekvizitai` (paieška pagal pavadinimą, geriausios pastangos: prekės ženklas dažnai ≠ juridinis pavadinimas, pvz. Ergonomic.lt nerandamas), `get_review_destination` → `(url, platform, info)`. `provision_lead_in_db()` naudoja jį, kai Google nuorodos nėra. Tyrimo JSON: `rekvizitai_url`, `google_place_id` neprivalomas.
- [x] **R6. Laiškas „be Google“.** `NO_GOOGLE` šablonas `build_tracked_email(no_google=True, rk_stats=…)`, individualus laiškas `build_custom_email(guide=…)` su `email_draft.guide_text`. Instrukcijos nuoroda – teksto nuoroda, vienas CTA mygtukas. Follow-up'ai (`build_followup(platform=…)`) be „Google“ žodžių.
- [x] **R7. Testai ir peržiūra.** `tests/review-platforms.test.ts`, `tests/stand-order.test.ts`, iš viso 27/27. Patikrinta naršyklėje DB kopijoje: demo, 5★ mygtukas → Rekvizitai, instrukcijos puslapis. Bandomasis laiškas: `python core/morning_campaign_runner.py research data/leads/research/ergonomic-lt.json --send --to=savininko@adresas` (siųsti TIK po diegimo, kitaip demo rodys seną versiją).
- [ ] **R8. Pirmas tikras laiškas: Ergonomic.lt** (`data/leads/research/ergonomic-lt.json` paruoštas, `email` tuščias – be jo tikras siuntimas blokuojamas).
  - Rekvizitai: `https://rekvizitai.vz.lt/imone/a_z_prekyba/atsiliepimai/`. Atitikimas patvirtintas telefonu +370 691 99833 (2026-11-11). Įvertinimas 8,3/10 iš 19, 9 atsiliepimai.
  - Google Maps profilio nėra (tikrinta 2026-11-11). Konkurentai: Trukmė 4,5★/94, Ergolain 4,9★/42, Ergostalas 5,0★/36.
  - Laiške ir demo naudoti tik „Ergonomic.lt“ (savininko nurodymas).
  - Gavėjo adresą patvirtinti su savininku prieš siunčiant (pirmas nurodytas adresas buvo be @). Domenas ergonomic.lt priima paštą (Google Workspace MX).

### Etapas S: nemokamas QR + NFC stovelis (savininko sprendimas 2026-11-11)

- [x] **S1. Užsakymas kliento skydelyje** (`#stovelis`, `src/components/stand-order.tsx`): gavėjas, telefonas, įmonė, adresas, pašto kodas, kiekis 1–3, pastabos. Būsena tikra (`stand_orders.status`: `requested` → `sent` → `delivered`, `canceled`), adresą galima keisti, kol neišsiųsta. Tik aktyvuotoms paskyroms (`is_demo=0`). API: `POST /api/admin/stand-order`.
- [x] **S2. Savininkui pranešimas el. paštu** (`sendStandOrderAlert` → tomas@verslomatika.lt) su adresu ir NFC nuoroda `…/r/{slug}?s=stovelis`.
- [x] **S3. Savininko puslapis `/admin/klientai`**: visos aktyvuotos paskyros (aktyvavimo data, planas, įvertinimai, neperskaitytos pastabos, stovelio būsena) ir stovelių užsakymai su mygtukais „Išsiųsta“ / „Pristatyta“ (`PATCH`, tik savininkui). Seni `stand_orders` įrašai be adreso (2026-11-05 registracijos) laikomi neužsakytais.
- [x] **S4. Demo „Ką gaunate“ ir DUK** mini nemokamą stovelį aktyvavus.
- [ ] **S5. Patikrinti, ar VIC ir „Vilniaus Šypsena Pro“ (`is_demo=0`, 2026-11-05) yra tikri klientai, ar seni testiniai įrašai.** Jie rodomi `/admin/klientai`.

### Etapas H: demo hero, kuriame telefonas valdo sistemos schemą (planas 2026-11-11, peržiūrėtas)

Tikslas: per 10 sekundžių savininkas supranta visą paslaugą: kur klientas pamato kodą, kas nutinka po gero ir po blogo įvertinimo, ką reikia daryti jam pačiam.

Pirmos versijos (atskiras 20 s „filmukas“ šalia telefono) problemos, todėl ji atmesta:
- du judantys centrai: autoplay animacija atitraukia akį nuo telefono, kurį norime, kad paspaustų;
- animacijos viduje būtų antras telefonas;
- svarbiausia mintis tik ~10 sekundę, o dauguma tiek nežiūri;
- 5 būdai vienu metu sukuria grūstį, nors kiekvienai veiklai aktualūs 2–3;
- telefone (pusė atidarymų) animacija būtų po telefonu ir jos niekas nepamatytų;
- akcentas „blogi atsiliepimai nepatenka į Google“ prieštarauja AGENTS.md invariantui 3 ir Google taisyklėms.

Principas: vienas dėmesio centras, tikras telefonas. Viskas kita reaguoja į jį. Animacija kodu (SVG + CSS, `src/components/hero-motion.tsx`), ne MP4: asmeniška (pavadinimas, QR, Google arba Rekvizitai.lt) ir ~30 KB.

- [x] **H1. Antraštė pasako naudą be animacijos.** Pvz. „Daugiau 5★ atsiliepimų {Įmonė}. Pastabos pirmiausia ateina Jums.“, viena eilutė paaiškinimo, CTA „Aktyvuoti nemokamai“, 3 punktai (14 d. nemokamai, be kortelės, nemokamas QR + NFC stovelis). Jei žinoma: asmeninis skaičius („Google šiandien 4,6★ iš 395“ arba „Google žemėlapiuose Jūsų nėra“).
- [x] **H2. Scena: kairėje telefonas, dešinėje skydelis „Kas vyksta toliau“** su 3 būsenomis:
  - *Laukia*: kaip klientai pasiekia puslapį: 3 būdai pagal veiklą (klinika: stovelis registratūroje, SMS po vizito, kvitas; el. parduotuvė: lipdukas ant siuntinio, laiškas po užsakymo, parašas; kavinė/paslaugos: kvitas, stovelis, SMS). Rodyklė „Paspauskite žvaigždutę telefone“.
  - *Po 4–5★*: linija į Google (arba Rekvizitai.lt) kortelę, „+1 ★★★★★“, reitingo skaitiklis.
  - *Po 1–3★*: pastaba keliauja į „Vadovo dėžutę“ + el. pašto pranešimo pavyzdys „Nauja pastaba nuo kliento“ + „Galite paskambinti ir išspręsti“. Mažu šriftu sąžiningai: „Klientas visada gali parašyti ir viešai.“ (kai jungiklis įjungtas, rodoma ir viešo atsiliepimo nuoroda).
- [x] **H3. „Vaiduoklio“ demonstracija.** Jei per ~6 s po hero pasirodymo niekas nespaudžia, pats telefonas parodo pirštą, kuris paspaudžia 5★ (skydelis rodo kelią į Google), tada atsistato ir paspaudžia 2★ (kelias vadovui). Tik vieną kartą; bet koks paspaudimas ją sustabdo.
- [x] **H4. Telefonuose iš pradžių.** <900 px: antraštė → telefonas → skydelis „Kas vyksta toliau“ atsiranda iškart po žvaigždutėmis, kaip įslenkanti kortelė; būdai rodomi kaip slenkanti juosta virš telefono.
- [x] **H5. Kokybė.** Tik `transform`/`opacity`, sustoja nematoma, `prefers-reduced-motion` → statiški kadrai, jokio CLS, antraštė yra LCP. Tikrinti Chrome, Safari iOS, Android, 375 / 768 / 1280 / 1920 px.
- [x] **H6. Matavimas sąžiningai.** Per mažas srautas (~25 laiškai/d.) A/B testui, todėl matuoti įsitraukimą: dalis žmonių, paspaudusių žvaigždutę, paslinkusių iki CTA, paspaudusių CTA, ir aktyvavimus per savaitę prieš ir po.
_Padaryta 2026-11-11 (laukia diegimo): `src/components/hero-motion.tsx`, `owner-demo.tsx` (orkestracija), `review-gate.tsx` (`control`, `highlightPublic`). Savininko idėja: po 1–3★ pastaba „įrašoma“ akyse ir „išsiunčiama“ (lankytojas gali perimti), skydelyje atkeliauja laiškas su tuo tekstu ir „Kam: {įmonės el. paštas}“ (tik asmeninėje nuorodoje). Demo įvertinimai nebesiunčiami į `/api/rating`, o API demo profiliams jų nesaugo. Matavimas: `POST /api/track/demo` → `campaign_events` (`click`, `demo:{įvykis}`). Patikrinta naršyklėje 1280 ir 390 px DB kopijoje._
- [ ] **H7. (Vėliau) žmogaus balsas.** 30–40 s įrašas su Tomo balsu ir subtitrais (B2B pasitikėjimui) ir GIF miniatiūra laiškams. Testuoti tik po H1–H6.

### Etapas K: „Mažiau streso darbuotojams“ (2026-11-11, K1–K6 padaryta, laukia diegimo)

Problema: visur rašoma „vadovui“. Laišką ar demo dažnai pirmas perskaito registratūros ar aptarnavimo darbuotojas ir supranta, kad kiekviena klaida keliaus vadovui. Toks žmogus laiško nepersiųs. Pozicionavimas turi būti priešingas: sistema saugo darbuotojus. Nusivylęs klientas pirmiausia parašo įmonės komandai, o ne Google, ir darbuotojas gali pats išspręsti problemą, kol klientas skubotai neparašė viešai. Ypač svarbu naujiems darbuotojams.

Sąžiningumas (AGENTS.md invariantas 3): niekada nerašyti „apsaugos nuo blogų atsiliepimų“. Rašyti „suteikia progą išspręsti pirmiems“; klientas visada gali parašyti ir viešai.

- [x] **K1. Kliento puslapis (telefone, 1:1 su gyvu).** „vadovui“ → neutralu:
  - „Jūsų nuomonė svarbi vadovui“ → „Mums svarbu tai išspręsti“.
  - „Parašykite tiesiai vadovui – jis galės asmeniškai išspręsti situaciją“ → „Parašykite mums – atsakingas darbuotojas susisieks ir padės išspręsti“.
  - „Žinutė bus perduota tiesiogiai įmonės vadovui“ → „Žinutę gaus įmonės komanda. Viešai ji neskelbiama“.
  - Mygtukai: „Siųsti tiesiai vadovui“ → „Siųsti žinutę“; „Arba parašyti asmeninę žinutę vadovui“ → „Arba parašyti mums asmeniškai“; sutikime „įmonės vadovas“ → „įmonės atstovas“; padėkoje „perduota vadovui“ → „perduota“.
  - Kompromisas: piktam klientui „vadovas“ skamba rimčiau. „Atsakingas darbuotojas susisieks“ tą patį pažada nebaugindamas komandos.
- [x] **K2. Skydelis ir prisijungimas.** „Vadovo dėžutė“ → „Atsiliepimų dėžutė“ (šoninis meniu, antraštė, tuščia būsena, kampanijų puslapis); „Prisijungimas vadovui“ → „Prisijungti“; KPI „liko vadovui“ → „liko Jūsų komandai“; jungiklio tekstai be „vadovui“; pranešimo laiško tema „Nauja kliento pastaba“.
- [x] **K3. Demo tekstai.** Hero „pastabos pirmiausia ateina Jums“ → „Jūsų komandai“; „Kas vyksta toliau“ 2★ scena „Pastaba ateina Jūsų komandai: darbuotojas gali paskambinti ir išspręsti“; „Kaip veikia“ kortelė; DUK „Kas mato privačias pastabas? Jūsų komanda“.
- [x] **K4. Nauja demo sekcija „Mažiau streso Jūsų darbuotojams“** (po „Kaip veikia“, su vektorine iliustracija: 2★ → skambutis → išspręsta → padėka):
  - „Klaida – ne viešas skandalas“: suklydus nusivylimas pirmiausia tampa žinute komandai, o ne 1★, kuri kabo metų metus.
  - „Išspręskite tą pačią dieną“: darbuotojas paskambina, atsiprašo, pasiūlo sprendimą. Išspręsta problema dažnai virsta gera rekomendacija.
  - „Ramiau naujiems darbuotojams“: mokosi iš pastabų ramiai, be baimės būti viešai sukritikuoti.
  - „Padėkas mato visa komanda“: 5★ atsiliepimai motyvuoja.
  - Smulkiu šriftu: „Klientas visada gali parašyti ir viešai. Sistema tik suteikia progą išspręsti pirmiems.“
- [x] **K5. Komandos pranešimai (funkcija, kad žinutė būtų tiesa).** Nustatymuose „Kas gauna pastabas“: iki 3 el. paštų (pvz. registratūra, administratorius, vadovas). Stulpelis `clients.notify_emails`, validacija, `sendFeedbackAlert` siunčia visiems. Būsenos „Nauja / Sprendžiama / Išspręsta“ jau yra.
- [x] **K6. Laiškai ir follow-up'ai.** Viena eilutė apie komandą pagal veiklą (klinika: „registratūrai mažiau streso“, el. parduotuvė: „klientų aptarnavimo komandai“, kavinė: „padavėjams“). B1 „persiųskite kolegai, kuris rūpinasi atsiliepimais“.
_K5 įgyvendinta: `clients.notify_emails` (abiejose schemos pusėse), `parseNotifyEmails` / `notifyRecipients` (`src/lib/validation.ts`), `PATCH /api/admin/settings` priima `notify_emails`, nustatymuose `src/components/notify-emails.tsx`. Testai: `tests/team-notify.test.ts`. Patikrinta naršyklėje DB kopijoje: kliento puslapio tekstai, „Atsiliepimų dėžutė“, demo sekcija, adresų išsaugojimas._
- [ ] **K7. `verslomatika.lt/reputacija` sekcija** su ta pačia žinute: kitas repo (edge worker), daryti kartu su A6.

### Etapas M: filialai, kelios vietos vienoje paskyroje (2026-11-11, padaryta, laukia diegimo)

Verslas su keliais padaliniais (pvz. kituose miestuose) skydelyje susikuria filialų profilius. Kiekvienas filialas turi savo atsiliepimų puslapį `/r/{slug}`, QR kodus, pastabų dėžutę, statistiką, nustatymus, pranešimų gavėjus ir nemokamo stovelio užsakymą.

- [x] **M1. Duomenys.** Filialas yra `clients` eilutė su `parent_id` (pagrindinis profilis, tik vienas lygis), `location_label` (miestas ar adresas) ir `archived_at` (pašalintas). Stulpeliai abiejose schemos pusėse (`db.ts` `CLIENT_COLUMNS`, `core/claim_tokens.py`). `clients.email` UNIQUE, todėl filialas be savo el. pašto gauna `filialas-…@filialai.invalid` vietos rezervavimo adresą, kuriam niekas nesiunčiama. Funkcijos: `createBranch`, `updateBranch`, `archiveBranch`, `getBranches`, `getAccountRoot`, `getLocationStats`; `MAX_BRANCHES = 25` (apsauga, kol nėra kainodaros).
- [x] **M2. Prieiga.** Prisijungiama tik pagrindiniu profiliu; `canAccessClient` leidžia valdyti savo pagrindinį profilį ir jo filialus, niekada kitos paskyros. QR (`/api/admin/qr?slug`), spausdinimas (`/admin/print?slug`), pastabų būsenos, stovelio užsakymas ir nustatymai veikia pasirinktam filialui.
- [x] **M3. Prenumerata.** `canCollectFeedback(filialas)` tikrina pagrindinio profilio būseną ir bandymą; pašalintas filialas nebeima įvertinimų (puslapis 404).
- [x] **M4. Pranešimai.** Pastaba iš filialo ateina pagrindiniam paskyros el. paštui + filialo el. paštui (jei įrašytas) + filialo papildomiems adresams (`notifyRecipients(client, root)`).
- [x] **M5. Skydelis.** Perjungiklis „Pasirinkite filialą“ (`?clinic={slug}`), skiltis „Filialai ir vietos“ (`src/components/branch-manager.tsx`: sąrašas su įvertinimais ir neperskaitytomis pastabomis, „Valdyti“, „QR“, „Puslapis“, „Pridėti filialą“). Sukūrus filialą atveriami jo QR kodai. Nustatymuose filialo duomenys (pavadinimas, vieta, atsiliepimų nuoroda, el. paštas, telefonas, puslapio adresas su perspėjimu dėl QR) ir „Pašalinti filialą“. API: `POST/PATCH/DELETE /api/admin/branches`.
- [x] **M6. Savininko panelė.** `/admin/klientai`: paskyros su filialų sąrašu, bendru įvertinimų skaičiumi, filialų stovelių užsakymais; savininko perjungiklyje filialai pažymėti „↳“. Savininkas gali kurti filialą bet kuriai paskyrai.
- [x] **M7. Testai.** `tests/branches.test.ts` (6): planas ir unikalus adresas, prieiga tik prie savų filialų, prenumerata iš pagrindinio, archyvas, pranešimų gavėjai, savininko apžvalga, formos validacija. Iš viso 36/36. Patikrinta naršyklėje DB kopijoje.
- [ ] **M8. Kainodara (su Etapu G).** Variantai: (a) pagrindinis planas + X €/mėn. už kiekvieną filialą, (b) planas su neribotais filialais. Įgyvendinti: plano laukas (pvz. `clients.plan`), filialų limitas pagal planą vietoj `MAX_BRANCHES`, Stripe kiekis (`quantity` = filialų skaičius), sąskaitoje filialų sąrašas.

### Etapas N: įmonės su filialais kampanijose (2026-11-11, padaryta, laukia diegimo; `core/company_groups.py`, testai `test_company_groups.py` 17/17, TS 38/38. Įmonės nariai renkami iš visų katalogų (`all_catalog_leads`). Patikrinta naršyklėje DB kopijoje: demo perjungiklis, aktyvavimas, pakvietimas, filialo vadovo prieiga, savininko skiltis)

Dabar (patikrinta 2026-11-11): agentai dubliuojasi tik pagal tikslų el. paštą. Kiekvienas filialas laikomas atskira įmone: tą pačią dieną gali gauti laiškus keli tos pačios įmonės filialai, kiekvienam kuriamas atskiras demo ir atskiri follow-up'ai. Kai vienas aktyvuoja, kiti toliau gauna laiškus, o aktyvavimai sukuria atskiras paskyras, ne filialus. Kataloguose jau yra 6 tokios įmonės (Denticija Vilnius/Kaunas, Melga, Estetus, Sugihara, Amberton, Ratų meistrai).

Principai:
- **Viena įmonė = vienas pokalbis.** Įmonė niekada negauna kelių laiškų tą pačią dieną. Vienu metu aktyvi tik viena gija.
- **Vienas pasiūlymas visiems filialams.** Pirmas laiškas pristato puslapius visiems įmonės filialams („Paruošėme atsiliepimų puslapius visiems 3 Jūsų filialams: Vilnius, Kaunas, Klaipėda“). Tai stipresnis pasiūlymas nei rašyti kiekvienam atskirai.
- **Viena aktyvacija = visi filialai.** Bet kuriam filialui aktyvavus, aktyvuojama visa įmonės paskyra su visais filialais, o kitiems laiškai nebesiunčiami.
- **Kitas filialas tik jei tylima.** Ne kasdien naujam filialui (įmonė per savaitę gautų 5–7 laiškus, didėtų „spam“ skundų rizika ir kentėtų domeno reputacija), o vienas naujas adresas ne dažniau kaip kas 3 darbo dienas, tik jei niekas neatidarė ir nepaspaudė, iš viso ne daugiau 3 adresų įmonei.

- [x] **N1. Įmonės raktas (`company_key`).** Lead'ai grupuojami pagal įmonės el. pašto domeną (ne gmail.com, inbox.lt ir pan.), antra pagal svetainės domeną. Vien pavadinimas įmonės neįrodo (franšizės, bendriniai vardai): toks sutapimas tik pažymimas peržiūrai. Stulpelis `campaign_leads.company_key`. Visa įmonė priskiriama vienam agentui (pagal raktą), kad Tomas ir Marius nerašytų tai pačiai įmonei.
- [x] **N2. Pagrindinis kontaktas.** Iš įmonės adresų pirmas parenkamas: bendras / būstinės (info@, centras@) → didžiausio miesto filialas → filialas su daugiausiai Google atsiliepimų. Kiti adresai laukia (`status='group_waiting'`).
- [x] **N3. Viena demo paskyra su filialais.** Įmonė paruošiama kaip vienas demo profilis (pagrindinis) + filialų demo profiliai (`parent_id`, kiekvienas su savo Google nuoroda ir QR). Demo puslapyje virš telefono filialų perjungiklis („Vilnius · Kaunas · Klaipėda“), CTA „Aktyvuoti visus filialus“. Jau sukurti atskiri tos pačios įmonės demo profiliai (`is_demo=1`) susiejami; aktyvuotų neliečiame.
- [x] **N4. Aktyvavimas visai įmonei.** `claimClient()` aktyvuoja pagrindinį profilį ir visus jo demo filialus vienoje transakcijoje. Aktyvavimo nuoroda gali būti iš bet kurio filialo laiško: tokenas veda į tą pačią įmonės paskyrą.
- [x] **N5. Stabdymo taisyklės įmonės lygiu.** Aktyvavus, atsakius ar parašius „ne“ iš bet kurio įmonės adreso, sustoja visos tos įmonės gijos ir follow-up'ai (suppression pagal `company_key`). Atsakymas, kuris nėra „ne“, įmonę pristabdo rankiniam atsakymui.
- [x] **N6. Kaskada, kai tylima.** Jei pagrindinis kontaktas po E0 ir B1 (3 darbo dienos) nieko neatidarė ir nepaspaudė, kitam filialo adresui siunčiamas vienas laiškas su ta pačia įmonės demo nuoroda: „Rašome ir {Kauno} filialui: paruošėme puslapius visiems Jūsų filialams…“. Ne dažniau kaip kas 3 darbo dienas, ne daugiau 3 adresų įmonei. Jei pagrindinis kontaktas atidarė ar paspaudė, filialams nerašome: tęsiame tik jo follow-up'us. Visi laiškai skaičiuojami į bendrą 25/d. kvotą.
- [x] **N7. Filialų pakvietimai skydelyje.** Skiltyje „Filialai“ prie kiekvieno filialo mygtukas „Pakviesti filialo vadovą“: vienkartinė nuoroda `/pakvietimas/{token}` (kopijuoti arba išsiųsti el. paštu). Filialo vadovas įveda savo el. paštą ir slaptažodį ir gauna prisijungimą tik prie savo filialo: savo pastabos, QR, nustatymai. Kitų filialų ir mokėjimų nemato. Pagrindinė paskyra mato viską ir gali pakvietimą atšaukti.
- [x] **N8. Tyrimo agentas renka filialus.** Tiriant įmonę (svetainė, Google Maps), surenkami visi padaliniai: miestas, adresas, el. paštas, telefonas, Google place ID / Rekvizitai. Tyrimo JSON gauna `branches: [...]`; `research` komanda paruošia įmonės paskyrą su visais filialais.
- [x] **N9. Savininko panelė pagal įmones.** Kampanijų sąraše viena eilutė įmonei: filialai, kuris adresas aktyvus, kas išsiųsta ir kada, kitas planuojamas žingsnis, mygtukai „Stabdyti“ / „Tęsti“.
- [x] **N10. Testai.** Grupavimas pagal domeną (ne laisvi paštai), vienas laiškas per dieną įmonei, kaskados laikai ir limitas, stabdymas visai įmonei, aktyvavimas su visais filialais, pakvietimo prieiga tik prie savo filialo.

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

### Etapas L: naujų įmonių rinktuvas (2026-11-11, kodas paruoštas, LAUKIA `GOOGLE_PLACES_API_KEY`)

Kodėl: senuose kataloguose (326 įrašai) **115 adresų yra neegzistuojančiuose domenuose** (sugalvoti), o **nė vienas įrašas neturi patikrinto Google place ID**. Senas `resolve_google_place_id()` Maps HTML dabar gauna consent puslapį, Rekvizitai.lt saugo Cloudflare patikra (apeidinėti negalima). Todėl be rinktuvo tikras siuntimas beveik visus įrašus praleidžia (`needs_review`).

- [x] **L1. `core/lead_harvester.py`:** oficialus Google Places API (New) Text Search (nišos × 20 miestų, iki 60 rezultatų užklausai) → pavadinimas, reitingas, atsiliepimų skaičius, place ID, svetainė, telefonas; el. paštas iš įmonės svetainės (tik to paties domeno, kitaip laisvas paštas; sertifikatų tikrinimas neišjungiamas). Dublikatai šalinami pagal el. paštą, place ID, domeną. Rezultatas `data/leads/harvested.json` (Git-ignored). Komandos: `status`, `run --max-requests=40`, `run --target=1100` (mėnesio atsarga), `email <url>`, `lookup "Pavadinimas" Miestas <url>`.
- [x] **L2. Prijungta:** `multi_niche_lead_pool` ima surinktus pirmiausia (klinikoms nišos odontologija/veterinarija/medicina); `provision_lead_in_db` įrašo reitingą ir skaičių (→ segmento laiškas C6); seniems įrašams be place ID `places_lookup()` (priimama tik sutapus svetainės domenui). Demonas kartą per parą (nuo 03:00) paleidžia `harvest()` (`HARVEST_MAX_REQUESTS`, numatyta 40).
- [x] **L3. Apsauga nuo atšokusių laiškų:** `email_domain_exists()` prieš siuntimą; neegzistuojantis domenas → `campaign_suppressions.reason='bad_address'`.
- [x] **L3b. 2026-11-11 vakaras:** be Places rakto 63 klinikos surinktos naršykle iš Google Maps (`lead_harvester.py import <failas> --city= --niche=`, eilutė `pavadinimas|place_id|reitingas|kiekis|svetainė|telefonas`). Siunčiama TIK įmonėms su patikrintu place ID (`ALLOW_UNVERIFIED_CATALOG=1` grąžina seną elgesį). Ta pati svetainė kitame mieste = filialas (viena gija, savo place ID). Dienos limitas skaičiuojamas kiekvienai pašto dėžutei (`campaign_messages.sender`), follow-up'ai siunčiami nuo to paties agento, kuris rašė pirmą laišką. Visas siuntimo kelias patikrintas DB kopijoje: 50 laiškų, 100 puslapių, aktyvavimas.
- [x] **L3c. 2026-11-12 auditas:**
  - pirmas tikras siuntimas (50 laiškų, 0 atšokusių);
  - gmail lead'ų dvigubos įmonės sujungtos (backfill nebekuria `e:` dvynių, `campaign_leads` saugo website ir company_key);
  - savininko skydelis: „Karšti lead'ai“ (paspaudė / demo veiksmai / atsakė + telefonas), testinės paskyros pažymėtos ir neįskaičiuojamos, laikai Europe/Vilnius;
  - kliento KPI be išgalvotų skaičių („100 %“, „5.0“), nebėra „Sertifikuota paskyra“ / „AES-256“ / „AI patarimas“;
  - lietuviški skaičiai demo (atsiliepimas / atsiliepimai / atsiliepimų);
  - Maps sąrašų importas: robust parsing, `clean_name()`, viešos įstaigos praleidžiamos.
- [ ] **L4. Savininkas:** Google Cloud įjungti „Places API (New)“, sukurti atskirą raktą (apriboti tik Places API), `setx GOOGLE_PLACES_API_KEY "..."`. Tada `python core/lead_harvester.py run --target=1100`. Kaina: Text Search su reitingu/svetaine = Enterprise SKU, ~1 000 užklausų/mėn. nemokamai; mėnesio atsargai reikia ~200–400 užklausų.
- [ ] **L5. Agentai kitoms nišoms** (grožis, auto, horeca): aktyvuoti Kamilę/Justą `AGENT_PROFILES`, kai bus jų pašto dėžučių configai.

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

Įmonių su filialais logika (Etapas N): `python test_company_groups.py` (17/17).

Naršyklės patikra su DB kopija (taip tikrinta visa 11-05–11-11 sesija):
```bash
# 1) gyvos DB kopija (sqlite backup), 2) build į atskirą katalogą, 3) serveris 3005 su kopija ir be laiškų
REPUTATION_BUILD_DIR=.next-verify npx next build
# serveris: DATABASE_PATH=<kopija> APP_URL=http://127.0.0.1:3005 REPUTATION_MAIL_DISABLED=true next start -p 3005
# po patikros: ištrinti .next-verify ir git checkout -- tsconfig.json next-env.d.ts (build'as juos pakeičia)
```

---

## 4. Pastabos perėmėjui (gotchas)

- **Gyva DB:** `apps/reputationpro/data/reputation.db` (WAL). Ją naudoja ir Next.js, ir Python skriptai. Schemos pakeitimai turi būti idempotentiški (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN` tik jei stulpelio nėra) ir vienodi Node (`src/lib/db.ts`) bei Python (`core/claim_tokens.py::ensure_schema`) pusėse.
- **Gyvas serveris** veikia iš `npm run build` + `npm run start`. Kodo pakeitimai gyvai neatsiranda, kol nepadarytas build'as ir neperkrautas procesas.
- **Edge worker** (`verslomatika.lt/r/*`, `/api/track/*`, `/api/qr`, `/checkout`) yra kitoje repo. Gyvo kodo kopija: `verslomatika_v2_live.js` (bundle). Šaltinis ištrauktas iš sourcemap'o.
- **Git Bash** keičia kelius, prasidedančius `/` (pvz. `/r/x` → `C:/Program Files/Git/r/x`). Naudok `MSYS_NO_PATHCONV=1` arba PowerShell.
- **Šio PC DNS** kartais neišsprendžia `reputacija.verslomatika.lt`. Testuok su `curl --resolve reputacija.verslomatika.lt:443:104.21.35.136 ...`.
- **Lietuviškos raidės:** Python skriptuose `sys.stdout.reconfigure(encoding='utf-8')`. Su `python -I` `PYTHONIOENCODING` neveikia.
- **Filialai** (Etapas M/N): filialas = `clients` eilutė su `parent_id`. Prenumerata, prisijungimo galiojimas ir „gali rinkti įvertinimus“ visada tikrinami per pagrindinį profilį. `clients.email` UNIQUE, todėl filialas be el. pašto turi `…@filialai.invalid`, kuriam niekas nesiunčiama.
- **Įmonė kampanijose** = `campaign_companies` (`core/company_groups.py`). Naujas pirmas laiškas niekada nesiunčiamas įmonei, kuri jau yra šioje lentelėje; kitam filialui rašo tik kaskada.
- **Testiniai laiškai** savininkui: tiksliai jo adresu, be `+alias` (`research ... --send --to=`). Jo adresas užimtas aktyvuoto testinio profilio, todėl `--to` sukuria atskirą `{slug}-testas` profilį.
- **Ne savi failai darbo kataloge:** `core/*topical*`, `data/articles*`, `data/keywords` yra kito agento SEO darbas, į ReputationPro commit'us jų nedėti be savininko sutikimo.
- **Asmeniniai duomenys** į GitHub nekeliami (savininko el. paštas, trečių asmenų vardai): prieš commit'ą `git diff --cached | grep` paieška.

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
| 2026-11-11 | Claude (Opus 5.5) | D5 QR rinkinys (žymė `v1`). Pataisytas `research` siuntimas: po Gemini pakeitimų `build_custom_email`/`send_researched` naudojo neapibrėžtus `s_name`, `s_email`, `agent` (būtų nulūžęs). Suplanuotas Etapas R (be Google → Rekvizitai.lt). |
| 2026-11-11 | Claude (Opus 5.5) | Etapas R (be Google → Rekvizitai.lt, `/google-profilis`, agentų patikra, laiškai) ir Etapas S (nemokamo stovelio užsakymas, `/admin/klientai`). 27/27 testų, patikrinta naršyklėje DB kopijoje. Laukia diegimo ir R8 adreso. |
| 2026-11-11 | Claude (Opus 5.5) | Etapas H (demo hero: telefonas valdo „Kas vyksta toliau“, automatinė demonstracija, demo įvertinimai nebesaugomi) ir Etapas K (komanda vietoj „vadovo“, „Atsiliepimų dėžutė“, sekcija „Mažiau streso darbuotojams“, kelių gavėjų pranešimai). 30/30 testų. |
| 2026-11-11 | Claude (Opus 5.5) | Etapas M: filialai (kelios vietos vienoje paskyroje), plačiau hero (1440 px, scenos be persidengimų). 36/36 testų. |
| 2026-11-11 | Claude (Opus 5.5) | C5: pirmo laiško temų A/B/C variantai (4 atvejai × 3), stabilus parinkimas pagal lead'ą, `campaign_messages.variant`, lentelė „Laiškų temų rezultatai“ `/admin/klientai`. `test_email_preview.py` 47/47, `test_subject_variants.py` 7/7, `npm test` 39/39, `tsc` švarus, `preview 5` veikia. Laukia savininko patvirtinimo ir diegimo. |

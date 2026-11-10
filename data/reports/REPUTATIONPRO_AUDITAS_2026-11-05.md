# ReputationPro: konversijos, produkto ir saugumo auditas

**Data:** 2026-11-05
**Apimtis:** visas kelias nuo laiško iki mokančio kliento: laiškas → demonstracija → aktyvavimas → pirmos dienos sistemoje → apmokėjimas.
**Kaip tikrinta:** peržiūrėtas kodas (`core/`, `apps/reputationpro/`, `deployments/`), gyvo Cloudflare worker'io kodas (ištrauktas iš `verslomatika_v2_live.js` sourcemap'o, nes `verslomatika-v2-website/worker/` šioje repo nėra), užklausos į gyvą `verslomatika.lt` ir `reputacija.verslomatika.lt`, demo puslapis išbandytas telefono ekrane (375 px), paleisti unit testai (`npm test`) ir pažiūrėta vietinė DB (tik skaitymui).

---

## 0. Santrauka (perskaitykite bent šitą)

**Šiandien piltuvas nutrūksta trijose vietose, todėl net labai susidomėjęs gavėjas fiziškai negali tapti klientu taip, kaip žada laiškas.**

1. **Mygtukas „Aktyvuoti paskyrą (14 d. nemokamai)“ laiške veda į kainų puslapį, o ne į registraciją.** Laiške žadama „Jūsų duomenys jau bus paruošti – tereikės nustatyti slaptažodį“, bet žmogus atsiduria `verslomatika.lt/reputacija/#kainos` ir turi pradėti nuo nulio. Net ir `verslomatika.lt/checkout?slug=…` nukreipia ten pat, o slug, vardas ir el. paštas dingsta.
2. **Atidarymai ir paspaudimai nefiksuojami.** Gyvas `/api/track/click` ir `/api/track/open` tik nukreipia arba grąžina pikselį ir nieko neįrašo. DB: `opened_at = 0`, `clicked_at = 0`. Nežinote, kas susidomėjo, todėl negalite laiku parašyti antro laiško ar paskambinti.
3. **Demo puslapis rodo paciento ekraną ir nieko nepaaiškina savininkui.** Nėra aktyvavimo mygtuko, nėra „ką pamatytumėte Jūs“. Privati forma netikra (`setTimeout`, niekur nesaugoma), o pavadinimas sugeneruojamas iš slug be lietuviškų raidžių („Baldu Turgus“).

Be to, yra keturios rizikos, kurios gali pakenkti labiau nei bloga konversija:

- **Kritinė saugumo spraga: svetimos paskyros perėmimas.** `/api/checkout` leidžia bet kam, žinančiam slug ir el. paštą (abu dažnai vieši), gauti prisijungimo sesiją prie **mokančio** kliento paskyros ir pakeisti jo Google nuorodą. Tada konkurentas gautų visus kliento 5★ paspaudimus.
- **Reflected XSS gyvame `verslomatika.lt/r/…`.** `?name=<i>audit</i>` ekrane atvaizduojamas kaip HTML. Patvirtinta gyvai.
- **Review gating rizika.** Gyvame demo įvertinus 1–3★ **nerodoma jokia vieša Google nuoroda**, nors to reikalauja jūsų pačių AGENTS.md taisyklė Nr. 3. Laiškuose ir puslapyje rašoma „Nulis viešų skundų“, „skundas NIEKADA nepateks į viešumą“, „Sulaiko 100% skundų“. Google draudžia atgrasyti nuo neigiamų atsiliepimų ir atrinkinėti tik teigiamus, o tai kelia riziką ir jūsų klientų profiliams, ir jūsų reputacijai.
- **Nėra kaip sumokėti.** `billingMode()` visada grąžina `'disabled'`. `trialing` būsena niekada nesibaigia, nes `canCollectFeedback` jos laiko nežiūri. Net sėkmingai aktyvuotas klientas niekada netampa pajamomis.

**Gera žinia:** DB yra tik 8 leadai ir išsiųstas tik 1 laiškas. Kampanija dar neįsibėgėjo, todėl viską galima sutvarkyti, kol leadų bazė dar nesudeginta.

**Rekomendacija Nr. 1:** sustabdyti `morning_campaign_runner.py daemon`, kol nebus sutvarkytas 0 etapas (žr. §3). Kiekvienas dabar išsiųstas laiškas sudegina leadą, nes jo konversija beveik lygi nuliui.

---

## 1. Kaip piltuvas veikia šiandien (faktai)

| # | Etapas | Ką mato gavėjas | Kas iš tikrųjų vyksta | Įrodymas |
|---|---|---|---|---|
| 1 | Laiškas | Ilgas HTML laiškas su violetine antrašte, 3 nuorodomis, QR paveikslėliu ir 3 kainomis be paaiškinimo | Kreipinys „Sveiki, Klinikos vadovui“ (gramatiškai netaisyklingas ir iškart išduoda automatą). Paslaugų verslai (autoservisai, SPA, viešbučiai) gauna **odontologijos** tekstą apie „pacientus“ | `core/morning_campaign_runner.py:80`, `:195–296` |
| 2 | Atidarymas | — | Pikselis nieko neįrašo | edge `reputation_edge.ts` `handleEdgeTracking` |
| 3 | Paspaudimas „Išbandyti“ | — | Nukreipiama per atvirą redirect'ą (`?to=` priima **bet kokį** URL, gyvai patikrinta su `example.com`), paspaudimas neįrašomas | gyvas `verslomatika.lt/api/track/click` |
| 4 | Demo `/r/{slug}` | Paciento ekranas su žvaigždutėmis ir mažu „Demonstracinis puslapis“ ženkliuku | Edge worker **visai neskaito DB**: pavadinimas imamas iš slug arba `?name=`, Google nuoroda iš `?google_review_url=`. Įvertinus 1–3★, forma netikra ir neturi viešos nuorodos. Vienintelis CTA yra smulkus tekstas apačioje „Sužinokite daugiau“, vedantis į bendrą puslapį | edge `renderReviewGate`, `worker/index.ts` |
| 5 | Paspaudimas „Aktyvuoti“ | Bendras kainų puslapis | `claim_url` = kainų puslapis, o `verslomatika.lt/checkout` taip pat nukreipia į `/reputacija/#kainos` | `morning_campaign_runner.py:87–95`, edge `index.ts` |
| 6 | Registracija `reputacija.verslomatika.lt/checkout` | 9–11 laukų forma: planas (3 variantai), pavadinimas, el. paštas, **slug**, telefonas, **Google review nuoroda**, slaptažodis ×2, adresas (metiniam planui) | Žmogus pats turi susirasti Google „Prašyti atsiliepimų“ nuorodą. Daugumai savininkų tai neįveikiama kliūtis | `src/components/admin-controls.tsx` `ClinicForm` |
| 7 | Pirmas įėjimas į sistemą | Tuščias skydelis | Nukreipiama į `#onboarding`, bet tokio elemento nėra. Nėra „pirmų žingsnių“. Rodoma „5.0“ vidurkis be jokių duomenų ir „Susietas“ ženkliukas, net jei nuoroda neteisinga | `admin/page.tsx:257`, `:286` |
| 8 | 14 dienų pabaiga | Nieko | Bandymas niekada nesibaigia, apmokėjimo nėra, nėra laiškų, primenančių apie pabaigą ar rodančių rezultatus | `lib/entitlements.ts:11`, `lib/billing-mode.ts:2` |

Papildomai:

- `reputacija.verslomatika.lt` (registracija, prisijungimas, skydelis) veikia per Cloudflare Tunnel iš vietinio kompiuterio. Jei PC išjungtas, niekas negali užsiregistruoti ar prisijungti.
- Unit testai: **2 iš 16 krenta**, ir būtent saugumo testai: „email ownership must also be verified“ ir „pre-existing demo credentials and sessions cannot claim profile ownership“. Tai reiškia, kad „claim“ logika buvo pridėta apeinant ankstesnes apsaugas.

---

## 2. Radiniai pagal prioritetą

### P0: kritiniai (taisyti prieš siunčiant kitą laišką)

#### P0-1. Svetimos paskyros perėmimas per `/api/checkout`
- **Kur:** `apps/reputationpro/src/app/api/checkout/route.ts:22–46`, `:81`, `:108`; `src/app/checkout/page.tsx:29`.
- **Problema:** jei slug egzistuoja ir `is_demo=1` **arba sutampa el. paštas**, kodas be jokio patvirtinimo:
  - perrašo `business_name`, `email`, `google_review_url`, `phone`, nustato `subscription_status='trialing'` (taip **numušdamas `active`** mokančiam klientui);
  - pažymi el. paštą kaip patvirtintą (`INSERT OR REPLACE INTO clinic_email_verifications`);
  - išduoda 8 val. sesiją (`issueClinicSession`).
  Be to, `/checkout?slug=X` užpildo formą esamo kliento el. paštu, todėl užpuolikui net nereikia jo žinoti.
- **Pasekmė:** bet kas gali perimti bet kurio kliento skydelį (pacientų vardai, telefonai, skundai, tai yra asmens duomenys pagal BDAR) ir nukreipti jo 5★ srautą kitur. Leadų slug'ą gali „užimti“ konkurentas ar atsitiktinis žmogus.
- **Sprendimas:**
  1. Leadų aktyvavimas **tik per vienkartinį pasirašytą tokeną**: `claim_token = HMAC(lead_id + slug + expiry)`, galioja pvz. 30 d., saugomas DB kaip hash, panaudojamas vieną kartą. Nuoroda laiške: `…/aktyvuoti/{token}`.
  2. Jei `is_demo=0` (tikras klientas), checkout **niekada** nieko neatnaujina: grąžina „Paskyra jau yra, prisijunkite“ ir siūlo slaptažodžio atkūrimą.
  3. `/checkout?slug=` daugiau neužpildo duomenų iš DB. Užpildoma tik turint galiojantį tokeną.
  4. El. pašto patvirtinimas: jei aktyvuojama per tokeną iš laiško, el. paštas jau įrodytas (tokenas atėjo į tą dėžutę). Jei vartotojas jį pakeičia, reikia naujo patvirtinimo.
  5. Grąžinti ir papildyti 2 krentančius testus, pridėti testą „claim be tokeno → 403“ ir „claim aktyvaus kliento → 409“.

#### P0-2. Laiško „Aktyvuoti“ nuoroda veda ne ten
- **Kur:** `core/morning_campaign_runner.py:87–95`; edge `worker/index.ts` (`/checkout` → `302 /reputacija/#kainos`).
- **Sprendimas:** `claim_url` turi vesti į vieno žingsnio aktyvavimo puslapį su tokenu (žr. P1-3). Pašalinti edge `/checkout` nukreipimą arba nukreipti išsaugant visus parametrus į `reputacija.verslomatika.lt/checkout`.

#### P0-3. Sekimas nefiksuoja nieko, o redirect'as atviras
- **Kur:** edge `reputation_edge.ts` → `handleEdgeTracking`. Saugi Next.js versija (`src/app/api/track/click/route.ts` su allowlist ir `recordLeadClick`) **niekada nepasiekiama**, nes edge perima `/api/track/*` anksčiau.
- **Pasekmė:** jokių duomenų apie susidomėjimą, todėl neįmanomi elgsena paremti follow-up'ai. Atviras redirect'as ant `verslomatika.lt` yra tipinis spam filtrų signalas ir phishing'o įrankis kitiems, galintis sugadinti domeno reputaciją.
- **Sprendimas:**
  - Nuorodos be laisvo `to`: `/t/{lead_id}/{link_key}`, kur `link_key ∈ {demo, claim, pricing}`. Tikslas sudaromas serveryje.
  - Edge worker įrašo įvykį į Cloudflare D1 arba KV ir/arba `ctx.waitUntil(fetch(VPS/api/track…))`, o VPS sinchronizuoja į `campaign_events`.
  - Laikinai, kol nėra D1: allowlist (`verslomatika.lt`, `reputacija.verslomatika.lt`, `search.google.com`) tiesiog edge kode.

#### P0-4. XSS ir laisvi parametrai gyvame demo
- **Kur:** edge `renderReviewGate`: `${businessName}` įterpiamas į HTML be escape'inimo, `google_review_url` iš query string įdedamas į `href` (galimas `javascript:` URL).
- **Gyvai patvirtinta:** `verslomatika.lt/r/test?name=<i>audit</i>` → `<h1><i>audit</i></h1>`.
- **Sprendimas:** demo duomenis (pavadinimą su diakritikais, patikrintą Google nuorodą) imti **pagal slug iš DB/KV**, o ne iš URL. HTML escape'inti visada. Google URL leisti tik iš allowlist (`search.google.com`, `g.page`, `www.google.com/maps`).

#### P0-5. Review gating gyvame demo ir pardavimo tekstuose
- **Kur:** edge `renderOutcome()` (1–3★ be viešos nuorodos), laiškų tekstai `morning_campaign_runner.py:106, 156, 203, 254`, landing („Nulis viešų skundų“, „Sulaiko 100% skundų“), admin („sulaikytos nuo viešo Google Maps“). Next.js `review-gate.tsx` turi viešą nuorodą, bet gyvai rodomas edge variantas.
- **Kodėl svarbu:** Google turinio politika draudžia atgrasyti nuo neigiamų atsiliepimų ir selektyviai prašyti tik teigiamų. Jūsų klientams gresia atsiliepimų šalinimas arba profilio apribojimai, o jums – kad produktas bus pristatomas kaip „skundų slėpimas“. Be to, „100%“ ir „niekada“ yra neįrodomi teiginiai (taip pat nesąžiningos komercinės veiklos rizika). Rekomenduoju trumpą teisininko peržiūrą.
- **Sprendimas: pozicionuoti ne kaip skundų slėpimą, o kaip problemų sprendimą anksčiau, nei jos tampa viešos.** Tai parduoda taip pat stipriai, bet yra sąžininga:
  - Visiems įvertinimams rodyti abu kelius. Po 1–3★ privati forma pirmoje vietoje, bet aiški nuoroda „Rašyti viešai Google“ lieka.
  - Tekstuose: „Sužinokite apie nepatenkintą klientą per 1 min. ir susisiekite, kol jis dar nenusprendė rašyti viešai“, „Patenkinti klientai pagaliau parašo atsiliepimą: priminimas tinkamu metu“.
  - Ištrinti: „Nulis viešų skundų“, „NIEKADA nepateks į viešumą“, „Sulaiko 100%“, „Review Shield™ Triage … sulaikytos nuo viešo Google“.

#### P0-6. Nėra apmokėjimo, bandymas nesibaigia
- **Kur:** `lib/billing-mode.ts:2` (`return 'disabled'`), `lib/entitlements.ts:11` (`trialing` be datos patikros), `clinic-access.ts` (`authenticateClinic`/`clinicSession` laiko `trialing` aktyviu visada).
- **Sprendimas (greičiausias):** Stripe Checkout prenumerata (kodas `lib/stripe.ts`, `clinic-checkout.ts` ir webhook jau yra, tereikia įjungti ir sutvarkyti 3 planus). Lietuvos rinkai verta apsvarstyti ir Paysera / Montonio (bankų nuorodos), nes dalis klinikų nemoka kortele.
  Laikinas variantas: mygtukas „Tęsti po bandymo, atsiųskite sąskaitą“, kuris sukuria užduotį jums ir išrašo sąskaitą rankiniu būdu.
  Bandymo pabaiga: `trial_ends_at < now` → puslapis `/r/{slug}` toliau veikia dar 7 d. (grace), o skydelyje rodomas aiškus „Pratęskite“ ekranas.

#### P0-7. Aplikacija priklauso nuo vieno kompiuterio
- **Sprendimas:** perkelti `apps/reputationpro` į VPS (yra `setup_vps.sh`), SQLite atsarginės kopijos (pvz. Litestream į S3/R2 arba bent kasdienis `.backup`), uptime stebėjimas (`/api/health` kas 1 min., pranešimas į telefoną).

---

### P1: konversijos stiprinimas („kad gavėjas iškart suprastų“)

#### P1-1. Laiškas: trumpas, asmeniškas, su tikrais skaičiais
**Dabar:** apie 350 žodžių, HTML „naujienlaiškio“ dizainas, 3 CTA, 3 kainos, bendros frazės („Pastebėjome, kad pacientai vis dažniau…“), tema su „5.0★“ net jei įmonė turi 4,3★.

**Kas parduoda šaltame B2B laiške:** įrodymas, kad pažiūrėjote būtent į jų verslą, viena aiški problema, vienas CTA ir maža prašymo kaina.

**Pakeitimai:**
1. **Personalizacija iš tikrų Google duomenų** (Places API, žr. P1-8): reitingas, atsiliepimų skaičius, artimiausio konkurento skaičiai, paskutinio neigiamo atsiliepimo data.
2. **80–120 žodžių**, „paprasto laiško“ išvaizda (be banerio ir paveikslėlių, be QR pirmame laiške), parašas su tikru telefonu.
3. **Vienas CTA**: asmeninė demo nuoroda. Aktyvavimas siūlomas pačiame demo puslapyje.
4. **Kreipinys:** „Laba diena,“ arba „Sveiki, {Vardas},“ jei vardas žinomas. Jokio „Sveiki, Klinikos vadovui“.
5. **Atskiri šablonai** kiekvienai nišai: klinikos, el. parduotuvės, paslaugos (auto, grožis, SPA, viešbučiai). Dabar `industry == "services"` patenka į odontologijos šabloną.
6. **Kainų pirmame laiške nerodyti.** „29 € / 49 € / 290 €“ be konteksto tik sukelia klausimus.
7. **Atsisakymas:** aiškus „Atsakykite „ne“ – daugiau nerašysime“ ir realiai veikiantis `opt_out` statusas DB. Dėl LT elektroninių ryšių reguliavimo tiesioginei rinkodarai el. paštu verta pasitarti su teisininku.

**Pavyzdys (klinika):**

> **Tema:** {Įmonė}: 4,6★ iš 87 – ir {Konkurentas} su 312 atsiliepimų
>
> Laba diena,
>
> pažiūrėjome į {Įmonė} Google profilį: 4,6★ iš 87 atsiliepimų. {Konkurentas} tame pačiame mieste turi 4,9★ iš 312. Pacientas, lygindamas klinikas telefone, dažniausiai renkasi tą, kurios atsiliepimų daugiau.
>
> Priežastis paprasta: patenkinti pacientai atsiliepimo nepalieka, nes niekas jų nepaprašo tinkamu momentu.
>
> Paruošėme {Įmonė} atsiliepimų puslapį. Per 30 sekundžių pamatysite, kaip jis atrodo paciento telefone ir ką tuo metu matote Jūs:
> {asmeninė demo nuoroda}
>
> Jei tiks, paskyrą aktyvuosite vienu paspaudimu: 14 d. nemokamai, be kortelės.
>
> Tomas
> Verslomatika · +370 6XX XXXXX
>
> P.S. Jei neaktualu, atsakykite „ne“ ir daugiau nerašysime.

**Follow-up seka (pagal elgseną, kai veiks sekimas):**

| Diena | Sąlyga | Žinutė |
|---|---|---|
| 0 | — | Pirmas laiškas (aukščiau) |
| 3 | Neatidarė demo | Trumpas „bump“: 1 sakinys + 1 naujas faktas (pvz. „per pastarąsias 30 d. {Konkurentas} gavo 14 naujų atsiliepimų, {Įmonė} – 2“) |
| 1–2 | **Atidarė demo, bet neaktyvavo** | Asmeninis laiškas nuo Tomo arba **skambutis**. Tai karščiausias segmentas |
| 7 | Neatsakė | Socialinis įrodymas: trumpas pilotinio kliento rezultatas (kai tik toks bus) arba 60 s video |
| 14 | Neatsakė | „Uždarymo“ laiškas: „Uždarome Jūsų paruoštą puslapį. Jei norėsite vėliau – atsakykite.“ |

#### P1-2. Demo puslapis turi būti demonstracija savininkui, ne pacientui
Šiandien savininkas mato paciento ekraną ir turi pats susivokti, kas čia vyksta. Dažniausiai jis paspaudžia 5★, nukeliauja į savo paties Google formą ir uždaro langą. „Aha“ momentas (*pacientas parašė skundą → aš per sekundę jį gaunu, o ne Google*) neįvyksta, nes forma netikra.

**Nauja struktūra `/r/{slug}` demo režimui (kai `is_demo=1`):**

1. **Viršutinė juosta savininkui (sticky):** „Sveiki, {Įmonė}! Tai Jūsų paruoštas atsiliepimų puslapis.“ + mygtukas **„Aktyvuoti nemokamai“** (claim tokenas).
2. **Dviejų pusių vaizdas** (kompiuteryje greta, telefone viena po kita):
   - **Kairėje: „Ką mato Jūsų klientas“.** Telefono rėmelyje tikras puslapis su jų pavadinimu (su diakritikais), logotipu (favicon arba og:image iš jų svetainės) ir žvaigždutėmis.
   - **Dešinėje: „Ką matote Jūs“.** Mini skydelis. Kai kairėje paspaudžiama 2★ ir parašoma pastaba, ji **iškart atsiranda dešinėje** su „🔔 Naujas pranešimas vadovui“ ir laiško peržiūra. Įvertinus 5★, rodoma „Klientas nukreiptas į Jūsų Google profilį“ **ir savininkas nenukeliauja į savo Google formą** (demo režime nukreipimas tik simuliuojamas).
3. **Jų pačių skaičiai:** „Šiandien: 4,6★ iš 87. Jei per mėnesį gautumėte 15 naujų 5★ atsiliepimų, po 3 mėn. turėtumėte ~4,7★ iš 132.“ Skaičiuojama iš tikrų duomenų ir rodoma kaip prognozė.
4. **Jų QR stovelio maketas** su pavadinimu (`StandStudio` komponentas jau yra admin'e, verta panaudoti demo).
5. **3 žingsniai „Kaip pradėti“:** Aktyvuoti (1 min.) → Atsispausdinti QR arba nusiųsti nuorodą 10 paskutinių klientų → Gauti pirmus atsiliepimus.
6. **Antrinis CTA** abejojantiems: „Užsisakyti 15 min. pokalbį“ (Calendly/Cal.com) ir „Gauti nemokamą stovelį išbandyti“ (dabar siūloma tik laiško gale).
7. **Rizikos pašalinimas:** „14 d. be kortelės · Atšaukiama bet kada · Duomenys ES serveriuose“.

Techniškai: demo turi būti vienas šaltinis. Arba edge skaito duomenis iš KV/D1 (sinchronizuojama provisioning'o metu), arba edge proxy'ina `/r/*` į VPS su cache. Dvi skirtingos `/r/` implementacijos (edge ir Next.js) jau dabar išsiskyrė (viešos nuorodos nebuvimas, netikra forma).

#### P1-3. Aktyvavimas: vienas žingsnis, ne 11 laukų
**Puslapis `/aktyvuoti/{token}`:**
- Antraštė: „{Įmonė} paskyra paruošta“.
- Rodomi jau paruošti dalykai su ✓: įmonės pavadinimas, **patikrinta Google atsiliepimų nuoroda** (mygtukas „Atidaryti ir patikrinti“), QR kodas.
- Vienintelis laukas: **slaptažodis** (arba net be jo: magic link prisijungimas el. paštu).
- Mygtukas „Pradėti 14 d. bandymą“ → skydelis su onboarding'u.
- **Neklausti** plano (pasirenkama bandymo pabaigoje), slug, adreso (tik užsakant stovelį).
- Jei Google nuoroda neprovizionuota arba nepatikrinta: vietoj URL lauko paieška „Raskite savo įmonę Google“ (Places Autocomplete), kuri pati suformuoja `writereview?placeid=…`.

Bendra `/checkout` forma (ateinantiems iš landing) taip pat turi būti trumpesnė: pavadinimas (su Google paieška), el. paštas, slaptažodis. Visa kita vėliau.

#### P1-4. Pirmos 14 dienų: kad bandymas virstų įpročiu
- **Onboarding checklist** skydelyje (dabar `#onboarding` neegzistuoja):
  1. ✓ Patikrinkite Google nuorodą
  2. Atsisiųskite QR / užsakykite stovelį
  3. Nusiųskite nuorodą 10 paskutinių klientų (paruoštas SMS/el. laiško tekstas su „Kopijuoti“ mygtuku)
  4. Gaukite pirmą įvertinimą 🎉
  Progreso juosta. **Aktyvacijos metrika:** pirmas tikras įvertinimas per 72 val.
- **Laiškų seka bandymo metu:** 1 d. (kaip gauti pirmą atsiliepimą), 3 d. (jei 0 įvertinimų: „Ar pavyko pastatyti QR? Galime atsiųsti stovelį“), 7 d. (savaitės ataskaita), 11 d. (**rezultatų suvestinė**: „surinkote X įvertinimų, Y privačių pastabų, Z paspaudimų į Google“ + planų pasirinkimas), 13 d. (paskutinis priminimas).
- **Asmeninis kontaktas:** pirmiems 20–30 klientų Tomas paskambina 2-ą dieną. Tai brangu, bet labiausiai padidina bandymo → mokėjimo konversiją ir duoda produkto įžvalgų.

#### P1-5. Skydelio sąžiningumas ir kalba
- `admin/page.tsx:257`: „Susietas“ rodomas visada → tikrinti, ar URL yra `writereview?placeid=` arba `g.page/r/…/review`. Jei ne, rodyti „⚠ Patikrinkite nuorodą“.
- `admin/page.tsx:286`: be duomenų rodomas `5.0` → rodyti „Dar nėra įvertinimų“ ir CTA „Nusiųskite nuorodą pirmiems klientams“.
- „Klinikos“ / „pacientai“ visur, net el. parduotuvėms → saugoti `industry` lauką `clients` lentelėje ir terminus rinktis pagal jį („klientai“ / „pirkėjai“ / „pacientai“).
- `review-gate.tsx:19`: Next.js versijoje 4–5★ iškart nukreipia (`window.location.href`), todėl 4–5★ blokas su pasirinkimu „parašyti privačiai“ niekada nerodomas. Verta palikti vieną aiškų ekraną su abiem pasirinkimais.

#### P1-6. Kainodara: dabar ji kenkia pati sau
- **Starter 29 €** neturi „Privačios klientų žinutės“, o tai yra **pagrindinė** produkto vertė. Starter be jos beveik nieko neduoda.
- **Metinis 290 €** = „Viskas iš Pro“ + nemokamas NFC stovelis, o tai pigiau nei Starter × 12 (348 €). „Sutaupote 40%“ neteisinga: lyginant su Pro (588 €) taupoma ~51%. Metinis „suvalgo“ abu mėnesinius planus.
- **Siūlymas:**
  - Vienas pagrindinis planas **49 €/mėn.** arba **490 €/metus** (2 mėn. dovanų + stovelis dovanų). Paprasčiau apsispręsti šaltam klientui.
  - Arba 2 planai: **Bazinis 39 €** (1 vieta, nuoroda + QR + privatūs pranešimai) ir **Pro 69 €** (kelios vietos, SMS, integracijos, kai jos bus).
  - **„Įkūrėjų“ pasiūlymas pirmiems 20 klientų:** 29 €/mėn. fiksuotai visam laikui. Tikras ribotumas, greitesnis apsisprendimas, o mainais atvejo studija.
  - **Rezultato garantija:** „Jei per 60 d. negausite bent 10 naujų Google atsiliepimų, grąžinsime pinigus.“ Šaltam B2B klientui stipriausias rizikos pašalinimas.

#### P1-7. Pažadai landing puslapyje, kurių produktas neišpildo
Puslapyje žadama: Shopify, WooCommerce, PrestaShop, OpenCart, Omniva/DPD integracijos, Webhook API, SMS, Trustpilot, NFC stovelis su logotipu „išsiunčiamas per 1–2 d.d.“. Kode nėra nei integracijų, nei SMS, nei Trustpilot nukreipimo. `PRODUCT.md` pats sako: „MVP has no SMS…“. Klientas aktyvuoja, nepranda žadėtų dalykų ir praranda pasitikėjimą (churn).
- **Sprendimas:** palikti tik tai, kas veikia, o kita pažymėti „Netrukus“ arba „Pagal užklausą“. Kas būtų pigu ir greitai: universali nuoroda el. laiškams/SMS, kurią klientas pats įklijuoja į savo užsakymo patvirtinimo šabloną. Tai „integracija“ be kodo, ir ją galima aprašyti sąžiningai.
- Skaičiuoklė „+32 400 € / metus“ ir „Prieš 3,2★ → Po 60 d. 4,8★“ atrodo neįtikinamai net su „iliustracinis“ prierašu. Geriau maži, tikroviški skaičiai.
- **Socialinis įrodymas:** jo nėra visai (`PRODUCT.md`: „No testimonials“). Prioritetas: 3–5 pilotiniai klientai nemokamai 2 mėn. mainais į atsiliepimą, logotipą ir skaičius.

#### P1-8. Google atsiliepimų nuorodos tikslumas
- **Kur:** `core/google_place_resolver.py`: place_id ieškomas „skrapinant“ Google Maps HTML (trapu, prieštarauja Google ToS, grąžina pirmą atitikmenį, kuris gali būti kita įmonė). Atsarginis variantas `writereview?q=…` (`:60`) nėra dokumentuotas formatas ir greičiausiai neatveria teisingos formos.
- **Pasekmė:** jei demo atveria svetimą arba tuščią Google formą, prarandamas pasitikėjimas.
- **Sprendimas:** Google Places API (Text Search / Find Place) su vardo, miesto ir svetainės domeno sutikrinimu. Saugoti `place_id`, `rating`, `user_ratings_total`, `website`. **Nesiųsti laiško**, jei place_id nepatikrintas (arba siųsti variantą be demo). Tie patys duomenys naudojami P1-1 personalizacijai ir P1-2 prognozei.

---

### P2: matavimas, pristatomumas, mastas

#### P2-1. Vienas įvykių piltuvas
Įvykiai: `sent → delivered → demo_view → demo_rated → demo_private_sent → claim_view → activated → first_real_rating → paid`, su `lead_id` ir `variant`. `opened` laikyti tik orientaciniu (Apple Mail Privacy Protection jį iškraipo). Skydelyje (`/admin/campaigns`): konversija tarp kiekvieno žingsnio ir **„karšti leadai šiandien“** (atidarė demo per 24 val., bet neaktyvavo).

#### P2-2. Laiškų pristatomumas
- Patikrinti SPF, DKIM, DMARC `verslomatika.lt` (siunčiama per `mx.oradomail.com`).
- Šaltiems laiškams verta **atskiras siuntimo domenas** (pvz. `verslomatika.eu` / `verslomatika-mail.lt`), kad spam skundai nepaveiktų pagrindinio domeno ir klientų sąskaitų/atkūrimo laiškų.
- Sekimo nuorodos neturi būti atviras redirect'as (P0-3). Mažiau HTML ir paveikslėlių.
- 25 laiškai per dieną yra saugu. Didinti tik stebint bounce < 2% ir spam skundus.

#### P2-3. A/B testai
Prie 25 laiškų/d. (~500/mėn.) galima testuoti **vieną** dalyką vienu metu: pirmiausia temą, tada CTA (demo vs. pokalbis), tada pasiūlymą (garantija vs. be). `variant` laukas `campaign_leads` lentelėje.

#### P2-4. AI atsakymai į laiškus
`reputation_sales_agent.py` / `email_reply_listener.py`: pirmus ~50 atsakymų rekomenduoju siųsti **tik po žmogaus patvirtinimo** (juodraštis → Tomas patvirtina). Netinkamas AI atsakymas karštam leadui kainuoja brangiausiai.

#### P2-5. Kiti techniniai dalykai
- QR generuojamas per trečią šalį `api.qrserver.com` (edge `handleEdgeQr`). Geriau generuoti savo serveryje (biblioteka `qrcode` jau yra Next app'e).
- `verslomatika.lt/admin` nukreipia į vidinį `/admin/campaigns`, todėl klientui neaišku, kur prisijungti. Reikia aiškaus `verslomatika.lt/prisijungti` → `reputacija.verslomatika.lt/admin/login`.
- Asmens duomenys URL'e: AGENTS.md aprašo `checkout?slug=…&name=…&email=…`. El. paštas URL'e patenka į logus ir analitiką, todėl tokenas jį pakeičia (P0-1).
- `AGENTS.md` aprašo funkcionalumą, kuris neatitinka tikrovės (claim URL, edge demo „skaito DB“, „4–5★ → Google, 1–3★ → forma“ be viešos nuorodos). Kadangi kodą prižiūri LLM agentai, po pataisymų **AGENTS.md būtina atnaujinti**, kitaip agentai kartos tas pačias klaidas.
- Edge worker'io šaltinis (`verslomatika-v2-website/worker/`) nėra šioje repo. Verta jį įtraukti (arba submodulį), kad būtų peržiūrimas kartu.

---

## 3. Veiksmų planas etapais

### 0 etapas: sustabdyti nuostolius (1–2 d.)
| # | Užduotis | Failai |
|---|---|---|
| 0.1 | Sustabdyti `morning_campaign_runner.py daemon` | PM2 / Task Scheduler |
| 0.2 | Uždaryti paskyros perėmimą: tikram klientui checkout nieko neatnaujina, prefill tik su tokenu, sutvarkyti 2 krentančius testus | `api/checkout/route.ts`, `checkout/page.tsx`, `tests/clinic-access.test.ts` |
| 0.3 | Claim tokenai ir `/aktyvuoti/{token}` maršrutas. `claim_url` laiške → šis maršrutas | `lib/db.ts`, naujas `app/aktyvuoti/[token]`, `morning_campaign_runner.py` |
| 0.4 | Edge: escape'inti HTML, duomenys pagal slug (ne query), Google URL allowlist, uždaryti atvirą redirect'ą | `worker/reputation_edge.ts`, `worker/index.ts` |
| 0.5 | Edge: įrašyti click/open įvykius (D1/KV arba forward į app) | `worker/reputation_edge.ts` |
| 0.6 | Vieša Google nuoroda visuose demo keliuose, ištrinti „100% / niekada / nulis skundų“ tekstus | edge, `review-gate.tsx`, laiškų šablonai, landing |
| 0.7 | Demo privati forma: realiai saugo į DB (demo kliento dėžutę) | edge → `/api/feedback` |

### 1 etapas: konversijos branduolys (≈1 sav.)
| # | Užduotis |
|---|---|
| 1.1 | Places API resolveris + `place_id`, `rating`, `user_ratings_total` saugojimas. Nesiųsti be patikrinto place_id |
| 1.2 | Nauji laiškų šablonai pagal nišą (klinikos, el. prekyba, paslaugos), 80–120 žodžių, 1 CTA, tikri skaičiai, taisyklingas kreipinys |
| 1.3 | Follow-up seka (3 / 7 / 14 d.) + „karštų leadų“ (demo atidarė, neaktyvavo) pranešimas Tomui |
| 1.4 | Naujas demo „savininko režimas“: dviejų pusių vaizdas, gyvas vadovo pranešimas, jų skaičiai, sticky „Aktyvuoti“ |
| 1.5 | Vieno žingsnio aktyvavimas (tik slaptažodis arba magic link) |
| 1.6 | Onboarding checklist skydelyje + bandymo laiškų seka (1 / 3 / 7 / 11 / 13 d.) |
| 1.7 | Skydelio sąžiningumas: „Susietas“, „5.0“, terminai pagal `industry` |

### 2 etapas: pajamos ir patikimumas (2–3 sav.)
| # | Užduotis |
|---|---|
| 2.1 | Kainodaros supaprastinimas (žr. P1-6) ir landing atnaujinimas |
| 2.2 | Stripe (ir/ar Paysera/Montonio) prenumeratos įjungimas, bandymo pabaigos logika su 7 d. grace |
| 2.3 | Perkėlimas į VPS, SQLite atsarginės kopijos, uptime monitoringas |
| 2.4 | Landing pažadų suvienodinimas su realiu produktu, „Netrukus“ žymės |
| 2.5 | Pristatomumas: SPF/DKIM/DMARC patikra, atskiras siuntimo domenas |

### 3 etapas: augimas (nuolat)
| # | Užduotis |
|---|---|
| 3.1 | 3–5 pilotiniai klientai → atvejo studijos → socialinis įrodymas laiškuose ir demo |
| 3.2 | Piltuvo skydelis `/admin/campaigns` su konversija tarp žingsnių |
| 3.3 | A/B testai: tema → CTA → pasiūlymas (garantija) |
| 3.4 | AI atsakymai su žmogaus patvirtinimu, vėliau autonomiškai tipiniams klausimams |
| 3.5 | AGENTS.md atnaujinimas po kiekvieno etapo |

---

## 4. Orientaciniai tikslai (KPI)

Tai **orientyrai**, ne garantija. Tikrus skaičius parodys P2-1 matavimas.

| Žingsnis | Dabar | Tikslas po 1 etapo |
|---|---|---|
| Laiškas → demo atidarymas | nežinoma (nefiksuojama) | 8–15% |
| Demo → aktyvavimas | ~0% (nėra kelio) | 15–25% demo lankytojų |
| Aktyvavimas → pirmas tikras įvertinimas per 72 val. | nematuojama | ≥ 50% |
| Bandymas → mokantis klientas | 0% (nėra apmokėjimo) | 25–40% |
| Atsakymų rodiklis į laiškus | nežinoma | 2–5% |

Pvz. 500 laiškų per mėnesį × 10% demo × 20% aktyvavimas × 30% mokėjimas ≈ **3 nauji mokantys klientai per mėnesį vienam siuntėjui**. Su 49 € tai yra ~150 € naujų MRR kas mėnesį, augančių kaupiamai. Didžiausias svertas yra demo → aktyvavimo žingsnis (P1-2, P1-3) ir personalizacija (P1-1, P1-8).

---

## 5. Kas jau gerai (išsaugoti)

- Tvarkingas pagrindas: Next.js + SQLite WAL, parametrizuotos užklausos, `scrypt` slaptažodžiai, sesijų hash'ai, `sameOrigin` patikra, rate limiting, honeypot formose, CSV eksportas apsaugotas nuo formulių injekcijos.
- Tenant izoliacija admin API (`canAccessClient`) teisinga, o `internal_feedback` atnaujinimas ribojamas `client_id`.
- Next.js `track/click` maršrutas jau turi allowlist ir įrašymą. Tereikia, kad edge jį naudotų.
- Momentinis vadovo pranešimas apie 1–3★ (`sendFeedbackAlert`) yra stiprus pardavimo argumentas. Jį reikia **parodyti demo** (P1-2).
- `StandStudio` (QR stovelio maketas) yra puikus vizualus elementas, kurį verta panaudoti ir demo.
- Lietuviška kalba, `UTF-8`, aiškus produkto fokusas.

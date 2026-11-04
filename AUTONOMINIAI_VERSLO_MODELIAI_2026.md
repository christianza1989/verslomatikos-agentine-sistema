# AUTONOMINIAI AI VERSLO MODELIAI IR HOLDINGO PLĖTROS GIDAS 2026

Šiame dokumente detaliai aprašyti du jūsų pasirinkti verslo modeliai (**Reputation SaaS** ir **Niche Directories**) bei **naujausi 2026 m. pasauliniai AI automatizavimo modeliai**, išanalizuoti iš pirmaujančių YouTube kūrėjų ir AI agentų architektų (Liam Ottley, David Ondrej, Matthew Berman, Greg Isenberg).

Visi šie modeliai sukurti taip, kad **Codex arba vietinis programuotojas galėtų juos suprogramuoti per 1–3 dienas**, o AI agentų komanda perimtų kasdienį darbą: nuo klientų paieškos iki pardavimo, aptarnavimo ir ataskaitų teikimo.

---

## 1 DALIS: JŪSŲ PASIRINKTŲ DVIEJŲ MODELIŲ TECHNINIS PLANAS

### 1 MODELIS: Vietinio Verslo Reputacijos Valdymas (Reputation SaaS)
* **Koncepcija:** Odontologams, autoservisams, grožio klinikoms ir restoranams parduodama paslauga: automatinis 5★ Google Reviews surinkėjas ir 24/7 AI atsakiklis.
* **Kaina klientui:** **49 € / mėn.** (arba 490 € / metams).
* **Savikaina:** ~4.50 € / mėn. (SMS siuntimas + LLM API).
* **Grynasis pelnas:** **+44.50 € / mėn. nuo kiekvieno kliento** (>90% marža).

#### A. Kaip Codex tai suprogramuoja (Architektūra):
1. **Nusileidimo puslapis ir savitarna (`Next.js + Tailwind + Stripe`):**
   * Registracijos forma: klientas įveda savo įmonės pavadinimą ir Google Maps nuorodą.
   * Stripe integracija: automatinis 49 €/mėn. nuskaitymas su 14 d. nemokamu bandomuoju laikotarpiu.
2. **Atsiliepimų Filtravimo Piltuvėlis (Smart Review Gate):**
   * Klientas gauna trumpąją nuorodą (pvz. `reputationpro.lt/r/vilniaus-denta`) ir paruoštą spaudai QR kodą registratūrai.
   * Kai pacientas/klientas nuskenuoja kodą, rodomas klausimas: *„Kaip vertinate apsilankymą?“ (1 iki 5 žvaigždučių)*:
     * **Jei pasirenka 5★ arba 4★:** sistema automatiškai atidaro oficialų Google Maps atsiliepimo langą.
     * **Jei pasirenka 1–3★:** Google Maps neatidaromas. Vietoj to atidaromas vidinis langas: *„Atsiprašome, kas nutiko? Praneškite tiesiogiai vadovui.“* Šis atsiliepimas niekada nepatenka į Google, o vadovas gauna perspėjimą į el. paštą ar SMS.
3. **24/7 AI Atsakiklis (Auto-Responder Webhook):**
   * Kas 15 min. per Google Business Profile API tikrinami nauji atsiliepimai.
   * LLM modelis sugeneruoja unikalų, šiltą, medicinos/paslaugų etikos reikalavimus atitinkantį atsakymą lietuvių kalba ir automatiškai jį paskelbia.

#### B. Kaip agentai dirba nuo ryto iki vakaro:
* **08:30 – 10:30 (Elena / Scout):** Google Maps skeneris atrenka įmones, turinčias 3.8★–4.4★ reitingą (joms skauda labiausiai) arba <30 atsiliepimų.
* **10:30 – 12:30 (Audit Bot):** Sugeneruoja asmeninį 1 puslapio auditą: *„Štai kodėl jūsų 4.1★ reitingas atiduoda ~15 pacientų per mėnesį kaimyninei klinikai.“*
* **12:30 – 15:30 (Klaus / Closer):** Išsiunčia pasiūlymą vadovui su 14 dienų nemokamu testu ir garantija gauti bent 5 naujus 5★ atsiliepimus.
* **Visą parą (Sophie / Engine):** Filtruoja atsiliepimus ir per 60 sek. atsako į visus naujus komentarus.

---

### 2 MODELIS: Skaitmeniniai B2B Lead Generatoriai (Niche Directories)
* **Koncepcija:** Specializuotas portalas-katalogas pelningai sričiai (pvz., `meistrai24.lt`, `vestuviufotografai.lt`, `buhalteriukatalogas.lt`).
* **Kaina specialistui:** **25 € / mėn.** (arba 199 € / metams) už PRO narystę.
* **Savikaina:** ~1.20 € / mėn. (serveris + SMS/WhatsApp API).
* **Grynasis pelnas:** **+23.80 € / mėn. nuo kiekvieno specialisto**.

#### A. Kaip Codex tai suprogramuoja:
1. **Programmatic SEO struktūra:**
   * AI sukuria dinaminį maršrutizavimą: `/[miestas]/[paslauga]` (pvz., `/vilnius/elektrikas`, `/kaunas/plyteliu-klijavimas`). Tai sukuria 500+ puslapių, kurie per kelias savaites užima pirmąsias Google paieškos vietas pagal vietines užklausas.
2. **„Claim Your Profile“ (Profilio Patvirtinimo) variklis:**
   * Skreperis surenka 300 meistrų/specialistų iš viešų skelbimų ir socialinių tinklų.
   * Sukuriami paruošti profiliai su nuotraukomis ir aprašymais.
3. **Užklausų Paskirstymo Sistema (Lead Dispatcher):**
   * Kai paprastas vartotojas portale užpildo formą: *„Ieškau meistro buto remontui Vilniuje, biudžetas 1,500 €“*:
   * Nemokami nariai mato tik pranešimą: *„Gavote naują užklausą. Atrakinkite kontaktą užsisakę PRO.“*
   * PRO nariai kliento telefono numerį ir aprašymą gauna tiesiai į WhatsApp per 15 sekundžių.

#### B. Kaip agentai dirba nuo ryto iki vakaro:
* **09:00 – 11:00:** Scout agentas randa naujus meistrus Instagram/Facebook/Skelbiu.lt ir sukuria jiems profilį kataloge.
* **11:00 – 13:00:** Outreach agentas parašo specialistui: *„Sveikas, tavo profilis meistrai24.lt jau turi 85 peržiūras šį mėnesį. Paspausk čia ir nemokamai patvirtink savo duomenis.“*
* **14:00 – 18:00:** Lead Dispatcher agentas priima lankytojų užklausas svetainėje ir siunčia tiesiogiai PRO nariams.
* **18:00 – 20:00:** Upsell agentas praneša nemokamiems nariams apie praleistą užsakymą ir pasiūlo PRO narystę už 25 €/mėn.

---

## 2 DALIS: YOUTUBE TYRIMAS — GERIAUSI 2026 M. AI VERSLO MODELIAI

Išanalizavus pirmaujančius pasaulinius AI verslo praktikus (Liam Ottley AAA framework, David Ondrej autonomous loops, Matthew Berman, Greg Isenberg), išryškėjo **4 didžiausio pelningumo modeliai**, kuriuos AI gali sukurti ir valdyti visiškai autonomiškai.

---

### 3 MODELIS: „Database Reactivation as a Service“ (Mirusių Klientų Bazių Prikėlimas)
> **Kas tai:** 90% verslų (odontologai, grožio salonai, autoservisai, saulės jėgainių montuotojai, stogdengiai) turi CRM sistemas su 1,000–10,000 senų klientų ar kontaktų, kurie per pastaruosius 1–2 metus nieko nebepirko. Verslai šiuos kontaktus laiko „mirusiais“.

* **Kaip veikia AI agentas:**
  1. Klientas įkelia CSV failą su senais kontaktais (arba pajungiamas jų CRM per API).
  2. AI agentas pradeda asmeninį, mandagų pokalbį per SMS arba WhatsApp:
     * *„Sveika, Laura! Čia Rasa iš [Grožio Klinikos]. Gydytoja peržiūrėjo jūsų profilį – pastebėjome, kad praėjo jau 9 mėnesiai nuo paskutinio vizito. Šį mėnesį turime specialų pasiūlymą nuolatiniams klientams. Ar norėtumėte rezervuoti laiką šią savaitę?“*
  3. AI agentas palaiko natūralų dvipusį pokalbį (atsako į klausimus apie laikus, kainas) ir įrašo susitikimą į Google Calendar.
* **Kodėl šis modelis neįtikėtinai pelningas:**
  * Klientui nereikia mokėti už reklamą Facebook ar Google.
  * Pasiūlymas verslui: **„Mes nemokamai paleidžiame sistemą jūsų bazei ir imame 20–30% nuo sugeneruotų naujų užsakymų (arba 30 € už kiekvieną užregistruotą vizitą)“**.
  * Tai pasiūlymas be jokios rizikos verslui („No-Brainer Offer“), kurį pasirašo 4 iš 10 pakalbintų vadovų.

---

### 4 MODELIS: „Missed-Call Text-Back & Voice AI“ (Praleistų Skambučių Gelbėtojas)
> **Kas tai:** Remiantis JAV ir Europos statistika, **62% skambučių į smulkius paslaugų verslus** (avarinis santechnikas, automobilių evakuatorius, stogdengys, privati klinika) lieka neatsakyti, nes meistras tuo metu dirba rankomis arba vairuoja. **85% skambinusiųjų nepalieka balso pašto žinutės, o iškart skambina konkurentui.**

* **Kaip veikia AI agentas:**
  1. Kai skambutis lieka neatsakytas, Twilio / Retell AI sistema per **5 sekundes** automatiškai išsiunčia SMS žinutę:
     * *„Sveiki, čia Tomas iš [Meistrų Serviso]. Šiuo metu atlieku skubų remontą ir negalėjau pakelti ragelio. Kokia problema nutiko jūsų namuose? Galiu operatyviai padėti.“*
  2. Klientas atrašo: *„Trūko vamzdis, bėga vanduo į rūsį.“*
  3. AI agentas surenka adresą, įvertina skubumą, įrašo užsakymą ir nusiunčia meistrui į telefoną garso pranešimą: *„Skubus iškvietimas Vilniuje, Žvėryne, klientas Tomas, tel. +3706...“*.
* **Monetizacija:**
  * **99 € – 149 € / mėn.** pastovus abonentinis mokestis iš kiekvieno meistro ar klinikos.
  * Meistras sumoka su džiaugsmu, nes vienas išgelbėtas santechnikos ar stogo remontas jam atneša 100–1,000 €.

---

### 5 MODELIS: B2B Viešųjų Pirkimų ir Sąmatų Rašymo Agentas (Tender / RFP Automator)
> **Kas tai:** Statybos, kelių remonto, patalpų valymo, apsaugos ir IT įmonės kas savaitę pildo 30–80 puslapių viešųjų pirkimų paraiškas. Vieno pasiūlymo parengimas trunka 15–30 inžinieriaus darbo valandų.

* **Kaip veikia AI agentas:**
  1. Agentas automatiškai skenuoja viešųjų pirkimų portalą (CVP IS Lietuvoje arba TED Europoje).
  2. Atrinkęs tinkamus pirkimus, agentas išanalizuoja techninę specifikaciją.
  3. Pagal įmonės kainoraštį ir praeities laimėtus konkursus, agentas per **10 minučių sugeneruoja pilną, teisiškai atitinkantį konkurso pasiūlymą PDF formatu**.
* **Monetizacija:**
  * **299 € – 599 € / mėn.** prenumerata statybų ar inžinerinėms įmonėms.

---

### 6 MODELIS: Automatizuotas Turinio Perdirbimas Vadovams („Content Repurposing Engine“)
> **Kas tai:** Įmonių vadovai, advokatai, investuotojai ir ekspertai nori būti matomi LinkedIn ir TikTok, bet neturi laiko kasdien rašyti tekstų ar montuoti video.

* **Kaip veikia AI agentas:**
  1. Vadovas kartą per savaitę įrašo 15–20 min. balso žinutę arba vaizdo pokalbį (Zoom / telefonas).
  2. AI agentas (naudodamas Whisper + Claude + auto-montavimo API):
     * Iškerpa **5–10 trumpų vertikalių vaizdo klipų (Shorts/Reels)** su dinaminiais subtitrais ir garso efektais.
     * Parašo **5 autorinius LinkedIn įrašus**.
     * Paruošia **savaitinį naujienlaiškį** klientų bazei.
     * Automatiškai paskelbia turinį pagal grafiką.
* **Monetizacija:**
  * **490 € – 1,200 € / mėn.** už pilną asmeninio prekės ženklo autopiloto paketą vienam vadovui.

---

### 7 MODELIS: „Signal-Based B2B Outbound“ (Signalais Paremtas AI Pardavėjas / Clay-in-Python)
> **Kas tai:** Tradiciniai šalti el. laiškai miršta, nes visi siunčia vienodus šablonus. Šis agentas nesiunčia laiško, kol neužfiksuoja konkretaus **pirkimo signalo** (pvz., įmonė ką tik paskelbė darbo skelbimą LinkedIn, pakeitė vadovą, pritraukė investicijų arba pradėjo naudoti naują technologiją).

* **Kaip veikia AI agentas:**
  1. Python skriptas kas rytą nuskaito LinkedIn Jobs, Rekvizitai.lt ir technologijų pokyčius.
  2. Radęs signalą (pvz., įmonė ieško 2 naujų pardavimų vadybininkų), agentas parašo ultra-personalizuotą laišką:
     * *„Sveikas, Tomai! Mačiau, kad 'Acme Logistics' ką tik paskelbė skelbimą 2 naujiems pardavimų vadybininkams Vilniuje. Kol vykdote atrankas, mūsų AI agentų piltuvėlis gali užpildyti jūsų kalendorių 15 kvalifikuotų susitikimų per savaitę už 1/4 vadybininko algos. Štai trumpas 2 min. demonstracinis video.“*
  3. Kadangi laiškas kalba apie realų šios dienos įvykį, atsakomumas siekia **18–25%** (vietoj įprasto 1%).
* **Monetizacija:**
  * **150 € už kiekvieną įvykusį susitikimą (Pay-per-Meeting)** ARBA **1,200 € / mėn. abonementas**.

---

### 8 MODELIS: EAA & ADA Teisinės Atitikties Valdiklis („AccessGuard AI“)
> **Kas tai:** Nuo 2025/2026 m. įsigalioja **Europos prieinamumo aktas (European Accessibility Act - EAA)**, įpareigojantis visas e-komercijos ir paslaugų svetaines būti pritaikytoms žmonėms su negalia (kontrastas, ekrano skaitytuvai, klaviatūros valdymas). Už pažeidimus gresia tūkstantinės baudos.

* **Kaip veikia AI agentas:**
  1. Agentas automatiškai nuskenuoja el. parduotuvę per 30 sekundžių ir sugeneruoja 10 puslapių oficialią audito ataskaitą:
     * *„Jūsų el. parduotuvėje aptikome 24 WCAG 2.1 pažeidimus (trūksta 58 paveikslėlių alt žymų, netinkamas mygtukų kontrastas).“*
  2. Klientui siūlomas momentinis sprendimas: **1 kodo eilutės JavaScript valdiklis**, kuris automatiškai realiuoju laiku ištaiso visus pažeidimus be jokio svetainės perprogramavimo.
* **Monetizacija:**
  * **290 € / metams** iš kiekvienos el. parduotuvės. Marža: 95%.

---

### 9 MODELIS: Trumpalaikės Nuomos (Airbnb / Booking) AI Konsjeržas & Upsell Variklis
> **Kas tai:** Airbnb ir kaimo turizmo sodybų šeimininkai vargsta atsakydami į svečių klausimus vėlai vakare (*„koks Wi-Fi kodas?“, „kur rasti raktus?“*) ir praleidžia tūkstančius eurų papildomų pajamų.

* **Kaip veikia AI agentas:**
  1. Sujungtas per iCal arba Airbnb pranešimų sistemą.
  2. 24/7 akimirksniu atsako į visus svečių klausimus 5 kalbomis.
  3. **Esminis pinigų variklis (Upsell):** Prieš atvykimą automatiškai atsiunčia žinutę:
     * *„Sveiki! Ar norėtumėte atvykti 2 valandomis anksčiau už 15 €?“*
     * *„Ar paruošti ir iškūrenti karštą kubilą jūsų atvykimui už 70 €?“*
  4. Svečias sumoka per Stripe nuorodą, o šeimininkas gauna grynus pinigus be jokių pastangų.
* **Monetizacija:**
  * **19 € / mėn. už vieną butą/namelį** arba 15% nuo visų sugeneruotų papildomų pardavimų.

---

### 10 MODELIS: Generatyvinis SEO (GEO) — Optimizavimas ChatGPT, Perplexity ir Gemini
> **Kas tai:** 2026 m. vartotojai nebepildo tradicinės Google paieškos – jie klausia ChatGPT arba Perplexity: *„Rekomenduok geriausią odontologą Vilniuje“* arba *„Kas patikimiausiai gamina kubilus Lietuvoje?“*. Įmonės, kurių nerekomenduoja AI, praranda turtingiausius pirkėjus.

* **Kaip veikia AI agentas:**
  1. Agentas patikrina 50 tikslinių promptų ChatGPT, Gemini ir Perplexity platformose.
  2. Parodo verslui video įrodymą: *„ChatGPT rekomenduoja jūsų konkurentą, o jūsų net nežino.“*
  3. Agentas įdiegia struktūrizuotus žinių grafus (Schema.org / JSON-LD), sukuria autoritetingų šaltinių tinklelius ir sukalibruoja semantinį pėdsaką taip, kad LLM modeliai pradėtų cituoti būtent šį klientą.
* **Monetizacija:**
  * **490 € / mėn.** pastovus retaineris.

---

## 3 DALIS: HOLDINGO BENDRASIS PLANAS (VISI 11 MODELIŲ)

| Verslas | Tipas | Kaina klientui | 30 d. Tikslas | Mėnesio Pajamos |
|---|---|---|---|---|
| **Baltic Hot Tubs Export** | B2B Eksportas | 3,600 – 4,200 € | 4 kubilai | **+6,400 € pelno** |
| **Memocasting Lietuva** | B2C/B2B E-com | 39.99 – 85.00 € | 30 užsakymų | **+1,200 € pelno** |
| **ClipPulse AI** | Vadovų Turinio Autopilotas | 590 € / mėn. | 3 vadovai | **+1,650 € pelno** |
| **ReviveLeads AI** | CRM Bazių Prikėlimas | 500 € + RevShare | 4 projektai | **+2,000 € pelno** |
| **SignalOutreach AI** | B2B Signal SDR | 1,200 € / mėn. | 2 B2B įmonės | **+2,200 € pelno** |
| **TenderBot AI** | Viešieji Pirkimai | 349 € / mėn. | 4 rangovai | **+1,320 € pelno** |
| **AccessGuard AI** | EAA / ADA Atitiktis | 290 € vienkartinis/met. | 8 el. parduotuvės | **+2,200 € pelno** |
| **ReputationPro SaaS** | Google Reviews 5★ | 49 € / mėn. | 40 klinikų | **+1,780 € MRR** |
| **HostGenie AI** | Airbnb / Booking Upsell | 19 € / būstui | 50 būstų | **+900 € MRR** |
| **MeistraiPRO Directory** | B2B Paslaugų Portalas | 25 € / mėn. | 80 meistrų | **+1,900 € MRR** |
| **SynthAudio.io** | YouTube Faceless SaaS | $59 / mėn. | 25 kūrėjai | **+$1,300 MRR** |

---

## 4 DALIS: PRIORITETIZAVIMAS — NUO KURIŲ 2–3 PRADĖTI PIRMAUSIA?

Norint pasiekti maksimalų rezultatą be resursų išbarstymo, rekomenduojama pradėti nuo šių **trijų „greitųjų pergalių“ (Quick Wins)**:

1. **STARTAS #1: `ReviveLeads AI` (Mirusių CRM Bazių Prikėlimas)**
   * **Kodėl pirmasis:** Pasiūlymas yra be rizikos klientui („sumokėsite tik tada, kai atvesime realius pirkėjus“). Pirmą sandorį galima uždaryti per 48 valandas su bet kuria pažįstama klinika ar servisu.
   * **Laikas paleidimui:** 1 diena (FastAPI skriptas + Twilio).

2. **STARTAS #2: `ReputationPro AI` (Google Reviews 5★ Filtravimas po 49 €/mėn.)**
   * **Kodėl antrasis:** Lengviausiai suprantamas produktas bet kuriam odontologui ar serviso meistrui. Reitingas Google Maps tiesiogiai lemia jų pelną.
   * **Laikas paleidimui:** 2 dienos (Next.js piltuvėlis + Stripe).

3. **STARTAS #3: `AccessGuard AI` (EAA / ADA Teisinė Atitiktis po 290 €)**
   * **Kodėl trečiasis:** Baimės faktorius (baudos iki 15,000 € nuo 2025/2026 m. pagal ES direktyvą). Agentas nusiunčia paruoštą audito ataskaitą su nustatytomis klaidomis – el. parduotuvės vadovas sumoka 290 € vien tam, kad turėtų ramybę.

---

## 5 DALIS: KAIP PALEISTI TIESIOGIAI SISTEMOJE

Visi 11 modelių jau sukonfigūruoti aplanke `configs/`:
```powershell
# Paleisti bet kurį verslą:
python C:\Users\Lenovo\Documents\Agentai\universal_orchestrator.py --business reputation_saas --agent all
python C:\Users\Lenovo\Documents\Agentai\universal_orchestrator.py --business database_reactivation --agent all
python C:\Users\Lenovo\Documents\Agentai\universal_orchestrator.py --business signal_sdr_ai --agent all
python C:\Users\Lenovo\Documents\Agentai\universal_orchestrator.py --business accessibility_compliance_ai --agent all

# Patikrinti bendrą visų verslų holdingo pelną:
python C:\Users\Lenovo\Documents\Agentai\holding_overview.py
```

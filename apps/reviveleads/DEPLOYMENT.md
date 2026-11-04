## Produkto puslapio nuoroda — 2026-10-27

Pagrindinis `https://verslomatika.lt/reviveleads/` patvirtintas HTTP 200. Subdomeno visų puslapių poraštėje pridėta kontekstinė nuoroda „Apie ReviveLeads“. Aktyvus paketas `.next-product-20261027`, ankstesnis `.next` liko neperrašytas; jį parenka `data/active-build`. SQLite backup API kopija `data/backups/before-product-link-20261027.db` patikrinta integrity_check OK prieš perjungimą. 3 unit testai, atskiras build, atskiro serverio desktop/mobile patikra ir gyvų `/`, `/demo`, `/checkout` nuorodų bei demonstracijos patikra praėjo; HTTPS health 200, viešas admin 404, ReputationPro health 200. Duomenų schema nekeista. Grąžinant ankstesnę versiją, patvirtinus pagal `logs/server.json` ir 3002 porto savininką, sustabdyti tik tą Node procesą, įrašyti `.next` į `data/active-build` ir paleisti `scripts/start-local.ps1`; duomenų bazės iš kopijos neatkurti per vėliau sukauptus duomenis.

# ReviveLeads – TASK-005 prototipo leidimas

2026-10-27. Viešas adresas: https://reviveleads.verslomatika.lt/ . Kodas `C:/Users/Lenovo/Documents/Agentai/apps/reviveleads`; Next.js 15.5.28, Node 24. Vietinis serveris `127.0.0.1:3002`; šio serverio PID ir laikas yra `logs/server.json`. Visas produktas priklauso nuo įjungto šio kompiuterio ir aktyvaus Cloudflare Tunnel; tai nėra patvirtinta didelio patikimumo gamybinė infrastruktūra. Nėra Git repozitorijos.

## Būsena

- `/` – produkto prototipas; `/demo` – interaktyvi iš anksto parašytų atsakymų demonstracija; `/checkout` – 29 €/mėn., 49 €/mėn. ir 290 €/metus planų peržiūra, 14 dienų bandymas dar svarstomas; registracija ir mokėjimai neįjungti.
- `/admin` ir jos API prieinami tik iš šio kompiuterio per `http://127.0.0.1:3002`; viešame hoste grąžina 404. Prisijungimas su generuotu slaptažodžiu, kuris laikomas tik vietinėje `.env.local`; Windows ACL apriboja prieigą naudotojui ir SYSTEM. Prisijungimo slaptažodžio nespausdinti ir nesiųsti į tiltą. Admin sukuria įmones, importuoja CSV/XLSX kontaktus ir išsaugo kampanijų juodraščius SQLite. Naudoti tik testinius duomenis.
- SMS, AI, tikras kalendorius, kampanijų siuntimas, viešos klientų paskyros ir prenumeratų apmokėjimas neįgyvendinti. Statistika rodo DB įrašus, ne išgalvotus siuntimus ar užsakymus. Teisinės siuntimo, asmens duomenų, tiekėjų, sutikimų ir kainodaros sąlygos nenustatytos. Laikyti tai demonstracija, ne pilnu SaaS.
- `data/reviveleads.db` su SQLite WAL ir foreign keys turi `clients`, `contacts`, `campaigns`, `bookings` bei lokalius sesijų / bandymų limitus. Po patikros testinė įmonė ir jos priklausomi įrašai pašalinti pagal tikslų ID; kitų įrašų netrinta. `data` ir `.env.local` nėra viešai pasiekiami per HTTP.

## Cloudflare

- Aktyvi zona `verslomatika.lt`, ID `6168ac20a500dfb3687f20dec1783195`. Panaudotas esamas nuotoliniu būdu valdomas tunelis `reputationpro-lenovo`, ID `1ac51e02-2ae5-46e1-9c25-cf3a4223d12f`. Prieš pakeitimą config versija 1, ingress buvo `reputacija.verslomatika.lt -> http://127.0.0.1:3000`, po to `http_status:404`. Config versija 2 įterpė `reviveleads.verslomatika.lt -> http://127.0.0.1:3002` prieš catch-all, senas įrašas išliko.
- Sukurtas proxied CNAME `reviveleads.verslomatika.lt -> 1ac51e02-2ae5-46e1-9c25-cf3a4223d12f.cfargotunnel.com`, ID `c3032cdf745ad1b9202fd46959ec63a3`, TTL Auto. Visų kitų 13 DNS įrašų turinys ir savybės patikrinti prieš ir po – pokyčių nėra.
- Prie esamo redirect ruleset `15c454109ccd4117926fc6bc27309340` pridėta tik hostname apribota HTTP→HTTPS 308 taisyklė `199d11a79f2f4d918ba1824b39ebf1f8`, išsauganti kelią ir query. Kitų taisyklių nekeista. Nameserveriai, kiti subdomenai ir pašto įrašai nekeisti.

## Patikra

- `npm run build` ir 3 SQLite / CSV / XLSX unit testai praėjo; `npm audit --omit=dev` – 0 pažeidžiamumų. `node scripts/acceptance.mjs` patikrino local HTTP, admin apsaugą, sesiją, CSRF, kontaktų importą, juodraštį, mobilų demonstracijos kelią ir peržiūros statusą. Prototipo konkretūs testiniai įrašai pašalinti pagal ID.
- Lokalūs `/api/health` – 200, vieši HTTPS `/`, `/demo`, `/checkout`, `/api/health` – 200; `/admin`, `/admin/login`, privatus API, `/.env.local`, `/data/reviveleads.db` – 404. HTTP URL 308 į HTTPS su keliu ir query. Tikro Chrome desktop/mobilus public HTTPS demo testas praėjo be horizontalaus overflow ar puslapio klaidų. `https://reputacija.verslomatika.lt/api/health` ir `https://verslomatika.lt/` – 200.
- `https://verslomatika.lt/reviveleads/` patikros metu 404; pagrindinės svetainės sesijai perduota parengti tikslų puslapį pagal bendrą architektūrą, nes Agentai HTML turi nepatikrintų komercinių teiginių.

## Vietinis paleidimas ir atšaukimas

Po perkrovimo: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1`; atskirai turi veikti esamas ReputationPro Cloudflare Tunnel. Skriptas tikrina 3002 prievadą ir jo neužima, jei jau naudojamas.

Norint atšaukti: perskaityti esamą DNS įrašą, HTTPS taisyklę ir tunelio ingress. Tik jei jų ID ir turinys vis dar sutampa su šiame leidime nurodytais, pašalinti tik `c3032cdf745ad1b9202fd46959ec63a3`, tik `199d11a79f2f4d918ba1824b39ebf1f8`, ir iš dabartinės tunelio konfigūracijos pašalinti tik `reviveleads.verslomatika.lt` ingress, paliekant visas naujesnes taisykles ir kitų paslaugų įrašus. Nesustabdyti bendro tunelio ir neatkurti visos senos DNS zonos. Stabdyti tik portą 3002 naudojantį patvirtintą `logs/server.json` procesą. SQLite neliečiama – jos atkūrimas nėra kodo atšaukimas.

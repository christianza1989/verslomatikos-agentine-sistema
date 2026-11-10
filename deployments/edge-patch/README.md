# Edge worker pataisa (ROADMAP A6)

**Kur pritaikyti:** repo `verslomatika-v2-website`, failas `worker/index.ts`. Šioje repo jo nėra: gyvo kodo kopija yra `verslomatika_v2_live.js`, šaltinis ištrauktas iš sourcemap'o.

## Kodėl

Gyvas `verslomatika.lt` worker'is turi savo `/r/:slug`, `/api/track/*`, `/api/qr` ir `/checkout` versijas, kurios:

- **XSS:** `/r/x?name=<script>…` įterpia HTML be escape'inimo, o `google_review_url` iš URL patenka į `href` (patikrinta gyvai 2026-11-05);
- **atviras redirect'as:** `/api/track/click?to=https://bet-kas.lt` nukreipia bet kur, todėl kenkia domeno reputacijai pašto filtruose;
- **neįrašo** atidarymų ir paspaudimų;
- `/checkout` meta lankytoją į `/reputacija/#kainos` ir pameta `slug`;
- demo neskaito DB: netikra privati forma, pavadinimai be lietuviškų raidžių.

Visa ši logika dabar teisingai veikia Next.js aplikacijoje `reputacija.verslomatika.lt` (šiame PC). Edge'ui užtenka **nukreipti** šiuos kelius ten, išsaugant kelią ir parametrus. Taip veiks ir senuose laiškuose bei atspausdintuose QR kodus esančios nuorodos.

## Pakeitimas `worker/index.ts`

Pakeiskite blokus „2. … /r/:slug“, „3. Sekimo nuorodos“, „3b. QR kodo generavimas“ ir „4. Registracijos nuoroda“ šiuo vienu bloku:

```ts
  // ReputationPro piltuvas gyvena aplikacijoje (DB, sekimas, aktyvavimas). Edge tik nukreipia.
  // 307 išsaugo metodą; kelias ir query perduodami be pakeitimų.
  if (url.pathname.startsWith('/r/') || url.pathname.startsWith('/api/track/') ||
      url.pathname === '/api/qr' || url.pathname === '/api/qr/' ||
      url.pathname === '/checkout' || url.pathname === '/checkout/' ||
      url.pathname.startsWith('/aktyvuoti/')) {
    const target = new URL(url.pathname + url.search, 'https://reputacija.verslomatika.lt');
    return Response.redirect(target.toString(), 307);
  }
```

Ir pašalinkite importą: `renderReviewGate, handleEdgeTracking, handleEdgeQr` (`BUHALTERIJA_HTML` palikite).

## Patikra po deploy

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://verslomatika.lt/r/vilniaus-denta?name=%3Ci%3Ex%3C/i%3E"
# tikimasi: 307 https://reputacija.verslomatika.lt/r/vilniaus-denta?name=%3Ci%3Ex%3C/i%3E  (aplikacija name parametro nenaudoja)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://verslomatika.lt/api/track/click?id=x&to=https%3A%2F%2Fexample.com"
# tikimasi: 307 į reputacija.verslomatika.lt; ten allowlist nukreips į verslomatika.lt/reputacija, ne į example.com
```

⚠️ Po šio pakeitimo `verslomatika.lt/r/*` veikia tik tada, kai veikia šis PC ir Cloudflare Tunnel (savininko sprendimas Nr. 3 roadmap'e). Budėtojas `core/health_watchdog.py` tai stebi.

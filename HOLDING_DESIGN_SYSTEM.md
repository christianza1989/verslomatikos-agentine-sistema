# 🎨 VERSLOMATIKOS HOLDINGO VIENINGOS DIZAINO SISTEMOS STANDARTAS (2026)

> **Privalomas reikalavimas:** Visi 15 holdingo subdomenų (`reputacija.verslomatika.lt`, `revive.verslomatika.lt`, `access.verslomatika.lt` ir kt.) privalo 100% atitikti pagrindinės **Verslomatika V2** platformos vizualinę tapatybę, spalvas, tipografiką ir komponentų hierarchiją.

---

## 1. Tapatybė ir Firminės Spalvos

| Spalvos Tipas | Reikšmė HEX | Panaudojimas |
| :--- | :--- | :--- |
| **Pagrindinis Veiksmas (Primary)** | `#5636E8` | Pagrindiniai mygtukai, akcentai, CTA, aktyvios būsenos |
| **Veiksmo Užvedimas (Hover)** | `#4324D6` | Mygtukų užvedimo būsena |
| **Švelnus Alyvinis (Tint)** | `#F5F3FF` / `#EDE9FE` | Ženkliukų (badges) fonai, švelnūs akcentai |
| **Sėkmės / Mėtų Žalia (Mint)** | `#157A57` / `#10B981` | Antrasis logotipo taškas, sėkmės būsenos, patvirtinti 5★ |
| **Pagrindinis Tekstas (Ink)** | `#0F172A` | Didelės antraštės, tekstas |
| **Prislopintas Tekstas (Muted)** | `#64748B` | Aprašymai, paaiškinimai, etiketės |
| **Švarus Fonas (Canvas)** | `#FFFFFF` | Puslapių ir kortelių pagrindas |
| **Paviršius (Surface)** | `#F8FAFC` | Švelnios sekcijos, alternatyvūs blokai |
| **Kraštinė (Line)** | `#E2E8F0` | Švarios, minimalistinės kortelių ribos |
| **Tamsusis Blokas (Deep Indigo)**| `#13112E` | Tamsios ROI / kontrastingos kortelės |

---

## 2. Oficialus Firminis Logotipas

Kiekvieno subdomeno antraštėje (Header) privaloma naudoti originalų Verslomatika geometrinį ženklą:

```html
<span class="brand">
  <svg width="28" height="29" viewBox="0 0 31 32" aria-hidden="true">
    <path d="M3 6L14 16 3 26M14 16L24 6M14 16L24 26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="25" cy="6" r="3.5" fill="#5636e8"/>
    <circle cx="25" cy="26" r="3.5" fill="#157a57"/>
  </svg>
  <span>verslomatika<span style="color:#5636e8">.</span></span>
  <span style="color:#94a3b8">|</span>
  <span style="color:#5636e8; font-weight:700;">[Produkto Pavadinimas]</span>
</span>
```

Pavyzdžiai:
* `verslomatika. | ReputationPro`
* `verslomatika. | ReviveLeads`
* `verslomatika. | AccessGuard`

---

## 3. Tipografika

* **Antraštės:** `Manrope` / `Sora` (svoriai: 600, 700, 800) su `letter-spacing: -0.035em`.
* **Tekstas:** `Plus Jakarta Sans` / `Inter` (svoriai: 400, 500, 600).
* **Šrifto dydžiai:**
  * H1: `clamp(40px, 4.5vw, 58px)`
  * H2: `32px – 38px`
  * H3: `20px – 24px`
  * Tekstas: `15px – 16px` (line-height: `1.65`)

---

## 4. Komponentų Standartai

1. **Pagrindinis Mygtukas (`.btn-primary`):**
   * Fonas: `#5636E8`, tekstas: `#FFFFFF`, šrifto svoris: `600`, `border-radius: 8px`.
   * Su rodykle `↗` (`ArrowUpRight` iš `lucide-react`).
2. **Kortelės (`.card`):**
   * Fonas: `#FFFFFF`, kraštinė: `1px solid #E2E8F0`, `border-radius: 14px`.
   * Švelnus šešėlis: `box-shadow: 0 10px 30px -10px rgba(0,0,0,0.04)`.
3. **Poraštė (Footer):**
   * Privaloma juridinė nuoroda: **Operatorius: MB Pinet • Vilnius, Lietuva • info@pinet.lt**.
   * Nuorodos į pagrindinę `https://verslomatika.lt` ir kitus holdingo įrankius.

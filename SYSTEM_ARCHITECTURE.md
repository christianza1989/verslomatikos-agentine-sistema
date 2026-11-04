# SISTEMOS ARCHITEKTŪRA: KUBILŲ EKSPORTO AGENTŲ TINKLAS

Šiame dokumente pateikiama techninė schema, kaip agentai bendrauja tarpusavyje, kokius failus naudoja ir kaip duomenys cirkuliuoja sistemoje.

---

## 1. DUOMENŲ SRAUTO SCHEMA (MERMAID)

```mermaid
flowchart TD
    subgraph Scout["Agentė Elena (EU Lead Scout)"]
        WebScrape["Google Maps / Glamping katalogai (DE, NL, FR, SE)"] --> CleanData["Filtravimas ir Tier nustatymas"]
        CleanData --> LeadsFile[("data/leads_europe.json")]
    end

    subgraph Outreach["Agentas Klaus (Outreach & Closer)"]
        LeadsFile --> LoadLeads["Ima naujus kontaktus"]
        LoadLeads --> LangEngine{"Kalbos nustatymas"}
        LangEngine -->|Vokietija/Austrija| MsgDE["Vokiškas pasiūlymas (DE)"]
        LangEngine -->|Olandija/Skandinavija/ES| MsgEN["Angliškas pasiūlymas (EN)"]
        LangEngine -->|Prancūzija/Belgija| MsgFR["Prancūziškas pasiūlymas (FR)"]
        MsgDE & MsgEN & MsgFR --> OutboxFile[("data/outbox_multilingual.json")]
    end

    subgraph Quoting["Agentė Sophie (Quotes & Follow-Up)"]
        OutboxFile --> InterestDetect["Klientas susidomėjo / prašo kainos"]
        InterestDetect --> CalcQuote["Paskaičiuoja kainą + transportą"]
        CalcQuote --> QuotesFile[("data/quotes.json")]
    end

    subgraph Management["Agentas Erik (Logistics & Reporting)"]
        QuotesFile & OutboxFile --> CalcMargin["Skaičiuoja grynajį pelną ir vilkikų užpildymą"]
        CalcMargin --> WeeklyReport[("data/reports/savaitine_ataskaita.md")]
    end

    WeeklyReport --> Owner(("Verslo Savininkas"))
    Owner -->|"Patvirtina užsakymą ir išrašo sąskaitą"| Delivery[("Lietuvos Gamintojas -> Vilkikas -> ES Klientas")]
```

---

## 2. FAILŲ IR DUOMENŲ BAZIŲ ROLĖS

* `configs/kubilai_europa.json` – Pagrindinės taisyklės: modeliai (Premium 200cm, Deluxe 225cm), gamybos kainos Lietuvoje, pardavimo kainos Europoje, transporto tarifai pagal šalis.
* `data/leads_europe.json` – Surinkti potencialūs pirkėjai ir dileriai su kontaktais, kategorija ir šalimi.
* `data/outbox_multilingual.json` – Paruošti išsiuntimui profesionalūs laiškai vokiečių, anglų ir prancūzų kalbomis.
* `data/quotes.json` – Sugeneruoti komerciniai pasiūlymai su pilna komplektacija ir transporto kaina iki durų.
* `data/reports/` – Savaitinės verslo suvestinės savininkui apie grynajį pelną, parduotus kubilus ir dilerius.

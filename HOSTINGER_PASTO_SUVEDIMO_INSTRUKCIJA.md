# 📬 REPUTATIONPRO PAŠTO SUVEDIMO INSTRUKCIJA (CODEX / VARTOTOJUI)

Ekonomiškas ir efektyvus modelis: vietoje 5 mokamų dėžučių naudojame **2 aktyvius agentus**, orientuotus išskirtinai į **klinikas, odontologiją ir veterinariją**.

Bendra siuntimo galia: **po 25 laiškus iš kiekvieno = 50 laiškų per dieną**.

---

## 1. Dėžutės ir jų statusas

| # | El. pašto adresas | Agentas | Paskirta niša | Statusas | Ką daryti? |
|---|---|---|---|---|---|
| 1 | **`tomas@verslomatika.lt`** | Tomas \| Verslomatika Klinikos | Odontologija, klinikos, veterinarija | 🟢 **JAU PARUOŠTA IR VEIKIA** | Nieko papildomai pirkti ar kurti nereikia (naudojama `configs/email_credentials.json`). |
| 2 | **`marius@verslomatika.eu`** | Marius \| Verslomatika Klinikos | Odontologija, klinikos, veterinarija | 🟡 **SUKURTI HOSTINGER** | Sukurti tik šią 1 dėžutę Hostinger hPanel valdymo skyde. |

*(Kiti profiliai: Laura, Kamilė, Justas – išsaugoti konfigūracijoje, bet deaktyvuoti, kad nekainuotų papildomų mokesčių).*

---

## 2. Dėžutės sukūrimas Hostinger (TIK 1 DĖŽUTĖ)

1. Prisijunkite prie **Hostinger hPanel** → **Emails** → pasirinkite domeną **`verslomatika.eu`**.
2. Sukurkite **vienintelę dėžutę**:
   * El. paštas: **`marius@verslomatika.eu`**
   * Slaptažodis: sugalvokite saugų slaptažodį.
3. Įsitikinkite, kad Hostinger Email skiltyje įjungti rekomenduojami **DKIM**, **SPF** ir **DMARC** įrašai.

---

## 3. Slaptažodžio įrašymas

Faile:  
👉 **`configs/reputation_agents/agent_marius.json`**

Pakeiskite:
```json
{
  "smtp_host": "smtp.hostinger.com",
  "smtp_port": 465,
  "use_ssl": true,
  "email": "marius@verslomatika.eu",
  "password": "ČIA_ĮRAŠYTI_MARIAUS_SLAPTAŽODĮ",
  "display_name": "Marius | Verslomatika Klinikos",
  "reply_to": "marius@verslomatika.eu"
}
```

---

## 4. Ryšio patikrinimas (1 komanda)

Suvedus slaptažodį, paleiskite automatinę patikrą:

```powershell
python test_multi_agent_smtp.py
```

Sistema patikrins ryšį su `smtp.hostinger.com:465`.

---

## 5. Agentų paleidimas

* **Sugeneruoti peržiūras abiem agentams (nieko nesiunčiant):**
  ```powershell
  python core/morning_campaign_runner.py preview
  ```
* **Išsiųsti šios dienos kvotą (50 laiškų klinikoms: 25 Tomas + 25 Marius):**
  ```powershell
  python core/morning_campaign_runner.py all
  ```
* **Paleisti kasdienį automatinį rytinį siuntėją (kasdien 08:30):**
  ```powershell
  python core/morning_campaign_runner.py daemon
  ```

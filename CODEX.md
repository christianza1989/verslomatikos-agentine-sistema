# CODEX UNIVERSALI AGENTŲ SISTEMA (BET KOKIAM VERSLUI)

Sveikas, Codex! Šis aplankas (`C:\Users\Lenovo\Documents\Agentai`) yra **universali, savarankiška AI agentų sistema**, gebanti valdyti bet kokį verslą pagal Joel Blackman ir 'Agency-Agents' standartus.

---

## 🚀 Kaip Sukurti ir Paleisti Agentus BET KOKIAM NAUJAM VERSLUI:

### 1 ŽINGSNIS: Naujo verslo prijungimas (1 komanda)
Kai vartotojas pasako: *"Codexai, sukurk agentus mano naujam verslui [Pavadinimas, Niša, Prekė, Kaina]"*, tu tiesiog paleidi onboarderį:
```powershell
python universal_onboarder.py --name "Verslo Pavadinimas" --niche "Veiklos sritis" --product "Prekė ar paslauga" --price 500 --market "Lietuva ir Europa"
```
Ši komanda automatiškai sugeneruoja `configs/{verslo_id}.json` su visais skauduliais, auditorijomis ir prieštaravimų atsakymais!

### 2 ŽINGSNIS: Agentų paleidimas
```powershell
python universal_orchestrator.py --business {verslo_id} --agent all
```
Sistema automatiškai:
1. Sukuria izoliuotą aplanką `data/{verslo_id}/`.
2. Paleidžia **Eleną** (Lead Scout), kuri randa tikslinius kontaktus į `data/{verslo_id}/leads.json`.
3. Paleidžia **Klausą** (Outreach Closer), kuris paruošia asmeninius laiškus be spamo į `data/{verslo_id}/outbox.json`.
4. Paleidžia **Eriką** (COO Reporter), kuris apskaičiuoja maržas, pardavimus ir sukuria savaitinę ataskaitą į `data/{verslo_id}/reports/`.

---

## 🎯 Jau Sukonfigūruoti Verslai Sistemoje:
1. **`kubilai_europa`** – Lietuviškų kubilų eksportas į Vokietiją, Olandiją, Prancūziją (`run_kubilai_agents.py`).
2. **`memocasting`** – 3D rankų ir kojų liejimo rinkiniai, dovanos ir apleistų krepšelių gelbėjimas.
3. **`namudarbas`** – Buitinės meistrų paslaugos į namus (Vilnius, Kaunas, Klaipėda).
4. **`synthaudio`** – AI balso sintezė ir voiceoverių SaaS.
5. **`phonebridger`** – Išmanioji AI telefonija ir skambučių nukreipimas.
6. **`azuolo_baldai`** – Baldų gamybos pavyzdys.

### 🏢 Visų verslų bendra ataskaita:
```powershell
python holding_overview.py
```

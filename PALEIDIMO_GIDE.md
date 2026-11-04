# GREITASIS PALEIDIMO GIDAS (SAVININKUI)

Šis gidas skirtas jums – paprasta žmonių kalba, be jokių sudėtingų techninių terminų.

---

## 🚀 Kaip Paleisti Agentus Kubilams Vienu Paspaudimu:

### 1 ŽINGSNIS:
Atsidarykite šį aplanką savo kompiuteryje:
`C:\Users\Lenovo\Documents\Agentai`

### 2 ŽINGSNIS:
Du kartus paspauskite pele failą:
👉 **`PALEISTI_AGENTUS.bat`**

Tai viskas! Atsidarys juodas langas ir agentai pradės darbą:
1. **Elena** pradės ieškoti glampingų ir dilerių Vokietijoje, Olandijoje ir Prancūzijoje.
2. **Klaus** paruoš asmeninius laiškus vokiečių (DE), anglų (EN) ir prancūzų (FR) kalbomis.
3. **Sophie** paskaičiuos kubilų kainas su pristatymu pagal šalis.
4. **Erik** paskaičiuos jūsų pelną (maržą) ir sugeneruos savaitinę ataskaitą.

---

## ➕ Kaip Pridėti BET KOKĮ KITĄ Savo Verslą:

Jei turite kitą verslą (pvz., baldai, paslaugos, el. parduotuvė, klinika):

Jums (arba Codexui) užtenka parašyti vos **VIENĄ komandą**:
```powershell
python universal_onboarder.py --name "Mano Naujas Verslas" --niche "Kuo užsiimate" --product "Prekė ar paslauga" --price 150 --market "Lietuva ir Europa"
```
Sistema akimirksniu:
* Sukurs naują verslo profilį aplanke `configs/`.
* Sukurs atskirą duomenų katalogą `data/mano_naujas_verslas/`.
* Paleis agentus ieškoti klientų ir ruošti asmeninius pasiūlymus būtent šitam naujam verslui!

---

## 📊 Kur Rasti Rezultatus?

Visi agentų darbo rezultatai išsisaugo aplanke `data/`:
* `data/{verslas}/leads.json` – visi rasti klientai ir dileriai (su el. paštais, telefonais, miestais).
* `data/{verslas}/outbox.json` – paruošti išsiuntimui pasiūlymai.
* `data/{verslas}/reports/` – savaitinės ataskaitos (kiek užsakymų, koks pelnas eurais).

---

## 💰 Kiek Tai Kainuoja?
* **DABAR:** **0 € (visiškai nemokamai)**. Sistema naudoja protingą vietinį generatorių, kuris veikia tiesiai jūsų kompiuteryje be jokių mokesčių.
* **JEI NORITE PRIJUNGTI TIKRĄ AI (OpenAI / Grok):**
  Atsidarykite `PALEISTI_AGENTUS.bat` per Notepad (Užrašinę) ir įrašykite savo raktą:
  `set OPENAI_API_KEY=sk-...`
  *(Net ir su OpenAI modeliu, vienas visos Europos klientų skenavimas kainuos vos ~0.02 €)*.

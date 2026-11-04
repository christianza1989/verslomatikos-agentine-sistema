# WHATSAPP INTEGRACIJOS GIDAS: AGENTŲ VALDYMAS IŠ TELEFONO

Šis dokumentas paaiškina, kaip sujungti jūsų AI agentų komandą su **WhatsApp**, kad galėtumėte valdyti visą verslą tiesiai iš savo išmaniojo telefono – gulėdami ant sofos ar keliaudami.

---

## 📱 Kaip Tai Veikia Praktiškai (Scenarijai):

Jūs tiesiog atsidarote „WhatsApp“ programėlę savo telefone ir rašote į pokalbį lyg savo asmeniniam asistentui:

* **1 Scenarijus: Užduoties davimas**
  > **JŪS (WhatsApp):** *„Elena, surask 10 naujų glampingų Austrijoje ir paruošk vokiškus laiškus.“*  
  > **ELENA (atsako per 10 s):** *„Supratau, vadove! Jau nuskenavau Tirolio regioną, radau 10 glampingų su el. paštais ir perdaviau Klausui laiškams ruošti.“*

* **2 Scenarijus: Sandorio patvirtinimas (Pinigų gavimas)**
  > **ERIKAS (atsiunčia pranešimą):** *„🚨 DĖMESIO! Vokiečių dileris 'Wellness & Gartenwelt' nori pirkti 1 pavyzdinį kubilą (4,200 €). Jūsų grynasis pelnas: 1,900 €. Ar patvirtinti užsakymą ir išsiųsti sąskaitą?“*  
  > **JŪS (WhatsApp):** *„Taip, patvirtinu.“*  
  > **ERIKAS:** *„Sąskaita išsiųsta dileriui! Rezervuoju gamybos vietą Lietuvoje.“*

* **3 Scenarijus: Greita finansų suvestinė**
  > **JŪS (WhatsApp):** *„Koks šios savaitės pelnas?“*  
  > **ERIKAS:** *„Šią savaitę išsiųsta 15 pasiūlymų, patvirtinti 2 užsakymai. Bendras grynasis pelnas šiai dienai: **3,800.00 €**.“*

---

## 🛠️ 3 Būdai Prijungti WhatsApp (Pasirinkite sau tinkamiausią):

### 1 BŪDAS: „Green-API“ arba „UltraMsg“ (Greičiausias ir Paprasčiausias – 5 min.)
* **Kaip veikia:** Nereikia jokių sudėtingų „Facebook/Meta Business“ patvirtinimų. Tiesiog savo telefonu nuskenuojate QR kodą ekrane (lyg jungiantis prie „WhatsApp Web“).
* **Kaina:** Nemokamas testinis planas, vėliau ~10–12 €/mėn.
* **Žingsniai:**
  1. Užsiregistruojate `green-api.com` arba `ultramsg.com`.
  2. Telefono WhatsApp programėlėje: *Nustatymai -> Susieti įrenginiai -> Nuskenuoti QR kodą*.
  3. Gaunate `Instance ID` ir `Token`, kuriuos įrašote į `.env` failą.

---

### 2 BŪDAS: Oficialus „Twilio WhatsApp API“ (Profesionaliausias)
* **Kaip veikia:** Naudojamas oficialus Meta WhatsApp Business API kanalas per Twilio platformą.
* **Kaina:** Mokama tik už išsiųstas žinutes (apie **0.005 $** už žinutę – praktiškai centai).
* **Žingsniai:**
  1. Užsiregistruojate `twilio.com`.
  2. Suaktyvinate „WhatsApp Sandbox“ testavimui.
  3. Nukreipiate Webhook adresą į savo agentų serverį.

---

### 3 BŪDAS: „Make.com“ / „n8n“ (Be Programavimo)
* **Kaip veikia:** Vizualus sujungimas be kodo. Make.com paima žinutę iš jūsų WhatsApp, nusiunčia agentui į kompiuterį ir grąžina atsakymą atgal į telefoną.
* **Kaina:** Nemokama iki 1,000 žinučių per mėnesį.

---

## 💻 Paruoštas Kodas: `core/whatsapp_bridge.py`

Aplanke `core/` paruoštas Python tiltas, kuris priima žinutes ir nukreipia jas agentams.

Kai būsite pasiruošę prijungti WhatsApp:
1. Atsidarykite `.env` failą ir įrašykite:
   ```env
   WHATSAPP_PROVIDER=green_api
   GREEN_API_INSTANCE=1101...
   GREEN_API_TOKEN=...
   OWNER_PHONE_NUMBER=+37060000000
   ```
2. Paleiskite tiltą:
   ```powershell
   python core/whatsapp_bridge.py
   ```
Agentai pradės tiesiogiai klausytis jūsų komandų telefone!

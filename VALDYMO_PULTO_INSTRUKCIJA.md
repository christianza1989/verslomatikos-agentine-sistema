# VERSLOMATIKA • AI SISTEMOS VALDYMO PULTAS IR AUTOSTARTAS

Sveiki! Šiame gide aprašyta, kaip veikia naujoji grafinė valdymo pulto sistema (**Python GUI**) ir automatinis pasileidimas po kompiuterio perkrovimo (**Windows Autostart**).

---

## 📍 Projekto Nauja Vieta
Visas projektas su visomis bibliotekomis, duomenų bazėmis ir nustatymais perkeltas į:
👉 **`E:\Verslomatika`**

---

## 🖥️ Valdymo Pultas (Python GUI)

### Kaip atidaryti pultą:
1. **Ant darbalaukio (Desktop):** Du kartus paspauskite piktogramą **„Verslomatika Valdymo Pultas“**.
2. **Arba aplanke `E:\Verslomatika`:** Du kartus paspauskite **`PALEISTI_VALDYMO_PULTA.bat`**.

### Pulto galimybės:
* **Gyva stebėsena (Real-time Status):**
  - Matote kiekvieno serviso būseną realiuoju laiku (🟢 VEIKIA (200 OK) / 🔴 SUSTABDYTA).
* **Vieno mygtuko valdymas:**
  - 🚀 **Paleisti Viską** – vienu paspaudimu paleidžia ReputationPro, ReviveLeads ir Bridge serverius.
  - ⏹️ **Sustabdyti Viską** – saugiai sustabdo visus procesus.
  - 🔄 **Perkrauti** – perkrauna visus servisus.
* **Atskirų servisų valdymas:**
  - Prie kiekvieno serviso yra mygtukai „Paleisti“, „Sustabdyti“ ir **„🌐 Atidaryti“** (atidaro naršyklėje).
* **Agentų valdymas:**
  - Mygtukas **„🌲 Kubilų Eksporto Agentai“** – paleidžia Elenos, Klaus, Sophie ir Erik paieškos bei pasiūlymų ciklą.
  - Mygtukas **„🧪 Pilna Sistemos Patikra“** – atlieka visų API, autorizacijos ir QR kodų testus.
* **Gyvas žurnalas (Live Logs):**
  - Apačioje matote visus sistemos įvykius, atsakų kodus ir agentų pranešimus.

---

## 🚀 Windows Autostart (Automatinis paleidimas po PC perkrovimo)

### Kaip tai veikia:
1. Sukonfigūruotas paleidėjas Windows Startup aplanke:  
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Verslomatika_AutoStart.bat`
2. **Kiekvieną kartą, kai kompiuteris persikrauna ar yra įjungiamas:**
   - Windows automatiškai paleidžia `verslomatika_gui.py` su parametru `--autostart`.
   - Valdymo pultas automatiškai fone paleidžia:
     1. **ReputationPro** (`http://127.0.0.1:3000`)
     2. **ReviveLeads** (`http://127.0.0.1:3002`)
     3. **Holding Bridge** (`http://127.0.0.1:5050`)
   - Ekrane atsiranda valdymo pultas, kuriame visi indikatoriai iškart šviečia žaliai!
3. **Kaip išjungti arba vėl įjungti Autostart:**
   - Pačiame valdymo pulte yra jungiklis **„Įjungtas į Windows Startup“**. Jį galima bet kada įjungti arba išjungti vienu pelės paspaudimu.

---

## 🌐 Paslaugų Sąrašas

| Servisas | Vietinis Adresas | Paskirtis |
| :--- | :--- | :--- |
| **ReputationPro** | [http://127.0.0.1:3000](http://127.0.0.1:3000) | 5★ Google atsiliepimai, registracija, vadovo pultas |
| **ReviveLeads** | [http://127.0.0.1:3002](http://127.0.0.1:3002) | Neaktyvių klientų bazių reaktyvavimo platforma |
| **Holding Bridge** | [http://127.0.0.1:5050](http://127.0.0.1:5050) | Agentų tarpusavio ryšio ir stebėjimo tiltas |

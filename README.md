# Verslomatika • Autonominė B2B Agentinė Sistema (2026)

Autonominė B2B klientų pritraukimo, Google Maps 5★ reputacijos valdymo ir šaltųjų el. pašto kampanijų sistema Lietuvos bei ES rinkoms.

> 🤖 **Dirbtinio Intelekto / LLM Modelių Gidas:**  
> Jei esate AI modelis ar agentas (Claude, GPT, Codex, Cursor, Devin), išsamią techninę atmintį, failų schemas, paleidimo komandas ir veiklos taisykles rasite faile **[AGENTS.md](AGENTS.md)**.

---

## 🏛️ Sistemos Architektūra

```
Agentai/
├── apps/
│   ├── reputationpro/       # Next.js 16 aplikacija: 5★ Google atsiliepimų vartai, registracija (/checkout), admin pultas (/admin)
│   └── reviveleads/         # Next.js aplikacija: senų klientų bazių atgaivinimo sistema
├── core/
│   ├── morning_campaign_runner.py  # Kasdienis 08:30 B2B siuntimo demonas (kvotos, intervalai, apsauga)
│   ├── email_reply_listener.py     # 24/7 IMAP klausytojas (reaguoja į klientų atsakymus, klasifikuoja, atsako)
│   ├── dental_lead_pool.py         # Odontologijos / medicinos klinikų katalogas ir automatinis paruošimas
│   ├── ecommerce_lead_pool.py      # E-komercijos ir paslaugų įmonių katalogas
│   ├── smtp_sender.py              # Patikimas SMTP el. laiškų siuntiklis per verslomatika.lt
│   ├── objection_handler.py        # LLM prieštaravimų analizatorius ir konsultacinių atsakymų generatorius
│   └── reputation_sales_agent.py   # Autonominis pardavimų agentas (Tomas | Verslomatika B2B)
├── bridge/
│   └── bridge_server.py            # Lokalus WebSocket / HTTP tiltas procesų valdymui ir stebėjimui
├── configs/
│   ├── email_credentials.example.json # Pašto konfigūracijos šablonas
│   └── *.json                      # Atskirų verslo nišų parametrai
└── data/                           # Kampanijų registrai, šablonai ir ataskaitos
```

---

## 🚀 Greitas Paleidimas Lokaliai (Windows)

1. **Python priklausomybės:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **ReputationPro paleidimas:**
   ```powershell
   cd apps/reputationpro
   npm install
   npm run build
   npm run start
   ```

3. **Visos ekosistemos paleidimas:**
   Paleiskite failą `start_all_services.bat` arba PowerShell:
   ```powershell
   .\start_all_services.ps1
   ```

---

## ☁️ Perkėlimas į VPS (Ubuntu 24.04 Linux)

Visą sistemą galima paleisti bet kuriame pigiame Linux VPS (pvz., Hetzner CX22 ~4.50 €/mėn. arba Hostinger VPS):

### 1. Sistemos paruošimas:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl python3 python3-pip python3-venv sqlite3

# Node.js 22 diegimas:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Repozitorijos klonavimas:
```bash
cd /opt
git clone https://github.com/christianza1989/verslomatikos-agentine-sistema.git agentai
cd agentai
```

### 3. Konfigūracijos sukūrimas:
```bash
cp configs/email_credentials.example.json configs/email_credentials.json
nano configs/email_credentials.json  # Įveskite el. pašto slaptažodį

cp apps/reputationpro/.env.example apps/reputationpro/.env.local
nano apps/reputationpro/.env.local   # Nustatykite SESSION_SECRET ir ADMIN_PASSWORD
```

### 4. Aplikacijų diegimas ir build:
```bash
cd /opt/agentai/apps/reputationpro
npm install
npm run build
```

### 5. Paslaugų paleidimas 24/7 per PM2:
```bash
cd /opt/agentai

# Paleidžiame ReputationPro serverį (port 3000):
pm2 start "npm run start" --name "reputationpro" --cwd /opt/agentai/apps/reputationpro

# Paleidžiame Rytinį B2B siuntėją:
pm2 start "python3 -u core/morning_campaign_runner.py daemon" --name "morning-campaign"

# Paleidžiame Atsakymų klausytoją:
pm2 start "python3 -u core/email_reply_listener.py lilijazap@gmail.com" --name "reply-listener"

# Išsaugome automatinį paleidimą po serverio perkrovimo:
pm2 save
pm2 startup
```

---

## 🔒 Saugumas ir Privatumo Taisyklės

- `.env` failai, slaptažodžiai ir `*.db` duomenų bazės **niekada nėra keliami į Git**.
- Registruojant demonstracinius klientus, slaptažodžiai saugomi naudojant `scrypt` kriptografinį maišymą su druska.
- Sesijos apsaugotos `HttpOnly`, `SameSite=Lax` slapukais su HMAC parašu.

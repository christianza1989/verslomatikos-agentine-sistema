#!/usr/bin/env bash
# ==============================================================================
# Verslomatika B2B Agentinė Sistema — Automatinis VPS Diegimas (Ubuntu 22.04 / 24.04)
# ==============================================================================
set -e

echo "🚀 [1/6] Atnaujinami sistemos paketai..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y git curl python3 python3-pip python3-venv sqlite3 build-essential

echo "📦 [2/6] Diegiamas Node.js 22 LTS ir PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

sudo npm install -g pm2

echo "🐍 [3/6] Ruošiama Python virtuali aplinka..."
cd "$(dirname "$0")"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "⚙️ [4/6] Konfigūracijos failai..."
if [ ! -f "configs/email_credentials.json" ] && [ -f "configs/email_credentials.example.json" ]; then
    cp configs/email_credentials.example.json configs/email_credentials.json
    echo "⚠️ Svarbu: Įrašykite el. pašto slaptažodį į: configs/email_credentials.json"
fi

if [ ! -f "apps/reputationpro/.env.local" ] && [ -f "apps/reputationpro/.env.example" ]; then
    cp apps/reputationpro/.env.example apps/reputationpro/.env.local
fi

echo "🏗️ [5/6] Kompiliuojama ReputationPro Next.js aplikacija..."
cd apps/reputationpro
npm install
npm run build
cd ../..

echo "🛡️ [6/6] Paleidžiamos 24/7 paslaugos per PM2..."
pm2 delete reputationpro 2>/dev/null || true
pm2 delete morning-campaign 2>/dev/null || true
pm2 delete reply-listener 2>/dev/null || true

# 1. Next.js serveris
pm2 start "npm run start" --name "reputationpro" --cwd "$PWD/apps/reputationpro"

# 2. Rytinis kampanijos demonas (kasdien 08:30)
pm2 start "$PWD/.venv/bin/python -u core/morning_campaign_runner.py daemon" --name "morning-campaign"

# 3. IMAP atsakymų klausytojas
pm2 start "$PWD/.venv/bin/python -u core/email_reply_listener.py lilijazap@gmail.com" --name "reply-listener"

pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "================================================================================"
echo "✅ DIEGIMAS SĖKMINGAI BAIGTAS!"
echo "Paslaugų būseną galite tikrinti komanda: pm2 status"
echo "Žurnalus (logs) galite stebėti komanda: pm2 logs"
echo "================================================================================"

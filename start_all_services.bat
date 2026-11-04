@echo off
echo ===================================================
echo   PALEIDŽIAMI VERSLOMATIKA HOLDINGO SERVISAI
echo ===================================================

echo [1/3] Paleidziamas Antigravity <-> Codex Bridge (port 5050)...
start "Holding Bridge Server" cmd /k "cd /d C:\Users\Lenovo\Documents\Agentai\bridge && python bridge_server.py"

echo [2/3] Paleidziamas ReputationPro Next.js (port 3000)...
start "ReputationPro Production" cmd /k "cd /d C:\Users\Lenovo\Documents\Agentai\apps\reputationpro && npx next start -H 127.0.0.1 -p 3000"

echo [3/3] Paleidziamas Cloudflare Tunnel (reputacija.verslomatika.lt)...
start "Cloudflare Tunnel" cmd /k "cd /d C:\Users\Lenovo\Documents\Agentai\apps\reputationpro && tools\cloudflared.exe tunnel --no-autoupdate run --token-file data\operations\tunnel-token"

echo ===================================================
echo Visi servisai paleisti atskiruose foniniuose languose!
echo ===================================================
timeout /t 5

@echo off
chcp 65001 > nul
echo ===================================================
echo   PALEIDŽIAMI VERSLOMATIKA HOLDINGO SERVISAI
echo ===================================================

set "ROOT_DIR=%~dp0"

echo [1/3] Paleidziamas Antigravity <-> Codex Bridge (port 5050)...
start "Holding Bridge Server" cmd /k "cd /d "%ROOT_DIR%bridge" && python bridge_server.py"

echo [2/3] Paleidziamas ReputationPro Next.js (port 3000)...
start "ReputationPro Production" cmd /k "cd /d "%ROOT_DIR%apps\reputationpro" && npx next start -H 127.0.0.1 -p 3000"

echo [3/3] Paleidziamas ReviveLeads Next.js (port 3002)...
start "ReviveLeads Production" cmd /k "cd /d "%ROOT_DIR%apps\reviveleads" && npx next start -H 127.0.0.1 -p 3002"

if exist "%ROOT_DIR%apps\reputationpro\tools\cloudflared.exe" (
    echo [4/4] Paleidziamas Cloudflare Tunnel (reputacija.verslomatika.lt)...
    start "Cloudflare Tunnel" cmd /k "cd /d "%ROOT_DIR%apps\reputationpro" && tools\cloudflared.exe tunnel --no-autoupdate run --token-file data\operations\tunnel-token"
) else (
    echo [4/4] Cloudflare Tunnel praleistas (lokalus rezimas)
)

echo ===================================================
echo Visi servisai paleisti atskiruose foniniuose languose!
echo ===================================================
timeout /t 5

echo [5] Paleidziamas 24/7 budetojas (health check + DB kopijos)...
start "Verslomatika Watchdog" /min pythonw "%ROOT_DIR%core\health_watchdog.py"

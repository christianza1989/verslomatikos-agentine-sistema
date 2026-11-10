# Paleidimo skriptas po kompiuterio perkrovimo
$ROOT_DIR = $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  PALEIDŽIAMI VERSLOMATIKA HOLDINGO SERVISAI" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Bridge Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\bridge'; python bridge_server.py"

# 2. ReputationPro App (port 3000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\apps\reputationpro'; cmd /c 'npx next start -H 127.0.0.1 -p 3000'"

# 3. ReviveLeads App (port 3002)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\apps\reviveleads'; cmd /c 'npx next start -H 127.0.0.1 -p 3002'"

# 4. Cloudflare Tunnel (jei yra)
$tunnelPath = "$ROOT_DIR\apps\reputationpro\tools\cloudflared.exe"
if (Test-Path $tunnelPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\apps\reputationpro'; .\tools\cloudflared.exe tunnel --no-autoupdate run --token-file data\operations\tunnel-token"
} else {
    Write-Host "Cloudflare Tunnel nerastas - veikiama lokaliu rezimu (http://localhost:3000 & :3002)" -ForegroundColor Yellow
}

# 5. 24/7 budetojas: health check, automatinis perkrovimas, kasdiene DB kopija (ROADMAP E2-E3)
Start-Process pythonw -ArgumentList "`"$ROOT_DIR\core\health_watchdog.py`"" -WorkingDirectory $ROOT_DIR

# 6. Kampanijos demonai (ROADMAP C). Ijunkite, kai perziuresite laiskus: python core\morning_campaign_runner.py preview 5
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR'; python core\morning_campaign_runner.py daemon"
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR'; python core\email_reply_listener.py"

Write-Host "Visi servisai paleisti!" -ForegroundColor Green

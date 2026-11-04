# Paleidimo skriptas po kompiuterio perkrovimo
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  PALEIDŽIAMI VERSLOMATIKA HOLDINGO SERVISAI" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Bridge Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Lenovo\Documents\Agentai\bridge'; python bridge_server.py"

# 2. Next.js App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Lenovo\Documents\Agentai\apps\reputationpro'; cmd /c 'npx next start -H 127.0.0.1 -p 3000'"

# 3. Cloudflare Tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Lenovo\Documents\Agentai\apps\reputationpro'; .\tools\cloudflared.exe tunnel --no-autoupdate run --token-file data\operations\tunnel-token"

Write-Host "Visi servisai paleisti!" -ForegroundColor Green

# Įdiegia naują ReputationPro versiją šiame PC-serveryje (prastova ~1–2 min.).
#
#   powershell -ExecutionPolicy Bypass -File E:\Verslomatika\apps\reputationpro\scripts\deploy-live.ps1
#
# Žingsniai: testai → sustabdomas procesas porte 3000 → `npm run build` į .next → paleidimas per start-local.ps1
# → lokalaus ir viešo /api/health patikra. Jei build'as nepavyksta, senas .next lieka (Next rašo atomiškai
# tik sėkmės atveju), todėl serveris paleidžiamas su ankstesne versija.
$ErrorActionPreference = 'Stop'
$app = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $app

Write-Output '1/5 Testai...'
& npm.cmd test --silent
if ($LASTEXITCODE -ne 0) { throw 'Testai nepraėjo – diegimas sustabdytas, gyvas serveris nepaliestas.' }

Write-Output '2/5 Stabdomas dabartinis serveris (portas 3000)...'
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Write-Output '3/5 Build...'
Remove-Item Env:REPUTATION_BUILD_DIR -ErrorAction SilentlyContinue
& npm.cmd run build
$buildOk = $LASTEXITCODE -eq 0

Write-Output '4/5 Paleidžiama...'
& (Join-Path $PSScriptRoot 'start-local.ps1')
$ok = $false
foreach ($i in 1..30) {
  Start-Sleep -Seconds 2
  try { if ((Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 5).status -eq 'ok') { $ok = $true; break } } catch {}
}
if (-not $ok) { throw 'Serveris neatsako per 60 s. Žr. logs/server-error.log' }
if (-not $buildOk) { throw 'Build nepavyko: paleista ANKSTESNĖ versija. Ištaisykite klaidas ir paleiskite skriptą dar kartą.' }

Write-Output '5/5 Patikra...'
Write-Output ('Lokalus: ' + (Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 5).status)
try {
  $public = Invoke-RestMethod 'https://reputacija.verslomatika.lt/api/health' -TimeoutSec 15
  Write-Output ('Viešas: ' + $public.status)
} catch { Write-Warning 'Viešo adreso nepavyko patikrinti iš šio PC (gali būti vietinio DNS problema). Patikrinkite naršyklėje.' }
Write-Output 'Įdiegta. Patikrinkite: https://reputacija.verslomatika.lt/r/vilniaus-denta'

$ErrorActionPreference = 'Stop'
$appDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appDirectory
if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 3001 is occupied; no existing process was changed.'
}
if (-not (Test-Path -LiteralPath '.next-equal-choice-20261027/BUILD_ID')) {
  throw 'The isolated equal-choice build is missing.'
}
$qaDirectory = Join-Path ([IO.Path]::GetTempPath()) ('reputationpro-equal-choice-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $qaDirectory | Out-Null
$env:REPUTATION_BUILD_DIR = '.next-equal-choice-20261027'
$env:DATABASE_PATH = Join-Path $qaDirectory 'qa.db'
$env:DEMO_MODE = 'true'
$env:APP_URL = 'http://127.0.0.1:3001'
Write-Output 'Isolated test data only. Open http://127.0.0.1:3001/r/vilniaus-denta; press Ctrl+C to stop.'
& node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001

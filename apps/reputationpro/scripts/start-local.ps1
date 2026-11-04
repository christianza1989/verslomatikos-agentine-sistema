$ErrorActionPreference = 'Stop'
$appDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appDirectory
$existingListener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($existingListener) { Write-Output 'Port 3000 is already in use. Check http://127.0.0.1:3000 before starting another server.'; exit 0 }
& node scripts/setup-local.mjs
if ($LASTEXITCODE -ne 0) { throw 'Local setup failed.' }
$activeBuildFile = 'data/operations/active-build'
if (Test-Path -LiteralPath $activeBuildFile) {
  $buildDirectory = (Get-Content -Raw -LiteralPath $activeBuildFile).Trim()
  if ($buildDirectory -notmatch '^\.next(-[a-z0-9-]+)?$') { throw 'Invalid active build name.' }
  if (-not (Test-Path -LiteralPath (Join-Path $buildDirectory 'BUILD_ID'))) { throw 'Active build is missing; restore the previous build or rebuild explicitly.' }
  $env:REPUTATION_BUILD_DIR = $buildDirectory
} else {
  Remove-Item Env:REPUTATION_BUILD_DIR -ErrorAction SilentlyContinue
  $buildDirectory = '.next'
}
if (-not (Test-Path -LiteralPath (Join-Path $buildDirectory 'BUILD_ID'))) {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
}
New-Item -ItemType Directory -Path 'logs' -Force | Out-Null
$nodeBinary = (Get-Command node).Source
$serverProcess = Start-Process -FilePath $nodeBinary -ArgumentList @('node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000') -WorkingDirectory $appDirectory -WindowStyle Hidden -RedirectStandardOutput 'logs/server.log' -RedirectStandardError 'logs/server-error.log' -PassThru
@{pid=$serverProcess.Id;url='http://127.0.0.1:3000';started_at=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath 'logs/server.json'
Write-Output ('ReputationPro started at http://127.0.0.1:3000 (PID ' + $serverProcess.Id + ').')

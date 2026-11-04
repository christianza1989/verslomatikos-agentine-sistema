$ErrorActionPreference = 'Stop'
$appDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appDir
if (Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 3002 is already in use; inspect the listener before starting.' }
& node scripts/setup.mjs
if ($LASTEXITCODE -ne 0) { throw 'Local setup failed.' }
$buildDirectory = '.next'
if (Test-Path -LiteralPath 'data/active-build') { $buildDirectory = (Get-Content -Raw -LiteralPath 'data/active-build').Trim() }
if ($buildDirectory -notmatch '^\.next(-[a-z0-9-]+)?$') { throw 'Invalid build name.' }
if (-not (Test-Path -LiteralPath (Join-Path $buildDirectory 'BUILD_ID'))) { throw 'Active build not found.' }
$env:REVIVE_BUILD_DIR = $buildDirectory
New-Item -ItemType Directory -Path logs -Force | Out-Null
$binary = (Get-Command node).Source
$process = Start-Process -FilePath $binary -ArgumentList @('node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3002') -WorkingDirectory $appDir -WindowStyle Hidden -RedirectStandardOutput 'logs/server.log' -RedirectStandardError 'logs/server-error.log' -PassThru
@{pid=$process.Id;url='http://127.0.0.1:3002';started_at=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath 'logs/server.json'
Write-Output ('ReviveLeads server started on 127.0.0.1:3002 (PID '+$process.Id+').')

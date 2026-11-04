$ErrorActionPreference = 'Stop'
$appDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appDirectory
$binaryPath = Join-Path $appDirectory 'tools\cloudflared.exe'
$tokenPath = Join-Path $appDirectory 'data\operations\tunnel-token'
if (-not (Test-Path -LiteralPath $binaryPath)) { throw 'cloudflared.exe is missing. See deployment instructions.' }
if (-not (Test-Path -LiteralPath $tokenPath)) { throw 'Private tunnel token is missing. Restore through Cloudflare, not Git.' }
if (Test-Path -LiteralPath 'logs/tunnel-process.json') {
  $priorTunnel = Get-Content -Raw 'logs/tunnel-process.json' | ConvertFrom-Json
  $runningTunnel = Get-Process -Id $priorTunnel.pid -ErrorAction SilentlyContinue
  if ($runningTunnel -and $runningTunnel.ProcessName -eq 'cloudflared') { Write-Output ('Tunnel already running (PID ' + $priorTunnel.pid + ').'); exit 0 }
}
$originHealth = Invoke-RestMethod 'http://127.0.0.1:3000/api/health'
if ($originHealth.status -ne 'ok') { throw 'Start ReputationPro before starting the tunnel.' }
$listeningPorts = @((Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue).LocalPort)
$metricsPort = 20241..20249 | Where-Object { $_ -notin $listeningPorts } | Select-Object -First 1
if (-not $metricsPort) { throw 'No free local tunnel metrics port; no other process was stopped.' }
New-Item -ItemType Directory -Path 'logs' -Force | Out-Null
$tunnelProcess = Start-Process -FilePath $binaryPath -ArgumentList @('tunnel','--no-autoupdate','--metrics',('127.0.0.1:'+$metricsPort),'run','--token-file','data/operations/tunnel-token') -WorkingDirectory $appDirectory -WindowStyle Hidden -RedirectStandardOutput 'logs/tunnel.log' -RedirectStandardError 'logs/tunnel-error.log' -PassThru
@{pid=$tunnelProcess.Id;hostname='reputacija.verslomatika.lt';metrics_port=$metricsPort;started_at=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath 'logs/tunnel-process.json'
Write-Output ('Cloudflare Tunnel started (PID ' + $tunnelProcess.Id + ').')

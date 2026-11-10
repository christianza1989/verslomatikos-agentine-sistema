# ROADMAP E1: automatinis Verslomatika servisų paleidimas po kompiuterio perkrovimo.
#
# Paleiskite VIENĄ kartą (PowerShell kaip administratorius):
#   powershell -ExecutionPolicy Bypass -File E:\Verslomatika\scripts\register-windows-tasks.ps1
#
# Kas sukuriama: Task Scheduler užduotis „Verslomatika-Servisai“, kuri prisijungus vartotojui paleidžia
# start_all_services.ps1 (Next.js 3000/3002, Cloudflare Tunnel, bridge, 24/7 budėtoją).
# Kad PC veiktų kaip serveris be žmogaus: Windows nustatymuose įjunkite automatinį prisijungimą
# (netplwiz) arba pakeiskite trigerį į -AtStartup su vartotojo slaptažodžiu.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root 'start_all_services.ps1'
if (-not (Test-Path -LiteralPath $script)) { throw "Nerastas $script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$script`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = 'PT30S'  # palaukiame tinklo
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0)
Register-ScheduledTask -TaskName 'Verslomatika-Servisai' -Action $action -Trigger $trigger -Settings $settings -Description 'Verslomatika: ReputationPro, ReviveLeads, Cloudflare Tunnel, budetojas' -Force | Out-Null
Write-Output 'Sukurta užduotis „Verslomatika-Servisai“ (paleidžiama prisijungus).'

# Rekomenduojami (neprivalomi) maitinimo nustatymai 24/7 serveriui – atkomentuokite, jei sutinkate:
# powercfg /change standby-timeout-ac 0     # niekada neužmigti, kai prijungtas prie elektros
# powercfg /change hibernate-timeout-ac 0
# Windows Update → Advanced options → Active hours: nustatykite, kad perkrovimai vyktų naktį.

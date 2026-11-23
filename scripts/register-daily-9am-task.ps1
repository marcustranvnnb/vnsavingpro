# Registers a monthly Day-1 9:00 AM Windows Scheduled Task to run the bank rate scrapers.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\register-daily-9am-task.ps1

$ErrorActionPreference = "Stop"
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodePath = (Get-Command node).Source
$taskName = "VnSavingPro_MonthlyRateSync_Day1_9AM"

Push-Location $projectDir.Path
try {
  & schtasks.exe /Create /TN $taskName /TR "`"$nodePath`" scripts/scrape-all.js" /SC MONTHLY /D 1 /ST 09:00 /F | Out-Null
} finally {
  Pop-Location
}

Write-Host "Registered Windows Scheduled Task '$taskName' to run on the 1st of every month at 09:00 AM." -ForegroundColor Green
Write-Host "Command: $nodePath scripts/scrape-all.js (in $($projectDir.Path))"

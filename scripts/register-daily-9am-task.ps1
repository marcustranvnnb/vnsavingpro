# Registers a daily 9:00 AM Windows Scheduled Task to run the TNEX & TIMO rate scrapers.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\register-daily-9am-task.ps1

$ErrorActionPreference = "Stop"
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodePath = (Get-Command node).Source
$taskName = "VnSavingPro_DailyRateSync_9AM"

$action = New-ScheduledTaskAction `
  -Execute $nodePath `
  -Argument "scripts/scrape-all.js" `
  -WorkingDirectory $projectDir.Path

$trigger = New-ScheduledTaskTrigger -Daily -At "09:00"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Runs TNEX & TIMO savings rate scrapers daily at 09:00 AM for VnSavingPro" `
  -Force | Out-Null

Write-Host "Registered Windows Scheduled Task '$taskName' to run daily at 09:00 AM." -ForegroundColor Green
Write-Host "Command: $nodePath scripts/scrape-all.js (in $($projectDir.Path))"

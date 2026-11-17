# VnSavingPro Living Brain Snapshot Script
# Checks file modification timestamps against docs/knowledge-base/INDEX.md and detects unreferenced files in src/

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")
$kbIndex = Join-Path $root "docs\knowledge-base\INDEX.md"

Write-Host "=== VnSavingPro Living Brain Status ===" -ForegroundColor Cyan
if (Test-Path $kbIndex) {
    $kbTime = (Get-Item $kbIndex).LastWriteTime
    Write-Host "Knowledge Base Last Synced: $($kbTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Green
} else {
    $kbTime = [DateTime]::MinValue
    Write-Host "WARNING: docs/knowledge-base/INDEX.md not found!" -ForegroundColor Yellow
}

$srcFiles = Get-ChildItem -Path (Join-Path $root "src") -Recurse -File
$newerFiles = $srcFiles | Where-Object { $_.LastWriteTime -gt $kbTime }

Write-Host "`n--- Files Modified Since Last Brain Sync ($($newerFiles.Count)) ---" -ForegroundColor Cyan
if ($newerFiles.Count -eq 0) {
    Write-Host "None! Knowledge base is up-to-date with all src/ files." -ForegroundColor Green
} else {
    foreach ($f in $newerFiles) {
        $rel = $f.FullName.Substring($root.Path.Length + 1)
        Write-Host " [MODIFIED] $rel ($($f.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Yellow
    }
}

Write-Host "`n--- Top 8 Most Recently Modified Source Files ---" -ForegroundColor Cyan
$srcFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 8 | ForEach-Object {
    $rel = $_.FullName.Substring($root.Path.Length + 1)
    Write-Host (" {0,-42} {1}" -f $rel, $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))
}

param (
    [string]$ZipName = "maty-music-clean.zip"
)

$desktop = [Environment]::GetFolderPath("Desktop")
$target = Join-Path $desktop $ZipName

if (Test-Path $target) { Remove-Item $target -Force }

Get-ChildItem -Recurse -File | Where-Object {
    $full = $_.FullName

    # לא לכלול תיקיות כבדות/לא רלוונטיות
    $full -notmatch '(\\|/)(node_modules|\.next|dist|build|out|coverage|logs|tmp|\.git|\.turbo)(\\|/)' -and
    # לא לכלול קבצי env
    $_.Name -notmatch '^\.env' -and
    # לא לכלול ZIP בתוך הפרויקט
    $_.Extension -ne '.zip'
} | Compress-Archive -DestinationPath $target -Force

Write-Host "✔ Project successfully zipped -> $target"


# powershell -ExecutionPolicy Bypass -File .\scripts\zip-project.ps1

# zip-project.ps1
param (
    [string]$ZipName = "maty-music.zip"
)

$desktop = [Environment]::GetFolderPath("Desktop")
$target = Join-Path $desktop $ZipName

if (Test-Path $target) { Remove-Item $target -Force }

Get-ChildItem -Recurse -File | Where-Object {
    $_.FullName -notmatch '(\\|/)(node_modules|\.next|dist|\.git)(\\|/)'
} | Compress-Archive -DestinationPath $target -Force

Write-Host "Project successfully zipped -> $target"

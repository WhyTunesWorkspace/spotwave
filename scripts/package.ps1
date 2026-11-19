param(
  [string]$Version = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$stage = Join-Path $dist "_stage"

if (-not $Version) {
  $Version = (Get-Content (Join-Path $root "app\manifest.json") -Raw | ConvertFrom-Json).version
  if (-not $Version) { $Version = "dev" }
}

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

Copy-Item (Join-Path $root "app") $stage -Recurse
Copy-Item (Join-Path $root "scripts") $stage -Recurse
foreach ($f in @("README.md", "README.ru.md", "LICENSE", "CHANGELOG.md", "update.cmd")) {
  $p = Join-Path $root $f
  if (Test-Path $p) { Copy-Item $p $stage }
}

$zip = Join-Path $dist "spotwave.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force
Remove-Item $stage -Recurse -Force

Write-Host "[package] $zip ($([math]::Round((Get-Item $zip).Length / 1kb, 1)) KB, version $Version)" -ForegroundColor Green

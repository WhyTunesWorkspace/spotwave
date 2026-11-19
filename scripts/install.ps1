param(
  [string]$SpotifyPath = "$env:APPDATA\Spotify",
  [string]$SpicetifyExe = "",
  [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$repo = "WhyTunesWorkspace/spotwave"

function Step($text) { Write-Host "[spotwave] $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "[spotwave] $text" -ForegroundColor Red; exit 1 }

# --- locate app files: local checkout or latest release ---
$scriptDir = $PSScriptRoot
if ($scriptDir -and (Test-Path (Join-Path $scriptDir "..\app\manifest.json"))) {
  $appDir = (Resolve-Path (Join-Path $scriptDir "..\app")).Path
} elseif ($scriptDir -and (Test-Path (Join-Path $scriptDir "app\manifest.json"))) {
  $appDir = (Join-Path $scriptDir "app")
} else {
  Step "Downloading the latest release..."
  $tmp = Join-Path $env:TEMP ("spotwave-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  try {
    Invoke-WebRequest "https://github.com/$repo/releases/latest/download/spotwave.zip" -OutFile "$tmp\spotwave.zip" -UseBasicParsing
    Expand-Archive "$tmp\spotwave.zip" -DestinationPath $tmp -Force
  } catch {
    Fail "Could not download the release: $($_.Exception.Message)"
  }
  $appDir = Join-Path $tmp "app"
}

if (-not (Test-Path (Join-Path $appDir "manifest.json"))) {
  Fail "app\manifest.json not found."
}
if (-not (Test-Path (Join-Path $SpotifyPath "Spotify.exe"))) {
  Fail "Spotify not found at $SpotifyPath. Pass -SpotifyPath 'C:\...\Spotify'"
}

# --- find Spicetify ---
if (-not $SpicetifyExe) {
  $cmd = Get-Command spicetify -ErrorAction SilentlyContinue
  if ($cmd) { $SpicetifyExe = $cmd.Source }
}
if (-not $SpicetifyExe) {
  $candidates = @(
    (Join-Path $appDir "..\tools\spicetify\spicetify.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\spicetify\spicetify.exe"),
    (Join-Path $env:LOCALAPPDATA "spicetify\spicetify.exe"),
    (Join-Path $env:APPDATA "spicetify\spicetify.exe"),
    (Join-Path $env:ProgramFiles "Spicetify\spicetify.exe")
  )
  foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { $SpicetifyExe = $c; break } }
}
if (-not $SpicetifyExe -or -not (Test-Path $SpicetifyExe)) {
  Write-Host ""
  Write-Host "Spicetify CLI not found. Install it first:" -ForegroundColor Yellow
  Write-Host '  iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex'
  Write-Host "then run this script again."
  exit 1
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$extra = @()
if ($isAdmin) { $extra = @("--bypass-admin") }

Step "Spicetify: $SpicetifyExe"
if ($isAdmin) { Step "Running as administrator - adding --bypass-admin" }

& $SpicetifyExe @extra config spotify_path $SpotifyPath | Out-Null
& $SpicetifyExe @extra config prefs_path (Join-Path $SpotifyPath "prefs") | Out-Null
& $SpicetifyExe @extra config custom_apps wave | Out-Null
Step "Spicetify config updated"

$dest = Join-Path $env:APPDATA "spicetify\CustomApps\wave"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item (Join-Path $appDir "*") $dest -Recurse -Force
Step "App copied to $dest"

Step "Closing Spotify..."
Get-Process Spotify -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

$backupDir = Join-Path $env:APPDATA "spicetify\Backup"
$hasBackup = (Test-Path $backupDir) -and ((Get-ChildItem $backupDir -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)

Step "Applying the patch (10-30 seconds)..."
if ($hasBackup) {
  & $SpicetifyExe @extra apply
} else {
  & $SpicetifyExe @extra backup apply
}

if (-not $NoLaunch) {
  Step "Starting Spotify..."
  Start-Process (Join-Path $SpotifyPath "Spotify.exe")
}

Write-Host ""
Write-Host "Done. The wave icon is in the top-left corner of Spotify." -ForegroundColor Green
Write-Host "Rollback: spicetify restore"
exit 0

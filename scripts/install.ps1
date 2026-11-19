param(
  [string]$SpotifyPath = "$env:APPDATA\Spotify",
  [string]$SpicetifyExe = ""
)

$ErrorActionPreference = "Stop"

function Write-Step($text) { Write-Host "[wave] $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "[wave] $text" -ForegroundColor Red; exit 1 }

$root = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $root "app"

if (-not (Test-Path (Join-Path $appDir "manifest.json"))) {
  Fail "Не найден app\manifest.json. Запусти скрипт из папки репозитория."
}
if (-not (Test-Path (Join-Path $SpotifyPath "Spotify.exe"))) {
  Fail "Spotify не найден в $SpotifyPath. Укажи путь: -SpotifyPath 'C:\...\Spotify'"
}

# --- поиск Spicetify ---
if (-not $SpicetifyExe) {
  $cmd = Get-Command spicetify -ErrorAction SilentlyContinue
  if ($cmd) { $SpicetifyExe = $cmd.Source }
}
if (-not $SpicetifyExe) {
  $candidates = @(
    (Join-Path $root "tools\spicetify\spicetify.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\spicetify\spicetify.exe"),
    (Join-Path $env:APPDATA "spicetify\spicetify.exe")
  )
  foreach ($c in $candidates) { if (Test-Path $c) { $SpicetifyExe = $c; break } }
}
if (-not $SpicetifyExe -or -not (Test-Path $SpicetifyExe)) {
  Write-Host ""
  Write-Host "Spicetify CLI не найден. Установи его:" -ForegroundColor Yellow
  Write-Host '  iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex'
  Write-Host "и запусти скрипт снова."
  exit 1
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$extra = @()
if ($isAdmin) { $extra = @("--bypass-admin") }

Write-Step "Spicetify: $SpicetifyExe"
if ($isAdmin) { Write-Step "Запуск от администратора — добавляю --bypass-admin" }

# --- конфиг ---
& $SpicetifyExe @extra config spotify_path $SpotifyPath | Out-Null
& $SpicetifyExe @extra config prefs_path (Join-Path $SpotifyPath "prefs") | Out-Null
& $SpicetifyExe @extra config custom_apps wave | Out-Null
Write-Step "Конфиг Spicetify обновлён"

# --- копирование приложения ---
$dest = Join-Path $env:APPDATA "spicetify\CustomApps\wave"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item (Join-Path $appDir "*") $dest -Recurse -Force
Write-Step "Приложение скопировано в $dest"

# --- применение ---
Write-Step "Закрываю Spotify…"
Get-Process Spotify -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

$backupDir = Join-Path $env:APPDATA "spicetify\Backup"
$hasBackup = (Test-Path $backupDir) -and ((Get-ChildItem $backupDir -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)

Write-Step "Применяю патч (это может занять 10–30 секунд)…"
if ($hasBackup) {
  & $SpicetifyExe @extra apply
} else {
  & $SpicetifyExe @extra backup apply
}

Write-Step "Запускаю Spotify…"
Start-Process (Join-Path $SpotifyPath "Spotify.exe")

Write-Host ""
Write-Host "Готово. Открой Spotify и найди иконку с волной в левом верхнем углу." -ForegroundColor Green
Write-Host "Если что-то пошло не так: spicetify restore (вернёт клиент к состоянию до патча)."

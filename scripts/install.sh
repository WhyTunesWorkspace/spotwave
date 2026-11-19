#!/usr/bin/env bash
# spotwave installer for macOS / Linux
set -euo pipefail

REPO="WhyTunesWorkspace/spotwave"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
APP="$HERE/../app"

if [ ! -f "$APP/manifest.json" ]; then
  echo "[spotwave] Downloading the latest release…"
  TMP="$(mktemp -d)"
  curl -fsSL "https://github.com/$REPO/releases/latest/download/spotwave.zip" -o "$TMP/spotwave.zip"
  unzip -q "$TMP/spotwave.zip" -d "$TMP"
  APP="$TMP/app"
fi

if [ ! -f "$APP/manifest.json" ]; then
  echo "[spotwave] app/manifest.json not found" >&2
  exit 1
fi

if ! command -v spicetify >/dev/null 2>&1; then
  echo "[spotwave] Spicetify CLI not found. Install it first: https://spicetify.app" >&2
  exit 1
fi

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/spicetify"
DEST="$CONFIG_DIR/CustomApps/wave"
mkdir -p "$DEST"
cp -R "$APP/." "$DEST/"
echo "[spotwave] App copied to $DEST"

echo "[spotwave] Close Spotify, then press Enter…"
if [ -t 0 ]; then read -r _; fi

spicetify config custom_apps wave
if [ -d "$CONFIG_DIR/Backup" ] && [ -n "$(ls -A "$CONFIG_DIR/Backup" 2>/dev/null || true)" ]; then
  spicetify apply || echo "[spotwave] spicetify returned non-zero; if Spotify looks fine, ignore"
else
  spicetify backup apply || echo "[spotwave] spicetify returned non-zero; if Spotify looks fine, ignore"
fi

echo "[spotwave] Done. Open Spotify — the wave icon is in the top-left corner."
echo "[spotwave] Rollback: spicetify restore"

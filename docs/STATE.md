# Project state (handoff)

Updated: 2026-11-19

## Repo

- **https://github.com/WhyTunesWorkspace/spotwave** (public, MIT)
- Latest release: **v0.7.0** (auto-published by `.github/workflows/release.yml` on `v*` tags)
- Local working copy: `C:\Users\Administrator\wave`
- Backups: `C:\Users\Administrator\wave-backup-2026-11-19.zip` (state + git bundle + config)

## What is done

- Spicetify custom app (`app/`) + startup extension (`app/extension.js`).
- Waves from: liked songs, playlists, track, artist, album.
- Skip learning, "only new", BPM moods (calm/mid/energetic), auto-extend, reasons, stats.
- Playback via a service playlist `Р’РѕР»РЅР° В· Live` (native next/prev/shuffle/queue).
- Export/import profile JSON; optional ListenBrainz scrobbling.
- Bilingual UI (ru/en), native Spotify-style layout, brand identity (`docs/brand/`).
- One-line installers (`scripts/install.ps1`, `scripts/install.sh`), package script, CI,
  release automation, issue/PR templates.
- Docs: `README.md` (EN), `README.ru.md`, `docs/how-it-works.md`,
  `docs/launch-ru.md`, `docs/launch-en.md`.
- GitHub profile redesigned (manga B&W, no titles) + dark brand avatar uploaded.

## Spicetify Marketplace (done, 2026-11-19)

Verified against `spicetify/marketplace` source (`9970452`, 2026-11-16):

- Apps are discovered via GitHub search `topic:spicetify-apps` (`Grid.tsx:318`).
- The manifest is fetched from the **repo root** (`FetchRemotes.ts:143`).
- `fetchAppManifest` accepts a manifest only if it has `name` + `description` and **no `main`
  and no `usercss`** — otherwise it is classified as an extension/theme.
- Marketplace does **not** install apps: the card opens the repo (`Card.tsx:195`). Install
  stays with our one-line scripts.
- Blacklist (`resources/blacklist.json`) does not include spotwave.

Shipped in `2c9a16d`:

- Root `manifest.json` (`name`, `description`, `preview`, `readme`, `authors`, `tags`,
  no `main`/`usercss`).
- `docs/marketplace-preview.png` (1024², ink + icon + wordmark; square because cards are 1:1).
- Topic `spicetify-apps` added (existing topics kept).
- README/README.ru: Marketplace install section; duplicate badges removed.

Verified after push: raw manifest 200, preview 200, `search/repositories?q=topic:spicetify-apps+user:WhyTunesWorkspace` → 1.

Note: `app/manifest.json` is the Spicetify runtime manifest (with `main`) and must stay separate
from the root Marketplace manifest.

Next steps:

1. ~~Fresh screenshots~~ done in v0.5.1: `docs/screenshot.png` (English UI, My mix wave) and
   `docs/marketplace-preview.png` (1200², ink + icon + wordmark + UI card).
2. Publish `docs/launch-ru.md` (Habr) and `docs/launch-en.md` (Show HN).
3. ~~Pinned feedback issue~~ created after the 0.5.1 release.
4. ~~Scheduled morning wave~~ done in v0.6.0: prompt bar, no autoplay; simple/advanced
   settings with extra mood presets.
5. ~~Shared presets~~ done in v0.7.0: five built-ins, `SW1.` share codes, `presets/` docs.
6. Next: launch/promotion, then the optional local server for a phone.

## Commands

```powershell
# rebuild and apply locally
cd C:\Users\Administrator\wave
Copy-Item "app\*" "$env:APPDATA\spicetify\CustomApps\wave\" -Recurse -Force
spicetify --bypass-admin apply

# package + release
powershell -File .\scripts\package.ps1
git tag vX.Y.Z; git push origin vX.Y.Z   # Actions builds the release
```

## Token-efficiency notes for the next session

- Don't dump whole files/config/HTML into chat; use `grep`/`--jq`/`Select-Object -First`.
- Read large files with offset/limit.
- Avoid screenshots unless visual verification is required.
- Prefer one apply/test cycle per batch of changes.


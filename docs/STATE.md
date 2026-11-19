# Project state (handoff)

Updated: 2026-11-19

## Repo

- **https://github.com/WhyTunesWorkspace/spotwave** (public, MIT)
- Latest release: **v0.5.0** (auto-published by `.github/workflows/release.yml` on `v*` tags)
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

## Pending: Spicetify Marketplace

Research so far (from `spicetify/marketplace` source):

- The Marketplace discovers items by **GitHub topic** (`getTaggedRepos(topic)`), not by a
  curated list.
- For each repo it fetches **`manifest.json` from the repository root**
  (`raw.githubusercontent.com/<user>/<repo>/<branch>/manifest.json`).
- Manifest schema (`src/logic/Schemas.ts`):
  `{ name, description, main?, usercss?, authors[], preview?, readme?, tags[], branch?, schemes?, include? }`.
- Apps tab uses a specific topic вЂ” **still need to confirm** by grepping
  `src/components/Grid.tsx` around the `getTaggedRepos(` call (~line 379).
- Our app manifest lives at `app/manifest.json`, so a **root `manifest.json`** is required,
  plus the repo topic. Need to know how the Apps installer downloads the app (repo archive vs
  `main` path) before adding it.

Next steps:

1. Confirm the Apps topic and install mechanism.
2. Add root `manifest.json` with `name`, `description`, `preview`, `authors`, `tags`.
3. Add the repo topic; verify it appears in Marketplace.
4. Post launch article (`docs/launch-ru.md`) and Show HN (`docs/launch-en.md`).
5. Optional: scheduled morning wave, community mood presets.

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


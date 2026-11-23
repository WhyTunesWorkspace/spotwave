# Changelog

All notable changes to spotwave are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: SemVer.

## [0.8.0] - 2026-11-23

### Added

- **Time of day**: with mood any, the wave leans to the tempo of the clock: quiet at night (~85 BPM),
  airy in the morning (~100), neutral in the day (~120), driving in the evening (~130). A switch in
  settings turns it off; a chosen mood always wins.
- Settings and feedback are saved immediately: the 250 ms debounce used to drop a click
  when the tab was closed right after it.

### Changed

- **Not this one** (close button) is a track-level opinion now: the track is hidden for 45 days and
  down-weighted later, without punishing the artist.
- **Fewer artist repeats**: an artist already in the wave, or heard among the last picks, sinks lower
  instead of only being blocked by the per-artist cap.

## [0.7.1] — 2026-11-22

### Fixed

- **Playlists inside folders are now sources.** The playlist list only read the root of the library,
  so anything kept in a folder was invisible. Folders are now walked recursively (up to 3 levels,
  80 folders per refresh) and their contents are fetched straight from the client rootlist
  service, because `RootlistAPI.getContents()` ignores its arguments.

### Changed

- Playlist chips show the folder path in the tooltip (`Folder / Playlist`).

## [0.7.0] — 2026-11-20

### Added

- **Presets**: Morning, Sad, Focus, Evening and Road in the settings panel — one click applies
  mood, novelty, exploration, diversity, length and the two queue flags.
- **Shareable preset codes**: "Share current" copies an `SW1.` code (versioned base64url JSON)
  and "Apply" restores settings from a pasted code. Nothing leaves the machine.
- `presets/` in the repository documents the built-in values and the format.

## [0.6.1] — 2026-11-20

### Added

- **Sad mood**: low-tempo tracks (55-105 BPM) with a preference for minor keys. It sits in
  the basic mood row and in the morning-wave mood list.
- Candidate fetching asks for more tracks when a mood is active, and narrow moods now top up
  with the closest tempos instead of producing a three-track wave.

## [0.6.0] — 2026-11-20

### Added

- **Morning wave**: a scheduled calm wave. Pick a time, mood and "weekdays only";
  at that time the app shows a "build it?" bar with a time window — nothing starts on its
  own. A sun button in the toolbar builds one on demand.
- **Simple / Advanced settings**: the panel has two modes. Simple keeps sources, mood,
  length, language, "only new" and auto-extend. Advanced adds novelty, diversity,
  exploration, the morning schedule, known tracks, scrobbling and profile import/export.
- Three extra mood presets in advanced mode: Slow (≤90 BPM), Focus (90-125), Fast (140+).

### Changed

- The wave header marks morning waves ("Утренняя волна / Morning wave").
- The morning scheduler only re-renders to surface the prompt; it never autoplays.

## [0.5.2] — 2026-11-20

### Fixed

- Track reasons are stored as source descriptors and translated at render time, so the wave
  queue follows a language switch instead of keeping the old strings. Seed waves ("по треку
  «…»") do the same; existing saved waves keep their text.
- Settings labels can no longer collide with controls: single-line labels ellipsize, and the
  section header wraps instead of overlapping its links on narrow windows.
- Copy: the known-tracks counter now reads "Исключено знакомых треков" / "Known tracks
  excluded".

## [0.5.1] — 2026-11-20

### Added

- **Spicetify Marketplace listing**: root `manifest.json` (no `main`/`usercss`), square
  preview, repo topic `spicetify-apps`, install notes in both READMEs.
- Fresh UI screenshot and a marketplace preview built from it.

### Fixed

- UI language right after a client restart: the locale is retried instead of caching the
  fallback, so the app no longer starts in English on a Russian client.
- Settings and Stats panels are mutually exclusive; settings render as a single list instead
  of a grid that collapsed on narrow windows.

## [0.5.0] — 2026-11-19

### Added

- **Queue filter**: narrow the wave by track title or artist.
- `docs/STATE.md`: a short handoff describing the project state and pending work.

## [0.4.0] — 2026-11-19

### Added

- **Wave from an album** in the context menu (album seeds use GraphQL album tracks).
- **Export / import** of the taste profile, history and settings as JSON.
- **BPM** is shown next to each track, so mood filtering is visible.
- Release automation: pushing a `v*` tag packages the app and publishes a release.
- Issue and pull-request templates.

### Changed

- Docs: technical write-up (`docs/how-it-works.md`), launch kit (`docs/launch-ru.md`,
  `docs/launch-en.md`), roadmap in the README.

## [0.3.0] — 2026-11-19

Brand release: identity, native polish, smarter selection.

### Added

- **Brand identity**: the mark is a W built from a waveform. App icon (512 px), mono and mint
  variants, brand guide with palette, clear space and usage rules (`docs/brand/`).
- The app header uses the brand mark when there is no artwork yet.
- **Onboarding steps** in the empty state: pick sources → build → skip/like.
- Playlist list cache (60 s) — fewer client API calls per generation.

### Changed

- **Album diversity**: no more than two tracks from the same album in one wave.
- Accessibility: action buttons now carry `aria-label`.

## [0.2.1] — 2026-11-19

### Fixed

- Public Windows installer is now pure ASCII: PowerShell 5.1 no longer fails to parse
  non-ASCII characters when the script is fetched with `iwr | iex`.
- The installer exits with code 0 after a successful patch (Spicetify itself returns 1).
- More Spicetify CLI locations are searched automatically.

## [0.2.0] — 2026-11-19

Global-readiness release: bilingual UI, native redesign, one-line install, real releases.

### Added

- **Bilingual UI (Russian / English)** with automatic locale detection and a manual switch
  in Settings. All user-facing strings go through the translation layer.
- **Mood presets** (calm / mid / energetic) filtered by BPM, which the client returns together
  with recommendations via `decorateWithBpmAndKey`.
- **Wave from a track** and **wave by an artist** in the context menu. Artist seeds use GraphQL
  top tracks and a reusable `Волна · Seed` playlist.
- **Pick reason** for every track: source playlist, liked songs, or the seed.
- **Stats panel**: plays, skips, completion rate, average tempo, weekday/hour distribution,
  top artists.
- **ListenBrainz scrobbling** with token storage and validation.
- **Auto-extend**: the wave tops itself up when 3–4 tracks remain.
- **"Only new"** mode: excludes tracks from playlists, liked songs and recent plays by URI and
  by normalized "title + artist".
- **One-line installers** for Windows (`install.ps1`) and macOS/Linux (`install.sh`).
- CI workflow, packaging script, CONTRIBUTING guide, English README.

### Changed

- **Redesigned UI to match native Spotify**: playlist-style header with artwork, green play
  button, filter chips, 56 px track rows, SVG icons. No more gradient orb or emoji.
- Playback is now a **playlist context** (`Волна · Live`), so native next/prev, queue and
  shuffle work. The previous per-track queue approach was unreliable.
- Sidebar label is now **Wave**.

### Fixed

- Tracks no longer fail to switch with player buttons.
- Cover art and durations render correctly for recommendation items.
- The `t` translation helper no longer collides with local track variables.

## [0.1.0] — 2026-11-19

First working MVP.

### Added

- Spicetify custom app with "My mix" and playlist-based waves.
- Skip/completion tracking through a startup extension.
- Like / hide track / mute artist feedback.
- Save wave as a playlist.
- "Only new" filter and live playlist playback.

[0.5.0]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.5.0
[0.4.0]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.4.0
[0.3.0]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.3.0
[0.2.1]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.2.1
[0.2.0]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.2.0
[0.1.0]: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.1.0

# Launch kit (English)

Ready-to-post copy for Show HN, Reddit and the Spicetify community.

## Show HN

**Title:** Show HN: spotwave – endless personal radio inside Spotify, without the Web API

**Body:**

I missed Yandex Music's "My Wave" after moving to Spotify. Daylist ignores most of what I
actually play, and playlist radio is just shuffle with a few recommendations.

Since February 2026 the Spotify Web API is effectively closed to personal projects:
development-mode apps require a Premium owner, extended quota is companies-only, and
`/recommendations`, `/audio-features`, related artists and top tracks are deprecated for new
apps. So I built spotwave as a [Spicetify](https://spicetify.app) app that runs inside the
desktop client and uses the same internal services the UI does. No tokens, no OAuth, no
credentials leave the machine.

How it works:

- Candidate generation uses the client's playlist-context recommender
  (`PlaylistAPI.getRecommendedTracks`), which also returns BPM and key — a replacement for the
  closed audio features.
- Ranking is artist affinity (completions + likes − skips) × freshness × novelty, with
  per-artist and per-album caps and exploration noise.
- Skips are captured by a startup extension (`songchange`/`onprogress`), so it learns even when
  the tab is closed.
- Playback writes the wave into a service playlist and plays it as a context, which makes
  native next/prev/shuffle/queue work. The obvious queue API approach silently drops items.

Features: waves from likes / playlists / tracks / artists / albums, "only new" filter,
BPM mood presets, auto-extend, why-this-track reasons, stats, export/import of the profile,
optional ListenBrainz scrobbling, RU/EN UI.

Install (Spotify desktop + Spicetify required):

```
iwr -useb https://raw.githubusercontent.com/WhyTunesWorkspace/spotwave/main/scripts/install.ps1 | iex
```

Repo: https://github.com/WhyTunesWorkspace/spotwave (MIT)

Happy to answer questions about the internal APIs, the ranking, or the packaging. Feedback on
what breaks on your setup is very welcome.

## Reddit / Discord blurb

**spotwave — endless personal radio for Spotify (free accounts, no API keys).**

Built as a Spicetify app. Learns from skips, builds waves from your playlists, tracks, artists
or albums, filters out what you already know, and plays as a real playlist context so the
native controls work. RU/EN, MIT.

→ https://github.com/WhyTunesWorkspace/spotwave

## Spicetify Marketplace submission notes

Prepared package: `dist/spotwave.zip` from `scripts/package.ps1` (contains `app/`, `scripts/`,
README, LICENSE, CHANGELOG).

Before submitting:

1. Confirm `manifest.json` has a name, icon, and version.
2. Include a short description (one sentence) and 1–2 screenshots (`docs/screenshot.png`).
3. Note that the app requires no external credentials and sends no telemetry.
4. If the marketplace requires a PR with a metadata entry, add the repository URL and the
   latest release asset, not a branch archive.

## Posting checklist

- [ ] Release is published and the one-line installer works from a clean machine.
- [ ] README has the screenshot above the fold.
- [ ] A pinned issue collects feedback.
- [ ] Cross-post to the Spicetify Discord and the Russian-speaking Spotify community.
- [ ] Reply to every bug report in the first 48 hours — that is what turns a launch into a
      project.

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
BPM mood presets (calm, sad, mid, energetic, plus slow/focus/fast), simple and advanced
settings, five one-click presets with shareable `SW1.` codes, scheduled morning wave (a
prompt, not autoplay), auto-extend, why-this-track reasons, stats, export/import of the
profile, optional ListenBrainz scrobbling, RU/EN UI.

Install (Spotify desktop + Spicetify required):

```
iwr -useb https://raw.githubusercontent.com/WhyTunesWorkspace/spotwave/main/scripts/install.ps1 | iex
```

Also listed in **Spicetify Marketplace → Apps** (the card links here; the installer above is
still the install step).

Repo: https://github.com/WhyTunesWorkspace/spotwave (MIT)

Happy to answer questions about the internal APIs, the ranking, or the packaging. Feedback on
what breaks on your setup is very welcome.

## Reddit / Discord blurb

**spotwave — endless personal radio for Spotify (free accounts, no API keys).**

Built as a Spicetify app. Learns from skips, builds waves from your playlists, tracks, artists
or albums, filters out what you already know, and plays as a real playlist context so the
native controls work. New in 0.7: simple/advanced settings, sad mood, a scheduled morning
wave that waits for a click, and presets you can share as an `SW1.` code. RU/EN, MIT.

→ https://github.com/WhyTunesWorkspace/spotwave

## Spicetify Marketplace listing (live)

Listed since 2026-11-19. How it works, verified in the Marketplace source:

- Discovery: GitHub topic `spicetify-apps`.
- Metadata: root `manifest.json` with `name`, `description`, `preview`, `readme`, `authors`,
  `tags` — and deliberately **no `main`/`usercss`**, which would reclassify it as an
  extension/theme.
- The card links to this repo; Marketplace does not install custom apps itself. The repo's
  one-line installer is the install path.

When updating the card: edit the root `manifest.json` or replace
`docs/marketplace-preview.png` and push to `main`. GitHub's topic search and the raw CDN each
cache for a few minutes.

## Telegram blurb (RU)

**spotwave — бесконечное персональное радио внутри Spotify.**

Приложение для Spicetify: волна собирается из лайков, плейлистов, трека, артиста или
альбома, учится на скипах, фильтрует знакомое и играется как обычный плейлист — штатные
next/prev и очередь работают. Без API-ключей и Premium-API, аккаунт может быть free.

Что нового в 0.7: режимы «Просто/Подробно», грустное настроение, утренняя волна по
расписанию (показывает кнопку, сама не включает музыку) и пресеты, которыми можно
поделиться кодом `SW1.`.

Репозиторий: https://github.com/WhyTunesWorkspace/spotwave (MIT)
Установка — одной строкой из README; в Spicetify Marketplace: Apps → spotwave.

## Posting checklist

- [x] Release is published (v0.5.0) and the one-line installer works from a clean machine.
- [x] Marketplace listing is live (`topic:spicetify-apps`, root manifest).
- [ ] README has a fresh screenshot above the fold.
- [ ] A pinned issue collects feedback.
- [ ] Cross-post to the Spicetify Discord and the Russian-speaking Spotify community.
- [ ] Reply to every bug report in the first 48 hours — that is what turns a launch into a
      project.

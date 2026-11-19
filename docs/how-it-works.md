# How spotwave works

A technical write-up of the engine, the constraints, and the two or three tricks that make it work.

## The constraint: the Web API is closed

Since February 2026, Spotify requires the **app owner** to have an active Premium subscription
for any app in development mode, and extended quota mode is only granted to registered
companies. For a personal, free-account project the official OAuth path is effectively dead.
On top of that, the endpoints a recommender needs were deprecated for new apps:

- `/recommendations`
- `/audio-features` and `/audio-analysis`
- `/artists/{id}/related-artists`
- `/artists/{id}/top-tracks`
- batch fetches (`/tracks?ids=…`), `popularity`, `/browse/*`

So spotwave does not use the Web API at all. It runs **inside the Spotify client** as a
Spicetify custom app and talks to the same internal services the UI already uses.
No tokens are extracted, no credentials are stored.

## Architecture

```
app/
  index.js       React UI + recommendation engine
  extension.js   background tracker, context-menu items, scrobbling
  style.css
  manifest.json
```

`index.js` is loaded when the Wave tab is opened; `extension.js` is a Spicetify extension and
runs from client start. The two communicate through `localStorage` only:

| Key | Purpose |
|---|---|
| `wave.v1` | settings, artist/track profile, history, current wave |
| `wave.events` | append-only play/skip events produced by the extension |
| `wave.known.v2` | cached "known tracks" set (likes + playlists + recent), 6 h TTL |
| `wave.scrobble.v1` | optional scrobble queue |

The app drains `wave.events` every 8 seconds and folds events into the profile. This is why
learning works when the tab is closed: the extension keeps recording.

## Candidate generation

The only recommendation primitive available to a client is playlist-context recommendation:

```js
Spicetify.Platform.PlaylistAPI.getRecommendedTracks(contextUri, skipIds, limit, {
  decorateWithBpmAndKey: true
})
```

It returns full track objects plus **BPM and musical key** — the closest thing to the closed
audio features. Liked songs are addressable as a special playlist URI, so "My mix" is just
another playlist context. Track/artist/album seeds are turned into a temporary `Волна · Seed`
playlist, which is then used as a context.

## Ranking

For every candidate:

```
score = Σ_artists weight × [0.55·tanh((completes − 0.7·skips)/3) + 0.25·tanh(likes/2)]
      − fatigue(artist played < 2 h / < 12 h)
      + track bonus (likes) − track fatigue (< 24 h / < 7 d)
      + novelty bonus for unseen artists
      − penalties (long tracks, slowed/remix/karaoke)
      + exploration noise
```

Selection is greedy over the sorted pool with two constraints: at most `diversity` tracks per
artist and at most two per album, and no artist twice in a row. The window of candidates is
sampled from the top 7–12, which keeps some variety without destroying the ranking.

"Only new" removes anything present in likes, playlists or recent plays, matched by URI and by
a normalized `artist|title` key (to catch remasters and re-releases).

Mood presets are plain BPM ranges: calm ≤ 105, mid 95–140, energetic ≥ 125. If too few tracks
land in the range, unknown-BPM tracks are admitted as a fallback.

## Playback: the queue is a lie

The obvious approach — play the first track and `addToQueue` the rest — fails on the current
client: the internal queue drops items while the context is switching, and the player ends up
with a single-track context where next/prev do nothing.

spotwave instead writes the wave into a service playlist **`Волна · Live`** and calls
`Player.playUri(liveUri)`. The player treats it as a normal playlist context, so native next,
previous, shuffle, repeat and the queue panel all behave correctly. Rewriting the playlist and
re-entering the context with `{ skipTo: { uri } }` is used for "Extend".

## Auto-extend

A `songchange` listener checks whether the current track is within the last 4 of the live wave.
If so, it generates another batch, appends it to the wave, enqueues it (arrays of 2+ items work
reliably), and refreshes the live playlist in the background. A 45-second cooldown prevents
loops.

## Stats

`recent` keeps the last 400 events with `{ uri, at, played, dur }`. From those and the BPM map
we compute plays, skips, completion rate, weekday/hour histograms, top artists and an average
tempo. No event leaves the machine unless ListenBrainz scrobbling is enabled.

## Failure modes

- Internal methods change between Spotify releases; every call is wrapped in `try/catch`,
  and the UI degrades instead of crashing.
- If GraphQL top tracks are unavailable, artist seeds fail gracefully.
- If the live playlist is deleted, it is recreated on the next wave.
- A Spotify update can break the patch; `scripts/install.ps1` / `install.sh` re-apply it.

## What it deliberately does not do

- No scraping of the web player, no token extraction, no credential storage.
- No audio downloading, no ad-blocking, no content modification.
- No network requests except the optional ListenBrainz submission.

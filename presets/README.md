# Presets

Starting points for **Settings → Presets**. Five are built into the app; the same values
live here so they can be reviewed, forked and discussed.

| File | What it is for |
|---|---|
| `morning.json` | calm start of the day |
| `sad.json` | low tempo, minor keys |
| `focus.json` | one artist at a time, long queue |
| `evening.json` | slow, wider artist range |
| `road.json` | energetic, repeats music you know |

## Format

```json
{
  "name": "Evening",
  "description": "Slow, wider artist range, a bit more randomness.",
  "settings": {
    "mood": "slow",
    "novelty": 0.55,
    "explore": 0.45,
    "diversity": 3,
    "length": 30,
    "onlyNew": true,
    "autoExtend": true
  }
}
```

- `mood`: `any`, `calm`, `sad`, `slow`, `focus`, `mid`, `energetic`, `fast`.
- `novelty`, `explore`: `0..1`.
- `diversity`: `1..5` tracks per artist.
- `length`: `10..60` tracks per build.
- `onlyNew`: exclude tracks already in likes, playlists and recent plays.
- `autoExtend`: top up the queue when the wave ends.

## Sharing

In **Settings → Advanced → Presets** press **Share current**. The app puts a code like
`SW1.eyJ2IjoxLCJtb29k...` on the clipboard (or into the field if the clipboard is blocked).
Anyone can paste it into the same field and press **Apply** — no account, no server, the code
is just versioned base64url JSON.

To propose a new built-in preset, open an issue with the name, the mood and the values, or a
pull request adding a file to this folder.

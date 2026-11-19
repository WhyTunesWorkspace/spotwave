# spotwave — brand

## Logo

The mark is a **W built from a waveform**: three peaks and two valleys on a 24 × 24 grid.
It reads as the first letter of *Wave* and as an audio waveform at the same time.
Everything is a single 2.4 px stroke with round caps, so it stays legible at 16–24 px.

| File | Use |
|---|---|
| `logo-mark.svg` | monochrome, inherits `currentColor` (sidebar, UI) |
| `logo-mark-mint.svg` | mint version on dark backgrounds |
| `app-icon.svg` | 512 px app icon: mint→deep gradient, ink mark |
| `app-icon-512.png` | raster app icon (GitHub, marketplace) |
| `sidebar-icon.png` | reference render at client scale |

**Clear space:** at least 0.5 × the mark height on every side.
**Minimum size:** 16 px. Below that use the app icon, not the mark.
**Do not:** stretch, add outlines, rotate, place the mint mark on light backgrounds,
or recolor it to Spotify green (green belongs to Spotify's own UI).

## Palette

| Token | Hex | Use |
|---|---|---|
| Mint | `#2BE5A6` | brand accent, app icon |
| Deep | `#0E7A52` | gradient end, hover |
| Ink | `#08080A` | backgrounds |
| Paper | `#F2F2F2` | primary text |
| Gray | `#9A9A9A` | secondary text |
| Blood | `#C1121F` | rare accent, dividers, danger |

The in-client UI intentionally uses Spotify's own variables (`--spice-*`), so it blends
with the native theme. The mint/ink palette is for brand assets, docs and the repo.

## Typography

- Display: **Arial Bold / Segoe UI Black**, tight tracking, uppercase.
- UI: Spotify's font stack.
- Labels and code: **Consolas / JetBrains Mono**, uppercase, wide tracking.

## Voice

Short, technical, no hype. Prefer verbs over adjectives:
“Build wave”, “Only new”, “Skip learning” — not “AI-powered magic”.
Russian and English are first-class; no third language in the product UI.

## Assets checklist

- [x] mark (mono + mint)
- [x] app icon 512
- [x] README banner
- [x] GitHub profile banner + character strip (monochrome)
- [x] animated waveform GIF
- [ ] social preview upload (GitHub UI only)

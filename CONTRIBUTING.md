# Contributing to spotwave

Thanks for wanting to help. spotwave is a Spicetify custom app: plain JavaScript, no build step,
no bundler. If you can edit `app/index.js`, you can ship a change.

## Development setup

1. Install Spotify desktop + [Spicetify](https://spicetify.app).
2. Clone the repo and install the app from source:

   ```powershell
   git clone https://github.com/WhyTunesWorkspace/spotwave.git
   cd spotwave
   powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
   ```

   On macOS/Linux: `bash scripts/install.sh`.

3. Open Spotify → wave icon in the top-left. DevTools: `Ctrl+Shift+I` (Windows),
   `Cmd+Opt+I` (macOS). Console filter: `[wave]`.

After editing the app, re-apply:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -NoLaunch
```

or `spicetify apply` with Spotify closed.

## Checks before a PR

```bash
node --check app/index.js
node --check app/extension.js
node -e "JSON.parse(require('fs').readFileSync('app/manifest.json','utf8'))"
```

CI runs the same on every push.

## Code guidelines

- ES5-style JavaScript (`var`, `function`) — the client's runtime is old and the app has no
  transpiler. No JSX: use `Spicetify.React.createElement` through the `h()` helper.
- All user-facing strings go through `T("русская строка")` and must have an English entry in
  the `I18N.en` dictionary (Russian is the key).
- Do not localize service playlist names (`Волна · Live`, `Волна · Seed`, `Волна · ` prefix) —
  they are used for lookup.
- New settings go into `DEFAULTS.settings` and are merged in `loadState()`.
- Keep `try/catch` around client API calls: internal methods change between Spotify versions.

## Reporting bugs

Include:

- Spotify version (Settings → About), Spicetify version (`spicetify -v`);
- OS;
- what you did, what you expected, what happened;
- console output filtered by `[wave]`.

## Ideas / feature requests

Open an issue with the `enhancement` label. Roadmap is in [CHANGELOG.md](CHANGELOG.md) and
the pinned issue.

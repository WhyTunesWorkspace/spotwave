# Telegram channel

**Live:** https://t.me/whyspotwave (`-1004277220561`, channel "spotwave").

## What is already done

- Pinned intro post (installation, what the channel is for).
- Release post for 0.7.0.
- "How it works" post: internal APIs, BPM/key instead of audio features, playlist context.

## Channel settings (applied 2026-11-22)

The CLI has no dedicated command for chat settings, but TDLib is reachable through
`telegram-agent eval`, so both are set from the terminal:

- **Description** (203 chars):

  > Бесконечное персональное радио внутри Spotify. Приложение для Spicetify: волны из лайков, плейлистов, треков и артистов, обучение на скипах, утренние волны и пресеты. RU/EN. Без API-ключей и Premium-API.

- **Avatar:** `docs/brand/app-icon-512.png` via `setChatPhoto` + `inputChatPhotoStatic`.

Notes:

- `eval` receives code as an argv string, so PowerShell mangles quotes and Cyrillic.
  Write the code to a UTF-8 `.js` file and use `eval --file`, or inline only ASCII with
  single quotes.
- `getChat` in this TDLib build does not return `description`; read it with
  `telegram-agent info <chat>` instead.
- Channel photo changes leave a `chatchangephoto` service message in the channel — expected.

## Media

Text posts go through `action send`. Files are not covered by the CLI's send path, so
attach them from the client.

Planned: a short screen recording of building a wave (GIF), 2–3 stills of the app in
EN and RU, and the brand card `docs/marketplace-preview.png` for the pinned post.

## Pinned intro post

```
spotwave — бесконечное персональное радио внутри Spotify.

Это приложение для Spicetify: волна собирается из ваших лайков, плейлистов, трека, артиста или альбома, учится на скипах и играется как обычный плейлист — штатные next/prev, очередь и шаффл работают.

Без API-ключей и OAuth. Free-аккаунт подходит.

Установка: https://github.com/WhyTunesWorkspace/spotwave
В Spicetify Marketplace: Apps → spotwave.

Здесь: релизы, короткие заметки о том, как это работает, и ответы на вопросы.
```

## Post: 0.7.0

```
spotwave 0.7 — что нового:

— режимы настроек «Просто» и «Подробно»
— грустное настроение: низкий BPM + минорные тональности
— утренняя волна по расписанию: показывает кнопку, сама музыку не включает
— пресеты (Утро, Грусть, Фокус, Вечер, Дорога) и код SW1., которым можно поделиться

Релиз: https://github.com/WhyTunesWorkspace/spotwave/releases/tag/v0.7.0
```

## Post: how it works (short)

```
Как это работает без официального API:

Spotify desktop — это CEF-приложение. Spicetify открывает доступ к тем же внутренним методам, которыми пользуется сам интерфейс: рекомендации по контексту плейлиста, метаданные, плеер.

Вместе с треками клиент отдаёт BPM и тональность — это заменяет закрытые audio features. Дальше ранжирование по аффинити артиста, свежести и новизне, фильтры «только новое» и настроения по темпу.

Волна пишется в служебный плейлист и играется как контекст — поэтому нативные кнопки и очередь работают, а не ломаются.
```

## Rules

- Only spotwave: releases, tips, changelog, user questions.
- No personal playlists, no listening history, no screenshots with account data.
- One post per release, plus at most one tip per week.
- Cross-link only the repository and the Marketplace card.

# Telegram channel

A dedicated channel for spotwave (not the personal one).

## Create it (once, ~1 minute)

1. Telegram → **New Channel**.
2. Name: `spotwave`.
3. Description (RU, 255 chars max):

   > Бесконечное персональное радио внутри Spotify. Приложение для Spicetify: волны из лайков, плейлистов, треков и артистов, обучение на скипах, утренние волны и пресеты. RU/EN. Без API-ключей и Premium-API.

4. Public username: `@spotwave_app` (если занят — `@spotwave_radio`, `@spotwave_ru`).
5. Avatar: `docs/brand/app-icon-512.png`.
6. Tell me the `@username` — the rest I can post and pin myself from this account.

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

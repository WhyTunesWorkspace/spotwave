/* Волна — персональное радио для Spotify
 * Spicetify custom app. Работает на клиентской сессии, ничего не патчит в API.
 */
"use strict";

var React = Spicetify.React;
var h = React.createElement;
var PF = Spicetify.Platform;

var ICONS = {
  play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>',
  heart: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 13.5S2.3 10.2 2.3 6.7A3.2 3.2 0 0 1 8 4.6a3.2 3.2 0 0 1 5.7 2.1c0 3.5-5.7 6.8-5.7 6.8z"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>',
  ban: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>',
  more: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="13" cy="8" r="1.4"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};

function icon(name) {
  return h("span", { className: "wave-svg", dangerouslySetInnerHTML: { __html: ICONS[name] || "" } });
}

/* Логотип: W, собранная из звуковой волны. */
function logoMark(size, className) {
  return h("svg", {
    className: className || "",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, h("path", { d: "M3 6.5L7.5 17.5L12 9L16.5 17.5L21 6.5" }));
}

var LS_KEY = "wave.v1";
var HOUR = 3600000;
var DAY = 86400000;

/* Служебные имена не локализуются: по ним ищутся плейлисты. */
var LIVE_NAME = "Волна · Live";
var SEED_NAME = "Волна · Seed";
var SNAP_PREFIX = "Волна · ";

var DEFAULTS = {
  settings: {
    novelty: 0.45,
    explore: 0.35,
    diversity: 2,
    length: 30,
    clean: false,
    onlyNew: true,
    mood: "any",
    autoExtend: true,
    scrobbleEnabled: false,
    scrobbleToken: "",
    lang: "auto"
  },
  artists: {},
  tracks: {},
  bans: {},
  recent: [],
  wave: null,
  sources: null,
  trackNames: {},
  artistNames: {},
  bpm: {},
  knownCount: 0
};

/* ------------------------------ state ------------------------------ */

function loadState() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    var parsed = JSON.parse(raw);
    return {
      settings: Object.assign({}, DEFAULTS.settings, parsed.settings || {}),
      artists: parsed.artists || {},
      tracks: parsed.tracks || {},
      bans: parsed.bans || {},
      recent: parsed.recent || [],
      wave: parsed.wave || null,
      sources: parsed.sources || null,
      trackNames: parsed.trackNames || {},
      artistNames: parsed.artistNames || {},
      bpm: parsed.bpm || {},
      knownCount: parsed.knownCount || 0
    };
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

var S = loadState();

/* ------------------------------ i18n ------------------------------ */

var I18N = {
  en: {
    " ч ": " h ",
    " мин": " min",
    "Без названия": "Untitled",
    "Плейлист": "Playlist",
    "Не удалось создать плейлист": "Could not create a playlist",
    "Не удалось создать плейлист «": "Could not create playlist «",
    "Всё, что нашлось, уже есть в твоих плейлистах и лайках. Отключи «Только новое» или добавь источники.":
      "Everything found is already in your playlists and liked songs. Turn off “Only new” or add sources.",
    "Spotify не вернул рекомендаций. Попробуй другой источник.": "Spotify returned no recommendations. Try another source.",
    "из твоих лайков": "from your liked songs",
    "из «": "from «",
    "подобрано для тебя": "picked for you",
    "Волна продолжается: +": "Wave continues: +",
    "Волна запомнила: нравится": "Wave noted: you like it",
    "Артист убран из волны": "Artist removed from the wave",
    "Артист": "Artist",
    "спокойное": "calm",
    "среднее": "mid",
    "энергичное": "energetic",
    "Пн": "Mon", "Вт": "Tue", "Ср": "Wed", "Чт": "Thu", "Пт": "Fri", "Сб": "Sat", "Вс": "Sun",
    "Прослушано": "Plays",
    "Скипов": "Skips",
    "Дослушано": "Finished",
    "Средний темп": "Avg tempo",
    "По дням недели": "By weekday",
    "По часам": "By hour",
    "Топ артистов": "Top artists",
    "пока нет данных — послушай волну": "no data yet — play the wave",
    "Нравится": "Like",
    "Убрать из волны": "Remove from wave",
    "Больше не этот артист": "Never this artist",
    "Играть": "Play",
    "Мой микс": "My mix",
    "Оставь хотя бы один источник": "Keep at least one source",
    "Обновляю список знакомого…": "Refreshing known tracks…",
    "Знакомых треков: ": "Known tracks: ",
    "Укажи токен ListenBrainz": "Enter a ListenBrainz token",
    "токен принят": "token accepted",
    "ListenBrainz не принял токен": "ListenBrainz rejected the token",
    "Не удалось проверить токен: сеть или CORS": "Could not verify the token: network or CORS",
    "Собираю рекомендации…": "Collecting recommendations…",
    "Пустая волна. Попробуй другой источник.": "Empty wave. Try another source.",
    "Готовлю очередь…": "Preparing the queue…",
    "Запускаю…": "Starting…",
    "Волна собрана: ": "Wave ready: ",
    " треков": " tracks",
    "Добавляю…": "Adding…",
    "Не удалось подобрать новые треки.": "Could not find new tracks.",
    "Продлеваю…": "Extending…",
    "Готовлю волну…": "Preparing the wave…",
    "по артисту «": "by artist «",
    "по артисту": "by artist",
    "по альбому «": "from album «",
    "по альбому": "from album",
    "по треку «": "from track «",
    "по треку": "from track",
    "Не удалось найти треки для этой волны": "Could not find tracks for this wave",
    "Не удалось собрать волну по этому seed": "Could not build a wave from this seed",
    "Волна ": "Wave ",
    "Сохраняю…": "Saving…",
    "Плейлист «": "Playlist «",
    "» готов — он уже на телефоне": "» is ready — it's already on your phone",
    "Радио": "Radio",
    "Волна": "Wave",
    "бесконечный поток по твоему вкусу": "an endless stream tuned to your taste",
    "Слушать": "Play",
    "Новая волна": "New wave",
    "Собрать волну": "Build wave",
    "Продлить": "Extend",
    "Сохранить в плейлист": "Save to playlist",
    "Настройки": "Settings",
    "Источники": "Sources",
    "Скрыть статистику": "Hide stats",
    "Статистика": "Stats",
    "Скрыть настройки": "Hide settings",
    "загружаю плейлисты…": "loading playlists…",
    "Выбери один плейлист — получишь волну в его настроении. Несколько — микс.":
      "Pick one playlist for a wave in its mood. Pick several for a mix.",
    "Настроение": "Mood",
    "Любое": "Any",
    "Спокойное": "Calm",
    "Среднее": "Mid",
    "Энергичное": "Energetic",
    "Новизна": "Novelty",
    "Разнообразие": "Diversity",
    "Длина": "Length",
    "Эксперимент": "Exploration",
    "Только новое — не брать треки из моих плейлистов и лайков":
      "Only new — skip tracks from my playlists and liked songs",
    "Автопродление — добирать треки, когда волна заканчивается":
      "Auto-extend — keep adding tracks as the wave ends",
    "Исключаю знакомых треков: ": "Excluding known tracks: ",
    "Список знакомых треков соберётся при первой генерации": "Known tracks will be collected on the first run",
    "обновить": "refresh",
    "Скробблить в ListenBrainz — история и рекомендации вне Spotify":
      "Scrobble to ListenBrainz — history beyond Spotify",
    "токен ListenBrainz": "ListenBrainz token",
    "Проверить": "Check",
    "Токен: listenbrainz.org/settings → API token. Учитываются треки, дослушанные хотя бы наполовину.":
      "Token: listenbrainz.org/settings → API token. Tracks played at least half-way are submitted.",
    "Очередь волны": "Wave queue",
    "сейчас: ": "now: ",
    "Здесь появится волна": "Your wave will appear here",
    "Нажми «Собрать волну» — Spotify подберёт треки по твоим лайкам и плейлистам, а Волна запомнит, что ты слушаешь и что пролистываешь.":
      "Hit “Build wave” — Spotify will pick tracks from your liked songs and playlists, and Wave will learn what you play and skip.",
    "прослушано: ": "played: ",
    " · скипов: ": " · skips: ",
    " · артистов: ": " · artists: ",
    "Волна учится на скипах и лайках": "Wave learns from skips and likes",
    "Волна по плейлисту": "Wave from this playlist",
    "Волна по этому треку": "Wave from this track",
    "Волна по исполнителю": "Wave by this artist",
    "Выбери источники — лайки или плейлисты": "Pick sources — liked songs or playlists",
    "Собери волну кнопкой выше": "Build a wave with the button above",
    "Скипай и лайкай — Волна подстроится": "Skip and like — Wave adapts",
    "Экспорт данных": "Export data",
    "Импорт": "Import",
    "Профиль вкуса, история и настройки — в JSON": "Taste profile, history and settings as JSON",
    "Данные экспортированы": "Data exported",
    "Данные импортированы": "Data imported",
    "Не удалось прочитать файл": "Could not read the file",
    "Темп": "Tempo",
    "Язык": "Language",
    "Авто": "Auto"
  }
};

var LANG_CACHE = null;

function detectLang() {
  var pref = (S.settings && S.settings.lang) || "auto";
  if (pref === "ru" || pref === "en") return pref;
  try {
    var loc = Spicetify.Locale && Spicetify.Locale.getLocale ? Spicetify.Locale.getLocale() : "";
    if (loc) return /^ru/i.test(loc) ? "ru" : "en";
  } catch (e) {}
  var nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return /^ru/i.test(nav) ? "ru" : "en";
}

function T(s) {
  if (!LANG_CACHE) LANG_CACHE = detectLang();
  if (LANG_CACHE === "ru") return s;
  var v = I18N.en[s];
  return v == null ? s : v;
}
var saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }, 250);
}

var listeners = new Set();
function subscribe(fn) { listeners.add(fn); return function () { listeners.delete(fn); }; }
function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

function useStore() {
  var pair = React.useState(0);
  var setTick = pair[1];
  React.useEffect(function () {
    return subscribe(function () { setTick(function (v) { return v + 1; }); });
  }, []);
}

/* ------------------------------ helpers ------------------------------ */

function now() { return Date.now(); }

function trackArtists(t) {
  return (t && t.artists ? t.artists : []).map(function (a) { return a && a.uri; }).filter(Boolean);
}

function primaryArtist(t) {
  var a = trackArtists(t);
  return a.length ? a[0] : "unknown";
}

function isBanned(uri) {
  var b = S.bans[uri];
  if (!b) return false;
  if (b.until && b.until < now()) { delete S.bans[uri]; return false; }
  return true;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function moodRange(mood) {
  if (mood === "calm") return [0, 105];
  if (mood === "mid") return [95, 140];
  if (mood === "energetic") return [125, 400];
  return null;
}

function buildOpts(length) {
  return {
    length: length || S.settings.length,
    novelty: S.settings.novelty,
    explore: S.settings.explore,
    diversity: S.settings.diversity,
    clean: S.settings.clean,
    onlyNew: S.settings.onlyNew,
    mood: S.settings.mood
  };
}

function rememberMeta(tracks) {
  (tracks || []).forEach(function (t) {
    if (t.uri && t.name) S.trackNames[t.uri] = t.name;
    if (typeof t.bpm === "number") S.bpm[t.uri] = t.bpm;
    (t.artists || []).forEach(function (a) {
      if (a.uri && a.name) S.artistNames[a.uri] = a.name;
    });
  });
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return "";
  var total = Math.round(ms / 1000);
  var m = Math.floor(total / 60);
  var s = total % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function totalDurationText(ms) {
  if (!ms) return "";
  var m = Math.round(ms / 60000);
  var hrs = Math.floor(m / 60);
  m = m % 60;
  if (!hrs) return m + T(" мин");
  return m ? hrs + T(" ч ") + m + T(" мин") : hrs + T(" ч ");
}

function normalizeImage(url) {
  if (!url) return "";
  if (url.indexOf("spotify:image:") === 0) return "https://i.scdn.co/image/" + url.slice("spotify:image:".length);
  return url;
}

function normalizeItem(x) {
  if (!x) return null;
  var album = x.album || {};
  var images = album.images || [];
  var cover = "";
  if (images.length) cover = normalizeImage(images[0].url);
  else if (album.imageUrl) cover = normalizeImage(album.imageUrl);
  else if (album.largeImageUrl) cover = normalizeImage(album.largeImageUrl);
  var artists = (x.artists || []).map(function (a) {
    return { uri: a.uri || (a.id ? "spotify:artist:" + a.id : ""), name: a.name || a.displayName || "" };
  });
  var dur = 0;
  if (typeof x.duration === "number") dur = x.duration;
  else if (x.duration) dur = x.duration.milliseconds || x.duration.totalMilliseconds || 0;
  if (!dur) dur = x.durationMs || x.duration_ms || 0;
  return {
    uri: x.uri || (x.id ? "spotify:track:" + x.id : ""),
    name: x.name || T("Без названия"),
    artists: artists,
    album: { uri: album.uri || "", name: album.name || "", image: cover },
    durationMs: dur,
    explicit: !!(x.isExplicit || x.explicit),
    isLocal: !!x.isLocal
  };
}

function trackKey(t) {
  var name = (t.name || "").toLowerCase().replace(/\s*[\(\[].*?[\)\]]\s*/g, "").replace(/[^a-zа-яё0-9]+/gi, "");
  var artist = (t.artists && t.artists[0] ? t.artists[0].name : "").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "");
  return artist + "|" + name;
}

function toSet(arr) {
  var o = {};
  (arr || []).forEach(function (x) { if (x) o[x] = 1; });
  return o;
}

/* ------------------------------ api ------------------------------ */

var KNOWN_CACHE = null;
var KNOWN_TTL = 6 * HOUR;
var PLAYLIST_CACHE = { at: 0, list: [] };
var PLAYLIST_TTL = 60 * 1000;

var api = {
  likedContext: function () {
    try { return PF.LibraryAPI._likedSongsUri || "spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ"; }
    catch (e) { return "spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ"; }
  },

  allPlaylists: async function (force) {
    if (!force && PLAYLIST_CACHE.list.length && now() - PLAYLIST_CACHE.at < PLAYLIST_TTL) {
      return PLAYLIST_CACHE.list;
    }
    var r = await PF.RootlistAPI.getContents();
    var items = (r && r.items) || [];
    var list = items
      .filter(function (i) { return i && i.type === "playlist" && i.uri && !i.isNotFound; })
      .map(function (i) { return { uri: i.uri, name: i.name || T("Плейлист") }; });
    PLAYLIST_CACHE = { at: now(), list: list };
    return list;
  },

  /* Для интерфейса: служебные плейлисты Волны не показываем как источники. */
  playlists: async function () {
    var list = await api.allPlaylists();
    return list.filter(function (p) { return p.name.indexOf(SNAP_PREFIX) !== 0; });
  },

  artistTopTracks: async function (artistUri) {
    var r = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryArtistOverview, {
      uri: artistUri,
      locale: "en",
      includePrerelease: true
    });
    var a = r && r.data && r.data.artistUnion;
    var items = (a && a.discography && a.discography.topTracks && a.discography.topTracks.items) || [];
    var uris = items
      .map(function (it) { return it && it.track && it.track.uri; })
      .filter(Boolean);

    if (!uris.length) {
      var found = (JSON.stringify(items).match(/spotify:track:[A-Za-z0-9]{22}/g) || []);
      uris = found.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    }

    return {
      uris: uris.slice(0, 10),
      name: (a && a.profile && a.profile.name) || ""
    };
  },

  recs: async function (contextUri, skipIds, limit) {
    var r = await PF.PlaylistAPI.getRecommendedTracks(contextUri, skipIds || [], limit, { decorateWithBpmAndKey: true });
    return (r || []).map(function (x) {
      var t = normalizeItem(x);
      if (t && typeof x.bpm === "number") t.bpm = x.bpm;
      return t;
    }).filter(function (t) {
      return t && t.uri && t.uri.indexOf("spotify:track:") === 0 && !t.isLocal;
    });
  },

  /* Всё, что у пользователя уже есть: лайки + содержимое своих плейлистов.
   * Кэшируется на 6 часов, чтобы не дёргать API на каждую генерацию. */
  known: async function (force) {
    if (!force && KNOWN_CACHE && now() - KNOWN_CACHE.at < KNOWN_TTL) return KNOWN_CACHE;

    if (!force) {
      try {
        var raw = localStorage.getItem("wave.known.v2");
        if (raw) {
          var p = JSON.parse(raw);
          if (p && now() - p.at < KNOWN_TTL) {
            KNOWN_CACHE = { at: p.at, uris: toSet(p.uris), keys: toSet(p.keys), count: p.count };
            return KNOWN_CACHE;
          }
        }
      } catch (e) {}
    }

    var uris = {};
    var keys = {};
    var count = 0;

    function remember(u, name, artists) {
      if (!u) return;
      uris[u] = 1;
      if (name) keys[trackKey({ name: name, artists: artists || [] })] = 1;
      count++;
    }

    // Liked Songs
    try {
      var offset = 0;
      for (var page = 0; page < 60; page++) {
        var r = await PF.LibraryAPI.getTracks({ limit: 50, offset: offset });
        var items = (r && r.items) || [];
        if (!items.length) break;
        items.forEach(function (it) { remember(it.uri, it.name, it.artists); });
        offset += items.length;
        if (r && typeof r.total === "number" && offset >= r.total) break;
        if (items.length < 50) break;
      }
    } catch (e) {
      console.warn("[wave] known: liked failed", e);
    }

    // Свои плейлисты
    try {
      var lists = await api.playlists();
      for (var i = 0; i < lists.length; i++) {
        try {
          var c = await PF.PlaylistAPI.getContents(lists[i].uri, { limit: 500 });
          ((c && c.items) || []).forEach(function (it) { remember(it.uri, it.name, it.artists); });
        } catch (e) {}
      }
    } catch (e) {
      console.warn("[wave] known: playlists failed", e);
    }

    // Недавно игравшее тоже считаем знакомым
    try {
      var rec = await PF.AssistedCurationAPI.getRecentlyPlayedTracks({ limit: 50, offset: 0 });
      (rec || []).forEach(function (u) { remember(u); });
    } catch (e) {}

    KNOWN_CACHE = { at: now(), uris: uris, keys: keys, count: count };

    try {
      localStorage.setItem("wave.known.v2", JSON.stringify({
        at: KNOWN_CACHE.at,
        count: count,
        uris: Object.keys(uris),
        keys: Object.keys(keys)
      }));
    } catch (e) {}

    return KNOWN_CACHE;
  },

  createPlaylist: async function (name, tracks) {
    var uri = await PF.RootlistAPI.createPlaylist(name, {});
    if (!uri) throw new Error(T("Не удалось создать плейлист"));
    var uris = tracks.map(function (t) { return t.uri; });
    for (var i = 0; i < uris.length; i += 50) {
      await PF.PlaylistAPI.add(uri, uris.slice(i, i + 50), {});
    }
    return uri;
  },

  /* Служебный плейлист: используется и для «Волна · Live», и для seed-волн. */
  fillPlaylist: async function (name, tracks) {
    var list = await api.allPlaylists();
    var found = list.filter(function (p) { return p.name === name; })[0];
    var uri = found ? found.uri : await PF.RootlistAPI.createPlaylist(name, {});
    if (!uri) throw new Error(T("Не удалось создать плейлист «") + name + "»");

    try {
      var c = await PF.PlaylistAPI.getContents(uri, { limit: 400 });
      var items = ((c && c.items) || [])
        .filter(function (x) { return x && x.uid; })
        .map(function (x) { return { uid: x.uid, uri: x.uri }; });
      if (items.length) await PF.PlaylistAPI.remove(uri, items);
    } catch (e) {
      console.warn("[wave] clear playlist failed", e);
    }

    var uris = tracks.map(function (t) { return t.uri; });
    for (var i = 0; i < uris.length; i += 50) {
      await PF.PlaylistAPI.add(uri, uris.slice(i, i + 50), {});
    }
    return uri;
  },

  /* Служебный плейлист, который всегда содержит текущую волну.
   * Играем его как контекст — тогда next/prev/очередь/шаффл работают нативно. */
  livePlaylist: function (tracks) {
    return api.fillPlaylist(LIVE_NAME, tracks);
  },

  seedPlaylist: function (tracks) {
    return api.fillPlaylist(SEED_NAME, tracks);
  },

  albumTracks: async function (albumUri) {
    try {
      var r = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryAlbumTracks, {
        uri: albumUri,
        offset: 0,
        limit: 50
      });
      var txt = JSON.stringify(r);
      var found = txt.match(/spotify:track:[A-Za-z0-9]{22}/g) || [];
      var uris = found.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
      var name = "";
      try { name = (r.data.albumUnion && r.data.albumUnion.name) || ""; } catch (e) {}
      return { uris: uris.slice(0, 10), name: name };
    } catch (e) {
      console.warn("[wave] albumTracks failed", e);
      return { uris: [], name: "" };
    }
  },

  trackInfo: async function (uri) {
    try {
      var r = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.decorateContextTracks, { uris: [uri] });
      var t = r && r.data && r.data.tracks && r.data.tracks[0];
      if (!t) return null;
      return {
        name: t.name,
        artists: ((t.artists && t.artists.items) || []).map(function (a) {
          return { uri: a.uri, name: (a.profile && a.profile.name) || "" };
        })
      };
    } catch (e) {
      return null;
    }
  },

  playContext: function (uri, skipToUri) {
    var opts = skipToUri ? { skipTo: { uri: skipToUri } } : {};
    return Spicetify.Player.playUri(uri, {}, opts);
  },

  play: async function (tracks) {
    if (!tracks.length) return;
    await Spicetify.Player.playUri(tracks[0].uri);
    for (var i = 1; i < tracks.length; i++) {
      try { Spicetify.addToQueue([{ uri: tracks[i].uri }]); } catch (e) {}
    }
  },

  enqueue: function (tracks) {
    for (var i = 0; i < tracks.length; i++) {
      try { Spicetify.addToQueue([{ uri: tracks[i].uri }]); } catch (e) {}
    }
  }
};

/* ------------------------------ engine ------------------------------ */

function scoreTrack(t, opts) {
  var ts = now();
  var score = 0;
  var artists = trackArtists(t);

  if (!artists.length) return -99;

  for (var i = 0; i < artists.length; i++) {
    var a = artists[i];
    var st = S.artists[a];
    var weight = i === 0 ? 1 : 0.45;
    if (!st) {
      score += opts.novelty * 0.85 * weight;
      continue;
    }
    if (st.mutedAt && ts - st.mutedAt < 60 * DAY) { score -= 3 * weight; continue; }
    var plays = st.plays || 0;
    var completes = st.completes || 0;
    var skips = st.skips || 0;
    var likes = st.likes || 0;
    score += weight * (0.55 * Math.tanh((completes - 0.7 * skips) / 3) + 0.25 * Math.tanh(likes / 2));
    if (st.lastPlayed) {
      var hours = (ts - st.lastPlayed) / HOUR;
      if (hours < 2) score -= 0.55 * weight;
      else if (hours < 12) score -= 0.25 * weight;
    }
  }

  var tr = S.tracks[t.uri];
  if (tr) {
    if (tr.likes) score += 0.3;
    if (tr.skips) score -= 0.22 * Math.min(tr.skips, 3);
    if (tr.lastPlayed) {
      var hAge = (ts - tr.lastPlayed) / HOUR;
      if (hAge < 24) score -= 0.65;
      else if (hAge < 24 * 7) score -= 0.18;
    }
  }

  if (opts.clean && t.explicit) score -= 1.5;

  var lname = (t.name || "").toLowerCase();
  if (/(slowed|sped up|speed up|nightcore|8d audio|bass boost|karaoke|instrumental|tribute)/.test(lname)) score -= 0.9;
  else if (/(remix|edit|flip)/.test(lname)) score -= 0.25;
  if (t.durationMs > 12 * 60000) score -= 0.4;

  score += (Math.random() - 0.5) * (opts.explore || 0.3) * 2;
  return score;
}

function pickTracks(pool, opts) {
  var sorted = pool.slice().sort(function (a, b) { return b._score - a._score; });
  var out = [];
  var perArtist = {};
  var perAlbum = {};
  var lastArtist = null;

  while (out.length < opts.length && sorted.length) {
    var chosen = null;
    var chosenIdx = 0;
    var windowSize = Math.min(sorted.length, 12);
    var tries = Math.min(windowSize, 7);

    for (var k = 0; k < tries; k++) {
      var cand = sorted[k];
      var key = primaryArtist(cand);
      var albumKey = (cand.album && cand.album.uri) || "";
      if ((perArtist[key] || 0) >= opts.diversity) continue;
      if (albumKey && (perAlbum[albumKey] || 0) >= 2) continue;
      if (key === lastArtist) continue;
      chosen = cand;
      chosenIdx = k;
      break;
    }

    if (!chosen) { chosen = sorted[0]; chosenIdx = 0; }
    sorted.splice(chosenIdx, 1);
    out.push(chosen);
    var ck = primaryArtist(chosen);
    perArtist[ck] = (perArtist[ck] || 0) + 1;
    var ak = (chosen.album && chosen.album.uri) || "";
    if (ak) perAlbum[ak] = (perAlbum[ak] || 0) + 1;
    lastArtist = ck;
  }

  return out;
}

async function generate(sourceUris, opts) {
  var bans = Object.keys(S.bans);
  var played = (S.wave && S.wave.tracks ? S.wave.tracks : []).map(function (t) { return t.uri; });

  function ids(list) {
    return list.map(function (u) { return u.split(":").pop(); }).filter(Boolean);
  }

  async function fetchPool(skipUris) {
    var per = clamp(Math.ceil((opts.length * 2.2) / Math.max(1, sourceUris.length)), 30, 100);
    var skipIds = ids(skipUris);
    var results = await Promise.all(sourceUris.map(function (uri) {
      return api.recs(uri, skipIds, per)
        .catch(function () { return []; })
        .then(function (arr) { return { uri: uri, arr: arr }; });
    }));

    var pool = [];
    var byUri = {};
    var byKey = {};
    results.forEach(function (res) {
      res.arr.forEach(function (t) {
        if (byUri[t.uri] || byKey[trackKey(t)] || isBanned(t.uri)) return;
        byUri[t.uri] = true;
        byKey[trackKey(t)] = true;
        t._src = res.uri;
        pool.push(t);
      });
    });
    return pool;
  }

  var pool = await fetchPool(bans.concat(played));

  // Если новых треков не хватает (движок любит повторять), добираем без исключения прошлой волны.
  if (pool.length < opts.length) {
    var wider = await fetchPool(bans).catch(function () { return []; });
    var seen = {};
    pool.forEach(function (t) { seen[t.uri] = true; });
    wider.forEach(function (t) {
      if (seen[t.uri] || isBanned(t.uri)) return;
      seen[t.uri] = true;
      pool.push(t);
    });
  }

  // «Только новое»: выбрасываем то, что уже есть в лайках и плейлистах.
  if (opts.onlyNew) {
    try {
      var known = await api.known();
      S.knownCount = known.count;
      var before = pool.length;
      pool = pool.filter(function (t) {
        return !known.uris[t.uri] && !known.keys[trackKey(t)];
      });
      if (before !== pool.length) console.info(T("[wave] отфильтровано знакомых треков:"), before - pool.length);
    } catch (e) {
      console.warn("[wave] known filter failed", e);
    }
  }

  // Настроение: фильтр по BPM (audio features Spotify закрыл, темп — честная замена).
  var range = moodRange(opts.mood);
  if (range) {
    var matched = [];
    var unknown = [];
    pool.forEach(function (t) {
      if (typeof t.bpm === "number") {
        if (t.bpm >= range[0] && t.bpm <= range[1]) matched.push(t);
      } else {
        unknown.push(t);
      }
    });
    pool = matched.length >= Math.min(opts.length, 8) ? matched : matched.concat(unknown);
  }

  if (!pool.length) {
    throw new Error(opts.onlyNew
      ? T("Всё, что нашлось, уже есть в твоих плейлистах и лайках. Отключи «Только новое» или добавь источники.")
      : T("Spotify не вернул рекомендаций. Попробуй другой источник."));
  }

  pool.forEach(function (t) { t._score = scoreTrack(t, opts); });
  var chosen = pickTracks(pool, opts);

  var labels = {};
  labels[api.likedContext()] = T("из твоих лайков");
  try {
    var pls = await api.playlists();
    pls.forEach(function (p) { labels[p.uri] = T("из «") + p.name + "»"; });
  } catch (e) {}

  chosen.forEach(function (t) {
    t.reason = (opts.labels && opts.labels[t._src]) || labels[t._src] || T("подобрано для тебя");
    delete t._src;
    delete t._score;
  });

  rememberMeta(chosen);
  return chosen;
}

/* ------------------------------ auto-extend ------------------------------ */

var autoBusy = false;
var lastAutoExtend = 0;

async function autoExtend() {
  if (!S.settings.autoExtend || autoBusy) return;
  if (!S.wave || !S.wave.liveUri || !S.wave.tracks || S.wave.tracks.length < 8) return;
  if (now() - lastAutoExtend < 45000) return;

  var data = Spicetify.Player.data || {};
  var item = data.item;
  var ctx = data.context && data.context.uri;
  if (!item || !item.uri) return;
  if (ctx !== S.wave.liveUri) return;

  var idx = -1;
  for (var i = 0; i < S.wave.tracks.length; i++) {
    if (S.wave.tracks[i].uri === item.uri) { idx = i; break; }
  }
  if (idx < 0 || idx < S.wave.tracks.length - 4) return;

  autoBusy = true;
  lastAutoExtend = now();
  try {
    var sources = (S.wave.sources && S.wave.sources.length) ? S.wave.sources : [api.likedContext()];
    var extra = await generate(sources, buildOpts(Math.max(10, Math.round(S.settings.length / 2))));
    if (!extra.length) return;

    var all = S.wave.tracks.concat(extra);
    S.wave.tracks = all;
    persist(); notify();

    try {
      Spicetify.addToQueue(extra.map(function (t) { return { uri: t.uri }; }));
    } catch (e) {
      console.warn("[wave] auto enqueue failed", e);
    }

    api.livePlaylist(all).catch(function (e) { console.warn("[wave] live refresh failed", e); });
    Spicetify.showNotification(T("Волна продолжается: +") + extra.length);
  } catch (e) {
    console.warn("[wave] auto-extend failed", e);
  } finally {
    autoBusy = false;
  }
}

/* ------------------------------ activity tracking ------------------------------ */

var EVENTS_KEY = "wave.events";

function bumpArtist(uri, field, amount) {
  if (!uri) return;
  var a = S.artists[uri] || (S.artists[uri] = { plays: 0, completes: 0, skips: 0, likes: 0, lastPlayed: 0 });
  a[field] = (a[field] || 0) + (amount == null ? 1 : amount);
  a.lastPlayed = now();
}

function bumpTrack(uri, field) {
  if (!uri) return;
  var t = S.tracks[uri] || (S.tracks[uri] = { plays: 0, completes: 0, skips: 0, likes: 0, lastPlayed: 0 });
  t[field] = (t[field] || 0) + 1;
  t.lastPlayed = now();
}

function finalizeEvent(ev) {
  if (!ev || !ev.uri) return;
  var played = ev.played || 0;
  var dur = ev.dur || 0;
  if (!played) return;

  var wasSkip = dur > 0 ? played < Math.min(30000, dur * 0.45) : played < 25000;
  var wasComplete = dur > 0 && played >= dur * 0.8;

  S.recent.unshift({ uri: ev.uri, at: ev.at || now(), played: played, dur: dur });
  if (S.recent.length > 400) S.recent.length = 400;

  if (ev.name) S.trackNames[ev.uri] = ev.name;
  if (ev.artistNames && ev.artistNames.length) {
    (ev.artists || []).forEach(function (uri, i) {
      if (uri && ev.artistNames[i]) S.artistNames[uri] = ev.artistNames[i];
    });
  }

  (ev.artists || []).forEach(function (a) {
    if (wasSkip) bumpArtist(a, "skips");
    else if (wasComplete) bumpArtist(a, "completes");
    else bumpArtist(a, "plays");
  });

  bumpTrack(ev.uri, "plays");
  if (wasSkip) bumpTrack(ev.uri, "skips");
  if (wasComplete) bumpTrack(ev.uri, "completes");
}

function drainEvents() {
  var raw = null;
  try { raw = localStorage.getItem(EVENTS_KEY); } catch (e) {}
  if (!raw) return false;
  try { localStorage.removeItem(EVENTS_KEY); } catch (e) {}

  var arr = [];
  try { arr = JSON.parse(raw) || []; } catch (e) { return false; }
  if (!arr.length) return false;

  arr.forEach(finalizeEvent);
  persist();
  notify();
  return true;
}

/* ------------------------------ feedback ------------------------------ */

function likeTrack(t) {
  bumpTrack(t.uri, "likes");
  trackArtists(t).forEach(function (a) { bumpArtist(a, "likes"); });
  var cur = Spicetify.Player.data && Spicetify.Player.data.item;
  if (cur && cur.uri === t.uri) {
    try { Spicetify.Player.setHeart(true); } catch (e) {}
  }
  try { PF.LibraryAPI.add({ uris: [t.uri] }); } catch (e) {}
  Spicetify.showNotification(T("Волна запомнила: нравится"));
  persist(); notify();
}

function dislikeTrack(t) {
  bumpTrack(t.uri, "skips");
  trackArtists(t).forEach(function (a) { bumpArtist(a, "skips"); });
  S.bans[t.uri] = { until: now() + 45 * DAY };
  if (S.wave && S.wave.tracks) {
    S.wave.tracks = S.wave.tracks.filter(function (x) { return x.uri !== t.uri; });
  }
  var cur = Spicetify.Player.data && Spicetify.Player.data.item;
  if (cur && cur.uri === t.uri) { try { Spicetify.Player.next(); } catch (e) {} }
  persist(); notify();
}

function muteArtist(t) {
  var uris = trackArtists(t);
  uris.forEach(function (a) {
    bumpArtist(a, "skips", 3);
    S.artists[a].mutedAt = now();
  });
  if (S.wave && S.wave.tracks) {
    S.wave.tracks = S.wave.tracks.filter(function (x) {
      return trackArtists(x).every(function (a) { return uris.indexOf(a) === -1; });
    });
  }
  Spicetify.showNotification(T("Артист убран из волны"));
  persist(); notify();
}

/* ------------------------------ stats ------------------------------ */

function stats() {
  var plays = 0, skips = 0, completes = 0;
  var artists = 0;
  Object.keys(S.artists).forEach(function (k) {
    var a = S.artists[k];
    plays += a.plays || 0;
    skips += a.skips || 0;
    completes += a.completes || 0;
    artists++;
  });
  return { plays: plays, skips: skips, completes: completes, artists: artists };
}

function topArtists(limit) {
  var names = {};
  (S.wave && S.wave.tracks ? S.wave.tracks : []).forEach(function (t) {
    (t.artists || []).forEach(function (a) { names[a.uri] = a.name; });
  });
  return Object.keys(S.artists)
    .map(function (uri) {
      var a = S.artists[uri];
      return { uri: uri, name: S.artistNames[uri] || names[uri] || T("Артист"), score: (a.completes || 0) + (a.likes || 0) - (a.skips || 0) };
    })
    .sort(function (x, y) { return y.score - x.score; })
    .slice(0, limit || 6);
}

function computeStats() {
  var recent = S.recent || [];
  var total = recent.length;
  var skips = 0;
  var completes = 0;
  var byDay = [0, 0, 0, 0, 0, 0, 0];
  var byHour = new Array(24).fill(0);
  var bpmSum = 0;
  var bpmCount = 0;

  recent.forEach(function (r) {
    if (r.at) {
      var d = new Date(r.at);
      byDay[(d.getDay() + 6) % 7]++;
      byHour[d.getHours()]++;
    }
    if (r.dur && r.played) {
      if (r.played < Math.min(30000, r.dur * 0.45)) skips++;
      else if (r.played >= r.dur * 0.8) completes++;
    }
    var b = S.bpm[r.uri];
    if (typeof b === "number") { bpmSum += b; bpmCount++; }
  });

  var avgBpm = bpmCount ? Math.round(bpmSum / bpmCount) : 0;

  return {
    total: total,
    skips: skips,
    completes: completes,
    skipRate: total ? Math.round((skips / total) * 100) : 0,
    finishRate: total ? Math.round((completes / total) * 100) : 0,
    artists: topArtists(5),
    byDay: byDay,
    byHour: byHour,
    avgBpm: avgBpm,
    mood: avgBpm ? (avgBpm < 105 ? T("спокойное") : avgBpm <= 135 ? T("среднее") : T("энергичное")) : "—"
  };
}

function statCard(label, value) {
  return h("div", { className: "wave-stat-card" },
    h("div", { className: "wave-stat-value" }, value),
    h("div", { className: "wave-stat-label" }, label)
  );
}

function StatsPanel(props) {
  var st = props.stats;
  var days = [T("Пн"), T("Вт"), T("Ср"), T("Чт"), T("Пт"), T("Сб"), T("Вс")];
  var dayMax = Math.max.apply(null, st.byDay.concat([1]));
  var hourBuckets = [0, 1, 2, 3, 4, 5].map(function (i) {
    return st.byHour.slice(i * 4, i * 4 + 4).reduce(function (a, b) { return a + b; }, 0);
  });
  var hourMax = Math.max.apply(null, hourBuckets.concat([1]));
  var hourLabels = ["00", "04", "08", "12", "16", "20"];

  return h("div", { className: "wave-stats" },
    h("div", { className: "wave-stat-cards" },
      statCard(T("Прослушано"), st.total),
      statCard(T("Скипов"), st.skips + " · " + st.skipRate + "%"),
      statCard(T("Дослушано"), st.finishRate + "%"),
      statCard(T("Средний темп"), (st.avgBpm ? st.avgBpm + " BPM" : "—") + (st.avgBpm ? " · " + st.mood : ""))
    ),

    h("div", { className: "wave-stat-block" },
      h("h3", null, T("По дням недели")),
      h("div", { className: "wave-bars" },
        st.byDay.map(function (v, i) {
          return h("div", { className: "wave-bar", key: i, title: days[i] + ": " + v },
            h("div", { className: "wave-bar-fill", style: { height: Math.round((v / dayMax) * 100) + "%" } }),
            h("span", { className: "wave-bar-label" }, days[i])
          );
        })
      )
    ),

    h("div", { className: "wave-stat-block" },
      h("h3", null, T("По часам")),
      h("div", { className: "wave-bars" },
        hourBuckets.map(function (v, i) {
          return h("div", { className: "wave-bar", key: i, title: hourLabels[i] + ":00–" + (Number(hourLabels[i]) + 3) + ":59 · " + v },
            h("div", { className: "wave-bar-fill", style: { height: Math.round((v / hourMax) * 100) + "%" } }),
            h("span", { className: "wave-bar-label" }, hourLabels[i])
          );
        })
      )
    ),

    h("div", { className: "wave-stat-block" },
      h("h3", null, T("Топ артистов")),
      st.artists.length
        ? h("ol", { className: "wave-top" }, st.artists.map(function (a) {
            return h("li", { key: a.uri },
              h("span", { className: "wave-top-name" }, a.name),
              h("span", { className: "wave-top-score" }, a.score)
            );
          }))
        : h("div", { className: "wave-muted" }, T("пока нет данных — послушай волну"))
    )
  );
}

/* ------------------------------ ui bits ------------------------------ */

function Cover(props) {
  var style = props.src
    ? { backgroundImage: 'url("' + props.src + '")' }
    : {};
  return h("div", { className: "wave-cover " + (props.className || ""), style: style },
    props.src ? null : h("span", null, "~")
  );
}

function TrackRow(props) {
  var t = props.track;
  var art = t.album && t.album.image;
  var artists = (t.artists || []).map(function (a) { return a.name; }).join(", ");
  var isCurrent = props.current;
  return h("div", { className: "wave-row" + (isCurrent ? " is-current" : "") },
    h("div", { className: "wave-row-index" }, isCurrent ? h("span", { className: "wave-eq" }, "\u25B6") : String(props.index + 1)),
    h(Cover, { src: art, className: "sm" }),
    h("div", { className: "wave-row-text" },
      h("div", { className: "wave-row-title", title: t.name }, t.name),
      h("div", { className: "wave-row-sub", title: artists },
        artists,
        t.reason ? h("span", { className: "wave-row-reason" }, " · " + t.reason) : null
      )
    ),
    t.bpm ? h("div", { className: "wave-row-bpm", title: T("Темп") }, String(t.bpm)) : null,
    h("div", { className: "wave-row-dur" }, fmtDuration(t.durationMs)),
    h("div", { className: "wave-row-actions" },
      h("button", { className: "wave-icon", title: T("Нравится"), "aria-label": T("Нравится"), onClick: function () { likeTrack(t); } }, icon("heart")),
      h("button", { className: "wave-icon", title: T("Убрать из волны"), "aria-label": T("Убрать из волны"), onClick: function () { dislikeTrack(t); } }, icon("close")),
      h("button", { className: "wave-icon", title: T("Больше не этот артист"), "aria-label": T("Больше не этот артист"), onClick: function () { muteArtist(t); } }, icon("ban")),
      h("button", { className: "wave-icon play", title: T("Играть"), "aria-label": T("Играть"), onClick: function () { props.onPlay ? props.onPlay(t) : Spicetify.Player.playUri(t.uri); } }, icon("play"))
    )
  );
}

/* ------------------------------ app ------------------------------ */

function usePlaylists() {
  var pair = React.useState({ list: [], loading: true });
  var state = pair[0], setState = pair[1];
  React.useEffect(function () {
    var dead = false;
    api.playlists()
      .then(function (list) { if (!dead) setState({ list: list, loading: false }); })
      .catch(function () { if (!dead) setState({ list: [], loading: false }); });
    return function () { dead = true; };
  }, []);
  return state;
}

function WaveApp() {
  useStore();
  var playlists = usePlaylists();

  React.useEffect(function () {
    drainEvents();
    var timer = setInterval(drainEvents, 8000);
    return function () { clearInterval(timer); };
  }, []);

  var pair = React.useState("");
  var busy = pair[0], setBusy = pair[1];
  var errPair = React.useState("");
  var error = errPair[0], setError = errPair[1];
  var advPair = React.useState(false);
  var showAdvanced = advPair[0], setShowAdvanced = advPair[1];
  var statsPair = React.useState(false);
  var showStats = statsPair[0], setShowStats = statsPair[1];

  var likedUri = api.likedContext();
  var allSources = [{ uri: likedUri, name: T("Мой микс"), icon: "\u2726" }].concat(
    playlists.list.map(function (p) { return { uri: p.uri, name: p.name, icon: "\u2261" }; })
  );

  if (!S.sources) S.sources = [likedUri];
  var selected = S.sources.filter(function (u) { return allSources.some(function (s) { return s.uri === u; }); });
  if (!selected.length) selected = [likedUri];

  function toggleSource(uri) {
    var idx = S.sources.indexOf(uri);
    if (idx >= 0) {
      if (S.sources.length === 1) { Spicetify.showNotification(T("Оставь хотя бы один источник")); return; }
      S.sources.splice(idx, 1);
    } else {
      S.sources.push(uri);
    }
    persist(); notify();
  }

  function setSetting(key, value) {
    S.settings[key] = value;
    LANG_CACHE = null;
    persist(); notify();
  }

  function refreshKnown() {
    setBusy(T("Обновляю список знакомого…"));
    api.known(true).then(function (k) {
      S.knownCount = k.count;
      persist(); notify();
      setBusy("");
      Spicetify.showNotification(T("Знакомых треков: ") + k.count);
    }).catch(function (e) {
      setBusy("");
      setError(String((e && e.message) || e));
    });
  }

  async function checkScrobble() {
    var token = (S.settings.scrobbleToken || "").trim();
    if (!token) { setError(T("Укажи токен ListenBrainz")); return; }
    try {
      var r = await fetch("https://api.listenbrainz.org/1/validate-token", {
        headers: { Authorization: "Token " + token }
      });
      var j = await r.json();
      if (j && j.valid) {
        setError("");
        setSetting("scrobbleEnabled", true);
        Spicetify.showNotification("ListenBrainz: " + (j.user_name || T("токен принят")));
      } else {
        setError(T("ListenBrainz не принял токен"));
      }
    } catch (e) {
      setError(T("Не удалось проверить токен: сеть или CORS"));
    }
  }

  async function run(sourcesOverride) {
    if (busy) return;
    setError("");
    setBusy(T("Собираю рекомендации…"));
    try {
      var sources = (sourcesOverride && sourcesOverride.length) ? sourcesOverride : selected;
      var opts = buildOpts();
      var tracks = await generate(sources, opts);
      if (!tracks.length) throw new Error(T("Пустая волна. Попробуй другой источник."));
      setBusy(T("Готовлю очередь…"));
      var liveUri = await api.livePlaylist(tracks);
      S.wave = { tracks: tracks, sources: sources.slice(), createdAt: now(), liveUri: liveUri };
      persist(); notify();
      setBusy(T("Запускаю…"));
      await api.playContext(liveUri);
      setBusy("");
      Spicetify.showNotification(T("Волна собрана: ") + tracks.length + T(" треков"));
    } catch (e) {
      console.error("[wave]", e);
      setError(String((e && e.message) || e));
      setBusy("");
    }
  }

  async function more() {
    if (busy) return;
    setBusy(T("Добавляю…"));
    try {
      var opts = buildOpts(Math.max(10, Math.round(S.settings.length / 2)));
      var src = (S.wave && S.wave.sources && S.wave.sources.length) ? S.wave.sources : selected;
      var extra = await generate(src, opts);
      if (!extra.length) throw new Error(T("Не удалось подобрать новые треки."));
      var all = (S.wave && S.wave.tracks ? S.wave.tracks : []).concat(extra);
      setBusy(T("Продлеваю…"));
      var liveUri = await api.livePlaylist(all);
      S.wave = {
        tracks: all,
        sources: (S.wave && S.wave.sources) ? S.wave.sources : selected.slice(),
        createdAt: (S.wave && S.wave.createdAt) || now(),
        liveUri: liveUri
      };
      persist(); notify();
      await api.playContext(liveUri, extra[0].uri);
      setBusy("");
    } catch (e) {
      setError(String((e && e.message) || e));
      setBusy("");
    }
  }

  function playTrack(t) {
    var live = S.wave && S.wave.liveUri;
    if (live) {
      api.playContext(live, t.uri).catch(function () {
        try { Spicetify.Player.playUri(t.uri); } catch (e) {}
      });
    } else {
      try { Spicetify.Player.playUri(t.uri); } catch (e) {}
    }
  }

  async function runSeed(seed) {
    if (busy) return;
    setError("");
    setBusy(T("Готовлю волну…"));
    try {
      var uris = [];
      var label = "";

      if (seed.type === "artist") {
        var info = await api.artistTopTracks(seed.uri);
        uris = info.uris;
        label = info.name ? T("по артисту «") + info.name + "»" : T("по артисту");
      } else if (seed.type === "album") {
        var album = await api.albumTracks(seed.uri);
        uris = album.uris;
        label = album.name ? T("по альбому «") + album.name + "»" : T("по альбому");
      } else {
        uris = [seed.uri];
        var meta = await api.trackInfo(seed.uri);
        if (meta) rememberMeta([{ uri: seed.uri, name: meta.name, artists: meta.artists }]);
        label = meta && meta.name ? T("по треку «") + meta.name + "»" : T("по треку");
      }

      if (!uris.length) throw new Error(T("Не удалось найти треки для этой волны"));

      setBusy(T("Собираю рекомендации…"));
      var tempUri = await api.seedPlaylist(uris.map(function (u) { return { uri: u }; }));

      var opts = buildOpts();
      opts.labels = {};
      opts.labels[tempUri] = label;

      var tracks = await generate([tempUri], opts);
      if (!tracks.length) throw new Error(T("Не удалось собрать волну по этому seed"));

      setBusy(T("Запускаю…"));
      var liveUri = await api.livePlaylist(tracks);
      S.wave = {
        tracks: tracks,
        sources: [tempUri],
        createdAt: now(),
        liveUri: liveUri,
        seedType: seed.type,
        seedUri: seed.uri,
        seedLabel: label
      };
      persist(); notify();
      await api.playContext(liveUri);
      Spicetify.showNotification(T("Волна ") + label);
      setBusy("");
    } catch (e) {
      console.error("[wave] seed", e);
      setError(String((e && e.message) || e));
      setBusy("");
    }
  }

  function exportState() {
    try {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var d = new Date();
      a.href = url;
      a.download = "spotwave-" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      Spicetify.showNotification(T("Данные экспортированы"));
    } catch (e) {
      setError(String((e && e.message) || e));
    }
  }

  function importState(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || "{}"));
        if (!data || typeof data !== "object") throw new Error("bad file");
        ["artists", "tracks", "bans", "trackNames", "artistNames", "bpm"].forEach(function (k) {
          if (data[k] && typeof data[k] === "object") S[k] = data[k];
        });
        if (Array.isArray(data.recent)) S.recent = data.recent;
        if (data.settings && typeof data.settings === "object") {
          S.settings = Object.assign({}, S.settings, data.settings);
        }
        LANG_CACHE = null;
        persist(); notify();
        Spicetify.showNotification(T("Данные импортированы"));
      } catch (e) {
        setError(T("Не удалось прочитать файл"));
      }
    };
    reader.readAsText(file);
  }

  async function save() {
    if (!S.wave || !S.wave.tracks.length) return;
    setBusy(T("Сохраняю…"));
    try {
      var d = new Date();
      var name = SNAP_PREFIX + d.getDate() + "." + (d.getMonth() + 1) + " " +
        String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      await api.createPlaylist(name, S.wave.tracks);
      Spicetify.showNotification(T("Плейлист «") + name + T("» готов — он уже на телефоне"));
    } catch (e) {
      setError(String((e && e.message) || e));
    }
    setBusy("");
  }

  React.useEffect(function () {
    var pending = null;
    try { pending = localStorage.getItem("wave.pendingSource"); } catch (e) {}
    if (!pending) return;
    try { localStorage.removeItem("wave.pendingSource"); } catch (e) {}
    S.sources = [pending];
    persist(); notify();
    run([pending]);
  }, []);

  React.useEffect(function () {
    var raw = null;
    try { raw = localStorage.getItem("wave.seed"); } catch (e) {}
    if (!raw) return;
    try { localStorage.removeItem("wave.seed"); } catch (e) {}
    var seed = null;
    try { seed = JSON.parse(raw); } catch (e) {}
    if (seed && seed.uri) runSeed(seed);
  }, []);

  var curItem = Spicetify.Player.data && Spicetify.Player.data.item;
  var curUri = curItem && curItem.uri;
  var st = stats();
  var wave = S.wave && S.wave.tracks ? S.wave.tracks : [];
  var totalMs = wave.reduce(function (a, t) { return a + (t.durationMs || 0); }, 0);
  var heroCover = wave.length && wave[0].album ? wave[0].album.image : (curItem && curItem.album && curItem.album.images && curItem.album.images[0] ? curItem.album.images[0].url : "");

  return h("div", { className: "wave-app" },
    h("header", { className: "wave-header" },
      h("div", { className: "wave-header-bg", style: heroCover ? { backgroundImage: 'url("' + heroCover + '")' } : {} }),
      h("div", { className: "wave-header-cover", style: heroCover ? { backgroundImage: 'url("' + heroCover + '")' } : {} },
        heroCover ? null : logoMark(64, "wave-header-mark")),
      h("div", { className: "wave-header-info" },
        h("div", { className: "wave-header-type" }, T("Радио")),
        h("h1", { className: "wave-header-title" }, T("Волна")),
        h("div", { className: "wave-header-meta" },
          wave.length
            ? [
                (S.wave && S.wave.seedLabel) ? T("Волна ") + S.wave.seedLabel : null,
                wave.length + T(" треков"),
                totalDurationText(totalMs)
              ].filter(Boolean).join(" · ")
            : T("бесконечный поток по твоему вкусу")
        )
      )
    ),

    h("div", { className: "wave-actions" },
      h("button", {
        className: "wave-play-big",
        disabled: !!busy,
        title: T("Слушать"),
        onClick: function () {
          if (wave.length && S.wave && S.wave.liveUri) {
            api.playContext(S.wave.liveUri).catch(function () { run(); });
          } else {
            run();
          }
        }
      }, icon("play")),

      h("button", { className: "wave-btn ghost", disabled: !!busy, onClick: function () { run(); } },
        wave.length ? T("Новая волна") : T("Собрать волну")),

      wave.length ? h("button", { className: "wave-btn ghost", disabled: !!busy, onClick: more }, T("Продлить")) : null,
      wave.length ? h("button", { className: "wave-btn ghost", disabled: !!busy, onClick: save }, T("Сохранить в плейлист")) : null,

      busy ? h("span", { className: "wave-busy" }, busy) : null,
      h("span", { className: "wave-actions-spacer" }),
      h("button", { className: "wave-icon-btn", title: T("Настройки"), onClick: function () { setShowAdvanced(!showAdvanced); } }, icon("gear"))
    ),

    error ? h("div", { className: "wave-error" }, error) : null,

    h("div", { className: "wave-section" },
      h("div", { className: "wave-section-head" },
        h("h2", null, T("Источники")),
        h("div", { className: "wave-links" },
          h("button", { className: "wave-link", onClick: function () { setShowStats(!showStats); } },
            showStats ? T("Скрыть статистику") : T("Статистика")),
          h("button", { className: "wave-link", onClick: function () { setShowAdvanced(!showAdvanced); } },
            showAdvanced ? T("Скрыть настройки") : T("Настройки"))
        )
      ),
      h("div", { className: "wave-chips" },
        allSources.map(function (s) {
          var on = selected.indexOf(s.uri) >= 0;
          return h("button", {
            key: s.uri,
            className: "wave-chip" + (on ? " on" : ""),
            onClick: function () { toggleSource(s.uri); }
          }, s.name);
        }),
        playlists.loading ? h("span", { className: "wave-muted" }, T("загружаю плейлисты…")) : null
      ),
      h("div", { className: "wave-hint" }, T("Выбери один плейлист — получишь волну в его настроении. Несколько — микс.")),

      h("div", { className: "wave-mood" },
        h("span", { className: "wave-mood-label" }, T("Настроение")),
        h("div", { className: "wave-chips" },
          [["any", T("Любое")], ["calm", T("Спокойное")], ["mid", T("Среднее")], ["energetic", T("Энергичное")]].map(function (pair) {
            var on = (S.settings.mood || "any") === pair[0];
            return h("button", {
              key: pair[0],
              className: "wave-chip" + (on ? " on" : ""),
              onClick: function () { setSetting("mood", pair[0]); }
            }, pair[1]);
          })
        )
      ),

      showAdvanced ? h("div", { className: "wave-settings" },
        h(Slider, { label: T("Новизна"), value: S.settings.novelty, min: 0, max: 1, step: 0.05, onChange: function (v) { setSetting("novelty", v); } }),
        h(Slider, { label: T("Разнообразие"), value: S.settings.diversity, min: 1, max: 5, step: 1, onChange: function (v) { setSetting("diversity", v); } }),
        h(Slider, { label: T("Длина"), value: S.settings.length, min: 10, max: 60, step: 5, onChange: function (v) { setSetting("length", v); } }),
        h(Slider, { label: T("Эксперимент"), value: S.settings.explore, min: 0, max: 1, step: 0.05, onChange: function (v) { setSetting("explore", v); } }),
        h("label", { className: "wave-slider" },
          h("span", { className: "wave-slider-label" }, T("Язык")),
          h("select", {
            className: "wave-input wave-select",
            value: S.settings.lang || "auto",
            onChange: function (e) { setSetting("lang", e.target.value); }
          },
            h("option", { value: "auto" }, T("Авто")),
            h("option", { value: "ru" }, "Русский"),
            h("option", { value: "en" }, "English")
          )
        ),
        h("label", { className: "wave-toggle" },
          h("input", {
            type: "checkbox",
            checked: !!S.settings.onlyNew,
            onChange: function (e) { setSetting("onlyNew", e.target.checked); }
          }),
          h("span", null, T("Только новое — не брать треки из моих плейлистов и лайков"))
        ),
        h("label", { className: "wave-toggle" },
          h("input", {
            type: "checkbox",
            checked: S.settings.autoExtend !== false,
            onChange: function (e) { setSetting("autoExtend", e.target.checked); }
          }),
          h("span", null, T("Автопродление — добирать треки, когда волна заканчивается"))
        ),
        h("div", { className: "wave-known" },
          h("span", null, S.knownCount ? T("Исключаю знакомых треков: ") + S.knownCount : T("Список знакомых треков соберётся при первой генерации")),
          h("button", { className: "wave-link", onClick: refreshKnown }, T("обновить"))
        ),
        h("div", { className: "wave-scrobble" },
          h("label", { className: "wave-toggle" },
            h("input", {
              type: "checkbox",
              checked: !!S.settings.scrobbleEnabled,
              onChange: function (e) { setSetting("scrobbleEnabled", e.target.checked); }
            }),
            h("span", null, T("Скробблить в ListenBrainz — история и рекомендации вне Spotify"))
          ),
          h("div", { className: "wave-scrobble-row" },
            h("input", {
              className: "wave-input",
              type: "password",
              placeholder: T("токен ListenBrainz"),
              value: S.settings.scrobbleToken || "",
              onChange: function (e) { setSetting("scrobbleToken", e.target.value.trim()); }
            }),
            h("button", { className: "wave-btn small", onClick: checkScrobble }, T("Проверить"))
          ),
          h("div", { className: "wave-hint" }, T("Токен: listenbrainz.org/settings → API token. Учитываются треки, дослушанные хотя бы наполовину."))
        ),
        h("div", { className: "wave-scrobble" },
          h("div", { className: "wave-scrobble-row" },
            h("button", { className: "wave-btn small", onClick: exportState }, T("Экспорт данных")),
            h("label", { className: "wave-btn small wave-label-btn" },
              T("Импорт"),
              h("input", {
                type: "file",
                accept: "application/json,.json",
                style: { display: "none" },
                onChange: function (e) {
                  importState(e.target.files && e.target.files[0]);
                  e.target.value = "";
                }
              })
            )
          ),
          h("div", { className: "wave-hint" }, T("Профиль вкуса, история и настройки — в JSON"))
        )
      ) : null
    ),

    wave.length ? h("div", { className: "wave-section" },
      h("div", { className: "wave-section-head" },
        h("h2", null, T("Очередь волны")),
        h("span", { className: "wave-muted" }, curUri ? T("сейчас: ") + (curItem.name || "") : "")
      ),
      h("div", { className: "wave-list" },
        wave.map(function (t, i) {
          return h(TrackRow, { key: t.uri + i, track: t, index: i, current: curUri === t.uri, onPlay: playTrack });
        })
      )
    ) : h("div", { className: "wave-empty" },
      h("h3", null, T("Здесь появится волна")),
      h("p", null, T("Нажми «Собрать волну» — Spotify подберёт треки по твоим лайкам и плейлистам, а Волна запомнит, что ты слушаешь и что пролистываешь.")),
      h("ol", { className: "wave-steps" },
        h("li", null, T("Выбери источники — лайки или плейлисты")),
        h("li", null, T("Собери волну кнопкой выше")),
        h("li", null, T("Скипай и лайкай — Волна подстроится"))
      )
    ),

    showStats ? h(StatsPanel, { stats: computeStats() }) : null,

    h("div", { className: "wave-foot" },
      h("span", null, T("прослушано: ") + st.plays + T(" · скипов: ") + st.skips + T(" · артистов: ") + st.artists),
      h("span", { className: "wave-muted" }, T("Волна учится на скипах и лайках"))
    )
  );
}

function Slider(props) {
  return h("label", { className: "wave-slider" },
    h("span", { className: "wave-slider-label" }, props.label),
    h("input", {
      type: "range",
      min: props.min,
      max: props.max,
      step: props.step,
      value: props.value,
      onChange: function (e) { props.onChange(Number(e.target.value)); }
    }),
    h("span", { className: "wave-slider-value" }, String(props.value))
  );
}

/* ------------------------------ boot ------------------------------ */

function waveRender() {
  return h(WaveApp);
}

/* Spicetify ищет глобальную render() */
function render() {
  return waveRender();
}

drainEvents();

try {
  Spicetify.Player.addEventListener("songchange", function () {
    setTimeout(autoExtend, 800);
  });
} catch (e) {
  console.warn("[wave] auto-extend hook failed", e);
}

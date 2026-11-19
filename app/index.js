/* Волна — персональное радио для Spotify
 * Spicetify custom app. Работает на клиентской сессии, ничего не патчит в API.
 */
"use strict";

var React = Spicetify.React;
var h = React.createElement;
var PF = Spicetify.Platform;

var LS_KEY = "wave.v1";
var HOUR = 3600000;
var DAY = 86400000;

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
    scrobbleToken: ""
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
    name: x.name || "Без названия",
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

var api = {
  likedContext: function () {
    try { return PF.LibraryAPI._likedSongsUri || "spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ"; }
    catch (e) { return "spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ"; }
  },

  playlists: async function () {
    var r = await PF.RootlistAPI.getContents();
    var items = (r && r.items) || [];
    return items
      .filter(function (i) { return i && i.type === "playlist" && i.uri && !i.isNotFound; })
      .map(function (i) { return { uri: i.uri, name: i.name || "Плейлист" }; });
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
    if (!uri) throw new Error("Не удалось создать плейлист");
    var uris = tracks.map(function (t) { return t.uri; });
    for (var i = 0; i < uris.length; i += 50) {
      await PF.PlaylistAPI.add(uri, uris.slice(i, i + 50), {});
    }
    return uri;
  },

  /* Служебный плейлист, который всегда содержит текущую волну.
   * Играем его как контекст — тогда next/prev/очередь/шаффл работают нативно. */
  livePlaylist: async function (tracks) {
    var playlists = await api.playlists();
    var live = playlists.filter(function (p) { return p.name === "Волна · Live"; })[0];
    var uri = live ? live.uri : await PF.RootlistAPI.createPlaylist("Волна · Live", {});
    if (!uri) throw new Error("Не удалось создать плейлист «Волна · Live»");

    try {
      var c = await PF.PlaylistAPI.getContents(uri, { limit: 400 });
      var items = ((c && c.items) || [])
        .filter(function (x) { return x && x.uid; })
        .map(function (x) { return { uid: x.uid, uri: x.uri }; });
      if (items.length) await PF.PlaylistAPI.remove(uri, items);
    } catch (e) {
      console.warn("[wave] clear live playlist failed", e);
    }

    var uris = tracks.map(function (t) { return t.uri; });
    for (var i = 0; i < uris.length; i += 50) {
      await PF.PlaylistAPI.add(uri, uris.slice(i, i + 50), {});
    }
    return uri;
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
  var lastArtist = null;

  while (out.length < opts.length && sorted.length) {
    var chosen = null;
    var chosenIdx = 0;
    var windowSize = Math.min(sorted.length, 12);
    var tries = Math.min(windowSize, 7);

    for (var k = 0; k < tries; k++) {
      var cand = sorted[k];
      var key = primaryArtist(cand);
      if ((perArtist[key] || 0) >= opts.diversity) continue;
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
      if (before !== pool.length) console.info("[wave] отфильтровано знакомых треков:", before - pool.length);
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
      ? "Всё, что нашлось, уже есть в твоих плейлистах и лайках. Отключи «Только новое» или добавь источники."
      : "Spotify не вернул рекомендаций. Попробуй другой источник.");
  }

  pool.forEach(function (t) { t._score = scoreTrack(t, opts); });
  var chosen = pickTracks(pool, opts);

  var labels = {};
  labels[api.likedContext()] = "из твоих лайков";
  try {
    var pls = await api.playlists();
    pls.forEach(function (p) { labels[p.uri] = "из «" + p.name + "»"; });
  } catch (e) {}

  chosen.forEach(function (t) {
    t.reason = (opts.labels && opts.labels[t._src]) || labels[t._src] || "подобрано для тебя";
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
    Spicetify.showNotification("Волна продолжается: +" + extra.length);
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
  Spicetify.showNotification("Волна запомнила: нравится");
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
  Spicetify.showNotification("Артист убран из волны");
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
      return { uri: uri, name: names[uri] || uri.split(":").pop(), score: (a.completes || 0) + (a.likes || 0) - (a.skips || 0) };
    })
    .sort(function (x, y) { return y.score - x.score; })
    .slice(0, limit || 6);
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
      h("div", { className: "wave-row-sub", title: artists }, artists)
    ),
    h("div", { className: "wave-row-dur" }, fmtDuration(t.durationMs)),
    h("div", { className: "wave-row-actions" },
      h("button", { className: "wave-icon", title: "Нравится", onClick: function () { likeTrack(t); } }, "\u2665"),
      h("button", { className: "wave-icon", title: "Убрать из волны", onClick: function () { dislikeTrack(t); } }, "\u2715"),
      h("button", { className: "wave-icon", title: "Больше не этот артист", onClick: function () { muteArtist(t); } }, "\u2298"),
      h("button", { className: "wave-icon play", title: "Играть", onClick: function () { props.onPlay ? props.onPlay(t) : Spicetify.Player.playUri(t.uri); } }, "\u25B6")
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

  var likedUri = api.likedContext();
  var allSources = [{ uri: likedUri, name: "Мой микс", icon: "\u2726" }].concat(
    playlists.list.map(function (p) { return { uri: p.uri, name: p.name, icon: "\u2261" }; })
  );

  if (!S.sources) S.sources = [likedUri];
  var selected = S.sources.filter(function (u) { return allSources.some(function (s) { return s.uri === u; }); });
  if (!selected.length) selected = [likedUri];

  function toggleSource(uri) {
    var idx = S.sources.indexOf(uri);
    if (idx >= 0) {
      if (S.sources.length === 1) { Spicetify.showNotification("Оставь хотя бы один источник"); return; }
      S.sources.splice(idx, 1);
    } else {
      S.sources.push(uri);
    }
    persist(); notify();
  }

  function setSetting(key, value) {
    S.settings[key] = value;
    persist(); notify();
  }

  function refreshKnown() {
    setBusy("Обновляю список знакомого…");
    api.known(true).then(function (k) {
      S.knownCount = k.count;
      persist(); notify();
      setBusy("");
      Spicetify.showNotification("Знакомых треков: " + k.count);
    }).catch(function (e) {
      setBusy("");
      setError(String((e && e.message) || e));
    });
  }

  async function run(sourcesOverride) {
    if (busy) return;
    setError("");
    setBusy("Собираю рекомендации…");
    try {
      var sources = (sourcesOverride && sourcesOverride.length) ? sourcesOverride : selected;
      var opts = buildOpts();
      var tracks = await generate(sources, opts);
      if (!tracks.length) throw new Error("Пустая волна. Попробуй другой источник.");
      setBusy("Готовлю очередь…");
      var liveUri = await api.livePlaylist(tracks);
      S.wave = { tracks: tracks, sources: sources.slice(), createdAt: now(), liveUri: liveUri };
      persist(); notify();
      setBusy("Запускаю…");
      await api.playContext(liveUri);
      setBusy("");
      Spicetify.showNotification("Волна собрана: " + tracks.length + " треков");
    } catch (e) {
      console.error("[wave]", e);
      setError(String((e && e.message) || e));
      setBusy("");
    }
  }

  async function more() {
    if (busy) return;
    setBusy("Добавляю…");
    try {
      var opts = buildOpts(Math.max(10, Math.round(S.settings.length / 2)));
      var extra = await generate(selected, opts);
      if (!extra.length) throw new Error("Не удалось подобрать новые треки.");
      var all = (S.wave && S.wave.tracks ? S.wave.tracks : []).concat(extra);
      setBusy("Продлеваю…");
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

  async function save() {
    if (!S.wave || !S.wave.tracks.length) return;
    setBusy("Сохраняю…");
    try {
      var d = new Date();
      var name = "Волна · " + d.getDate() + "." + (d.getMonth() + 1) + " " +
        String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      await api.createPlaylist(name, S.wave.tracks);
      Spicetify.showNotification("Плейлист «" + name + "» готов — он уже на телефоне");
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

  var curItem = Spicetify.Player.data && Spicetify.Player.data.item;
  var curUri = curItem && curItem.uri;
  var st = stats();
  var wave = S.wave && S.wave.tracks ? S.wave.tracks : [];
  var heroCover = wave.length && wave[0].album ? wave[0].album.image : (curItem && curItem.album && curItem.album.images && curItem.album.images[0] ? curItem.album.images[0].url : "");

  return h("div", { className: "wave-app" },
    h("div", { className: "wave-hero", style: heroCover ? { "--wave-hero": 'url("' + heroCover + '")' } : {} },
      h("div", { className: "wave-hero-glow" }),
      h("div", { className: "wave-orb", style: heroCover ? { backgroundImage: 'url("' + heroCover + '")' } : {} },
        heroCover ? null : h("span", { className: "wave-orb-mark" }, "~")),
      h("div", { className: "wave-hero-text" },
        h("div", { className: "wave-kicker" }, "персональное радио"),
        h("h1", { className: "wave-title" }, "Волна"),
        h("div", { className: "wave-subtitle" },
          wave.length
            ? wave.length + " треков · " + (S.wave && S.wave.sources ? S.wave.sources.length : 0) + " источн. · собрана " + new Date(S.wave.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
            : "бесконечный поток по твоему вкусу"
        )
      ),
      h("div", { className: "wave-hero-actions" },
        h("button", { className: "wave-btn primary", disabled: !!busy, onClick: run },
          busy ? busy : (wave.length ? "Новая волна" : "Собрать волну")),
        wave.length ? h("button", { className: "wave-btn", disabled: !!busy, onClick: more }, "Ещё") : null,
        wave.length ? h("button", { className: "wave-btn", disabled: !!busy, onClick: save }, "В плейлист") : null
      )
    ),

    error ? h("div", { className: "wave-error" }, error) : null,

    h("div", { className: "wave-section" },
      h("div", { className: "wave-section-head" },
        h("h2", null, "Источники"),
        h("button", { className: "wave-link", onClick: function () { setShowAdvanced(!showAdvanced); } },
          showAdvanced ? "Скрыть настройки" : "Настройки")
      ),
      h("div", { className: "wave-chips" },
        allSources.map(function (s) {
          var on = selected.indexOf(s.uri) >= 0;
          return h("button", {
            key: s.uri,
            className: "wave-chip" + (on ? " on" : ""),
            onClick: function () { toggleSource(s.uri); }
          }, h("span", { className: "wave-chip-icon" }, s.icon), s.name);
        }),
        playlists.loading ? h("span", { className: "wave-muted" }, "загружаю плейлисты…") : null
      ),
      h("div", { className: "wave-hint" }, "Выбери один плейлист — получишь волну в его настроении. Несколько — микс."),

      h("div", { className: "wave-mood" },
        h("span", { className: "wave-mood-label" }, "Настроение"),
        h("div", { className: "wave-chips" },
          [["any", "Любое"], ["calm", "Спокойное"], ["mid", "Среднее"], ["energetic", "Энергичное"]].map(function (pair) {
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
        h(Slider, { label: "Новизна", value: S.settings.novelty, min: 0, max: 1, step: 0.05, onChange: function (v) { setSetting("novelty", v); } }),
        h(Slider, { label: "Разнообразие", value: S.settings.diversity, min: 1, max: 5, step: 1, onChange: function (v) { setSetting("diversity", v); } }),
        h(Slider, { label: "Длина", value: S.settings.length, min: 10, max: 60, step: 5, onChange: function (v) { setSetting("length", v); } }),
        h(Slider, { label: "Эксперимент", value: S.settings.explore, min: 0, max: 1, step: 0.05, onChange: function (v) { setSetting("explore", v); } }),
        h("label", { className: "wave-toggle" },
          h("input", {
            type: "checkbox",
            checked: !!S.settings.onlyNew,
            onChange: function (e) { setSetting("onlyNew", e.target.checked); }
          }),
          h("span", null, "Только новое — не брать треки из моих плейлистов и лайков")
        ),
        h("label", { className: "wave-toggle" },
          h("input", {
            type: "checkbox",
            checked: S.settings.autoExtend !== false,
            onChange: function (e) { setSetting("autoExtend", e.target.checked); }
          }),
          h("span", null, "Автопродление — добирать треки, когда волна заканчивается")
        ),
        h("div", { className: "wave-known" },
          h("span", null, S.knownCount ? "Исключаю знакомых треков: " + S.knownCount : "Список знакомых треков соберётся при первой генерации"),
          h("button", { className: "wave-link", onClick: refreshKnown }, "обновить")
        )
      ) : null
    ),

    wave.length ? h("div", { className: "wave-section" },
      h("div", { className: "wave-section-head" },
        h("h2", null, "Очередь волны"),
        h("span", { className: "wave-muted" }, curUri ? "сейчас: " + (curItem.name || "") : "")
      ),
      h("div", { className: "wave-list" },
        wave.map(function (t, i) {
          return h(TrackRow, { key: t.uri + i, track: t, index: i, current: curUri === t.uri, onPlay: playTrack });
        })
      )
    ) : h("div", { className: "wave-empty" },
      h("div", { className: "wave-empty-orb" }, "~"),
      h("div", null,
        h("h3", null, "Пока пусто"),
        h("p", null, "Нажми «Собрать волну» — Spotify подберёт треки по твоим лайкам и плейлистам, а Волна запомнит, что ты слушаешь и что пролистываешь.")
      )
    ),

    h("div", { className: "wave-foot" },
      h("span", null, "прослушано: " + st.plays + " · скипов: " + st.skips + " · артистов: " + st.artists),
      h("span", { className: "wave-muted" }, "Волна учится на скипах и лайках")
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

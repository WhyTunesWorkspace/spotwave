/* Волна — фоновый трекер прослушиваний + пункт «Волна по плейлисту» в меню.
 * Грузится как расширение Spicetify при старте клиента, поэтому Волна учится,
 * даже когда её вкладка не открыта. Пишет только события в localStorage,
 * а приложение само их "переваривает".
 */
(function () {
  var KEY = "wave.events";
  var MAX = 800;
  var current = null;
  var installed = false;
  var menuInstalled = false;

  function push(ev) {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      arr.push(ev);
      if (arr.length > MAX) arr = arr.slice(arr.length - MAX);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {}
    submitListen(ev);
  }

  function waveSettings() {
    try {
      var s = JSON.parse(localStorage.getItem("wave.v1") || "{}");
      return s.settings || {};
    } catch (e) {
      return {};
    }
  }

  function submitListen(ev) {
    var st = waveSettings();
    if (!st.scrobbleEnabled || !st.scrobbleToken) return;
    if (!ev || !ev.dur) return;
    if (ev.played < Math.min(ev.dur * 0.5, 240000) || ev.played < 30000) return;

    var body = {
      listen_type: "single",
      payload: [{
        listened_at: Math.floor((ev.at || Date.now()) / 1000),
        track_metadata: {
          artist_name: (ev.artistNames || []).join(", "),
          track_name: ev.name || "",
          release_name: ev.album || "",
          additional_info: { submission_client: "Wave for Spotify", media_player: "Spotify" }
        }
      }]
    };

    try {
      fetch("https://api.listenbrainz.org/1/submit-listens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token " + st.scrobbleToken
        },
        body: JSON.stringify(body)
      }).catch(function (e) { console.warn("[wave] scrobble failed", e); });
    } catch (e) {
      console.warn("[wave] scrobble failed", e);
    }
  }

  function waveLanguage() {
    try {
      var st = JSON.parse(localStorage.getItem("wave.v1") || "{}");
      var pref = (st.settings && st.settings.lang) || "auto";
      if (pref === "ru" || pref === "en") return pref;
    } catch (e) {}
    try {
      var loc = Spicetify.Locale && Spicetify.Locale.getLocale ? Spicetify.Locale.getLocale() : "";
      if (loc) return /^ru/i.test(loc) ? "ru" : "en";
    } catch (e) {}
    return /^ru/i.test((typeof navigator !== "undefined" && navigator.language) || "en") ? "ru" : "en";
  }

  function tr(ru, en) {
    return waveLanguage() === "ru" ? ru : en;
  }

  function installMenu() {
    if (menuInstalled) return true;
    if (!window.Spicetify || !Spicetify.ContextMenu || !Spicetify.ContextMenu.Item) return false;
    menuInstalled = true;

    try {
      var icon = null;
      try {
        var icons = Spicetify.SVGIcons || {};
        icon = icons.radio || icons.queue || icons.volume || null;
      } catch (e) {}

      function go() {
        try { Spicetify.Platform.History.push("/wave"); } catch (e) {}
      }

      function setPending(uri) {
        try { localStorage.setItem("wave.pendingSource", uri); } catch (e) {}
        go();
      }

      function setSeed(type, uri) {
        try { localStorage.setItem("wave.seed", JSON.stringify({ type: type, uri: uri })); } catch (e) {}
        go();
      }

      function one(uris, prefix) {
        return uris && uris.length === 1 && String(uris[0]).indexOf(prefix) === 0;
      }

      var defs = [
        {
          name: tr("Волна по плейлисту", "Wave from this playlist"),
          run: function (u) { setPending(u[0]); },
          ok: function (u) {
            return one(u, "spotify:playlist:") && String(u[0]).indexOf("spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ") !== 0;
          }
        },
        {
          name: tr("Волна по этому треку", "Wave from this track"),
          run: function (u) { setSeed("track", u[0]); },
          ok: function (u) { return one(u, "spotify:track:"); }
        },
        {
          name: tr("Волна по исполнителю", "Wave by this artist"),
          run: function (u) { setSeed("artist", u[0]); },
          ok: function (u) { return one(u, "spotify:artist:"); }
        },
        {
          name: tr("Волна по альбому", "Wave from this album"),
          run: function (u) { setSeed("album", u[0]); },
          ok: function (u) { return one(u, "spotify:album:"); }
        }
      ];

      defs.forEach(function (def) {
        try {
          var item = new Spicetify.ContextMenu.Item(
            def.name,
            function (uris) { def.run(uris || []); },
            def.ok,
            icon
          );
          item.register();
        } catch (e) {
          console.warn("[wave] menu item failed", def.name, e);
        }
      });
    } catch (e) {
      console.warn("[wave] context menu failed", e);
      menuInstalled = false;
    }

    return menuInstalled;
  }

  function install() {
    if (installed) return true;
    if (!window.Spicetify || !Spicetify.Player || !Spicetify.Player.addEventListener) return false;
    installed = true;

    var it0 = Spicetify.Player.data && Spicetify.Player.data.item;
    if (it0 && it0.uri) {
      current = {
        uri: it0.uri,
        name: it0.name,
        artists: (it0.artists || []).map(function (a) { return a.uri; }).filter(Boolean),
        artistNames: (it0.artists || []).map(function (a) { return a.name; }).filter(Boolean),
        album: (it0.album && it0.album.name) || "",
        played: 0,
        dur: (it0.duration && it0.duration.milliseconds) || 0,
        at: Date.now()
      };
    }

    Spicetify.Player.addEventListener("songchange", function () {
      var it = Spicetify.Player.data && Spicetify.Player.data.item;

      if (current && current.uri && (!it || it.uri !== current.uri) && current.played > 3000) {
        push(current);
      }

      if (it && it.uri) {
        current = {
          uri: it.uri,
          name: it.name,
          artists: (it.artists || []).map(function (a) { return a.uri; }).filter(Boolean),
          artistNames: (it.artists || []).map(function (a) { return a.name; }).filter(Boolean),
          album: (it.album && it.album.name) || "",
          played: 0,
          dur: (it.duration && it.duration.milliseconds) || 0,
          at: Date.now()
        };
      } else {
        current = null;
      }
    });

    Spicetify.Player.addEventListener("onprogress", function (e) {
      if (!current) return;
      var p = e && typeof e.data === "number" ? e.data : Spicetify.Player.getProgress();
      if (typeof p === "number" && p > 0) current.played = p;
    });

    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    var a = install();
    var b = installMenu();
    if ((a && b) || tries > 240) clearInterval(timer);
  }, 500);
})();

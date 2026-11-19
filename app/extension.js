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
          name: "Волна по плейлисту",
          run: function (u) { setPending(u[0]); },
          ok: function (u) {
            return one(u, "spotify:playlist:") && String(u[0]).indexOf("spotify:playlist:37i9dQZF1F5p3rmiWPIYgZ") !== 0;
          }
        },
        {
          name: "Волна по этому треку",
          run: function (u) { setSeed("track", u[0]); },
          ok: function (u) { return one(u, "spotify:track:"); }
        },
        {
          name: "Волна по исполнителю",
          run: function (u) { setSeed("artist", u[0]); },
          ok: function (u) { return one(u, "spotify:artist:"); }
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

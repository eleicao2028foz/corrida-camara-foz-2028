(function () {
  "use strict";

  var LAT = -25.5163;
  var LON = -54.5854;
  var API =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    LAT +
    "&longitude=" +
    LON +
    "&current=weather_code,cloud_cover,precipitation,is_day&timezone=America/Sao_Paulo";
  var REFRESH_MS = 10 * 60 * 1000;
  var MODES = { sol: 1, nublado: 1, chuva: 1, tempestade: 1, neblina: 1 };

  var forced = readParam("clima");
  var holdLightning = readFlag("relampago");
  var mode = forced || "sol";
  var lastWeather = null;
  var reduce = false;
  var mobile = false;
  var hidden = false;
  var ready = false;

  var veil = null;
  var canvas = null;
  var ctx = null;
  var dpr = 1;
  var w = 0;
  var h = 0;

  var raf = 0;
  var lastT = 0;
  var drops = [];
  var shadows = [];
  var mist = [];
  var stormClouds = [];
  var lamps = [];
  var lampsDirty = true;

  var flash = {
    on: false,
    hold: holdLightning === true,
    t0: 0,
    bolts: [],
    next: 0,
    peak: 0
  };

  function readParam(name) {
    try {
      var v = (new URLSearchParams(location.search).get(name) || "").toLowerCase().trim();
      return MODES[v] ? v : null;
    } catch (e) {
      return null;
    }
  }

  function readFlag(name) {
    try {
      var v = (new URLSearchParams(location.search).get(name) || "").toLowerCase().trim();
      if (v === "1" || v === "on" || v === "sim") return true;
      if (v === "0" || v === "off" || v === "nao" || v === "não") return false;
    } catch (e) {}
    return null;
  }

  function mapWmo(code, cloud, precip) {
    var c = Number(code);
    if (c === 45 || c === 48) return "neblina";
    if (c === 95 || c === 96 || c === 99 || c === 82) return "tempestade";
    if ((c >= 51 && c <= 67) || (c >= 71 && c <= 77) || (c >= 80 && c <= 86)) return "chuva";
    if (c === 2 || c === 3) return "nublado";
    if (c === 0 || c === 1) return "sol";
    if (precip > 0.2) return "chuva";
    if (cloud >= 50) return "nublado";
    return "sol";
  }

  function nightPhase() {
    var n = window.__FOZ_NIGHT__;
    return n && typeof n.phase === "number" ? n.phase : 0;
  }

  function prefersReduce() {
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function isMobile() {
    return window.innerWidth <= 640 || (window.matchMedia && matchMedia("(max-width: 640px)").matches);
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function setMode(m) {
    if (!MODES[m]) m = "sol";
    mode = m;
    document.body.setAttribute("data-clima", m);
    rebuild();
    kickLoop();
    publish();
  }

  function publish() {
    window.__FOZ_CLIMA__ = {
      mode: mode,
      forced: forced,
      weather: lastWeather,
      reduced: reduce,
      setMode: function (m) {
        forced = MODES[m] ? m : null;
        setMode(forced || "sol");
      },
      refreshLamps: function () { lampsDirty = true; refreshLamps(); return lamps.length; },
      lampCount: function () { return lamps.length; },
      holdFlash: function (on) {
        flash.hold = !!on;
        if (flash.hold) {
          if (!flash.bolts.length) spawnFlash(true);
          flash.t0 = performance.now() - 90;
          flash.on = true;
          flash.peak = 1;
        } else {
          flash.on = false;
          flash.peak = 0;
          flash.bolts = [];
          flash.next = performance.now() + 4000;
        }
        draw(performance.now(), 0);
      },
      refresh: fetchWeather
    };
  }

  function setupDom() {
    veil = document.getElementById("clima-veil");
    canvas = document.getElementById("clima-canvas");
    if (!veil) {
      veil = document.createElement("div");
      veil.id = "clima-veil";
      veil.setAttribute("aria-hidden", "true");
      document.body.appendChild(veil);
    }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "clima-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      hidden = document.hidden;
      if (!hidden) {
        lastT = 0;
        lampsDirty = true;
        kickLoop();
      }
    });
    try {
      var mq = matchMedia("(prefers-reduced-motion: reduce)");
      reduce = mq.matches;
      if (mq.addEventListener) mq.addEventListener("change", function () { reduce = mq.matches; rebuild(); kickLoop(); });
    } catch (e) {
      reduce = prefersReduce();
    }
  }

  function resize() {
    mobile = isMobile();
    var cap = mobile ? 1.25 : 1.5;
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuild();
    lampsDirty = true;
  }

  function counts() {
    if (mobile) {
      return { dropsRain: 90, dropsStorm: 150, shadows: 3, mist: 3, storm: 3 };
    }
    return { dropsRain: 150, dropsStorm: 240, shadows: 5, mist: 4, storm: 5 };
  }

  function slantFor(m) {
    return m === "tempestade" ? 0.48 : 0.18;
  }

  function rebuild() {
    var n = counts();
    drops = [];
    shadows = [];
    mist = [];
    stormClouds = [];
    if (mode === "sol") {
      if (ctx) ctx.clearRect(0, 0, w, h);
      return;
    }
    var i, slant = slantFor(mode);
    if (mode === "chuva" || mode === "tempestade") {
      var nd = mode === "tempestade" ? n.dropsStorm : n.dropsRain;
      var lenA = mode === "tempestade" ? 22 : 16;
      var lenB = mode === "tempestade" ? 46 : 30;
      var spdA = mode === "tempestade" ? 860 : 540;
      var spdB = mode === "tempestade" ? 1280 : 860;
      for (i = 0; i < nd; i++) {
        drops.push({
          x: Math.random() * (w + 80) - 40,
          y: Math.random() * (h + 40) - 20,
          len: rand(lenA, lenB),
          spd: rand(spdA, spdB),
          w: mode === "tempestade" ? rand(1.15, 1.85) : rand(1.0, 1.55),
          a: mode === "tempestade" ? rand(0.42, 0.70) : rand(0.40, 0.66)
        });
      }
    }
    if (mode === "nublado" || mode === "chuva" || mode === "tempestade") {
      var ns = n.shadows;
      for (i = 0; i < ns; i++) {
        shadows.push({
          x: Math.random() * w,
          y: Math.random() * h,
          rx: rand(w * 0.22, w * 0.42),
          ry: rand(h * 0.10, h * 0.20),
          a: mode === "tempestade" ? rand(0.14, 0.24) : rand(0.10, 0.20),
          vx: rand(10, 22) * (Math.random() < 0.5 ? -1 : 1),
          vy: rand(2, 7) * (Math.random() < 0.5 ? -1 : 1)
        });
      }
    }
    if (mode === "tempestade") {
      for (i = 0; i < n.storm; i++) {
        stormClouds.push({
          x: (w / n.storm) * (i + 0.3) + rand(-40, 40),
          y: rand(-h * 0.04, h * 0.12),
          rx: rand(w * 0.28, w * 0.48),
          ry: rand(h * 0.10, h * 0.20),
          a: rand(0.16, 0.28),
          vx: rand(6, 14) * (i % 2 ? 1 : -1)
        });
      }
    }
    if (mode === "neblina") {
      for (i = 0; i < n.mist; i++) {
        mist.push({
          x: Math.random() * w,
          y: h * (0.35 + i * 0.16) + rand(-30, 30),
          rx: rand(w * 0.35, w * 0.7),
          ry: rand(h * 0.14, h * 0.28),
          a: rand(0.10, 0.20),
          vx: rand(4, 10) * (i % 2 ? 1 : -1)
        });
      }
    }
    /* slant stored implicitly via mode */
    void slant;
  }

  function tickDrops(dt) {
    var slant = slantFor(mode);
    var i, d, dx, dy;
    for (i = 0; i < drops.length; i++) {
      d = drops[i];
      dy = d.spd * dt;
      dx = d.spd * slant * dt;
      d.y += dy;
      d.x += dx;
      if (d.y > h + d.len || d.x > w + 60) {
        d.y = -d.len - Math.random() * 40;
        d.x = Math.random() * (w + 80) - 40 - slant * 40;
      }
    }
  }

  function tickBlobs(list, dt, wrapPad) {
    var i, b;
    for (i = 0; i < list.length; i++) {
      b = list[i];
      b.x += b.vx * dt;
      if (b.vy) b.y += b.vy * dt;
      if (b.x > w + wrapPad) b.x = -wrapPad;
      if (b.x < -wrapPad) b.x = w + wrapPad;
      if (b.vy) {
        if (b.y > h + wrapPad * 0.5) b.y = -wrapPad * 0.4;
        if (b.y < -wrapPad * 0.5) b.y = h + wrapPad * 0.4;
      }
    }
  }

  function spawnFlash(force) {
    flash.bolts = [makeBolt(w * rand(0.22, 0.72))];
    if (Math.random() < 0.4 || force) {
      flash.bolts.push(makeBolt(flash.bolts[0][0].x + rand(-80, 80)));
    }
    flash.t0 = performance.now();
    flash.on = true;
    flash.peak = 1;
    flash.next = performance.now() + rand(2800, 6800);
  }

  function makeBolt(x0) {
    var pts = [];
    var x = x0;
    var y = -12;
    var target = h * rand(0.42, 0.72);
    var segs = 11 + (Math.random() * 5) | 0;
    var i, branch = null, branch2 = null;
    pts.push({ x: x, y: y });
    for (i = 0; i < segs; i++) {
      x += rand(-16, 16);
      y += (target / segs) * rand(0.85, 1.15);
      pts.push({ x: x, y: y });
      if (!branch && i > 3 && i < segs - 2 && Math.random() < 0.55) {
        branch = branchFrom(x, y, 3 + (Math.random() * 3) | 0);
      } else if (!branch2 && branch && i > 6 && Math.random() < 0.35) {
        branch2 = branchFrom(x, y, 2 + (Math.random() * 2) | 0);
      }
    }
    if (branch) pts.push({ branch: branch });
    if (branch2) pts.push({ branch: branch2 });
    return pts;
  }

  function branchFrom(x, y, n) {
    var pts = [{ x: x, y: y }];
    var i, dir = Math.random() < 0.5 ? -1 : 1;
    for (i = 0; i < n; i++) {
      x += dir * rand(8, 22);
      y += rand(14, 28);
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  function flashIntensity(now) {
    if (flash.hold) return 0.92;
    if (!flash.on) return 0;
    var age = now - flash.t0;
    /* Double flicker: strong, dip, weaker, fade. */
    var v = 0;
    if (age < 70) v = age / 70;
    else if (age < 140) v = 1 - (age - 70) / 140 * 0.55;
    else if (age < 200) v = 0.45 + ((age - 140) / 60) * 0.4;
    else if (age < 420) v = 0.85 * (1 - (age - 200) / 220);
    else {
      flash.on = false;
      v = 0;
    }
    flash.peak = v;
    return v;
  }

  function getMap() {
    var s = window.__FOZ_CITY_SIM__;
    return s && s.map ? s.map : null;
  }

  var lastNightSeen = -1;

  function refreshLamps() {
    lamps = [];
    lampsDirty = false;
    var map = getMap();
    var night = nightPhase();
    if (!map || night < 0.12) return;
    if (mode !== "chuva" && mode !== "tempestade") return;
    var feats = [];
    try {
      if (map.getLayer && (map.getLayer("night-lamps") || map.getLayer("night-lamp-glow"))) {
        var layers = [];
        if (map.getLayer("night-lamp-glow")) layers.push("night-lamp-glow");
        else if (map.getLayer("night-lamps")) layers.push("night-lamps");
        feats = map.queryRenderedFeatures({ layers: layers }) || [];
      }
    } catch (e) {
      feats = [];
    }
    if (!feats.length) {
      try {
        feats = map.querySourceFeatures("night-lamps") || [];
      } catch (e2) {
        feats = [];
      }
    }
    var i, f, p, key, seen = {}, max = mobile ? 60 : 120;
    var z = map.getZoom ? map.getZoom() : 15;
    var scale = Math.max(0.7, Math.min(2.4, Math.pow(2, z - 15.2)));
    for (i = 0; i < feats.length && lamps.length < max; i++) {
      f = feats[i];
      if (!f || !f.geometry) continue;
      var c = f.geometry.type === "Point" ? f.geometry.coordinates : null;
      if (!c && f.geometry.coordinates) c = f.geometry.coordinates;
      if (!c || typeof c[0] !== "number") continue;
      p = map.project(c);
      if (p.x < -50 || p.y < -30 || p.x > w + 50 || p.y > h + 30) continue;
      key = (p.x | 0) + "," + (p.y | 0);
      if (seen[key]) continue;
      seen[key] = 1;
      lamps.push({ x: p.x, y: p.y, s: scale });
    }
  }

  function bindMap() {
    var map = getMap();
    if (!map || map.__climaBound) return;
    map.__climaBound = true;
    var dirty = function () { lampsDirty = true; };
    map.on("move", dirty);
    map.on("zoom", dirty);
    map.on("pitch", dirty);
    map.on("rotate", dirty);
    map.on("sourcedata", function (e) {
      if (e && e.sourceId === "night-lamps") lampsDirty = true;
    });
  }

  function drawShadows(list, color) {
    var i, b, g;
    for (i = 0; i < list.length; i++) {
      b = list[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(1, b.ry / b.rx);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
      g.addColorStop(0, color.replace("A", (b.a).toFixed(3)));
      g.addColorStop(0.55, color.replace("A", (b.a * 0.45).toFixed(3)));
      g.addColorStop(1, color.replace("A", "0"));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, b.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawRain(night) {
    var slant = slantFor(mode);
    var i, d, dx, col;
    if (night > 0.4) col = "rgba(186,210,235,";
    else col = "rgba(168,196,222,";
    ctx.lineCap = "round";
    for (i = 0; i < drops.length; i++) {
      d = drops[i];
      dx = d.len * slant;
      ctx.strokeStyle = col + d.a.toFixed(3) + ")";
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + dx, d.y + d.len);
      ctx.stroke();
    }
  }

  function drawReflections(night) {
    if (night < 0.12 || !lamps.length) return;
    var wet = mode === "tempestade" ? 1 : 0.88;
    var i, L, g, len, a, s, puddle;
    for (i = 0; i < lamps.length; i++) {
      L = lamps[i];
      /* Perspectiva: postes ao fundo (topo da tela, com pitch) ficam menores,
         senão o reflexo vira uma cortina dourada no horizonte. */
      var dist = Math.max(0.12, Math.min(1, L.y / (h * 0.82)));
      s = (L.s || 1) * (0.22 + 0.78 * dist);
      len = (12 + 16 * wet) * s;
      a = (0.24 + 0.18 * night) * wet * (0.35 + 0.65 * dist);
      if (dist < 0.22) continue;
      ctx.save();
      ctx.translate(L.x, L.y + 3 * s);
      puddle = ctx.createRadialGradient(0, 8 * s, 0, 0, 8 * s, 14 * s);
      puddle.addColorStop(0, "rgba(255, 214, 140," + (a * 0.55).toFixed(3) + ")");
      puddle.addColorStop(1, "rgba(255, 200, 120, 0)");
      ctx.fillStyle = puddle;
      ctx.beginPath();
      ctx.ellipse(0, 8 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, "rgba(255, 220, 150," + (a * 0.95).toFixed(3) + ")");
      g.addColorStop(0.4, "rgba(255, 200, 120," + (a * 0.42).toFixed(3) + ")");
      g.addColorStop(1, "rgba(255, 180, 90, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-2.4 * s, 0);
      ctx.lineTo(2.4 * s, 0);
      ctx.lineTo(5.8 * s, len);
      ctx.lineTo(-5.8 * s, len);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBoltPts(pts, alpha, width) {
    var i, p, started = false;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.branch) continue;
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    for (i = 0; i < pts.length; i++) {
      if (pts[i].branch) drawBoltPts(pts[i].branch, alpha * 0.8, width * 0.7);
    }
  }

  function drawLightning(v, night) {
    if (v <= 0.01) return;
    var wash = night > 0.4 ? 0.20 : 0.26;
    ctx.save();
    ctx.fillStyle = "rgba(228, 238, 255," + (v * wash).toFixed(3) + ")";
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "lighter";
    var i;
    ctx.strokeStyle = "rgba(170, 205, 255, 1)";
    for (i = 0; i < flash.bolts.length; i++) {
      drawBoltPts(flash.bolts[i], Math.min(1, v * 0.28), 5.5);
    }
    ctx.strokeStyle = "rgba(230, 242, 255, 1)";
    for (i = 0; i < flash.bolts.length; i++) {
      drawBoltPts(flash.bolts[i], Math.min(1, v * 0.7), 2.2);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    for (i = 0; i < flash.bolts.length; i++) {
      drawBoltPts(flash.bolts[i], Math.min(1, v * 0.95), 1.15);
    }
    ctx.restore();
  }

  function draw(now, dt) {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    if (mode === "sol") return;

    var night = nightPhase();
    if ((night >= 0.12) !== (lastNightSeen >= 0.12) || Math.abs(night - lastNightSeen) > 0.08) {
      lampsDirty = true;
    }
    lastNightSeen = night;
    if (lampsDirty) refreshLamps();

    if (!reduce && dt > 0) {
      if (drops.length) tickDrops(dt);
      if (shadows.length) tickBlobs(shadows, dt, 180);
      if (stormClouds.length) tickBlobs(stormClouds, dt, 220);
      if (mist.length) tickBlobs(mist, dt, 260);
    }

    if (mode === "tempestade") {
      drawShadows(stormClouds, "rgba(8,12,24,A)");
    }
    if (shadows.length && (mode === "nublado" || mode === "chuva" || mode === "tempestade")) {
      var sc = night > 0.4 ? "rgba(6,10,20,A)" : "rgba(28,36,48,A)";
      drawShadows(shadows, sc);
    }
    if (mode === "neblina") {
      var mc = night > 0.4 ? "rgba(150,168,186,A)" : "rgba(232,236,240,A)";
      drawShadows(mist, mc);
    }

    if (mode === "chuva" || mode === "tempestade") {
      drawReflections(night);
      if (drops.length) drawRain(night);
    }

    if (mode === "tempestade" && !reduce) {
      if (flash.hold && !flash.bolts.length) spawnFlash(true);
      if (!flash.hold && !flash.on && now >= flash.next) spawnFlash(false);
      drawLightning(flashIntensity(now), night);
    } else if (mode === "tempestade" && flash.hold) {
      if (!flash.bolts.length) spawnFlash(true);
      drawLightning(0.92, night);
    }
  }

  function loop(now) {
    raf = 0;
    if (hidden || mode === "sol") return;
    if (!lastT) lastT = now;
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    draw(now, dt);
    if (needsLoop()) raf = requestAnimationFrame(loop);
  }

  function needsLoop() {
    if (mode === "sol" || hidden) return false;
    if (reduce && !(mode === "tempestade" && flash.hold)) return false;
    return true;
  }

  function kickLoop() {
    if (raf) return;
    if (!needsLoop()) {
      draw(performance.now(), 0);
      return;
    }
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }

  function fetchWeather() {
    if (forced) return Promise.resolve(mode);
    return fetch(API, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("meteo");
        return r.json();
      })
      .then(function (j) {
        lastWeather = (j && j.current) || {};
        setMode(mapWmo(lastWeather.weather_code, lastWeather.cloud_cover, lastWeather.precipitation));
        publish();
        return mode;
      })
      .catch(function () {
        lastWeather = null;
        setMode("sol");
        publish();
        return "sol";
      });
  }

  function whenMapReady(cb) {
    var n = 0;
    (function wait() {
      var s = window.__FOZ_CITY_SIM__;
      if (s && s.ready) return cb();
      n += 1;
      if (n > 400) return cb();
      setTimeout(wait, 50);
    })();
  }

  function boot() {
    setupDom();
    document.body.setAttribute("data-clima", mode);
    if (holdLightning && mode === "tempestade") flash.hold = true;
    publish();
    if (forced) setMode(forced);
    else setMode("sol");

    fetchWeather();
    setInterval(function () {
      if (!forced) fetchWeather();
    }, REFRESH_MS);

    whenMapReady(function () {
      ready = true;
      bindMap();
      lampsDirty = true;
      kickLoop();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

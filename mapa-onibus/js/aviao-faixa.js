/* Banner plane over Foz. Screen-aligned overlay (aviao-faixa-v14). */
(function () {
  "use strict";

  var DATA_URL = "data/aviao-faixa.json";
  var REFRESH_MS = 10 * 60 * 1000;
  var FALLBACK = "FOZ DO IGUAÇU";
  var SPEED_MS = 130; /* calm banner-plane cruise (about half of v12) */
  var ALT = 60;
  /* Screen size tracks zoom as a real object at fixed altitude.
     Text is readable from ~zoom 16 up to the fade; far out it stays tiny.
     Fade starts after a comfortable readable window, when the camera
     would pass through the plane's altitude. */
  var Z_REF = 16.0;
  var Z_FADE0 = 17.7;
  var Z_FADE1 = 18.7;
  var SCALE_MIN = 0.08;
  var SCALE_MAX = 5;
  var PROP_HX = 168;
  var PROP_HY = 46;
  var PIVOT_VX = 108;
  var PIVOT_VY = 46;
  var TAIL_VX = 40;
  var TAIL_VY = 48;
  var PLANE_W = 96;
  var PLANE_H = 54;
  var PLANE_W_MOBILE = 68;
  var PLANE_H_MOBILE = 38;

  /* v14: straight viewport passes. The plane keeps a constant heading
     until the plane AND trailing banner are fully off-screen, then
     re-enters from another edge with a new heading. Passes are planned
     from the current viewport and prefer crossing Costa e Silva when it
     is in view. Recalc only after the current pass exits. */
  var CES_SW = [-54.576172, -25.534372];
  var CES_MID = [-54.563357, -25.523353];
  var CES_NE = [-54.550671, -25.512197];
  var PAUSE_MS = 800;
  var PASS_SAFETY_M = 25000;


  var query = new URLSearchParams(location.search);
  var disabled = query.get("aviao") === "0";
  var forcedT = query.has("aviao_t") ? clamp01(parseFloat(query.get("aviao_t"))) : null;
  var startFrozen = query.get("aviao_pause") === "1" || forcedT != null;

  var bannerTextValue = FALLBACK;
  var bannerImage = null;
  var bannerImageSrc = "";
  var bannerAtualizado = "";
  var mapRef = null;
  var frozen = startFrozen;
  var t0 = performance.now();
  var phase0 = forcedT != null ? forcedT : Math.random() * 0.15;
  var ready = false;
  var els = null;
  var flyingRight = true;
  var lastPose = null;
  var lastBannerKey = "";


  var FONT5 = {
    " ": [0, 0, 0, 0, 0],
    A: [0x3e, 0x09, 0x09, 0x09, 0x3e],
    B: [0x3f, 0x25, 0x25, 0x25, 0x1a],
    C: [0x1e, 0x21, 0x21, 0x21, 0x12],
    D: [0x3f, 0x21, 0x21, 0x21, 0x1e],
    E: [0x3f, 0x25, 0x25, 0x21, 0x21],
    F: [0x3f, 0x05, 0x05, 0x01, 0x01],
    G: [0x1e, 0x21, 0x21, 0x29, 0x1a],
    H: [0x3f, 0x04, 0x04, 0x04, 0x3f],
    I: [0x21, 0x21, 0x3f, 0x21, 0x21],
    J: [0x10, 0x20, 0x20, 0x20, 0x1f],
    K: [0x3f, 0x04, 0x0a, 0x11, 0x20],
    L: [0x3f, 0x20, 0x20, 0x20, 0x20],
    M: [0x3f, 0x02, 0x0c, 0x02, 0x3f],
    N: [0x3f, 0x02, 0x04, 0x08, 0x3f],
    O: [0x1e, 0x21, 0x21, 0x21, 0x1e],
    P: [0x3f, 0x09, 0x09, 0x09, 0x06],
    Q: [0x1e, 0x21, 0x29, 0x11, 0x2e],
    R: [0x3f, 0x09, 0x19, 0x29, 0x26],
    S: [0x16, 0x25, 0x25, 0x25, 0x1a],
    T: [0x01, 0x01, 0x3f, 0x01, 0x01],
    U: [0x1f, 0x20, 0x20, 0x20, 0x1f],
    V: [0x0f, 0x10, 0x20, 0x10, 0x0f],
    W: [0x3f, 0x10, 0x0c, 0x10, 0x3f],
    X: [0x31, 0x0a, 0x04, 0x0a, 0x31],
    Y: [0x03, 0x04, 0x38, 0x04, 0x03],
    Z: [0x31, 0x29, 0x25, 0x23, 0x21],
    "0": [0x1e, 0x29, 0x25, 0x23, 0x1e],
    "1": [0x00, 0x22, 0x3f, 0x20, 0x00],
    "2": [0x32, 0x29, 0x29, 0x29, 0x26],
    "3": [0x11, 0x21, 0x25, 0x25, 0x1b],
    "4": [0x0c, 0x0a, 0x09, 0x3f, 0x08],
    "5": [0x17, 0x25, 0x25, 0x25, 0x19],
    "6": [0x1e, 0x25, 0x25, 0x25, 0x18],
    "7": [0x01, 0x31, 0x09, 0x05, 0x03],
    "8": [0x1a, 0x25, 0x25, 0x25, 0x1a],
    "9": [0x06, 0x29, 0x29, 0x29, 0x1e],
    ":": [0x00, 0x00, 0x12, 0x00, 0x00],
    ".": [0x00, 0x00, 0x20, 0x00, 0x00],
    ",": [0x00, 0x00, 0x40, 0x20, 0x00],
    ";": [0x00, 0x00, 0x52, 0x20, 0x00],
    "-": [0x00, 0x04, 0x04, 0x04, 0x00],
    "+": [0x04, 0x04, 0x1f, 0x04, 0x04],
    "/": [0x20, 0x10, 0x08, 0x04, 0x02],
    "\\": [0x02, 0x04, 0x08, 0x10, 0x20],
    "%": [0x32, 0x18, 0x08, 0x06, 0x13],
    "#": [0x0a, 0x3f, 0x0a, 0x3f, 0x0a],
    "?": [0x02, 0x01, 0x29, 0x05, 0x02],
    "!": [0x00, 0x00, 0x2f, 0x00, 0x00],
    "(": [0x00, 0x1e, 0x21, 0x00, 0x00],
    ")": [0x00, 0x00, 0x21, 0x1e, 0x00],
    "[": [0x00, 0x3f, 0x21, 0x00, 0x00],
    "]": [0x00, 0x00, 0x21, 0x3f, 0x00],
    "'": [0x00, 0x00, 0x03, 0x00, 0x00],
    '"': [0x00, 0x03, 0x00, 0x03, 0x00],
    "&": [0x1a, 0x25, 0x2d, 0x12, 0x28],
    "*": [0x0a, 0x04, 0x1f, 0x04, 0x0a],
    "=": [0x0a, 0x0a, 0x0a, 0x0a, 0x0a],
    $: [0x16, 0x25, 0x7f, 0x25, 0x1a],
    "°": [0x00, 0x03, 0x03, 0x00, 0x00],
    "…": [0x20, 0x00, 0x20, 0x00, 0x20],
  };

  var ACCENT_OF = {
    Á: ["A", "acute"],
    À: ["A", "grave"],
    Â: ["A", "circum"],
    Ã: ["A", "tilde"],
    Ä: ["A", "umlaut"],
    É: ["E", "acute"],
    È: ["E", "grave"],
    Ê: ["E", "circum"],
    Ë: ["E", "umlaut"],
    Í: ["I", "acute"],
    Ì: ["I", "grave"],
    Î: ["I", "circum"],
    Ï: ["I", "umlaut"],
    Ó: ["O", "acute"],
    Ò: ["O", "grave"],
    Ô: ["O", "circum"],
    Õ: ["O", "tilde"],
    Ö: ["O", "umlaut"],
    Ú: ["U", "acute"],
    Ù: ["U", "grave"],
    Û: ["U", "circum"],
    Ü: ["U", "umlaut"],
    Ç: ["C", "cedilla"],
    Ñ: ["N", "tilde"],
  };

  function glyphCols(ch) {
    if (FONT5[ch]) return { cols: FONT5[ch], acc: null, cedilla: false };
    var acc = ACCENT_OF[ch];
    if (acc && FONT5[acc[0]]) {
      return { cols: FONT5[acc[0]], acc: acc[1], cedilla: acc[1] === "cedilla" };
    }
    if (ch === "–" || ch === "—" || ch === "−") return { cols: FONT5["-"], acc: null };
    return { cols: FONT5["?"], acc: null };
  }


  function clamp01(x) {
    if (!isFinite(x)) return 0;
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  function frac(x) {
    if (!isFinite(x)) return 0;
    return x - Math.floor(x);
  }
  function toUpperPt(s) {
    try { return String(s).toLocaleUpperCase("pt-BR"); }
    catch (e) { return String(s).toUpperCase(); }
  }
  function normalizeText(s) {
    s = toUpperPt(s || "").replace(/\s+/g, " ").trim();
    return s || FALLBACK;
  }
  function isMobile() {
    var root = document.getElementById("map");
    var w = root ? root.clientWidth : window.innerWidth;
    return w <= 620;
  }
  function nightAmount() {
    var n = window.__FOZ_NIGHT__;
    if (n && typeof n.phase === "number") return n.phase;
    if (document.body.classList.contains("night")) return 1;
    return 0;
  }

  function applyText(text) {
    bannerTextValue = normalizeText(text);
    lastBannerKey = "";
    if (els) paintBanner();
  }

  function loadBannerImage(src) {
    src = (src || "").trim();
    if (!src) {
      bannerImage = null;
      bannerImageSrc = "";
      lastBannerKey = "";
      if (els) paintBanner();
      return;
    }
    if (src === bannerImageSrc && bannerImage && bannerImage.width) return;
    bannerImageSrc = src;
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      if (bannerImageSrc !== src) return;
      bannerImage = img;
      lastBannerKey = "";
      if (els) paintBanner();
    };
    img.onerror = function () {
      if (bannerImageSrc === src) bannerImage = null;
      lastBannerKey = "";
      if (els) paintBanner();
    };
    img.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
  }

  function loadNews() {
    return fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      })
      .then(function (data) {
        var texto = data && data.texto != null ? String(data.texto).trim() : "";
        var imagem = data && data.imagem ? String(data.imagem).trim() : "";
        bannerAtualizado = data && data.atualizado ? String(data.atualizado) : "";
        applyText(texto || FALLBACK);
        loadBannerImage(imagem);
      })
      .catch(function () {
        applyText(FALLBACK);
      });
  }

  /* ---- path helpers (pass planner lives later, after overlay helpers) ---- */
  function distM(lng1, lat1, lng2, lat2) {
    var R = 6371000;
    var p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    var dph = (lat2 - lat1) * Math.PI / 180;
    var dl = (lng2 - lng1) * Math.PI / 180;
    var s = Math.sin(dph / 2) * Math.sin(dph / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function destPoint(lng, lat, headingRad, meters) {
    var dLng = (Math.sin(headingRad) * meters) / (111320 * Math.cos(lat * Math.PI / 180));
    var dLat = (Math.cos(headingRad) * meters) / 110540;
    return { lng: lng + dLng, lat: lat + dLat };
  }

  function headingBetween(lng0, lat0, lng1, lat1) {
    var mid = (lat0 + lat1) / 2;
    return Math.atan2((lng1 - lng0) * Math.cos((mid * Math.PI) / 180), lat1 - lat0);
  }

  function getPose() {
    return lastPose || poseAt(nowPhase());
  }

  /* ---- projection ---- */
  function project3d(map, lng, lat, alt) {
    var p;
    try {
      if (map.transform && typeof map.transform.locationPoint3D === "function") {
        p = map.transform.locationPoint3D({ lng: lng, lat: lat, alt: alt || 0 });
        if (p && isFinite(p.x) && isFinite(p.y)) return p;
      }
    } catch (e) {}
    p = map.project([lng, lat]);
    if (!alt) return p;
    var latRad = lat * Math.PI / 180;
    var mpp = (156543.03392 * Math.cos(latRad)) / Math.pow(2, map.getZoom());
    var pitch = (map.getPitch() || 0) * Math.PI / 180;
    p = { x: p.x, y: p.y - (alt * Math.sin(pitch)) / mpp };
    return p;
  }

  function currentScale() {
    if (!mapRef || typeof mapRef.getZoom !== "function") return 1;
    var s = Math.pow(2, mapRef.getZoom() - Z_REF);
    return Math.min(SCALE_MAX, Math.max(SCALE_MIN, s));
  }

  function currentFade() {
    if (!mapRef || typeof mapRef.getZoom !== "function") return 1;
    var z = mapRef.getZoom();
    if (z <= Z_FADE0) return 1;
    if (z >= Z_FADE1) return 0;
    return 1 - (z - Z_FADE0) / (Z_FADE1 - Z_FADE0);
  }

  function applyRigScale() {
    if (!els) return;
    var s = currentScale();
    var mobile = isMobile();
    var pw = (mobile ? PLANE_W_MOBILE : PLANE_W) * s;
    var ph = (mobile ? PLANE_H_MOBILE : PLANE_H) * s;
    els.plane.style.width = pw + "px";
    els.plane.style.height = ph + "px";
    els.plane.style.flexBasis = pw + "px";
    var strings = els.strings;
    if (strings) {
      var sw = (mobile ? 32 : 48) * s;
      var sh = (mobile ? 22 : 32) * s;
      strings.style.width = sw + "px";
      strings.style.height = sh + "px";
      strings.style.flexBasis = sw + "px";
    }
    if (els.shadow) {
      var shw = 80 * s, shh = 18 * s;
      els.shadow.style.width = shw + "px";
      els.shadow.style.height = shh + "px";
      els.shadow.style.marginLeft = -shw / 2 + "px";
      els.shadow.style.marginTop = -shh / 2 + "px";
    }
  }

  /* ---- banner canvas (always LTR, portrait on the left) ---- */
  function paintBanner() {
    if (!els) return;
    var night = nightAmount() > 0.45;
    var mobile = isMobile();
    var scale = currentScale();
    var cssH = Math.max(2, Math.round((mobile ? 28 : 40) * scale));
    var key = bannerTextValue + "|" + (bannerImage && bannerImage.width ? bannerImageSrc : "") + "|" + (night ? 1 : 0) + "|" + cssH + "|" + scale.toFixed(3) + "|" + (window.devicePixelRatio || 1);
    if (key === lastBannerKey) return;
    lastBannerKey = key;

    var canvas = els.banner;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var border = Math.max(0.5, (mobile ? 2 : 3) * scale);
    var px = Math.max(0.25, 2 * scale);
    var cellW = 6 * px;
    var chars = Array.from(normalizeText(bannerTextValue));
    var textW = chars.length * cellW;
    var innerH = Math.max(1, cssH - border * 2 - (cssH >= 16 ? 2 : 0));
    var imgH = innerH;
    var imgW = 0;
    if (bannerImage && bannerImage.width && bannerImage.height) {
      imgW = Math.round(imgH * (bannerImage.width / Math.max(1, bannerImage.height)));
    }
    var gap = imgW ? (mobile ? 5 : 7) : 0;
    var cssW = border + 5 + imgW + gap + textW + 10 + border;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = night ? "#f7e4b6" : "#f6e6c6";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = night ? "#c41c1c" : "#9e1616";
    ctx.fillRect(0, 0, cssW, border);
    ctx.fillRect(0, cssH - border, cssW, border);
    ctx.fillRect(0, 0, border, cssH);
    ctx.fillRect(cssW - border, 0, border, cssH);
    var x = border + 5;
    if (imgW) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bannerImage, x, border + 1, imgW, imgH);
      ctx.imageSmoothingEnabled = false;
      x += imgW + gap;
    }
    ctx.fillStyle = night ? "#3a120c" : "#3a1b12";
    var baseY = Math.floor((cssH - 7 * px) / 2) + (px > 1 ? 2 : 1);
    var accY = baseY - 3 * px;
    chars.forEach(function (ch) {
      var g = glyphCols(ch);
      if (g.acc && g.acc !== "cedilla") {
        var ax = x + px, ay = accY;
        function dot(dx, dy, dw, dh) {
          ctx.fillRect(ax + dx * px, ay + dy * px, (dw || 1) * px, (dh || 1) * px);
        }
        if (g.acc === "acute") { dot(2, 1); dot(3, 0, 1, 2); }
        else if (g.acc === "grave") { dot(2, 0, 1, 2); dot(1, 1); }
        else if (g.acc === "circum") { dot(2, 0); dot(1, 1); dot(3, 1); }
        else if (g.acc === "tilde") { dot(0, 1, 2, 1); dot(2, 0, 2, 1); }
        else if (g.acc === "umlaut") { dot(1, 1); dot(3, 1); }
      }
      for (var c = 0; c < 5; c++) {
        var bits = g.cols[c] || 0;
        for (var r = 0; r < 7; r++) {
          if (bits & (1 << r)) ctx.fillRect(x + c * px, baseY + r * px, px, px);
        }
      }
      if (g.cedilla) {
        ctx.fillRect(x + 2 * px, baseY + 7 * px, px, 2 * px);
        ctx.fillRect(x + 1 * px, baseY + 8 * px, px, px);
      }
      x += cellW;
    });
    els.overlay.classList.toggle("is-night", night);
    els.overlay.classList.toggle("is-mobile", mobile);
  }

  /* ---- DOM / SVG plane ---- */
  var STYLE = [
    "#foz-aviao-overlay{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden;font-family:inherit}",
    "#foz-aviao-overlay .foz-aviao-shadow{position:absolute;width:80px;height:18px;margin-left:-40px;margin-top:-9px;background:radial-gradient(ellipse at center,rgba(0,0,0,.28) 0%,rgba(0,0,0,.08) 55%,rgba(0,0,0,0) 75%);border-radius:50%;transform-origin:center}",
    "#foz-aviao-overlay .foz-aviao-rig{position:absolute;inset:0;will-change:opacity}",
    "#foz-aviao-overlay .foz-aviao-tow{position:absolute;left:0;top:0;display:flex;flex-direction:row;align-items:center;will-change:transform;filter:drop-shadow(0 3px 3px rgba(0,0,0,.25))}",
    "#foz-aviao-overlay .foz-aviao-tow.is-flipped{flex-direction:row-reverse}",
    "#foz-aviao-overlay .foz-aviao-banner{display:block;image-rendering:pixelated;image-rendering:crisp-edges;border-radius:2px;flex:0 0 auto}",
    "#foz-aviao-overlay.is-night .foz-aviao-banner{filter:brightness(1.08) drop-shadow(0 0 6px rgba(255,220,140,.45))}",
    "#foz-aviao-overlay .foz-aviao-strings{width:48px;height:32px;flex:0 0 48px;overflow:visible}",
    "#foz-aviao-overlay .foz-aviao-plane{position:absolute;left:0;top:0;width:96px;height:54px;will-change:transform;filter:drop-shadow(0 3px 3px rgba(0,0,0,.25))}",
    "#foz-aviao-overlay .foz-aviao-plane svg{width:100%;height:100%;display:block;overflow:visible}",
    "#foz-aviao-overlay .strobe{fill:#fff6c8;opacity:0}",
    "#foz-aviao-overlay.is-night .strobe{animation:foz-strobe 1.15s steps(1) infinite}",
    "#foz-aviao-overlay.is-night.is-frozen .strobe{animation:none;opacity:1}",
    "@keyframes foz-strobe{0%,21%{opacity:1}22%,100%{opacity:0}}"
  ].join("\n");

  var PLANE_SVG = '<svg viewBox="0 0 184 90" aria-hidden="true">'
    + '<ellipse class="strobe" cx="54" cy="22" rx="5" ry="5"/>'
    + '<path d="M78 34 L128 30 L132 36 L84 42 Z" fill="#c62828" stroke="#7a1414" stroke-width="1.2" stroke-linejoin="round"/>'
    + '<path d="M42 42 C48 34, 70 32, 108 34 L150 38 C156 39, 160 42, 160 46 C160 52, 154 56, 146 57 L70 60 C52 60, 40 54, 38 48 C36 44, 38 42, 42 42 Z" fill="#f3e6c4" stroke="#8a6a40" stroke-width="1.3" stroke-linejoin="round"/>'
    + '<path d="M50 47 L148 45 L147 50 L52 52 Z" fill="#c62828"/>'
    + '<rect x="96" y="38" width="14" height="8" rx="2" fill="#2c3d52"/>'
    + '<rect x="113" y="38.5" width="11" height="7" rx="2" fill="#2c3d52"/>'
    + '<rect x="127" y="39" width="9" height="6.5" rx="2" fill="#2c3d52"/>'
    + '<path d="M150 38 C158 39, 166 41, 168 46 C166 52, 158 55, 150 56 Z" fill="#4a2a22" stroke="#2a1612" stroke-width="1"/>'
    + '<path d="M62 50 L140 46 L148 58 L130 66 L70 64 Z" fill="#d32f2f" stroke="#7a1414" stroke-width="1.3" stroke-linejoin="round"/>'
    + '<path d="M78 50 L136 47 L138 52 L80 54 Z" fill="#f3e6c4"/>'
    + '<path d="M40 48 L44 18 L58 22 L52 48 Z" fill="#c62828" stroke="#7a1414" stroke-width="1.2" stroke-linejoin="round"/>'
    + '<path d="M44 20 L56 22 L50 28 L44 26 Z" fill="#f3e6c4"/>'
    + '<path d="M36 46 L58 44 L60 51 L36 52 Z" fill="#c62828" stroke="#7a1414" stroke-width="1"/>'
    + '<rect x="100" y="60" width="2.2" height="10" fill="#3a3a3a"/>'
    + '<rect x="128" y="57" width="2.2" height="10" fill="#3a3a3a"/>'
    + '<ellipse cx="101" cy="71" rx="5" ry="3" fill="#222"/>'
    + '<ellipse cx="129" cy="68" rx="5" ry="3" fill="#222"/>'
    + '<g class="prop" transform="translate(168 46) rotate(28)"><g>'
    + '<rect x="-1.8" y="-24" width="3.2" height="44" rx="1.4" fill="#2a2420" opacity=".92"/>'
    + '<rect x="-13" y="-3.8" width="26" height="3.2" rx="1.4" fill="#2a2420" opacity=".55"/>'
    + '</g></g>'
    + '<circle cx="168" cy="46" r="5.2" fill="#f0c430" stroke="#8a6a18" stroke-width="1.1"/>'
    + '</svg>';

  var STRINGS_SVG = '<svg class="foz-aviao-strings" viewBox="0 0 48 32" aria-hidden="true">'
    + '<path d="M1 9 C16 8, 32 6, 47 11" fill="none" stroke="#5a3c28" stroke-width="1.45" stroke-linecap="round"/>'
    + '<path d="M1 23 C16 23, 32 25, 47 18" fill="none" stroke="#5a3c28" stroke-width="1.45" stroke-linecap="round"/>'
    + '</svg>';

  function ensureDom() {
    if (els) return els;
    var style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);
    var overlay = document.createElement("div");
    overlay.id = "foz-aviao-overlay";
    overlay.innerHTML = '<div class="foz-aviao-shadow" hidden></div>'
      + '<div class="foz-aviao-rig">'
      + '<div class="foz-aviao-tow">'
      + '<canvas class="foz-aviao-banner"></canvas>'
      + STRINGS_SVG
      + "</div>"
      + '<div class="foz-aviao-plane">' + PLANE_SVG + "</div>"
      + "</div>";
    var host = document.getElementById("map") || document.body;
    host.appendChild(overlay);
    els = {
      overlay: overlay,
      shadow: overlay.querySelector(".foz-aviao-shadow"),
      rig: overlay.querySelector(".foz-aviao-rig"),
      tow: overlay.querySelector(".foz-aviao-tow"),
      banner: overlay.querySelector(".foz-aviao-banner"),
      plane: overlay.querySelector(".foz-aviao-plane"),
      strings: overlay.querySelector(".foz-aviao-strings"),
      prop: overlay.querySelector(".prop")
    };
    return els;
  }

  var smoothScreenAngle = null;
  var bannerFlipped = false;
  var lastAngleMs = 0;

  function lerpAngle(a, b, t) {
    var d = ((b - a + 540) % 360) - 180;
    return a + d * t;
  }

  function wrapAngle(a) {
    return ((a + 180) % 360 + 360) % 360 - 180;
  }

  function screenTravelAngle(air, pose) {
    var aheadM = 80;
    var dLng = (Math.sin(pose.heading) * aheadM) / (111320 * mathCosLat(pose.lat));
    var dLat = (Math.cos(pose.heading) * aheadM) / 110540;
    var air2 = project3d(mapRef, pose.lng + dLng, pose.lat + dLat, pose.alt);
    var dx = air2.x - air.x, dy = air2.y - air.y;
    if (!isFinite(dx) || !isFinite(dy) || (dx * dx + dy * dy) < 1e-6) {
      return smoothScreenAngle != null ? smoothScreenAngle : 0;
    }
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  function mathCosLat(lat) {
    return Math.cos((lat * Math.PI) / 180);
  }

  function updateSmoothAngle(target) {
    var now = passClock();
    if (frozen || smoothScreenAngle == null || Math.abs(wrapAngle(target - smoothScreenAngle)) > 40) {
      smoothScreenAngle = target;
      lastAngleMs = now;
      return target;
    }
    var dt = Math.max(0, Math.min(0.08, (now - lastAngleMs) / 1000));
    lastAngleMs = now;
    /* Tight follow: v14 has no visible turns, this only kills projection jitter. */
    var k = 1 - Math.exp(-dt / 0.08);
    smoothScreenAngle = lerpAngle(smoothScreenAngle, target, k);
    return smoothScreenAngle;
  }

  function updateBannerFlip(theta, snap) {
    var c = Math.cos((theta * Math.PI) / 180);
    if (snap) {
      bannerFlipped = c < 0;
      return bannerFlipped;
    }
    if (bannerFlipped) {
      if (c > 0.17) bannerFlipped = false; /* unflip below ~80° from vertical */
    } else if (c < -0.17) {
      bannerFlipped = true; /* flip past ~100° */
    }
    return bannerFlipped;
  }

  function contentBox() {
    var mapBox = els.overlay.getBoundingClientRect();
    var p = els.plane.getBoundingClientRect();
    var tbox = els.tow.getBoundingClientRect();
    var left = Math.min(p.left, tbox.left) - mapBox.left;
    var top = Math.min(p.top, tbox.top) - mapBox.top;
    var right = Math.max(p.right, tbox.right) - mapBox.left;
    var bottom = Math.max(p.bottom, tbox.bottom) - mapBox.top;
    return { left: left, top: top, right: right, bottom: bottom, width: right - left, height: bottom - top, absLeft: left + mapBox.left, absTop: top + mapBox.top };
  }

  function updateOverlay() {
    if (!mapRef || !els) return;
    var pose = poseAt(nowPhase());
    lastPose = pose;
    var air = project3d(mapRef, pose.lng, pose.lat, pose.alt);
    var gnd = project3d(mapRef, pose.lng, pose.lat, 0);
    if (!isFinite(air.x) || !isFinite(air.y)) return;

    var targetAng = screenTravelAngle(air, pose);
    var theta = updateSmoothAngle(targetAng);
    flyingRight = Math.cos((theta * Math.PI) / 180) >= 0;
    var flipped = updateBannerFlip(theta, frozen || (passCtrl && passCtrl.snapFlip));
    if (passCtrl) passCtrl.snapFlip = false;
    var bannerTheta = flipped ? theta + 180 : theta;

    var hiding = isPauseNow();
    if (els.rig) els.rig.style.visibility = hiding ? "hidden" : "visible";
    if (els.shadow) els.shadow.style.visibility = hiding ? "hidden" : "visible";
    if (hiding) {
      els.overlay.classList.toggle("is-frozen", frozen);
      return;
    }

    els.overlay.classList.toggle("is-frozen", frozen);
    applyRigScale();
    paintBanner();

    var fade = currentFade();
    var clock = passClock();
    var hasClock = (timeline && timeline.clock != null) || (passCtrl.clock != null);
    var angle = (frozen && !hasClock) ? 28 : (clock * 0.85) % 360;
    if (els.prop) {
      els.prop.setAttribute("transform", "translate(" + PROP_HX + " " + PROP_HY + ") rotate(" + angle + ")");
    }

    var pw = els.plane.offsetWidth || PLANE_W;
    var ph = els.plane.offsetHeight || PLANE_H;
    var sx = pw / 184, sy = ph / 90;
    var pivotX = PIVOT_VX * sx, pivotY = PIVOT_VY * sy;
    var tailLx = TAIL_VX * sx - pivotX;
    var tailLy = TAIL_VY * sy - pivotY;
    var rad = (theta * Math.PI) / 180;
    var c = Math.cos(rad), s = Math.sin(rad);
    var tailX = air.x + tailLx * c - tailLy * s;
    var tailY = air.y + tailLx * s + tailLy * c;

    els.rig.style.opacity = "1";
    els.rig.style.visibility = "hidden";
    els.plane.style.transformOrigin = pivotX + "px " + pivotY + "px";
    els.plane.style.left = air.x + "px";
    els.plane.style.top = air.y + "px";
    els.plane.style.transform = "translate(" + (-pivotX) + "px," + (-pivotY) + "px) rotate(" + theta + "deg)";

    els.tow.classList.toggle("is-flipped", flipped);
    els.tow.style.left = "0px";
    els.tow.style.top = "0px";
    els.tow.style.transform = "none";
    var tb = els.tow.getBoundingClientRect();
    var ox = flipped ? 0 : tb.width;
    var oy = tb.height / 2;
    els.tow.style.left = (tailX - ox) + "px";
    els.tow.style.top = (tailY - oy) + "px";
    els.tow.style.transformOrigin = ox + "px " + oy + "px";
    els.tow.style.transform = "rotate(" + bannerTheta + "deg)";

    var box = contentBox();
    var mapBox = els.overlay.getBoundingClientRect();
    var pad = 80;
    var on = fade >= 0.02 && !(box.right < -pad || box.left > mapBox.width + pad || box.bottom < -pad || box.top > mapBox.height + pad);
    els.rig.style.display = on || fade >= 0.02 ? "block" : "none";
    els.rig.style.visibility = on ? "visible" : "hidden";
    els.rig.style.opacity = String(fade);

    els.shadow.hidden = !on;
    if (on) {
      els.shadow.style.opacity = String(fade);
      els.shadow.style.transform = "translate(" + gnd.x + "px," + gnd.y + "px)";
    }
  }

  function frameInView(opts) {
    opts = opts || {};
    var map = mapRef;
    if (!map) return;
    var zoom = opts.zoom != null ? opts.zoom : 14.6;
    var pitch = opts.pitch != null ? opts.pitch : 52;
    var bearing = opts.bearing != null ? opts.bearing : -20;
    /* Place over Avenida Costa e Silva (or given coords); heading flies screen-right */
    var lng = opts.lng != null ? opts.lng : -54.563357;
    var lat = opts.lat != null ? opts.lat : -25.523353;
    map.jumpTo({ center: [lng, lat], zoom: zoom, pitch: pitch, bearing: bearing });
    /* Snap pose to this location; keep current route phase's speed direction out of it */
    placeAt(lng, lat, "screen-right");
    updateOverlay();
    if (opts.focus === "plane" || currentFade() < 0.95) {
      /* Keep the plane itself on the city; don't chase the (possibly huge) banner. */
    } else {
      fitRigOnScreen();
    }
  }

  function fitRigOnScreen() {
    /* Keep the camera on the city; slide the plane so the banner sits in view
       (over the urban fabric, not over the river west of Centro). */
    if (!mapRef || !els) return;
    var map = mapRef;
    var mapBox = els.overlay.getBoundingClientRect();
    var bar = document.getElementById("sec-bar");
    var barH = bar ? bar.getBoundingClientRect().height : 120;
    var visH = mapBox.height - barH;
    var pad = 10;
    for (var i = 0; i < 3; i++) {
      updateOverlay();
      var pose = poseOverride || lastPose;
      if (!pose) return;
      var rigBox = contentBox();
      if (!rigBox.width) return;
      var targetX;
      if (rigBox.width > mapBox.width - pad * 2) {
        targetX = mapBox.left + pad; /* mobile: pin portrait at the left */
      } else {
        targetX = mapBox.left + Math.max(pad, (mapBox.width - rigBox.width) / 2);
      }
      var targetY = mapBox.top + Math.max(16, (visH - rigBox.height) / 2);
      var dx = targetX - rigBox.absLeft;
      var dy = targetY - rigBox.absTop;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) break;
      var air = project3d(mapRef, pose.lng, pose.lat, pose.alt || ALT);
      var next = map.unproject([air.x + dx, air.y + dy]);
      poseOverride = {
        lng: next.lng,
        lat: next.lat,
        alt: pose.alt || ALT,
        heading: pose.heading,
        phase: pose.phase || 0,
        leg: pose.leg || 0,
        t: pose.t || 0
      };
      lastPose = poseOverride;
    }
    updateOverlay();
  }

  var passCtrl = {
    pass: null,
    last: null,
    phase: "idle",
    tStart: 0,
    pauseUntil: 0,
    everVisible: false,
    holdPose: null,
    clock: null,
    snapFlip: false,
    holdFrozenElapsed: null
  };
  var timeline = null;
  var PASS_INDEX = 0;

  function passClock() {
    if (timeline && timeline.clock != null) return timeline.clock;
    if (passCtrl.clock != null) return passCtrl.clock;
    return performance.now();
  }

  function fallbackPose() {
    return { lng: CES_MID[0], lat: CES_MID[1], alt: ALT, heading: 0, phase: 0, leg: 0, t: 0 };
  }

  function eventAtClock(ms) {
    if (!timeline || !timeline.events || !timeline.events.length) return null;
    var i, ev;
    for (i = 0; i < timeline.events.length; i++) {
      ev = timeline.events[i];
      if (ms < ev.t1 || i === timeline.events.length - 1) return ev;
    }
    return ev;
  }

  function isPauseNow() {
    if (poseOverride) return false;
    if (timeline) {
      var ev = eventAtClock(timeline.clock != null ? timeline.clock : 0);
      return !ev || ev.type === "pause";
    }
    if (!passCtrl.pass) return true;
    return passCtrl.phase === "pause";
  }

  function viewSize() {
    var w = 0, h = 0;
    if (els && els.overlay) {
      w = els.overlay.clientWidth;
      h = els.overlay.clientHeight;
    }
    if ((!w || !h) && mapRef) {
      var c = mapRef.getContainer();
      w = c.clientWidth;
      h = c.clientHeight;
    }
    w = w || 1440;
    h = h || 900;
    var bar = document.getElementById("sec-bar");
    var barH = bar ? bar.getBoundingClientRect().height : 0;
    return { w: w, h: h, barH: barH, usableH: Math.max(120, h - barH) };
  }

  function rigPadPx() {
    var scale = currentScale();
    var bw = 0;
    if (els && els.banner && els.banner.style && els.banner.style.width) {
      bw = parseFloat(els.banner.style.width) || 0;
    }
    if (!bw) {
      var chars = Array.from(normalizeText(bannerTextValue || FALLBACK)).length;
      var px = Math.max(0.25, 2 * scale);
      bw = chars * 6 * px + 80 * scale;
    }
    var strings = (isMobile() ? 32 : 48) * scale;
    var plane = (isMobile() ? PLANE_W_MOBILE : PLANE_W) * scale;
    return bw + strings + plane + 80;
  }

  function pointWellOutside(scr, pad) {
    var vs = viewSize();
    return !isFinite(scr.x) || !isFinite(scr.y) ||
      scr.x < -pad || scr.x > vs.w + pad || scr.y < -pad || scr.y > vs.h + pad;
  }

  function isRigOffscreen() {
    if (!els || !els.plane || !els.tow) return true;
    var box = contentBox();
    var vs = viewSize();
    var m = 4;
    return box.right < -m || box.left > vs.w + m || box.bottom < -m || box.top > vs.usableH + m;
  }

  function cesSamples() {
    var pts = [CES_SW, CES_MID, CES_NE];
    var out = [];
    var i, k, a, b, t;
    for (i = 0; i < pts.length - 1; i++) {
      a = pts[i];
      b = pts[i + 1];
      for (k = 0; k <= 5; k++) {
        t = k / 5;
        out.push({ lng: a[0] + (b[0] - a[0]) * t, lat: a[1] + (b[1] - a[1]) * t });
      }
    }
    return out;
  }

  function pickTarget() {
    var vs = viewSize();
    var pad = 60;
    var vis = [];
    var samples = cesSamples();
    var i, s, p;
    for (i = 0; i < samples.length; i++) {
      s = samples[i];
      p = project3d(mapRef, s.lng, s.lat, 0);
      if (isFinite(p.x) && p.x > -pad && p.x < vs.w + pad && p.y > -pad && p.y < vs.usableH + pad) {
        vis.push({ lng: s.lng, lat: s.lat, x: p.x, y: p.y });
      }
    }
    if (vis.length) {
      var idx = (Math.floor(vis.length / 2) + (PASS_INDEX % 3) - 1 + vis.length) % vis.length;
      var mid = vis[idx];
      var cesH = headingBetween(CES_SW[0], CES_SW[1], CES_NE[0], CES_NE[1]);
      var sign = (PASS_INDEX % 2) ? 1 : -1;
      var off = 70 + (PASS_INDEX % 4) * 40;
      return destPoint(mid.lng, mid.lat, cesH + sign * Math.PI / 2, off);
    }
    var c = mapRef.unproject([vs.w / 2, (vs.barH || 0) + vs.usableH * 0.42]);
    return { lng: c.lng, lat: c.lat };
  }

  function absAngleDiff(a, b) {
    return Math.abs(wrapAngle(a - b));
  }

  function wrap360(a) {
    return ((a % 360) + 360) % 360;
  }

  function lineRectHits(ox, oy, angDeg, x0, y0, x1, y1) {
    var ang = angDeg * Math.PI / 180;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var ts = [];
    function hit(t, x, y) {
      if (x >= x0 - 0.5 && x <= x1 + 0.5 && y >= y0 - 0.5 && y <= y1 + 0.5) {
        ts.push({ t: t, x: x, y: y });
      }
    }
    var t;
    if (Math.abs(dx) > 1e-8) {
      t = (x0 - ox) / dx; hit(t, x0, oy + dy * t);
      t = (x1 - ox) / dx; hit(t, x1, oy + dy * t);
    }
    if (Math.abs(dy) > 1e-8) {
      t = (y0 - oy) / dy; hit(t, ox + dx * t, y0);
      t = (y1 - oy) / dy; hit(t, ox + dx * t, y1);
    }
    ts.sort(function (a, b) { return a.t - b.t; });
    var uniq = [];
    for (var i = 0; i < ts.length; i++) {
      if (!uniq.length || Math.abs(ts[i].t - uniq[uniq.length - 1].t) > 0.5) {
        uniq.push(ts[i]);
      }
    }
    return uniq;
  }

  function edgeOf(pt, vs) {
    var eps = 3;
    if (pt.x <= eps) return "left";
    if (pt.x >= vs.w - eps) return "right";
    if (pt.y <= eps) return "top";
    if (pt.y >= vs.usableH - eps) return "bottom";
    return "inside";
  }

  function scoreAngle(ang, target, vs, last) {
    var tScr = project3d(mapRef, target.lng, target.lat, ALT);
    if (!isFinite(tScr.x) || !isFinite(tScr.y)) return null;
    var hits = lineRectHits(tScr.x, tScr.y, ang, 0, 0, vs.w, vs.usableH);
    if (hits.length < 2) return null;
    var a = hits[0], b = hits[hits.length - 1];
    var chord = Math.hypot(b.x - a.x, b.y - a.y);
    var minChord = Math.min(vs.w, vs.usableH) * 0.4;
    if (chord < minChord) return null;
    var entry = a, exit = b;
    var entryEdge = edgeOf(entry, vs);
    var exitEdge = edgeOf(exit, vs);
    if (entryEdge === "inside" || exitEdge === "inside" || entryEdge === exitEdge) return null;
    var score = chord;
    var rad = ang * Math.PI / 180;
    var horiz = Math.abs(Math.cos(rad));
    score += horiz * 400;
    if (last) {
      if (absAngleDiff(ang, last.screenAngle) < 30) score -= 8000;
      if (absAngleDiff(ang, last.screenAngle + 180) < 25) score -= 3000;
      if (entryEdge === last.entryEdge) score -= 1500;
      if (entryEdge === last.exitEdge && absAngleDiff(ang, last.screenAngle + 180) < 50) score -= 1200;
    }
    return {
      screenAngle: ang,
      entryEdge: entryEdge,
      exitEdge: exitEdge,
      chord: chord,
      score: score,
      horiz: horiz
    };
  }

  function screenAngleToHeading(angDeg, target) {
    var tScr = project3d(mapRef, target.lng, target.lat, ALT);
    var ang = angDeg * Math.PI / 180;
    var ll = mapRef.unproject([tScr.x + Math.cos(ang) * 80, tScr.y + Math.sin(ang) * 80]);
    return headingBetween(target.lng, target.lat, ll.lng, ll.lat);
  }

  function offscreenStart(target, heading, pad) {
    var d = 200;
    var p = destPoint(target.lng, target.lat, heading + Math.PI, d);
    for (var i = 0; i < 24; i++) {
      p = destPoint(target.lng, target.lat, heading + Math.PI, d);
      var scr = project3d(mapRef, p.lng, p.lat, ALT);
      if (pointWellOutside(scr, pad)) return p;
      d *= 1.35;
      if (d > PASS_SAFETY_M) break;
    }
    return p;
  }

  function offscreenEnd(target, heading, pad) {
    var d = 200;
    var seenOn = false;
    var p = destPoint(target.lng, target.lat, heading, d);
    for (var i = 0; i < 30; i++) {
      p = destPoint(target.lng, target.lat, heading, d);
      var scr = project3d(mapRef, p.lng, p.lat, ALT);
      var outside = pointWellOutside(scr, pad);
      if (!outside) seenOn = true;
      if (seenOn && outside) return { point: p, dist: d };
      d *= 1.35;
      if (d > PASS_SAFETY_M) break;
    }
    return { point: p, dist: d };
  }

  function planPass(opts) {
    opts = opts || {};
    if (!mapRef) return null;
    var vs = viewSize();
    var target = opts.target || pickTarget();
    var last = opts.last != null ? opts.last : passCtrl.last;
    var preferred = opts.preferredScreenAngles || null;
    var buckets = [
      20, 28, 36, 44, 52,
      128, 136, 144, 152, 160,
      200, 208, 216, 224, 232,
      308, 316, 324, 332, 340
    ];
    var jitter = ((PASS_INDEX * 17) % 9) - 4;
    var candidates = [];
    var used = {};
    function consider(raw) {
      var ang = wrap360(raw);
      var key = Math.round(ang * 10) / 10;
      if (used[key]) return;
      used[key] = true;
      var scored = scoreAngle(ang, target, vs, last);
      if (!scored) return;
      if (preferred) {
        var i;
        for (i = 0; i < preferred.length; i++) {
          if (absAngleDiff(ang, preferred[i]) < 8) {
            scored.score += 2500;
            scored.preferred = true;
            break;
          }
        }
      }
      candidates.push(scored);
    }
    var i;
    if (preferred) {
      for (i = 0; i < preferred.length; i++) consider(preferred[i]);
    }
    for (i = 0; i < buckets.length; i++) consider(buckets[i] + jitter);
    if (!candidates.length) {
      consider(28);
      consider(208);
      consider(0);
    }
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return b.score - a.score; });
    var pool = candidates;
    if (preferred) {
      var prefOnly = candidates.filter(function (c) { return c.preferred; });
      if (prefOnly.length) pool = prefOnly;
    }
    var pick = pool[Math.min(pool.length - 1, PASS_INDEX % Math.min(3, pool.length))];
    var heading = screenAngleToHeading(pick.screenAngle, target);
    var start = offscreenStart(target, heading, 220);
    var endInfo = offscreenEnd(target, heading, rigPadPx());
    var distFromStart = distM(start.lng, start.lat, endInfo.point.lng, endInfo.point.lat);
    if (distFromStart < 200) {
      endInfo.point = destPoint(start.lng, start.lat, heading, 3000);
      distFromStart = 3000;
    }
    var dur = (distFromStart / SPEED_MS) * 1000;
    PASS_INDEX++;
    return {
      lng0: start.lng, lat0: start.lat,
      lng1: endInfo.point.lng, lat1: endInfo.point.lat,
      heading: heading,
      screenAngle: pick.screenAngle,
      entryEdge: pick.entryEdge,
      exitEdge: pick.exitEdge,
      dist: distFromStart,
      dur: dur,
      target: target
    };
  }

  function poseOnPass(pass, u) {
    u = clamp01(u);
    return {
      lng: pass.lng0 + (pass.lng1 - pass.lng0) * u,
      lat: pass.lat0 + (pass.lat1 - pass.lat0) * u,
      alt: ALT,
      heading: pass.heading,
      phase: u,
      leg: 0,
      t: u,
      screenAngle: pass.screenAngle,
      entryEdge: pass.entryEdge,
      exitEdge: pass.exitEdge
    };
  }

  function poseFromEvent(ev, ms) {
    if (!ev) return fallbackPose();
    if (ev.type === "pause") return ev.pose;
    var span = ev.t1 - ev.t0;
    var u = span <= 0 ? ev.u1 : ev.u0 + (ev.u1 - ev.u0) * clamp01((ms - ev.t0) / span);
    return poseOnPass(ev.pass, u);
  }

  function elementOnScreen(el, vs, pad) {
    if (!el) return false;
    pad = pad || 0;
    var r = el.getBoundingClientRect();
    var mapBox = els.overlay.getBoundingClientRect();
    var left = r.left - mapBox.left, right = r.right - mapBox.left;
    var top = r.top - mapBox.top, bottom = r.bottom - mapBox.top;
    return right > pad && left < vs.w - pad && bottom > pad && top < vs.usableH - pad;
  }

  function measureVisibility(pass, steps) {
    steps = steps || 80;
    var savedOverride = poseOverride;
    var savedFrozen = frozen;
    var savedSmooth = smoothScreenAngle;
    frozen = true;
    var vs = viewSize();
    var uOn = null, uOff = null, uPlaneOn = null, uPlaneOff = null, uNice = null;
    var i, u, off, planeOn, bannerLeftOk, mapBox, b;
    for (i = 0; i <= steps; i++) {
      u = i / steps;
      poseOverride = poseOnPass(pass, u);
      lastPose = poseOverride;
      updateOverlay();
      off = isRigOffscreen();
      planeOn = elementOnScreen(els.plane, vs, 4);
      mapBox = els.overlay.getBoundingClientRect();
      b = els.banner.getBoundingClientRect();
      bannerLeftOk = (b.left - mapBox.left) > 8;
      if (uOn == null && !off) uOn = u;
      if (uPlaneOn == null && planeOn) uPlaneOn = u;
      if (uNice == null && planeOn && bannerLeftOk) uNice = u;
      if (uPlaneOn != null && !planeOn && uPlaneOff == null) uPlaneOff = u;
      if (uOn != null && off && uOff == null) {
        uOff = u;
        break;
      }
    }
    poseOverride = savedOverride;
    frozen = savedFrozen;
    smoothScreenAngle = savedSmooth;
    if (uOn == null) uOn = 0.15;
    if (uOff == null) uOff = 0.9;
    if (uPlaneOn == null) uPlaneOn = uOn;
    if (uPlaneOff == null) uPlaneOff = uOff;
    if (uNice == null) uNice = uPlaneOn;
    return {
      uOn: uOn,
      uOff: uOff,
      uPlaneOn: uPlaneOn,
      uPlaneOff: uPlaneOff,
      uNice: uNice,
      dur: pass.dur
    };
  }

  function startNewPass() {
    if (!mapRef) return null;
    var pass = planPass({ last: passCtrl.last });
    if (!pass) return null;
    passCtrl.pass = pass;
    passCtrl.phase = "fly";
    passCtrl.tStart = passClock();
    passCtrl.everVisible = false;
    passCtrl.holdPose = null;
    passCtrl.snapFlip = true;
    smoothScreenAngle = null;
    return pass;
  }

  function advanceLivePass() {
    if (!mapRef || timeline) return;
    var now = passClock();
    if (passCtrl.phase === "pause") {
      if (now >= passCtrl.pauseUntil) startNewPass();
      return;
    }
    if (!passCtrl.pass) startNewPass();
  }

  function finishPassIfOffscreen() {
    if (timeline || poseOverride) return;
    if (passCtrl.phase !== "fly" || !passCtrl.pass || !els) return;
    var off = isRigOffscreen();
    if (!off) passCtrl.everVisible = true;
    if (passCtrl.everVisible && off) {
      passCtrl.phase = "pause";
      passCtrl.pauseUntil = passClock() + PAUSE_MS;
      passCtrl.last = passCtrl.pass;
      passCtrl.holdPose = lastPose;
      if (els.rig) els.rig.style.visibility = "hidden";
      if (els.shadow) els.shadow.style.visibility = "hidden";
    } else if (!passCtrl.everVisible && (passClock() - passCtrl.tStart) > 18000) {
      startNewPass();
    }
  }

  function poseAt(phase) {
    if (poseOverride) return poseOverride;
    if (timeline) {
      var ms = timeline.clock != null ? timeline.clock : 0;
      return poseFromEvent(eventAtClock(ms), ms);
    }
    if (!passCtrl.pass) return fallbackPose();
    if (passCtrl.phase === "pause" && passCtrl.holdPose) return passCtrl.holdPose;
    var elapsed = Math.max(0, (passClock() - passCtrl.tStart) / 1000);
    var p = destPoint(passCtrl.pass.lng0, passCtrl.pass.lat0, passCtrl.pass.heading, elapsed * SPEED_MS);
    var u = passCtrl.pass.dur ? clamp01((elapsed * 1000) / passCtrl.pass.dur) : 0;
    return {
      lng: p.lng,
      lat: p.lat,
      alt: ALT,
      heading: passCtrl.pass.heading,
      phase: u,
      leg: 0,
      t: u,
      screenAngle: passCtrl.pass.screenAngle,
      entryEdge: passCtrl.pass.entryEdge,
      exitEdge: passCtrl.pass.exitEdge
    };
  }

  function nowPhase() {
    if (timeline) {
      var total = timeline.totalMs || 1;
      return clamp01((timeline.clock || 0) / total);
    }
    if (!passCtrl.pass) return 0;
    if (passCtrl.phase === "pause") return 1;
    var elapsed = Math.max(0, (passClock() - passCtrl.tStart) / 1000);
    return passCtrl.pass.dur ? clamp01((elapsed * 1000) / passCtrl.pass.dur) : 0;
  }

  function buildPreviewScenario(totalMs) {
    totalMs = totalMs || 10000;
    var pauseMs = PAUSE_MS;
    var reentryMs = 3200;
    var p1 = planPass({ preferredScreenAngles: [16, 10, 8, 20, 350, 6] });
    var p2 = planPass({ last: p1, preferredScreenAngles: [196, 188, 204, 170, 164, 210] });
    if (!p1 || !p2) return null;
    var vis1 = measureVisibility(p1, 80);
    var vis2 = measureVisibility(p2, 80);
    var tNice = (vis1.uNice != null ? vis1.uNice : vis1.uPlaneOn) * p1.dur;
    var tRigOff = vis1.uOff * p1.dur;
    var tStart = tNice;
    if (tStart >= tRigOff - 800) tStart = Math.max(0, tRigOff - 5000);
    var uStart = clamp01(tStart / p1.dur);
    var uOff = vis1.uOff;
    var p1SegMs = Math.max(800, (uOff - uStart) * p1.dur);
    /* A full banner exit at 130 m/s takes several seconds; extend the
       clip if needed so the video can show cross, full exit, pause, re-entry. */
    var needed = p1SegMs + pauseMs + reentryMs;
    if (needed > totalMs) totalMs = Math.ceil(needed / 100) * 100;
    var pauseStart = p1SegMs;
    var p2Start = p1SegMs + pauseMs;
    var remain = Math.max(800, totalMs - p2Start);
    var u2End = clamp01(remain / p2.dur);
    if (u2End < (vis2.uNice || vis2.uOn) + 0.04) {
      u2End = Math.min(1, (vis2.uNice || vis2.uOn) + 0.06);
    }
    timeline = {
      clock: 0,
      totalMs: totalMs,
      pauseMs: pauseMs,
      events: [
        { type: "fly", t0: 0, t1: p1SegMs, pass: p1, u0: uStart, u1: uOff },
        { type: "pause", t0: pauseStart, t1: p2Start, pose: poseOnPass(p1, uOff) },
        { type: "fly", t0: p2Start, t1: p2Start + remain, pass: p2, u0: 0, u1: u2End }
      ]
    };
    passCtrl.pass = p1;
    passCtrl.last = null;
    passCtrl.phase = "fly";
    frozen = true;
    if (els) els.overlay.classList.add("is-frozen");
    poseOverride = null;
    placed = null;
    smoothScreenAngle = null;
    passCtrl.snapFlip = true;
    updateOverlay();
    return {
      totalMs: totalMs,
      pauseMs: pauseMs,
      p1: summarizePass(p1, vis1, uStart, uOff, p1SegMs),
      p2: summarizePass(p2, vis2, 0, u2End, remain),
      events: timeline.events.map(function (ev) {
        return { type: ev.type, t0: Math.round(ev.t0), t1: Math.round(ev.t1), u0: ev.u0, u1: ev.u1, entry: ev.pass && ev.pass.entryEdge, exit: ev.pass && ev.pass.exitEdge, angle: ev.pass && ev.pass.screenAngle };
      })
    };
  }

  function summarizePass(pass, vis, u0, u1, ms) {
    return {
      entryEdge: pass.entryEdge,
      exitEdge: pass.exitEdge,
      screenAngle: Math.round(pass.screenAngle * 10) / 10,
      headingDeg: Math.round(pass.heading * 180 / Math.PI * 10) / 10,
      dur: Math.round(pass.dur),
      dist: Math.round(pass.dist),
      uOn: vis && vis.uOn,
      uOff: vis && vis.uOff,
      uPlaneOn: vis && vis.uPlaneOn,
      uPlaneOff: vis && vis.uPlaneOff,
      uNice: vis && vis.uNice,
      u0: u0,
      u1: u1,
      windowMs: Math.round(ms),
      target: pass.target
    };
  }

  function setTimelineClock(ms) {
    if (!timeline) return getPose();
    timeline.clock = Math.max(0, +ms || 0);
    frozen = true;
    if (els) els.overlay.classList.add("is-frozen");
    var ev = eventAtClock(timeline.clock);
    if (!ev || ev.type !== "fly" || !lastEvent || ev !== lastEvent) {
      smoothScreenAngle = null;
      passCtrl.snapFlip = true;
    }
    lastEvent = ev;
    updateOverlay();
    return getPose();
  }

  var lastEvent = null;

  function flyAcrossScreen(durationMs, setupOnly) {
    if (!mapRef) return;
    var pass = planPass({ preferredScreenAngles: [8, 0, 16, 352] });
    if (!pass) return;
    var dur = durationMs || pass.dur || 5200;
    timeline = {
      clock: 0,
      totalMs: dur,
      events: [{ type: "fly", t0: 0, t1: dur, pass: pass, u0: 0, u1: 1 }]
    };
    poseOverride = null;
    placed = null;
    smoothScreenAngle = null;
    if (setupOnly) {
      frozen = true;
      if (els) els.overlay.classList.add("is-frozen");
      updateOverlay();
      return;
    }
    passCtrl.pass = pass;
    passCtrl.phase = "fly";
    passCtrl.tStart = performance.now();
    passCtrl.everVisible = false;
    passCtrl.holdPose = null;
    passCtrl.snapFlip = true;
    timeline = null;
    frozen = false;
    if (els) els.overlay.classList.remove("is-frozen");
    updateOverlay();
    requestAnimationFrame(tick);
  }

  function setFlightProgress(u, clockMs) {
    u = clamp01(+u || 0);
    if (!timeline || !timeline.events || !timeline.events.length) flyAcrossScreen(5200, true);
    setTimelineClock(clockMs != null ? clockMs : u * ((timeline && timeline.totalMs) || 5200));
    return getPose();
  }

  var placed = null; /* {lng,lat,heading} override */

  function placeAt(lng, lat, mode) {
    var heading;
    if (mode === "screen-right" && mapRef) {
      heading = ((mapRef.getBearing() || 0) + 90) * Math.PI / 180;
    } else if (mode === "screen-left" && mapRef) {
      heading = ((mapRef.getBearing() || 0) - 90) * Math.PI / 180;
    } else {
      heading = typeof mode === "number" ? mode : 0;
    }
    placed = { lng: lng, lat: lat, heading: heading };
    /* Hijack poseAt temporarily via lastPose and a wrapper is messier;
       instead override nowPhase pose by setting a flag used in poseAt. */
    poseOverride = { lng: lng, lat: lat, alt: ALT, heading: heading, phase: nowPhase(), leg: 0, t: 0 };
    frozen = true;
    lastPose = poseOverride;
  }

  var poseOverride = null;

  function clearPlace() {
    poseOverride = null;
    placed = null;
  }

  function tick() {
    if (disabled) return;
    if (!frozen && !timeline) {
      advanceLivePass();
    }
    updateOverlay();
    if (!frozen && !timeline) {
      finishPassIfOffscreen();
    }
    if (!frozen && document.visibilityState !== "hidden") {
      requestAnimationFrame(tick);
    }
  }

  function onMapChange() {
    updateOverlay();
  }

  function attach(map) {
    if (!map || mapRef === map && ready) return;
    mapRef = map;
    ensureDom();
    paintBanner();
    ready = true;
    map.on("move", onMapChange);
    map.on("zoom", onMapChange);
    map.on("pitch", onMapChange);
    map.on("rotate", onMapChange);
    map.on("resize", function () {
      lastBannerKey = "";
      paintBanner();
      updateOverlay();
    });
    updateOverlay();
    if (!frozen) requestAnimationFrame(tick);
  }

  function boot() {
    if (disabled) return;
    loadNews();
    setInterval(loadNews, REFRESH_MS);
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var s = window.__FOZ_CITY_SIM__;
      if (s && s.map) {
        clearInterval(timer);
        var map = s.map;
        if (map.isStyleLoaded && map.isStyleLoaded()) attach(map);
        else map.once("load", function () { attach(map); });
        if (s.ready) attach(map);
      }
      if (tries > 400) clearInterval(timer);
    }, 50);
  }

  window.__FOZ_AVIAO__ = {
    ready: function () { return ready && !!(els && els.banner && els.banner.width); },
    hasImage: function () { return !!(bannerImage && bannerImage.complete && bannerImage.width); },
    getText: function () { return bannerTextValue; },
    getConfig: function () {
      return { texto: bannerTextValue, imagem: bannerImageSrc, atualizado: bannerAtualizado };
    },
    getPose: function () { return getPose(); },
    nowPhase: nowPhase,
    setFrozen: function (v) {
      if (v && !frozen && passCtrl.pass && passCtrl.phase === "fly") {
        passCtrl.holdFrozenElapsed = passClock() - passCtrl.tStart;
      }
      if (!v && frozen) {
        clearPlace();
        timeline = null;
        passCtrl.clock = null;
        if (passCtrl.pass && passCtrl.phase === "fly" && passCtrl.holdFrozenElapsed != null) {
          passCtrl.tStart = performance.now() - passCtrl.holdFrozenElapsed;
        }
        passCtrl.holdFrozenElapsed = null;
      }
      frozen = !!v;
      if (els) els.overlay.classList.toggle("is-frozen", frozen);
      updateOverlay();
      if (!frozen) requestAnimationFrame(tick);
    },
    setPhase: function (p) {
      p = clamp01(p);
      clearPlace();
      if (timeline) {
        setTimelineClock(p * (timeline.totalMs || 10000));
        return getPose();
      }
      if (!passCtrl.pass && mapRef) startNewPass();
      if (passCtrl.pass) {
        passCtrl.clock = null;
        passCtrl.tStart = performance.now() - p * (passCtrl.pass.dur || 1);
        passCtrl.phase = "fly";
        passCtrl.everVisible = p > 0.05 && p < 0.95;
        passCtrl.snapFlip = true;
        smoothScreenAngle = null;
      }
      frozen = true;
      if (els) els.overlay.classList.add("is-frozen");
      updateOverlay();
      return getPose();
    },
    placeAt: placeAt,
    frameInView: frameInView,
    flyAcrossScreen: flyAcrossScreen,
    setFlightProgress: setFlightProgress,
    planPass: planPass,
    startPass: startNewPass,
    getPass: function () { return passCtrl.pass; },
    getPassState: function () {
      return {
        phase: passCtrl.phase,
        u: nowPhase(),
        everVisible: passCtrl.everVisible,
        entry: passCtrl.pass && passCtrl.pass.entryEdge,
        exit: passCtrl.pass && passCtrl.pass.exitEdge,
        screenAngle: passCtrl.pass && passCtrl.pass.screenAngle
      };
    },
    buildPreviewScenario: buildPreviewScenario,
    setTimelineClock: setTimelineClock,
    getTimeline: function () { return timeline; },
    isRigOffscreen: isRigOffscreen,
    SPEED_MS: SPEED_MS,
    getScale: currentScale,
    getFade: currentFade,
    update: updateOverlay
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

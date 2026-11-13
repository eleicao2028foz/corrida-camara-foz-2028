/* Banner plane over Foz. Screen-aligned overlay (aviao-faixa-v12). */
(function () {
  "use strict";

  var DATA_URL = "data/aviao-faixa.json";
  var REFRESH_MS = 10 * 60 * 1000;
  var FALLBACK = "FOZ DO IGUAÇU";
  var SPEED_MS = 260; /* cartoony cruise, visible at city zoom */
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
  var PLANE_W = 96;
  var PLANE_H = 54;
  var PLANE_W_MOBILE = 68;
  var PLANE_H_MOBILE = 38;

  /* City-wide loop of straight-ish legs with gentle turns. Most crossings
     pass near Avenida Costa e Silva at varied angles and offsets (not along the street). */
  var ROUTES = [
    { a: [-54.532499, -25.54387], b: [-54.53171, -25.542874] },
    { a: [-54.53171, -25.542874], b: [-54.531042, -25.541807] },
    { a: [-54.531042, -25.541807], b: [-54.530503, -25.540681] },
    { a: [-54.530503, -25.540681], b: [-54.5301, -25.539509] },
    { a: [-54.5301, -25.539509], b: [-54.529837, -25.538304] },
    { a: [-54.529837, -25.538304], b: [-54.529717, -25.537081] },
    { a: [-54.529717, -25.537081], b: [-54.529742, -25.535854] },
    { a: [-54.529742, -25.535854], b: [-54.529911, -25.534636] },
    { a: [-54.529911, -25.534636], b: [-54.530222, -25.533441] },
    { a: [-54.530222, -25.533441], b: [-54.530673, -25.532283] },
    { a: [-54.530673, -25.532283], b: [-54.531256, -25.531176] },
    { a: [-54.531256, -25.531176], b: [-54.531967, -25.530132] },
    { a: [-54.531967, -25.530132], b: [-54.551719, -25.504301] },
    { a: [-54.551719, -25.504301], b: [-54.552571, -25.503302] },
    { a: [-54.552571, -25.503302], b: [-54.553531, -25.502387] },
    { a: [-54.553531, -25.502387], b: [-54.554589, -25.501567] },
    { a: [-54.554589, -25.501567], b: [-54.555734, -25.50085] },
    { a: [-54.555734, -25.50085], b: [-54.556955, -25.500243] },
    { a: [-54.556955, -25.500243], b: [-54.558237, -25.499754] },
    { a: [-54.558237, -25.499754], b: [-54.559568, -25.499387] },
    { a: [-54.559568, -25.499387], b: [-54.560933, -25.499146] },
    { a: [-54.560933, -25.499146], b: [-54.562319, -25.499034] },
    { a: [-54.562319, -25.499034], b: [-54.563709, -25.499052] },
    { a: [-54.563709, -25.499052], b: [-54.565091, -25.4992] },
    { a: [-54.565091, -25.4992], b: [-54.566448, -25.499476] },
    { a: [-54.566448, -25.499476], b: [-54.568057, -25.499883] },
    { a: [-54.568057, -25.499883], b: [-54.569365, -25.500282] },
    { a: [-54.569365, -25.500282], b: [-54.570621, -25.500805] },
    { a: [-54.570621, -25.500805], b: [-54.571809, -25.501444] },
    { a: [-54.571809, -25.501444], b: [-54.572917, -25.502193] },
    { a: [-54.572917, -25.502193], b: [-54.573931, -25.503044] },
    { a: [-54.573931, -25.503044], b: [-54.574842, -25.503987] },
    { a: [-54.574842, -25.503987], b: [-54.575639, -25.505012] },
    { a: [-54.575639, -25.505012], b: [-54.576313, -25.506108] },
    { a: [-54.576313, -25.506108], b: [-54.576856, -25.507261] },
    { a: [-54.576856, -25.507261], b: [-54.577263, -25.50846] },
    { a: [-54.577263, -25.50846], b: [-54.577529, -25.509692] },
    { a: [-54.577529, -25.509692], b: [-54.577651, -25.510941] },
    { a: [-54.577651, -25.510941], b: [-54.578872, -25.541787] },
    { a: [-54.578872, -25.541787], b: [-54.578849, -25.543039] },
    { a: [-54.578849, -25.543039], b: [-54.578681, -25.544282] },
    { a: [-54.578681, -25.544282], b: [-54.578369, -25.545502] },
    { a: [-54.578369, -25.545502], b: [-54.577918, -25.546685] },
    { a: [-54.577918, -25.546685], b: [-54.577332, -25.547818] },
    { a: [-54.577332, -25.547818], b: [-54.576618, -25.548889] },
    { a: [-54.576618, -25.548889], b: [-54.575784, -25.549885] },
    { a: [-54.575784, -25.549885], b: [-54.574839, -25.550796] },
    { a: [-54.574839, -25.550796], b: [-54.573793, -25.551612] },
    { a: [-54.573793, -25.551612], b: [-54.572659, -25.552322] },
    { a: [-54.572659, -25.552322], b: [-54.571448, -25.55292] },
    { a: [-54.571448, -25.55292], b: [-54.570175, -25.553399] },
    { a: [-54.570175, -25.553399], b: [-54.568603, -25.553904] },
    { a: [-54.568603, -25.553904], b: [-54.56727, -25.554263] },
    { a: [-54.56727, -25.554263], b: [-54.565904, -25.554496] },
    { a: [-54.565904, -25.554496], b: [-54.564519, -25.554601] },
    { a: [-54.564519, -25.554601], b: [-54.563129, -25.554575] },
    { a: [-54.563129, -25.554575], b: [-54.56175, -25.554421] },
    { a: [-54.56175, -25.554421], b: [-54.560395, -25.554139] },
    { a: [-54.560395, -25.554139], b: [-54.559079, -25.553732] },
    { a: [-54.559079, -25.553732], b: [-54.557816, -25.553204] },
    { a: [-54.557816, -25.553204], b: [-54.556619, -25.552562] },
    { a: [-54.556619, -25.552562], b: [-54.555501, -25.551811] },
    { a: [-54.555501, -25.551811], b: [-54.554474, -25.55096] },
    { a: [-54.554474, -25.55096], b: [-54.553548, -25.550018] },
    { a: [-54.553548, -25.550018], b: [-54.531757, -25.525418] },
    { a: [-54.531757, -25.525418], b: [-54.530969, -25.524423] },
    { a: [-54.530969, -25.524423], b: [-54.530303, -25.523358] },
    { a: [-54.530303, -25.523358], b: [-54.529765, -25.522234] },
    { a: [-54.529765, -25.522234], b: [-54.529363, -25.521065] },
    { a: [-54.529363, -25.521065], b: [-54.529101, -25.519863] },
    { a: [-54.529101, -25.519863], b: [-54.528981, -25.518642] },
    { a: [-54.528981, -25.518642], b: [-54.529006, -25.517417] },
    { a: [-54.529006, -25.517417], b: [-54.529175, -25.516202] },
    { a: [-54.529175, -25.516202], b: [-54.529485, -25.515009] },
    { a: [-54.529485, -25.515009], b: [-54.529934, -25.513854] },
    { a: [-54.529934, -25.513854], b: [-54.530517, -25.512749] },
    { a: [-54.530517, -25.512749], b: [-54.531226, -25.511707] },
    { a: [-54.531226, -25.511707], b: [-54.532162, -25.510483] },
    { a: [-54.532162, -25.510483], b: [-54.532998, -25.509501] },
    { a: [-54.532998, -25.509501], b: [-54.53394, -25.508603] },
    { a: [-54.53394, -25.508603], b: [-54.53498, -25.507798] },
    { a: [-54.53498, -25.507798], b: [-54.536104, -25.507093] },
    { a: [-54.536104, -25.507093], b: [-54.537303, -25.506498] },
    { a: [-54.537303, -25.506498], b: [-54.538562, -25.506017] },
    { a: [-54.538562, -25.506017], b: [-54.539869, -25.505657] },
    { a: [-54.539869, -25.505657], b: [-54.54121, -25.505421] },
    { a: [-54.54121, -25.505421], b: [-54.54257, -25.505311] },
    { a: [-54.54257, -25.505311], b: [-54.543936, -25.505328] },
    { a: [-54.543936, -25.505328], b: [-54.545293, -25.505473] },
    { a: [-54.545293, -25.505473], b: [-54.546626, -25.505744] },
    { a: [-54.546626, -25.505744], b: [-54.581187, -25.514485] },
    { a: [-54.581187, -25.514485], b: [-54.58246, -25.514874] },
    { a: [-54.58246, -25.514874], b: [-54.583681, -25.515382] },
    { a: [-54.583681, -25.515382], b: [-54.584837, -25.516004] },
    { a: [-54.584837, -25.516004], b: [-54.585914, -25.516733] },
    { a: [-54.585914, -25.516733], b: [-54.586901, -25.517561] },
    { a: [-54.586901, -25.517561], b: [-54.587787, -25.518478] },
    { a: [-54.587787, -25.518478], b: [-54.588562, -25.519475] },
    { a: [-54.588562, -25.519475], b: [-54.589218, -25.520541] },
    { a: [-54.589218, -25.520541], b: [-54.589746, -25.521663] },
    { a: [-54.589746, -25.521663], b: [-54.590142, -25.522829] },
    { a: [-54.590142, -25.522829], b: [-54.590401, -25.524027] },
    { a: [-54.590401, -25.524027], b: [-54.59052, -25.525243] },
    { a: [-54.59052, -25.525243], b: [-54.590578, -25.526718] },
    { a: [-54.590578, -25.526718], b: [-54.590556, -25.527938] },
    { a: [-54.590556, -25.527938], b: [-54.590392, -25.529148] },
    { a: [-54.590392, -25.529148], b: [-54.590089, -25.530336] },
    { a: [-54.590089, -25.530336], b: [-54.589649, -25.531488] },
    { a: [-54.589649, -25.531488], b: [-54.589078, -25.532592] },
    { a: [-54.589078, -25.532592], b: [-54.588383, -25.533635] },
    { a: [-54.588383, -25.533635], b: [-54.587571, -25.534605] },
    { a: [-54.587571, -25.534605], b: [-54.58665, -25.535492] },
    { a: [-54.58665, -25.535492], b: [-54.585632, -25.536287] },
    { a: [-54.585632, -25.536287], b: [-54.584527, -25.536979] },
    { a: [-54.584527, -25.536979], b: [-54.583348, -25.537561] },
    { a: [-54.583348, -25.537561], b: [-54.582108, -25.538027] },
    { a: [-54.582108, -25.538027], b: [-54.548361, -25.548861] },
    { a: [-54.548361, -25.548861], b: [-54.547049, -25.549215] },
    { a: [-54.547049, -25.549215], b: [-54.545703, -25.549445] },
    { a: [-54.545703, -25.549445], b: [-54.544338, -25.549548] },
    { a: [-54.544338, -25.549548], b: [-54.542969, -25.549523] },
    { a: [-54.542969, -25.549523], b: [-54.54161, -25.549371] },
    { a: [-54.54161, -25.549371], b: [-54.540275, -25.549092] },
    { a: [-54.540275, -25.549092], b: [-54.538979, -25.548691] },
    { a: [-54.538979, -25.548691], b: [-54.537734, -25.548172] },
    { a: [-54.537734, -25.548172], b: [-54.536555, -25.547539] },
    { a: [-54.536555, -25.547539], b: [-54.535454, -25.546799] },
    { a: [-54.535454, -25.546799], b: [-54.534442, -25.545961] },
    { a: [-54.534442, -25.545961], b: [-54.53353, -25.545033] },
    { a: [-54.53353, -25.545033], b: [-54.532499, -25.54387] }
  ];

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

  /* ---- path: straight legs across Foz, then the next leg (reappear) ---- */
  function routeMeta() {
    var total = 0;
    var parts = ROUTES.map(function (r) {
      var d = distM(r.a[0], r.a[1], r.b[0], r.b[1]);
      total += d;
      return { r: r, d: d };
    });
    return { total: total, parts: parts };
  }
  var META = routeMeta();

  function distM(lng1, lat1, lng2, lat2) {
    var R = 6371000;
    var p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    var dph = (lat2 - lat1) * Math.PI / 180;
    var dl = (lng2 - lng1) * Math.PI / 180;
    var s = Math.sin(dph / 2) * Math.sin(dph / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function nowPhase() {
    if (frozen && forcedT != null) return forcedT;
    if (frozen) return frac(phase0);
    var sec = (performance.now() - t0) / 1000;
    var dist = phase0 * META.total + sec * SPEED_MS;
    return frac(dist / META.total);
  }

  function poseAt(phase) {
    var dist = clamp01(phase) * META.total;
    var acc = 0;
    var i, p, t, lng, lat, heading;
    for (i = 0; i < META.parts.length; i++) {
      p = META.parts[i];
      if (acc + p.d >= dist || i === META.parts.length - 1) {
        t = p.d <= 0 ? 0 : Math.min(1, Math.max(0, (dist - acc) / p.d));
        lng = p.r.a[0] + (p.r.b[0] - p.r.a[0]) * t;
        lat = p.r.a[1] + (p.r.b[1] - p.r.a[1]) * t;
        heading = Math.atan2(
          (p.r.b[0] - p.r.a[0]) * Math.cos((lat * Math.PI) / 180),
          p.r.b[1] - p.r.a[1]
        );
        return { lng: lng, lat: lat, alt: ALT, heading: heading, phase: phase, leg: i, t: t };
      }
      acc += p.d;
    }
    return { lng: ROUTES[0].a[0], lat: ROUTES[0].a[1], alt: ALT, heading: 0, phase: phase, leg: 0, t: 0 };
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
    "#foz-aviao-overlay .foz-aviao-rig{position:absolute;left:0;top:0;display:flex;flex-direction:row;align-items:center;will-change:transform;filter:drop-shadow(0 3px 3px rgba(0,0,0,.25))}",
    "#foz-aviao-overlay .foz-aviao-rig.is-left{flex-direction:row-reverse}",
    "#foz-aviao-overlay .foz-aviao-banner{display:block;image-rendering:pixelated;image-rendering:crisp-edges;border-radius:2px}",
    "#foz-aviao-overlay.is-night .foz-aviao-banner{filter:brightness(1.08) drop-shadow(0 0 6px rgba(255,220,140,.45))}",
    "#foz-aviao-overlay .foz-aviao-strings{width:48px;height:32px;flex:0 0 48px;overflow:visible}",
    "#foz-aviao-overlay .foz-aviao-plane{position:relative;width:96px;height:54px;flex:0 0 96px}",
    "#foz-aviao-overlay .foz-aviao-plane svg{width:100%;height:100%;display:block;overflow:visible}",
    "#foz-aviao-overlay .foz-aviao-plane.is-left svg{transform:scaleX(-1)}",
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
      + '<canvas class="foz-aviao-banner"></canvas>'
      + STRINGS_SVG
      + '<div class="foz-aviao-plane">' + PLANE_SVG + "</div>"
      + "</div>";
    var host = document.getElementById("map") || document.body;
    host.appendChild(overlay);
    els = {
      overlay: overlay,
      shadow: overlay.querySelector(".foz-aviao-shadow"),
      rig: overlay.querySelector(".foz-aviao-rig"),
      banner: overlay.querySelector(".foz-aviao-banner"),
      plane: overlay.querySelector(".foz-aviao-plane"),
      strings: overlay.querySelector(".foz-aviao-strings"),
      prop: overlay.querySelector(".prop")
    };
    return els;
  }

  function updateOverlay() {
    if (!mapRef || !els) return;
    var pose = poseAt(nowPhase());
    lastPose = pose;
    var air = project3d(mapRef, pose.lng, pose.lat, pose.alt);
    var gnd = project3d(mapRef, pose.lng, pose.lat, 0);
    if (!isFinite(air.x) || !isFinite(air.y)) return;

    /* Screen direction of travel: project a point a few meters ahead */
    var aheadM = 80;
    var dLng = (Math.sin(pose.heading) * aheadM) / (111320 * Math.cos(pose.lat * Math.PI / 180));
    var dLat = (Math.cos(pose.heading) * aheadM) / 110540;
    var air2 = project3d(mapRef, pose.lng + dLng, pose.lat + dLat, pose.alt);
    flyingRight = air2.x >= air.x;
    els.rig.classList.toggle("is-left", !flyingRight);
    els.plane.classList.toggle("is-left", !flyingRight);
    els.overlay.classList.toggle("is-frozen", frozen);
    applyRigScale();
    paintBanner();

    var fade = currentFade();
    var clock = (demoFlight && demoFlight.clock != null) ? demoFlight.clock : performance.now();
    var angle = (frozen && !(demoFlight && demoFlight.clock != null)) ? 28 : (clock * 0.85) % 360;
    if (els.prop) {
      els.prop.setAttribute("transform", "translate(" + PROP_HX + " " + PROP_HY + ") rotate(" + angle + ")");
    }

    /* Place the rig so the plane sprite sits on the projected plane point */
    els.rig.style.opacity = "1";
    els.rig.style.visibility = "hidden";
    els.rig.style.transform = "translate(0px, 0px)";
    var mapBox = els.overlay.getBoundingClientRect();
    var planeBox = els.plane.getBoundingClientRect();
    var rigBox = els.rig.getBoundingClientRect();
    var planeOffX = planeBox.left + planeBox.width / 2 - rigBox.left;
    var planeOffY = planeBox.top + planeBox.height / 2 - rigBox.top;
    var x = air.x - planeOffX;
    var y = air.y - planeOffY;
    els.rig.style.transform = "translate(" + x + "px," + y + "px)";

    /* Hide only when the whole rig is far off-screen, or faded out */
    var pad = 80;
    var on = fade >= 0.02 && !(x + rigBox.width < -pad || x > mapBox.width + pad || y + rigBox.height < -pad || y > mapBox.height + pad);
    els.rig.style.display = on || fade >= 0.02 ? "flex" : "none";
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
      var rigBox = els.rig.getBoundingClientRect();
      if (!rigBox.width) return;
      var targetX;
      if (rigBox.width > mapBox.width - pad * 2) {
        targetX = mapBox.left + pad; /* mobile: pin portrait at the left */
      } else {
        targetX = mapBox.left + Math.max(pad, (mapBox.width - rigBox.width) / 2);
      }
      var targetY = mapBox.top + Math.max(16, (visH - rigBox.height) / 2);
      var dx = targetX - rigBox.left;
      var dy = targetY - rigBox.top;
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

  var demoFlight = null;

  function flyAcrossScreen(durationMs, setupOnly) {
    if (!mapRef || !els) return;
    var map = mapRef;
    var w = els.overlay.clientWidth || map.getContainer().clientWidth;
    var h = els.overlay.clientHeight || map.getContainer().clientHeight;
    var bar = document.getElementById("sec-bar");
    var barH = bar ? bar.getBoundingClientRect().height : 120;
    var y = Math.max(80, (h - barH) * 0.42);
    var start = map.unproject([-160, y]);
    var end = map.unproject([w + 1400, y]);
    var heading = ((map.getBearing() || 0) + 90) * Math.PI / 180;
    demoFlight = {
      t0: performance.now(),
      dur: durationMs || 5200,
      lng0: start.lng, lat0: start.lat,
      lng1: end.lng, lat1: end.lat,
      heading: heading
    };
    poseOverride = null;
    placed = null;
    if (setupOnly) {
      demoFlight.fixedU = 0;
      demoFlight.clock = 0;
      frozen = true;
      if (els) els.overlay.classList.add("is-frozen");
      updateOverlay();
      return;
    }
    frozen = false;
    if (els) els.overlay.classList.remove("is-frozen");
    updateOverlay();
    requestAnimationFrame(tick);
  }

  function setFlightProgress(u, clockMs) {
    u = Math.max(0, Math.min(1, +u || 0));
    if (!demoFlight) flyAcrossScreen(5200, true);
    demoFlight.fixedU = u;
    demoFlight.clock = clockMs != null ? clockMs : u * (demoFlight.dur || 5200);
    frozen = true;
    if (els) els.overlay.classList.add("is-frozen");
    updateOverlay();
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
  var _poseAt = poseAt;
  poseAt = function (phase) {
    if (demoFlight) {
      var u = demoFlight.fixedU != null
        ? demoFlight.fixedU
        : (performance.now() - demoFlight.t0) / demoFlight.dur;
      if (u >= 1) { u = 1; }
      return {
        lng: demoFlight.lng0 + (demoFlight.lng1 - demoFlight.lng0) * u,
        lat: demoFlight.lat0 + (demoFlight.lat1 - demoFlight.lat0) * u,
        alt: ALT,
        heading: demoFlight.heading,
        phase: phase,
        leg: 0,
        t: u
      };
    }
    if (poseOverride) return poseOverride;
    return _poseAt(phase);
  };

  function clearPlace() {
    poseOverride = null;
    placed = null;
  }

  function tick() {
    if (disabled) return;
    updateOverlay();
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
      if (v && !frozen) phase0 = nowPhase();
      if (!v && frozen) {
        t0 = performance.now();
        clearPlace();
        demoFlight = null;
      }
      frozen = !!v;
      if (els) els.overlay.classList.toggle("is-frozen", frozen);
      updateOverlay();
      if (!frozen) requestAnimationFrame(tick);
    },
    setPhase: function (p) {
      forcedT = clamp01(p);
      phase0 = forcedT;
      t0 = performance.now();
      clearPlace();
      demoFlight = null;
      updateOverlay();
      return getPose();
    },
    placeAt: placeAt,
    frameInView: frameInView,
    flyAcrossScreen: flyAcrossScreen,
    setFlightProgress: setFlightProgress,
    getScale: currentScale,
    getFade: currentFade,
    update: updateOverlay
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

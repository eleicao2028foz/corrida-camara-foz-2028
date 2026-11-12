/* Automatic day/night for Foz do Iguaçu (America/Sao_Paulo). No UI toggle.
   Hidden test params: ?modo=dia|noite|crepusculo  and/or  ?hora=HH:MM */
(function () {
  'use strict';

  const FOZ_LAT = -25.5163;
  const FOZ_LON = -54.5854;
  const FOZ_TZ = 'America/Sao_Paulo';
  const TWILIGHT_MIN = 30;

  const NIGHT = {
    paper: '#12192c',
    land: '#151c2e',
    rural: '#121a28',
    greens: '#163044',
    squares: '#1a3848',
    forest: '#102030',
    water: '#1a3d5c',
    streams: '#24557a',
    urban: '#152436',
    asphalt: '#2a2e3a',
    asphaltHi: '#323848',
    casing: '#3a342c',
    dash: '#c9b894',
    label: '#e8eef6',
    labelHalo: '#0d1220',
    place: '#f0d9a0',
    flat: '#3a332c',
    airport: '#2a2e32',
    dam: '#2c3238'
  };

  const LIGHT_DAY = { anchor: 'viewport', color: '#fff6e4', intensity: 0.4, position: [1.25, 210, 40] };
  const LIGHT_NIGHT = { anchor: 'viewport', color: '#b8c4dc', intensity: 0.16, position: [1.15, 200, 55] };

  const ROAD_GLOW = ['estrutural', 'arterial', 'especial', 'conectora', 'coletora', 'binario'];
  const LAMP_SPACING = {
    estrutural: 48, arterial: 55, especial: 60, conectora: 70,
    coletora: 75, binario: 80, local: 95
  };

  let map, ready = false, saved = [], texturesReady = false;
  let lampTimer = 0, tickTimer = 0, currentPhase = -1;
  let forcedModo = null, forcedHora = null;
  const bar = document.getElementById('sec-bar');

  function hash(i, x, y) {
    const n = Math.sin((i * 12.9898 + x * 78.233 + y * 37.719) * 43758.5453);
    return n - Math.floor(n);
  }

  function canvasPattern(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    return g.getImageData(0, 0, w, h);
  }

  function nightWall(seed) {
    const walls = ['#1c2433', '#24202c', '#1a2830', '#2a241c', '#1e2230', '#262030', '#1a222c', '#201c28'];
    const lits = ['#ffd56a', '#ffbe4a', '#ffe8a0', '#f3edd4', '#ff9f4a', '#ffe1a8'];
    return canvasPattern(64, 64, (g) => {
      g.fillStyle = walls[seed % walls.length];
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(255,255,255,0.04)';
      for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
      const tower = seed % 10 === 7;
      if (tower) {
        for (let x = 2; x < 64; x += 8) {
          for (let y = 2; y < 64; y += 12) {
            const h = hash(seed, x, y);
            if (h < 0.28) { g.fillStyle = '#0c1018'; g.fillRect(x, y, 5, 9); }
            else {
              g.fillStyle = 'rgba(255,200,80,0.28)'; g.fillRect(x - 1, y - 1, 7, 11);
              g.fillStyle = lits[(h * 11 | 0) % lits.length];
              g.fillRect(x, y, 5, 9);
            }
          }
        }
        return;
      }
      const dy = seed % 3 === 0 ? 16 : 20;
      const dx = seed % 2 ? 16 : 20;
      for (let y = 0; y < 64; y += dy) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, y + dy - 2, 64, 2);
        for (let x = 3; x < 64; x += dx) {
          const h = hash(seed, x, y);
          const bw = 10, bh = 8;
          if (h < 0.32) {
            g.fillStyle = '#0c1018';
            g.fillRect(x, y + 4, bw, bh);
          } else {
            g.fillStyle = 'rgba(255,190,70,0.35)';
            g.fillRect(x - 1, y + 3, bw + 2, bh + 2);
            g.fillStyle = lits[(h * 13 | 0) % lits.length];
            g.fillRect(x, y + 4, bw, bh);
          }
        }
      }
    });
  }

  function nightRoof(seed) {
    const roofs = ['#2a2420', '#262830', '#2c2824', '#23262c'];
    return canvasPattern(64, 64, (g) => {
      g.fillStyle = roofs[seed % roofs.length];
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1);
    });
  }

  function lampSprite() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 1, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255,248,220,1)');
    grd.addColorStop(0.18, 'rgba(255,220,120,0.95)');
    grd.addColorStop(0.45, 'rgba(255,180,60,0.28)');
    grd.addColorStop(1, 'rgba(255,160,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return g.getImageData(0, 0, 64, 64);
  }

  function headlightSprite() {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 80;
    const g = c.getContext('2d');
    const cone = g.createLinearGradient(24, 40, 24, 0);
    cone.addColorStop(0, 'rgba(255,230,160,0.55)');
    cone.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(18, 44); g.lineTo(4, 0); g.lineTo(44, 0); g.lineTo(30, 44);
    g.closePath(); g.fill();
    for (const x of [18, 30]) {
      const grd = g.createRadialGradient(x, 48, 0, x, 48, 8);
      grd.addColorStop(0, '#fff8e0');
      grd.addColorStop(0.4, '#ffe08a');
      grd.addColorStop(1, 'rgba(255,180,40,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, 48, 8, 0, Math.PI * 2); g.fill();
    }
    return { image: g.getImageData(0, 0, 48, 80), w: 48, h: 80 };
  }

  function ensureTextures() {
    if (texturesReady || !map) return;
    let n = 0;
    while (map.hasImage('retro-wall-' + n)) n++;
    for (let i = 0; i < n; i++) {
      const w = 'retro-wall-night-' + i, r = 'retro-roof-night-' + i;
      if (!map.hasImage(w)) map.addImage(w, nightWall(i), { pixelRatio: 2 });
      if (!map.hasImage(r)) map.addImage(r, nightRoof(i), { pixelRatio: 2 });
    }
    if (!map.hasImage('night-lamp')) map.addImage('night-lamp', lampSprite(), { pixelRatio: 2 });
    if (!map.hasImage('bus-headlight')) {
      const h = headlightSprite();
      map.addImage('bus-headlight', h.image, { pixelRatio: 2 });
    }
    texturesReady = true;
  }

  /* ---------- Foz clock + sunrise/sunset (NOAA/Meeus, no network) ---------- */

  function sind(d) { return Math.sin(d * Math.PI / 180); }
  function cosd(d) { return Math.cos(d * Math.PI / 180); }

  function fozParts(date) {
    const parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: FOZ_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
    return {
      year: +parts.year, month: +parts.month, day: +parts.day,
      hour: +parts.hour, minute: +parts.minute, second: +parts.second
    };
  }

  function fozLocalToDate(y, m, d, H, M, S) {
    let guess = Date.UTC(y, m - 1, d, H + 3, M, S); // America/Sao_Paulo is UTC-3 (no DST since 2019)
    for (let i = 0; i < 4; i++) {
      const p = fozParts(new Date(guess));
      const got = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      const want = Date.UTC(y, m - 1, d, H, M, S);
      if (got === want) break;
      guess += (want - got);
    }
    return new Date(guess);
  }

  function julianDate(y, m, d, hour) {
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + (hour || 0) / 24;
  }

  function julianToDate(J) {
    return new Date((J - 2440587.5) * 86400000);
  }

  function sunTimes(y, m, d, lat, lon) {
    lat = lat == null ? FOZ_LAT : lat;
    lon = lon == null ? FOZ_LON : lon;
    const lw = -lon;
    const Japprox = julianDate(y, m, d, 12);
    const n = Math.round(Japprox - 2451545.0 - lw / 360);
    const Js = 2451545.0 + n + lw / 360;
    let M = (357.5291 + 0.98560028 * (Js - 2451545.0)) % 360;
    let C = 1.9148 * sind(M) + 0.0200 * sind(2 * M) + 0.0003 * sind(3 * M);
    let lam = (M + 102.9372 + C + 180) % 360;
    let Jtrans = Js + 0.0053 * sind(M) - 0.0069 * sind(2 * lam);
    M = (357.5291 + 0.98560028 * (Jtrans - 2451545.0)) % 360;
    C = 1.9148 * sind(M) + 0.0200 * sind(2 * M) + 0.0003 * sind(3 * M);
    lam = (M + 102.9372 + C + 180) % 360;
    Jtrans = Js + 0.0053 * sind(M) - 0.0069 * sind(2 * lam);
    const delta = Math.asin(Math.max(-1, Math.min(1, sind(lam) * sind(23.4397)))) * 180 / Math.PI;
    const cosH = (sind(-0.833) - sind(lat) * sind(delta)) / (cosd(lat) * cosd(delta));
    const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
    const rise = julianToDate(Jtrans - H / 360);
    const sett = julianToDate(Jtrans + H / 360);
    const rp = fozParts(rise), sp = fozParts(sett);
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const fmt = (p) => pad(p.hour) + ':' + pad(p.minute);
    return {
      sunrise: rise,
      sunset: sett,
      sunriseMin: rp.hour * 60 + rp.minute + rp.second / 60,
      sunsetMin: sp.hour * 60 + sp.minute + sp.second / 60,
      sunriseText: fmt(rp),
      sunsetText: fmt(sp),
      sunriseTextFull: fmt(rp) + ':' + pad(rp.second),
      sunsetTextFull: fmt(sp) + ':' + pad(sp.second),
      date: y + '-' + pad(m) + '-' + pad(d)
    };
  }

  function clockNow() {
    if (forcedHora) {
      const p = fozParts(new Date());
      const bits = forcedHora.split(':').map(Number);
      return fozLocalToDate(p.year, p.month, p.day, bits[0] || 0, bits[1] || 0, bits[2] || 0);
    }
    return new Date();
  }

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function nightPhase(at) {
    const modo = forcedModo;
    if (modo === 'dia' || modo === 'day') return 0;
    if (modo === 'noite' || modo === 'night') return 1;
    if (modo === 'crepusculo' || modo === 'entardecer' || modo === 'dusk') return 0.38;
    if (modo === 'alvorecer' || modo === 'dawn') return 0.45;
    const p = fozParts(at || clockNow());
    const times = sunTimes(p.year, p.month, p.day);
    const nowMin = p.hour * 60 + p.minute + p.second / 60;
    const rise = times.sunriseMin, set = times.sunsetMin;
    // Dusk: sunset → sunset+30min (still light at official sunset, then darkens)
    // Dawn: sunrise-30min → sunrise (gets light before official sunrise)
    if (nowMin >= set && nowMin < set + TWILIGHT_MIN) return smoothstep((nowMin - set) / TWILIGHT_MIN);
    if (nowMin >= set + TWILIGHT_MIN || nowMin < rise - TWILIGHT_MIN) return 1;
    if (nowMin >= rise - TWILIGHT_MIN && nowMin < rise) return 1 - smoothstep((nowMin - (rise - TWILIGHT_MIN)) / TWILIGHT_MIN);
    return 0;
  }

  /* ---------- style apply ---------- */

  function remember(kind, layer, prop) {
    if (saved.some((s) => s.kind === kind && s.layer === layer && s.prop === prop)) return;
    try {
      const value = kind === 'paint' ? map.getPaintProperty(layer, prop) : map.getLayoutProperty(layer, prop);
      saved.push({ kind, layer, prop, value });
    } catch (e) { /* missing layer */ }
  }
  function setPaint(layer, prop, value) {
    if (!map.getLayer(layer)) return;
    remember('paint', layer, prop);
    try { map.setPaintProperty(layer, prop, value); } catch (e) {}
  }
  function setLayout(layer, prop, value) {
    if (!map.getLayer(layer)) return;
    remember('layout', layer, prop);
    try { map.setLayoutProperty(layer, prop, value); } catch (e) {}
  }
  function savedValue(kind, layer, prop) {
    const s = saved.find((x) => x.kind === kind && x.layer === layer && x.prop === prop);
    return s ? s.value : undefined;
  }
  function restore() {
    for (let i = saved.length - 1; i >= 0; i--) {
      const s = saved[i];
      try {
        if (s.kind === 'paint') map.setPaintProperty(s.layer, s.prop, s.value);
        else map.setLayoutProperty(s.layer, s.prop, s.value);
      } catch (e) {}
    }
  }

  function parseColor(c) {
    if (typeof c !== 'string') return null;
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      if (h.length !== 6) return null;
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    return m[1].split(',').map((x) => parseFloat(x));
  }
  function mixColor(a, b, t) {
    const A = parseColor(a), B = parseColor(b);
    if (!A || !B) return t < 0.5 ? a : b;
    const n = Math.max(A.length, B.length);
    const o = [];
    for (let i = 0; i < n; i++) o.push((A[i] == null ? 1 : A[i]) + ((B[i] == null ? 1 : B[i]) - (A[i] == null ? 1 : A[i])) * t);
    if (n > 3) return 'rgba(' + (o[0] | 0) + ',' + (o[1] | 0) + ',' + (o[2] | 0) + ',' + o[3] + ')';
    return 'rgb(' + (o[0] | 0) + ',' + (o[1] | 0) + ',' + (o[2] | 0) + ')';
  }
  function mixNum(a, b, t) { return a + (b - a) * t; }
  function paintToward(layer, prop, nightVal, t) {
    const dayVal = savedValue('paint', layer, prop);
    remember('paint', layer, prop);
    if (dayVal != null && typeof dayVal === 'string' && typeof nightVal === 'string') {
      setPaint(layer, prop, mixColor(dayVal, nightVal, t));
    } else {
      setPaint(layer, prop, t >= 0.5 ? nightVal : (dayVal != null ? dayVal : nightVal));
    }
  }

  function addHelperLayers() {
    if (!map.getSource('night-lamps')) {
      map.addSource('night-lamps', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }
    const glowColor = 'rgba(255, 186, 82, 0.22)';
    ROAD_GLOW.forEach((cls) => {
      const id = 'night-road-glow-' + cls;
      if (map.getLayer(id)) return;
      const before = map.getLayer('road-asphalt-' + cls) ? 'road-asphalt-' + cls : undefined;
      const width = cls === 'estrutural' || cls === 'arterial' ? 3.2 : 2.2;
      map.addLayer({
        id, type: 'line', source: 'municipal', 'source-layer': 'roads',
        filter: ['==', ['get', 'cls'], cls],
        layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': glowColor,
          'line-blur': ['interpolate', ['linear'], ['zoom'], 11, 1.2, 16, 3.5, 18, 5],
          'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, width * 1.2, 14, width * 4, 16, width * 10, 18, width * 22],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.35, 14, 0.55, 17, 0.35]
        }
      }, before);
    });
    if (!map.getLayer('night-lamp-glow')) {
      map.addLayer({
        id: 'night-lamp-glow', type: 'circle', source: 'night-lamps', minzoom: 13,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 6, 16, 14, 18, 22],
          'circle-color': 'rgba(255, 196, 90, 0.28)',
          'circle-blur': 0.85,
          'circle-pitch-alignment': 'map',
          'circle-opacity': 0.9
        }
      });
    }
    if (!map.getLayer('night-lamps')) {
      map.addLayer({
        id: 'night-lamps', type: 'symbol', source: 'night-lamps', minzoom: 13,
        layout: {
          visibility: 'none',
          'icon-image': 'night-lamp',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.22, 16, 0.42, 18, 0.62],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
          'icon-padding': 0
        },
        paint: { 'icon-opacity': 0.95 }
      });
    }
    if (map.getSource('sim-buses') && !map.getLayer('sim-bus-headlights')) {
      map.addLayer({
        id: 'sim-bus-headlights', type: 'symbol', source: 'sim-buses', minzoom: 14,
        layout: {
          visibility: 'none',
          'icon-image': 'bus-headlight',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.35, 17, 0.7, 19, 1.05],
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
          'icon-offset': [0, -18]
        },
        paint: { 'icon-opacity': 0.95 }
      });
    }
  }

  function metersPerDeg(lat) {
    return { e: 111320 * Math.cos(lat * Math.PI / 180), n: 110540 };
  }

  function walkLine(coords, spacing, out, cls) {
    if (!coords || coords.length < 2) return;
    let acc = 0;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i];
      const { e, n } = metersPerDeg((a[1] + b[1]) / 2);
      const dx = (b[0] - a[0]) * e, dy = (b[1] - a[1]) * n;
      const len = Math.hypot(dx, dy);
      if (!len) continue;
      let t = (spacing - (acc % spacing)) / len;
      while (t <= 1) {
        const lng = a[0] + (b[0] - a[0]) * t;
        const lat = a[1] + (b[1] - a[1]) * t;
        const nx = -dy / len, ny = dx / len;
        const side = (out.length % 2 ? 1 : -1) * (cls === 'local' ? 5 : 7);
        out.push({
          type: 'Feature',
          properties: { cls },
          geometry: { type: 'Point', coordinates: [lng + (side * nx) / e, lat + (side * ny) / n] }
        });
        t += spacing / len;
      }
      acc += len;
    }
  }

  function refreshLamps() {
    if (currentPhase < 0.08 || !map.getSource('night-lamps')) return;
    const z = map.getZoom();
    if (z < 13) {
      map.getSource('night-lamps').setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    const allowed = z < 14.2
      ? ['estrutural', 'arterial', 'especial']
      : z < 15.5
        ? ['estrutural', 'arterial', 'especial', 'conectora', 'coletora', 'binario']
        : Object.keys(LAMP_SPACING);
    let feats = [];
    try { feats = map.querySourceFeatures('municipal', { sourceLayer: 'roads' }) || []; } catch (e) { return; }
    const out = [];
    const scale = z < 14.2 ? 1.35 : 1;
    const cap = 2200;
    for (const f of feats) {
      if (out.length >= cap) break;
      const cls = f.properties && f.properties.cls;
      if (!allowed.includes(cls)) continue;
      const g = f.geometry;
      const space = (LAMP_SPACING[cls] || 80) * scale;
      if (!g) continue;
      if (g.type === 'LineString') walkLine(g.coordinates, space, out, cls);
      else if (g.type === 'MultiLineString') g.coordinates.forEach((c) => walkLine(c, space, out, cls));
    }
    map.getSource('night-lamps').setData({ type: 'FeatureCollection', features: out });
  }

  function hideNightOverlays() {
    ROAD_GLOW.forEach((cls) => { if (map.getLayer('night-road-glow-' + cls)) map.setLayoutProperty('night-road-glow-' + cls, 'visibility', 'none'); });
    ['night-lamp-glow', 'night-lamps', 'sim-bus-headlights'].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });
    if (map.getSource('night-lamps')) map.getSource('night-lamps').setData({ type: 'FeatureCollection', features: [] });
  }

  function applyDay() {
    restore();
    saved = [];
    hideNightOverlays();
    try { map.setLight(LIGHT_DAY); } catch (e) {}
    if (window.__FOZ_CIVIC__ && window.__FOZ_CIVIC__.setNight) window.__FOZ_CIVIC__.setNight(0);
    document.body.classList.remove('night', 'dusk');
    if (bar) bar.classList.remove('night');
    document.body.style.background = '';
    const el = document.getElementById('map');
    if (el) el.style.background = '';
  }

  function applyPhase(p) {
    p = Math.max(0, Math.min(1, +p || 0));
    if (Math.abs(p - currentPhase) < 0.002) return;
    currentPhase = p;
    if (p <= 0) {
      applyDay();
      publishApi();
      return;
    }
    ensureTextures();
    addHelperLayers();

    paintToward('paper', 'background-color', NIGHT.paper, p);
    setPaint('paper', 'background-pattern', null);
    setPaint('cartographic-land', 'fill-pattern', null);
    paintToward('cartographic-land', 'fill-color', NIGHT.land, p);
    setPaint('cartographic-rural', 'fill-pattern', null);
    paintToward('cartographic-rural', 'fill-color', NIGHT.rural, p);

    if (p >= 0.25) {
      ['urban-grass', 'municipal-green', 'squares'].forEach((id, i) => {
        setPaint(id, 'fill-pattern', null);
        paintToward(id, 'fill-color', [NIGHT.urban, NIGHT.greens, NIGHT.squares][i], p);
        setPaint(id, 'fill-opacity', 1);
      });
      setPaint('national-park', 'fill-pattern', null);
    } else {
      // keep day grass patterns, only tint if a solid color is in use
    }
    paintToward('national-park', 'fill-color', NIGHT.forest, p);
    paintToward('water', 'fill-color', NIGHT.water, p);
    paintToward('secondary-streams', 'line-color', NIGHT.streams, p);
    paintToward('waterfall-reference', 'line-color', '#7ec8d8', p);
    paintToward('dam-reference', 'fill-color', NIGHT.dam, p);
    paintToward('dam-reference-lines', 'line-color', '#4a5560', p);
    paintToward('airport-footprint', 'fill-color', NIGHT.airport, p);
    paintToward('airport-runways', 'line-color', '#6a6e76', p);

    ['local', 'binario', 'coletora', 'conectora', 'especial', 'arterial', 'estrutural'].forEach((cls) => {
      const hot = cls === 'estrutural' || cls === 'arterial';
      paintToward('road-asphalt-' + cls, 'line-color', hot ? NIGHT.asphaltHi : NIGHT.asphalt, p);
      paintToward('road-casing-' + cls, 'line-color', NIGHT.casing, p);
    });
    ['coletora', 'conectora', 'especial', 'arterial', 'estrutural'].forEach((cls) => {
      paintToward('road-centerdash-' + cls, 'line-color', NIGHT.dash, p);
      const dayOp = savedValue('paint', 'road-centerdash-' + cls, 'line-opacity');
      setPaint('road-centerdash-' + cls, 'line-opacity', mixNum(dayOp == null ? 1 : +dayOp || 1, 0.45, p));
    });

    paintToward('footprints-flat', 'fill-color', NIGHT.flat, p);
    const rt = ['to-number', ['get', 'rt'], 0];
    if (p >= 0.4) {
      setPaint('footprints-walls', 'fill-extrusion-pattern', ['concat', 'retro-wall-night-', ['to-string', rt]]);
      setPaint('footprints-roofs', 'fill-extrusion-pattern', ['concat', 'retro-roof-night-', ['to-string', rt]]);
    } else {
      const dw = savedValue('paint', 'footprints-walls', 'fill-extrusion-pattern');
      const dr = savedValue('paint', 'footprints-roofs', 'fill-extrusion-pattern');
      if (dw !== undefined) setPaint('footprints-walls', 'fill-extrusion-pattern', dw);
      if (dr !== undefined) setPaint('footprints-roofs', 'fill-extrusion-pattern', dr);
    }

    setPaint('veg-trees', 'icon-opacity', mixNum(1, 0.45, p));
    setPaint('veg-bushes', 'icon-opacity', mixNum(1, 0.35, p));
    paintToward('street-labels', 'text-color', NIGHT.label, p);
    paintToward('street-labels', 'text-halo-color', NIGHT.labelHalo, p);
    paintToward('district-labels', 'text-color', '#c5d0e0', p);
    paintToward('district-labels', 'text-halo-color', NIGHT.labelHalo, p);
    paintToward('place-labels', 'text-color', NIGHT.place, p);
    paintToward('place-labels', 'text-halo-color', NIGHT.labelHalo, p);
    paintToward('place-markers', 'circle-color', '#e0b86a', p);
    paintToward('place-markers', 'circle-stroke-color', '#1a2030', p);

    if (map.getLayer('sim-bus-labels')) {
      paintToward('sim-bus-labels', 'text-color', '#f3f1e4', p);
      paintToward('sim-bus-labels', 'text-halo-color', '#1a2030', p);
    }

    const lampsOn = p >= 0.12;
    ROAD_GLOW.forEach((cls) => {
      setLayout('night-road-glow-' + cls, 'visibility', lampsOn ? 'visible' : 'none');
      if (lampsOn && map.getLayer('night-road-glow-' + cls)) {
        try {
          map.setPaintProperty('night-road-glow-' + cls, 'line-opacity',
            ['interpolate', ['linear'], ['zoom'], 11, 0.35 * p, 14, 0.55 * p, 17, 0.35 * p]);
        } catch (e) {}
      }
    });
    setLayout('night-lamp-glow', 'visibility', lampsOn ? 'visible' : 'none');
    setLayout('night-lamps', 'visibility', lampsOn ? 'visible' : 'none');
    if (lampsOn) {
      setPaint('night-lamp-glow', 'circle-opacity', 0.9 * p);
      setPaint('night-lamps', 'icon-opacity', 0.95 * p);
    }
    if (map.getLayer('sim-bus-headlights')) {
      setLayout('sim-bus-headlights', 'visibility', p >= 0.4 ? 'visible' : 'none');
      if (p >= 0.4) setPaint('sim-bus-headlights', 'icon-opacity', 0.95 * p);
    }

    try {
      map.setLight({
        anchor: 'viewport',
        color: mixColor(LIGHT_DAY.color, LIGHT_NIGHT.color, p),
        intensity: mixNum(LIGHT_DAY.intensity, LIGHT_NIGHT.intensity, p),
        position: [
          mixNum(LIGHT_DAY.position[0], LIGHT_NIGHT.position[0], p),
          mixNum(LIGHT_DAY.position[1], LIGHT_NIGHT.position[1], p),
          mixNum(LIGHT_DAY.position[2], LIGHT_NIGHT.position[2], p)
        ]
      });
    } catch (e) {}
    if (window.__FOZ_CIVIC__ && window.__FOZ_CIVIC__.setNight) window.__FOZ_CIVIC__.setNight(p);

    document.body.classList.toggle('night', p >= 0.5);
    document.body.classList.toggle('dusk', p > 0 && p < 1);
    if (bar) bar.classList.toggle('night', p >= 0.5);
    const bg = mixColor('#e4e5e2', NIGHT.paper, p);
    document.body.style.background = bg;
    const el = document.getElementById('map');
    if (el) el.style.background = bg;
    refreshLamps();
    publishApi();
  }

  function timesForNow() {
    const p = fozParts(clockNow());
    return sunTimes(p.year, p.month, p.day);
  }

  function publishApi() {
    const t = timesForNow();
    const now = clockNow();
    const fp = fozParts(now);
    window.__FOZ_NIGHT__ = {
      phase: currentPhase,
      night: currentPhase >= 0.5,
      modo: forcedModo,
      hora: forcedHora,
      times: t,
      nowFoz: fp,
      setPhase: applyPhase,
      setModo: (m) => { forcedModo = m || null; currentPhase = -1; tick(); },
      setHora: (h) => { forcedHora = h || null; currentPhase = -1; tick(); },
      tick
    };
  }

  function tick() {
    if (!ready) return;
    applyPhase(nightPhase(clockNow()));
  }

  function scheduleTick() {
    clearTimeout(tickTimer);
    tick();
    const delay = 60000 - (Date.now() % 60000) + 80;
    function loop() {
      tick();
      tickTimer = setTimeout(loop, 60000);
    }
    tickTimer = setTimeout(loop, delay);
  }

  function readParams() {
    try {
      const q = new URLSearchParams(location.search);
      const modo = (q.get('modo') || '').toLowerCase().trim();
      const hora = (q.get('hora') || '').trim();
      forcedModo = modo || null;
      forcedHora = /^\d{1,2}:\d{2}(:\d{2})?$/.test(hora) ? hora : null;
    } catch (e) {
      forcedModo = null; forcedHora = null;
    }
  }

  function onMove() {
    if (currentPhase < 0.08) return;
    clearTimeout(lampTimer);
    lampTimer = setTimeout(refreshLamps, 180);
  }

  function boot() {
    const s = window.__FOZ_CITY_SIM__;
    if (!(s && s.ready && s.map && window.__FOZ_CIVIC__)) { setTimeout(boot, 80); return; }
    map = s.map;
    ready = true;
    readParams();
    try { ensureTextures(); addHelperLayers(); } catch (e) { console.warn('noite setup', e); }
    map.on('moveend', onMove);
    map.on('sourcedata', (e) => {
      if (currentPhase >= 0.08 && e && e.sourceId === 'municipal' && e.isSourceLoaded) onMove();
      if (e && e.sourceId === 'sim-buses') {
        try {
          addHelperLayers();
          if (currentPhase >= 0.4 && map.getLayer('sim-bus-headlights')) {
            map.setLayoutProperty('sim-bus-headlights', 'visibility', 'visible');
          }
        } catch (err) {}
      }
    });
    scheduleTick();
    publishApi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

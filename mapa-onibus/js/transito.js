/* Trânsito no mapa leve de Foz — prévia local (transito-v12).
   Tingimento suave no asfalto + veículos 3D instanciados (como o ônibus 3D).
   Não altera noite/avião. */
(function () {
  "use strict";

  const DATA_URL = "data/transito.json";
  const CATALOG_URL = "veiculos/catalogo.json";
  const MIN_ZOOM = 14.0;
  const PX_PER_M = 18;
  const SPRITE_PAD = 0.45;
  const PACK = 1.8;
  const GAP_HEAVY = 5.2;
  const GAP_MED = 9.5;
  const JAM_COLORS = { pesado: "#ff2d2d", medio: "#ffb020" };
  const JAM_GLOW = { pesado: "#ff6b6b", medio: "#ffd24a" };
  const CIVIL = [
    "hatch-azul","hatch-vermelho","hatch-amarelo","hatch-verde","hatch-branco",
    "sedan-vermelho","sedan-azul","sedan-amarelo","sedan-verde","sedan-branco","sedan-prata",
    "suv-vermelho","suv-azul","suv-verde","suv-amarelo","suv-branco",
    "picape-azul","picape-vermelha","picape-branca",
    "van-azul","van-verde","van-vermelha","van-branca"
  ];
  const APP = ["taxi","uber","comprista-py","comprista-ar"];
  const TWO = ["moto","moto-entrega","bicicleta","patinete"];
  const RARE = ["samu","viatura-pm","viatura-guarda","receita-pf","bombeiros"];
  const HEAVY = [
    "caminhao-bau","caminhao-bau-azul","caminhao-bau-verde","caminhao-bau-amarelo","caminhao-bau-vermelho","caminhao-bau-branco",
    "carreta","caminhao-pipa","caminhao-lixo","betoneira","guincho","micro-onibus","onibus-urbano","kombi-escolar"
  ];
  const ROAD_LAYERS = [
    "road-asphalt-estrutural","road-asphalt-arterial","road-asphalt-especial",
    "road-asphalt-conectora","road-asphalt-coletora","road-asphalt-binario",
    "road-asphalt-local"
  ];

  const ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="18.7" cy="28.35" rx="9.6" ry="1.3" fill="#1c2430" opacity=".2"/><rect x="4.05" y="17.7" width="1.2" height="9.1" rx=".45" fill="#5c6774"/><rect x="1.4" y="2.35" width="6.55" height="15.4" rx="1.9" fill="#3a4554"/><rect x="1.75" y="2.75" width="5.85" height="14.6" rx="1.55" fill="#2d3642"/><circle cx="4.68" cy="6.15" r="1.78" fill="#b71c1c"/><circle cx="4.68" cy="6.15" r="1.32" fill="#ff2d2d"/><circle cx="4.22" cy="5.7" r=".48" fill="#ffb0a8" opacity=".8"/><circle cx="4.68" cy="10.35" r="1.78" fill="#b8860b"/><circle cx="4.68" cy="10.35" r="1.32" fill="#ffb020"/><circle cx="4.22" cy="9.9" r=".42" fill="#ffe58a" opacity=".85"/><circle cx="4.68" cy="14.55" r="1.78" fill="#1b7a40"/><circle cx="4.68" cy="14.55" r="1.32" fill="#3cba6a"/><circle cx="4.22" cy="14.1" r=".42" fill="#b6f0c8" opacity=".75"/><ellipse cx="12.05" cy="25.85" rx="2.6" ry="3.2" fill="#23282f"/><ellipse cx="12.05" cy="25.85" rx="1.15" ry="1.45" fill="#d0d5dc"/><ellipse cx="25.5" cy="25.85" rx="2.6" ry="3.2" fill="#23282f"/><ellipse cx="25.5" cy="25.85" rx="1.15" ry="1.45" fill="#d0d5dc"/><path fill="#3d587e" stroke="#2a3d58" stroke-width=".65" stroke-linejoin="round" d="M10.15 25.05 C9.35 25.05 8.85 24.35 8.9 23.5 L9.2 17.35 C9.3 15.7 10.2 14.55 12.0 13.7 C12.7 12.35 14.15 9.85 16.0 8.85 C16.7 8.5 17.5 8.35 18.75 8.35 C20.0 8.35 20.8 8.5 21.5 8.85 C23.35 9.85 24.8 12.35 25.5 13.7 C27.3 14.55 28.2 15.7 28.3 17.35 L28.6 23.5 C28.65 24.35 28.15 25.05 27.35 25.05 Z"/><path fill="#4d6d98" d="M15.35 9.15 C16.0 8.75 17.0 8.6 18.75 8.6 C20.5 8.6 21.5 8.75 22.15 9.15 C23.15 9.75 23.85 11.15 24.15 12.35 L13.35 12.35 C13.65 11.15 14.35 9.75 15.35 9.15 Z"/><path fill="#b9d0e8" stroke="#5b7798" stroke-width=".45" stroke-linejoin="round" d="M13.7 13.95 L14.85 11.15 C15.25 10.25 16.2 9.8 17.2 9.8 L20.3 9.8 C21.3 9.8 22.25 10.25 22.65 11.15 L23.8 13.95 C23.95 14.3 23.7 14.7 23.3 14.7 L14.2 14.7 C13.8 14.7 13.55 14.3 13.7 13.95 Z"/><path fill="#4d6d98" d="M12.15 15.55 C13.0 15.2 15.1 14.95 18.75 14.95 C22.4 14.95 24.5 15.2 25.35 15.55 L26.15 18.55 C26.25 18.95 25.95 19.3 25.55 19.3 L11.95 19.3 C11.55 19.3 11.25 18.95 11.35 18.55 Z"/><rect x="15.05" y="16.4" width="7.4" height="2.2" rx=".55" fill="#2a3340"/><path d="M16.0 16.85 h5.5 M16.0 17.55 h5.5" stroke="#7a8490" stroke-width=".4" stroke-linecap="round"/><ellipse cx="12.45" cy="17.4" rx="1.95" ry="1.25" fill="#d4b84a"/><ellipse cx="12.45" cy="17.4" rx="1.45" ry=".9" fill="#f6e27a"/><ellipse cx="12.55" cy="17.15" rx=".75" ry=".45" fill="#fff8d0"/><ellipse cx="25.05" cy="17.4" rx="1.95" ry="1.25" fill="#d4b84a"/><ellipse cx="25.05" cy="17.4" rx="1.45" ry=".9" fill="#f6e27a"/><ellipse cx="25.15" cy="17.15" rx=".75" ry=".45" fill="#fff8d0"/><rect x="10.0" y="20.7" width="17.5" height="2.4" rx=".75" fill="#33455f"/><rect x="16.2" y="21.2" width="5.1" height=".85" rx=".35" fill="#c5ccd4"/></svg>';

  let map, data, catalog = [], byId = {}, vehicles = [];
  let running = false, lastTs = 0, selected = null, raf = 0, traf3d = null;
  let flow = null, lastFlowTs = 0;
  const FLOW_TILE_W = 128, FLOW_TILE_H = 32;
  const FLOW_SPEED_PESADO = 22; /* px/s no tile — lento no vermelho */
  const FLOW_SPEED_MEDIO = 44;  /* ~2x, um pouco mais rápido no laranja */

  function ready(fn) {
    if (window.__FOZ_CITY_SIM__ && window.__FOZ_CITY_SIM__.ready && window.__FOZ_CITY_SIM__.map) {
      fn();
      return;
    }
    const t0 = Date.now();
    const id = setInterval(function () {
      if (window.__FOZ_CITY_SIM__ && window.__FOZ_CITY_SIM__.ready && window.__FOZ_CITY_SIM__.map) {
        clearInterval(id); fn();
      } else if (Date.now() - t0 > 60000) clearInterval(id);
    }, 200);
  }

  function dest(lon, lat, heading, meters) {
    const R = 6371000, lat1 = lat * Math.PI / 180, lon1 = lon * Math.PI / 180;
    const brng = heading * Math.PI / 180, ang = meters / R;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(ang) * Math.cos(lat1),
      Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2));
    return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI];
  }

  function lineLen(line) {
    let n = 0;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i];
      const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
      n += Math.hypot((b[0] - a[0]) * 111320 * Math.cos(lat), (b[1] - a[1]) * 111320);
    }
    return n;
  }

  function along(line, s) {
    if (!line || line.length < 2) return { coord: line && line[0] || [0, 0], heading: 0 };
    let rem = ((s % 1e12) + 1e12) % 1e12;
    const total = lineLen(line);
    if (total <= 0) return { coord: line[0], heading: 0 };
    rem = rem % total;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i];
      const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
      const d = Math.hypot((b[0] - a[0]) * 111320 * Math.cos(lat), (b[1] - a[1]) * 111320);
      if (rem > d && i < line.length - 1) { rem -= d; continue; }
      const t = d ? rem / d : 0;
      const coord = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
      const heading = Math.atan2((b[0] - a[0]) * Math.cos(lat), b[1] - a[1]) * 180 / Math.PI;
      return { coord, heading };
    }
    return { coord: line[line.length - 1], heading: 0 };
  }

  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function pickSprite(kind) {
    const r = Math.random();
    if (kind === "jam-heavy") {
      if (r < 0.03) return pick(RARE);
      if (r < 0.18) return pick(HEAVY);
      if (r < 0.30) return pick(APP);
      if (r < 0.36) return pick(TWO);
      return pick(CIVIL);
    }
    if (kind === "jam-medium") {
      if (r < 0.03) return pick(RARE);
      if (r < 0.12) return pick(HEAVY);
      if (r < 0.28) return pick(APP);
      if (r < 0.36) return pick(TWO);
      return pick(CIVIL);
    }
    if (r < 0.012) return pick(RARE);
    if (r < 0.08) return pick(HEAVY);
    if (r < 0.2) return pick(APP);
    if (r < 0.32) return pick(TWO);
    return pick(CIVIL);
  }

  function formatClock(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return h + "h" + m;
  }

  function formatDelay(s) {
    s = Math.max(0, s | 0);
    if (s < 60) return s + " s de atraso";
    return Math.round(s / 60) + " min de atraso";
  }

  function isWide(t) {
    if (t && t.faixas >= 2) return true;
    const r = ((t && t.rua) || "").toLowerCase();
    return /avenida|br-?277|ponte|acesso/.test(r);
  }

  const ASPHALT_PX16 = {
    local: 6.494688287230382,
    binario: 9.278126124614833,
    coletora: 9.278126124614833,
    conectora: 11.133751349537798,
    especial: 12.989376574460763,
    arterial: 14.84500179938373,
    estrutural: 18.556252249229665
  };
  const TINT_OPACITY = ["match", ["get", "nivel"], "pesado", 0.55, 0.50];
  const HL_OPACITY = 0.35;
  const GLOW_OPACITY_PESADO = 0.30;
  const GLOW_OPACITY_MEDIO = 0.26;

  function asphaltWidthM(cls, lat) {
    const px = ASPHALT_PX16[cls] || ASPHALT_PX16.local;
    const mpp = 156543.03392804097 * Math.cos((lat || -25.517) * Math.PI / 180) / 65536;
    return px * mpp;
  }

  function clsOf(t) {
    return (t && t.cls) || (isWide(t) ? "conectora" : "local");
  }

  function hasApiSentido(t) {
    if (!t) return false;
    if (t.fonte_sentido === "waze-api" || t.sentido_waze || t.direcao) return true;
    const s = t.sentido;
    if (s == null || s === "" || s === "ambos" || s === "desconhecido") return false;
    return true;
  }

  function lineHeading(line) {
    if (!line || line.length < 2) return 0;
    const a = line[0], b = line[line.length - 1];
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    return Math.atan2((b[0] - a[0]) * Math.cos(lat), b[1] - a[1]) * 180 / Math.PI;
  }

  function midOf(line) {
    return line[line.length >> 1];
  }

  function lateralM(point, a, b) {
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const dx = (b[0] - a[0]) * 111320 * Math.cos(lat);
    const dy = (b[1] - a[1]) * 111320;
    const L = Math.hypot(dx, dy) || 1;
    const px = (point[0] - a[0]) * 111320 * Math.cos(lat);
    const py = (point[1] - a[1]) * 111320;
    return (dx * py - dy * px) / L;
  }

  function headingsAgree(h1, h2) {
    let d = Math.abs(h1 - h2) % 360;
    if (d > 180) d = 360 - d;
    return d < 70;
  }

  function orientSiblingLeft(line, siblingMid) {
    if (lateralM(siblingMid, line[0], line[line.length - 1]) >= -0.2) return line;
    return line.slice().reverse();
  }

  function findTwinLine(line, lines) {
    const h = lineHeading(line);
    const a = line[0], b = line[line.length - 1];
    for (let i = 0; i < lines.length; i++) {
      const other = lines[i].line || lines[i];
      if (other === line) continue;
      const dbrg = Math.abs(((lineHeading(other) - h + 180) % 360) - 180);
      const par = Math.min(dbrg, Math.abs(dbrg - 180));
      if (par > 18) continue;
      const latm = Math.abs(lateralM(midOf(other), a, b));
      if (latm >= 8 && latm <= 18) return other;
    }
    return null;
  }

  function jamLayout(t) {
    if (t._layout) return t._layout;
    const cls = clsOf(t);
    const lat = (t.centro && t.centro[1]) || (t.linha && t.linha[0] && t.linha[0][1]) || -25.517;
    const widthM = asphaltWidthM(cls, lat);
    const api = hasApiSentido(t);
    let mao = t.mao;
    let pistas = t.pistas;
    if (pistas && pistas.length >= 2) mao = "dupla-pistas";
    if (!mao) mao = isWide(t) ? "dupla" : "unica";
    const layout = { cls: cls, mao: mao, widthM: widthM, api: api, jam: [] };

    if (mao === "dupla-pistas" && pistas && pistas.length >= 2) {
      pistas.forEach(function (line) {
        const other = pistas[0] === line ? pistas[1] : pistas[0];
        const L = orientSiblingLeft(line, midOf(other));
        if (api && !headingsAgree(lineHeading(L), lineHeading(t.linha))) return;
        layout.jam.push({ line: L, lane: 0 });
      });
      if (!layout.jam.length) layout.jam.push({ line: t.linha, lane: 0 });
    } else if (mao === "unica") {
      const n = t.faixas || 1;
      if (n >= 2) {
        const usable = Math.max(3.2, widthM * 0.72);
        const laneW = usable / n;
        for (let i = 0; i < n; i++) {
          layout.jam.push({ line: t.linha, lane: -usable / 2 + (i + 0.5) * laneW });
        }
      } else {
        layout.jam.push({ line: t.linha, lane: 0 });
      }
    } else {
      const off = widthM / 4;
      layout.jam.push({ line: t.linha, lane: off });
      if (!api) layout.jam.push({ line: t.linha.slice().reverse(), lane: off });
    }
    t._layout = layout;
    return layout;
  }

  function slotOf(sprite, gap) {
    const meta = byId[sprite] || { comprimento_m: 4.5 };
    const len = meta.comprimento_m || 4.5;
    return len * PACK + gap;
  }

  async function svgImage(url, w, h) {
    const res = await fetch(url);
    const text = await res.text();
    const blob = new Blob([text], { type: "image/svg+xml" });
    const src = URL.createObjectURL(blob);
    try {
      const img = await new Promise(function (resolve, reject) {
        const i = new Image();
        const to = setTimeout(function () { reject(new Error("timeout svg " + url)); }, 8000);
        i.onload = function () { clearTimeout(to); resolve(i); };
        i.onerror = function (e) { clearTimeout(to); reject(e || new Error("fail svg " + url)); };
        i.src = src;
      });
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      return c;
    } finally {
      URL.revokeObjectURL(src);
    }
  }

  async function loadCatalog() {
    const cat = await (await fetch(CATALOG_URL)).json();
    catalog = cat.veiculos || [];
    catalog.forEach(function (v) { byId[v.id] = v; });
  }

  function jamFC() {
    const features = [];
    (data.trechos || []).forEach(function (t) {
      const layout = jamLayout(t);
      layout.jam.forEach(function (L) {
        features.push({
          type: "Feature",
          properties: {
            id: t.id,
            nivel: t.nivel,
            rua: t.rua,
            cls: layout.cls,
            faixa: isWide(t) ? "larga" : "fina",
            selected: selected === t.id ? 1 : 0
          },
          geometry: { type: "LineString", coordinates: L.line }
        });
      });
    });
    return { type: "FeatureCollection", features: features };
  }

  function vehicleFC() {
    const z = map ? map.getZoom() : 16;
    if (z < MIN_ZOOM) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: vehicles.map(function (v) {
        const pos = along(v.line, v.s);
        const offset = dest(pos.coord[0], pos.coord[1], pos.heading + 90, v.lane);
        return {
          type: "Feature",
          properties: { sprite: "tv-" + v.sprite, heading: pos.heading },
          geometry: { type: "Point", coordinates: offset }
        };
      })
    };
  }

  function layerBefore() {
    const ids = ["footprints-walls", "footprints-roofs", "veg-trees", "street-labels"];
    for (let i = 0; i < ids.length; i++) {
      if (map.getLayer(ids[i])) return ids[i];
    }
    return undefined;
  }

  const TINT_W = [
    "interpolate", ["exponential", 2], ["zoom"],
    9, ["match", ["get", "cls"],
      "estrutural", 0.14497072069710676,
      "arterial", 0.1159765765576854,
      "especial", 0.10147950448797471,
      "conectora", 0.08698243241826405,
      "coletora", 0.07248536034855338,
      "binario", 0.07248536034855338,
      0.05073975224398736],
    13, ["match", ["get", "cls"],
      "estrutural", 2.319531531153708,
      "arterial", 1.8556252249229663,
      "especial", 1.6236720718075954,
      "conectora", 1.3917189186922247,
      "coletora", 1.159765765576854,
      "binario", 1.159765765576854,
      0.8118360359037977],
    16, ["match", ["get", "cls"],
      "estrutural", 18.556252249229665,
      "arterial", 14.84500179938373,
      "especial", 12.989376574460763,
      "conectora", 11.133751349537798,
      "coletora", 9.278126124614833,
      "binario", 9.278126124614833,
      6.494688287230382],
    20, ["match", ["get", "cls"],
      "estrutural", 296.90003598767464,
      "arterial", 237.5200287901397,
      "especial", 207.83002519137221,
      "conectora", 178.14002159260477,
      "coletora", 148.45001799383732,
      "binario", 148.45001799383732,
      103.91501259568611]
  ];


  function drawFlowChevrons(ctx, w, h, offset, fill) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = fill;
    const period = 40;
    const o = ((offset % period) + period) % period;
    const mid = h / 2, margin = h * 0.16, tip = 15, thick = 7;
    for (let x = -period; x <= w + period; x += period) {
      const xx = x + o;
      ctx.beginPath();
      ctx.moveTo(xx, margin);
      ctx.lineTo(xx + tip, mid);
      ctx.lineTo(xx, h - margin);
      ctx.lineTo(xx + thick, h - margin);
      ctx.lineTo(xx + tip + thick, mid);
      ctx.lineTo(xx + thick, margin);
      ctx.closePath();
      ctx.fill();
    }
  }

  function flowImageData(entry) {
    return entry.ctx.getImageData(0, 0, FLOW_TILE_W, FLOW_TILE_H);
  }

  function ensureFlowImages() {
    if (!flow) {
      function make(fill) {
        const canvas = document.createElement("canvas");
        canvas.width = FLOW_TILE_W;
        canvas.height = FLOW_TILE_H;
        return { canvas: canvas, ctx: canvas.getContext("2d", { willReadFrequently: true }), offset: 0, fill: fill };
      }
      flow = {
        pesado: make("rgba(255,255,255,0.64)"),
        medio: make("rgba(255,248,220,0.68)")
      };
      drawFlowChevrons(flow.pesado.ctx, FLOW_TILE_W, FLOW_TILE_H, 0, flow.pesado.fill);
      drawFlowChevrons(flow.medio.ctx, FLOW_TILE_W, FLOW_TILE_H, 0, flow.medio.fill);
    }
    if (!map) return;
    ["pesado", "medio"].forEach(function (k) {
      const id = "traf-flow-" + k;
      const img = flowImageData(flow[k]);
      if (map.hasImage(id)) {
        try { map.updateImage(id, img); } catch (e) {}
      } else {
        map.addImage(id, img, { pixelRatio: 2 });
      }
    });
  }

  function tickFlow(ts) {
    if (!map || !flow) return;
    const dt = lastFlowTs ? Math.min(0.08, (ts - lastFlowTs) / 1000) : 0.016;
    lastFlowTs = ts;
    flow.pesado.offset += FLOW_SPEED_PESADO * dt;
    flow.medio.offset += FLOW_SPEED_MEDIO * dt;
    drawFlowChevrons(flow.pesado.ctx, FLOW_TILE_W, FLOW_TILE_H, flow.pesado.offset, flow.pesado.fill);
    drawFlowChevrons(flow.medio.ctx, FLOW_TILE_W, FLOW_TILE_H, flow.medio.offset, flow.medio.fill);
    try {
      if (map.hasImage("traf-flow-pesado")) map.updateImage("traf-flow-pesado", flowImageData(flow.pesado));
      if (map.hasImage("traf-flow-medio")) map.updateImage("traf-flow-medio", flowImageData(flow.medio));
    } catch (e) {}
  }

  function paintFlowLayer(id, nivel, imageId) {
    const before = layerBefore();
    const filter = ["==", ["get", "nivel"], nivel];
    if (!map.getLayer(id)) {
      map.addLayer({
        id: id,
        type: "line",
        source: "foz-transito",
        filter: filter,
        layout: { "line-cap": "butt", "line-join": "bevel" },
        paint: {
          "line-pattern": imageId,
          "line-width": TINT_W,
          "line-opacity": 0.92,
          "line-blur": 0
        }
      }, before);
    } else {
      map.setFilter(id, filter);
      map.setLayoutProperty(id, "line-cap", "butt");
      map.setLayoutProperty(id, "line-join", "bevel");
      map.setPaintProperty(id, "line-pattern", imageId);
      map.setPaintProperty(id, "line-width", TINT_W);
      map.setPaintProperty(id, "line-opacity", 0.92);
      map.setPaintProperty(id, "line-blur", 0);
    }
  }

  function ensureLayers() {
    ensureFlowImages();

    if (!map.getSource("foz-transito")) {
      map.addSource("foz-transito", { type: "geojson", data: jamFC() });
    } else {
      map.getSource("foz-transito").setData(jamFC());
    }
    const before = layerBefore();
    // some uma eventual borda/casco da versão anterior
    if (map.getLayer("foz-transito-casco")) {
      try { map.removeLayer("foz-transito-casco"); } catch (e) {}
    }
    if (map.getLayer("foz-transito-cars")) {
      try { map.removeLayer("foz-transito-cars"); } catch (e) {}
    }
    function paintGlow(id, nivel, color, opacity) {
      const filter = ["==", ["get", "nivel"], nivel];
      if (!map.getLayer(id)) {
        map.addLayer({
          id: id,
          type: "line",
          source: "foz-transito",
          filter: filter,
          layout: { "line-cap": "butt", "line-join": "bevel" },
          paint: {
            "line-color": color,
            "line-width": TINT_W,
            "line-opacity": opacity,
            "line-blur": 3.4
          }
        }, before);
      } else {
        map.setFilter(id, filter);
        map.setLayoutProperty(id, "line-cap", "butt");
        map.setLayoutProperty(id, "line-join", "bevel");
        map.setPaintProperty(id, "line-color", color);
        map.setPaintProperty(id, "line-width", TINT_W);
        map.setPaintProperty(id, "line-opacity", opacity);
        map.setPaintProperty(id, "line-blur", 3.4);
      }
    }
    paintGlow("foz-transito-glow-pesado", "pesado", JAM_GLOW.pesado, GLOW_OPACITY_PESADO);
    paintGlow("foz-transito-glow-medio", "medio", JAM_GLOW.medio, GLOW_OPACITY_MEDIO);
    paintFlowLayer("foz-transito-flow-pesado", "pesado", "traf-flow-pesado");
    paintFlowLayer("foz-transito-flow-medio", "medio", "traf-flow-medio");

    if (!map.getLayer("foz-transito-linha")) {

      map.addLayer({
        id: "foz-transito-linha",
        type: "line",
        source: "foz-transito",
        layout: { "line-cap": "butt", "line-join": "bevel" },
        paint: {
          "line-color": ["match", ["get", "nivel"], "pesado", JAM_COLORS.pesado, JAM_COLORS.medio],
          "line-width": TINT_W,
          "line-opacity": TINT_OPACITY,
          "line-blur": 0
        }
      }, before);
    } else {
      map.setLayoutProperty("foz-transito-linha", "line-cap", "butt");
      map.setLayoutProperty("foz-transito-linha", "line-join", "bevel");
      map.setPaintProperty("foz-transito-linha", "line-color", ["match", ["get", "nivel"], "pesado", JAM_COLORS.pesado, JAM_COLORS.medio]);
      map.setPaintProperty("foz-transito-linha", "line-width", TINT_W);
      map.setPaintProperty("foz-transito-linha", "line-opacity", TINT_OPACITY);
      map.setPaintProperty("foz-transito-linha", "line-blur", 0);
    }
    if (!map.getLayer("foz-transito-hl")) {
      map.addLayer({
        id: "foz-transito-hl",
        type: "line",
        source: "foz-transito",
        filter: ["==", ["get", "selected"], 1],
        layout: { "line-cap": "butt", "line-join": "bevel" },
        paint: {
          "line-color": "#ffe566",
          "line-width": TINT_W,
          "line-opacity": HL_OPACITY,
          "line-blur": 0
        }
      }, before);
    } else {
      map.setLayoutProperty("foz-transito-hl", "line-cap", "butt");
      map.setPaintProperty("foz-transito-hl", "line-color", "#ffe566");
      map.setPaintProperty("foz-transito-hl", "line-width", TINT_W);
      map.setPaintProperty("foz-transito-hl", "line-opacity", HL_OPACITY);
      map.setPaintProperty("foz-transito-hl", "line-blur", 0);
    }
    const b = layerBefore();
    if (b) {
      ["foz-transito-glow-pesado", "foz-transito-glow-medio", "foz-transito-linha", "foz-transito-flow-pesado", "foz-transito-flow-medio", "foz-transito-hl"].forEach(function (id) {
        if (map.getLayer(id)) {
          try { map.moveLayer(id, b); } catch (e) {}
        }
      });
    }
  }

  function ensureCars3D() {
    if (traf3d) return;
    if (!window.FozTrafego3D || !window.FozTrafego3D.createLayer) {
      console.error("FozTrafego3D não carregou");
      return;
    }
    traf3d = window.FozTrafego3D.createLayer(map, { id: "foz-transito-cars3d", minzoom: MIN_ZOOM });
    const before = map.getLayer("sim-bus-labels") ? "sim-bus-labels" : undefined;
    map.addLayer(traf3d, before);
  }

  function pushCars() {
    if (!traf3d) return;
    if (!map || map.getZoom() < MIN_ZOOM) {
      traf3d.setVehicles([]);
      return;
    }
    const list = vehicles.map(function (v) {
      const pos = along(v.line, v.s);
      const offset = dest(pos.coord[0], pos.coord[1], pos.heading + 90, v.lane);
      return { coordinates: offset, heading: pos.heading, type: v.sprite };
    });
    traf3d.setVehicles(list);
  }

  function pushJamCar(out, line, pathLen, s, sprite, lane, baseKmh, heavy) {
    const meta = byId[sprite] || { comprimento_m: 4.5 };
    out.push({
      line: line,
      pathLen: pathLen,
      s: s,
      sprite: sprite,
      lane: lane,
      baseSpeed: (baseKmh / 3.6) * (0.75 + Math.random() * 0.5),
      speed: 0,
      phase: Math.random() * Math.PI * 2,
      freq: heavy ? (0.35 + Math.random() * 0.5) : (0.15 + Math.random() * 0.2),
      loop: true,
      kind: "jam",
      length: meta.comprimento_m || 4.5
    });
  }

  function spawnJamVehicles() {
    const out = [];
    (data.trechos || []).forEach(function (t) {
      const layout = jamLayout(t);
      const raw = t.linha;
      const len = t.comprimento_m || lineLen(raw);
      const heavy = t.nivel === "pesado";
      const gap = heavy ? GAP_HEAVY : GAP_MED;
      const baseKmh = heavy ? (t.velocidade_kmh || 7) : (t.velocidade_kmh || 20);
      layout.jam.forEach(function (L, li) {
        const pathLen = lineLen(L.line) || len;
        let s = 6 + (li * 8) % 17;
        let n = 0;
        const cap = heavy ? 22 : 12;
        const showcase = (t.id === "pesado-carlos-gomes" && li === 0)
          ? ["taxi","sedan-vermelho","suv-azul","caminhao-bau-amarelo","hatch-verde","sedan-branco","caminhao-bau-vermelho","suv-amarelo"]
          : null;
        while (s < pathLen - 6 && n < cap) {
          const sprite = (showcase && n < showcase.length) ? showcase[n] : pickSprite(heavy ? "jam-heavy" : "jam-medium");
          const slot = slotOf(sprite, gap);
          if (s + slot * 0.35 > pathLen) break;
          pushJamCar(out, L.line, pathLen, s, sprite, L.lane, baseKmh, heavy);
          s += slot;
          n++;
        }
      });
    });
    return out;
  }

  function visibleLines() {
    let feats = [];
    const layers = ROAD_LAYERS.filter(function (id) { return map.getLayer(id); });
    try {
      if (layers.length) feats = map.queryRenderedFeatures({ layers: layers }) || [];
    } catch (e) {}
    if (!feats.length) {
      try {
        feats = map.querySourceFeatures("municipal", { sourceLayer: "roads" }) || [];
      } catch (e) { return []; }
    }
    const lines = [];
    const seen = new Set();
    feats.forEach(function (f) {
      const g = f.geometry;
      if (!g) return;
      const cls = (f.properties && f.properties.cls) || "local";
      const parts = g.type === "LineString" ? [g.coordinates]
        : g.type === "MultiLineString" ? g.coordinates : [];
      parts.forEach(function (c) {
        if (!c || c.length < 2) return;
        const len = lineLen(c);
        if (len < 35) return;
        const key = c[0][0].toFixed(5) + "," + c[0][1].toFixed(5) + ":" + c[c.length - 1][0].toFixed(5);
        if (seen.has(key)) return;
        seen.add(key);
        lines.push({ line: c, len: len, cls: cls });
      });
    });
    return lines;
  }

  function nearJam(line) {
    const trechos = data.trechos || [];
    const mid = line[line.length >> 1];
    for (let i = 0; i < trechos.length; i++) {
      const layout = jamLayout(trechos[i]);
      const paths = layout.jam.length ? layout.jam.map(function (j) { return j.line; }) : [trechos[i].linha];
      for (let k = 0; k < paths.length; k++) {
        const L = paths[k];
        for (let j = 0; j < L.length; j++) {
          const lat = ((mid[1] + L[j][1]) / 2) * Math.PI / 180;
          const d = Math.hypot((mid[0] - L[j][0]) * 111320 * Math.cos(lat), (mid[1] - L[j][1]) * 111320);
          if (d < 12) return true;
        }
      }
    }
    return false;
  }

  function freeSpeed(cls) {
    if (cls === "estrutural" || cls === "arterial") return 13;
    if (cls === "especial" || cls === "conectora") return 11;
    if (cls === "coletora") return 9;
    return 7.5;
  }

  function freeLane(cls, lat, twin) {
    if (twin) return 0;
    return asphaltWidthM(cls, lat) / 4;
  }

  function weightedLine(lines) {
    const weights = lines.map(function (r) {
      let w = r.len;
      if (r.cls === "estrutural" || r.cls === "arterial") w *= 2.2;
      else if (r.cls === "especial" || r.cls === "conectora") w *= 1.5;
      return w;
    });
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += weights[i];
    let x = Math.random() * sum;
    for (let i = 0; i < lines.length; i++) {
      x -= weights[i];
      if (x <= 0) return lines[i];
    }
    return lines[lines.length - 1];
  }

  function spawnFree() {
    const lines = visibleLines().filter(function (r) { return !nearJam(r.line); });
    if (!lines.length) return [];
    const z = map.getZoom();
    const target = z < 14.6 ? 28 : z < 15.4 ? 45 : z < 16.3 ? 60 : z < 17.3 ? 70 : 80;
    const out = [];
    const attempts = target * 4;
    for (let i = 0; i < attempts && out.length < target; i++) {
      const r = weightedLine(lines);
      const sprite = pickSprite("free");
      const meta = byId[sprite] || { comprimento_m: 4.5 };
      const twin = findTwinLine(r.line, lines);
      let line = r.line;
      if (twin) line = orientSiblingLeft(r.line, midOf(twin));
      else if (Math.random() < 0.5) line = r.line.slice().reverse();
      out.push({
        line: line,
        pathLen: r.len,
        s: Math.random() * r.len,
        sprite: sprite,
        lane: freeLane(r.cls, r.line[0][1], twin),
        baseSpeed: freeSpeed(r.cls) * (0.85 + Math.random() * 0.3),
        speed: 0,
        phase: Math.random() * Math.PI * 2,
        freq: 0.05,
        loop: false,
        kind: "free",
        length: meta.comprimento_m || 4.5
      });
    }
    return out;
  }

  function rebuildVehicles() {
    const jam = spawnJamVehicles();
    const free = map.getZoom() >= MIN_ZOOM ? spawnFree() : [];
    vehicles = jam.concat(free);
    pushCars();
  }

  function refreshFree(force) {
    if (!map || map.getZoom() < MIN_ZOOM) {
      if (vehicles.some(function (v) { return v.kind === "free"; })) {
        vehicles = vehicles.filter(function (v) { return v.kind === "jam"; });
        pushCars();
      }
      return;
    }
    const freeN = vehicles.filter(function (v) { return v.kind === "free"; }).length;
    const z = map.getZoom();
    const target = z < 14.6 ? 28 : z < 15.4 ? 45 : z < 16.3 ? 60 : 70;
    if (force || freeN < target * 0.45) {
      vehicles = vehicles.filter(function (v) { return v.kind === "jam"; }).concat(spawnFree());
      pushCars();
    }
  }

  function tick(ts) {
    raf = requestAnimationFrame(tick);
    tickFlow(ts);
    if (!running) return;
    const z = map.getZoom();
    if (z < MIN_ZOOM) {
      lastTs = ts;
      return;
    }
    const dt = lastTs ? Math.min(0.08, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    const tsec = ts / 1000;
    let needRespawn = 0;
    vehicles.forEach(function (v) {
      let factor = 1;
      if (v.kind === "jam") {
        const wave = 0.5 + 0.5 * Math.sin(tsec * v.freq * 2 * Math.PI + v.phase);
        factor = wave < 0.28 ? 0 : 0.25 + 0.75 * wave;
      }
      v.speed = v.baseSpeed * factor;
      v.s += v.speed * dt;
      if (v.s > v.pathLen) {
        if (v.loop) v.s = v.s % v.pathLen;
        else needRespawn++;
      }
    });
    if (needRespawn > 8) {
      vehicles = vehicles.filter(function (v) { return v.kind === "jam" || v.s <= v.pathLen; })
        .concat(spawnFree());
    } else {
      vehicles = vehicles.filter(function (v) { return v.kind === "jam" || v.s <= v.pathLen; });
    }
    pushCars();
  }

  function flyToTrecho(t) {
    selected = t.id;
    if (map.getSource("foz-transito")) map.getSource("foz-transito").setData(jamFC());
    const a = t.linha[0], b = t.linha[t.linha.length - 1];
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const heading = Math.atan2((b[0] - a[0]) * Math.cos(lat), b[1] - a[1]) * 180 / Math.PI;
    map.flyTo({
      center: t.centro,
      zoom: Math.max(map.getZoom(), 16.9),
      pitch: 40,
      bearing: heading - 62,
      duration: 1600,
      essential: true
    });
    document.querySelectorAll("#traf-dock .traf-item").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-id") === t.id);
    });
  }

  function buildDock() {
    if (document.getElementById("traf-dock")) return;
    const dock = document.createElement("aside");
    dock.id = "traf-dock";
    dock.innerHTML =
      '<div class="traf-rail" role="toolbar" aria-label="Ferramentas do mapa">' +
        '<button type="button" class="traf-btn" id="traf-btn-transito" aria-label="Trânsito" aria-pressed="false" title="Trânsito">' +
          ICON +
        "</button>" +
      "</div>" +
      '<div class="traf-panel" id="traf-panel" hidden>' +
        '<div class="traf-head"><h2 class="traf-title">Trânsito agora</h2>' +
        '<button type="button" class="traf-close" id="traf-close" aria-label="Fechar">×</button></div>' +
        '<p class="traf-meta" id="traf-meta"></p>' +
        '<ul class="traf-list" id="traf-list"></ul>' +
      "</div>";
    document.body.appendChild(dock);

    const btn = document.getElementById("traf-btn-transito");
    const panel = document.getElementById("traf-panel");
    function toggle(open) {
      const on = open == null ? panel.hidden : open;
      panel.hidden = !on;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    btn.addEventListener("click", function () { toggle(); });
    document.getElementById("traf-close").addEventListener("click", function () { toggle(false); });
    fillPanel();
  }

  function fillPanel() {
    const list = document.getElementById("traf-list");
    const meta = document.getElementById("traf-meta");
    if (!list || !meta) return;
    const modo = data.modo === "ao-vivo" ? "ao vivo" : "relatório das 9h20";
    meta.textContent = "Atualizado às " + formatClock(data.atualizado) +
      "  ·  fonte " + (data.fonte || "Waze") + " (" + modo + ")";
    const trechos = (data.trechos || []).slice().sort(function (a, b) {
      if (a.nivel !== b.nivel) return a.nivel === "pesado" ? -1 : 1;
      return (b.atraso_s || 0) - (a.atraso_s || 0);
    });
    if (!trechos.length) {
      list.innerHTML = '<li class="traf-empty">Nenhum congestionamento no recorte.</li>';
      return;
    }
    list.innerHTML = "";
    trechos.forEach(function (t) {
      const li = document.createElement("li");
      const vel = t.velocidade_kmh == null ? "—" : Math.round(t.velocidade_kmh) + " km/h";
      const bairro = t.bairro ? " · " + t.bairro : "";
      li.innerHTML =
        '<button type="button" class="traf-item" data-id="' + t.id + '" data-nivel="' + t.nivel + '">' +
          '<span class="traf-pip" aria-hidden="true"></span>' +
          '<span class="traf-rua">' + t.rua + "</span>" +
          '<span class="traf-sub"><span class="traf-badge">' + (t.nivel === "pesado" ? "Pesado" : "Médio") +
          "</span>" + vel + " · " + formatDelay(t.atraso_s) + bairro + "</span>" +
        "</button>";
      li.querySelector("button").addEventListener("click", function () { flyToTrecho(t); });
      list.appendChild(li);
    });
  }

  async function start() {
    map = window.__FOZ_CITY_SIM__.map;
    try {
      data = await (await fetch(DATA_URL + "?t=" + Date.now())).json();
    } catch (e) {
      data = { atualizado: null, fonte: "Waze", trechos: [], alertas: [] };
    }
    buildDock();
    try {
      ensureLayers();
      window.__FOZ_TRANSITO_UI__.ready = true;
    } catch (e) {
      console.error("Camadas de trânsito:", e);
    }
    try { await loadCatalog(); }
    catch (e) { console.error("Catálogo de veículos:", e); }
    try {
      ensureCars3D();
      if (!map.getLayer("foz-transito-linha")) ensureLayers();
      rebuildVehicles();
      if (!running) {
        running = true;
        lastTs = 0;
        raf = requestAnimationFrame(tick);
      }
    } catch (e) {
      console.error("Veículos de trânsito:", e);
    }
    map.on("moveend", function () { refreshFree(false); });
    map.on("idle", function () { refreshFree(false); });
  }

  window.__FOZ_TRANSITO_UI__ = {
    flyTo: function (id) {
      const t = (data.trechos || []).find(function (x) { return x.id === id; });
      if (t) flyToTrecho(t);
    },
    openPanel: function () {
      const p = document.getElementById("traf-panel");
      const btn = document.getElementById("traf-btn-transito");
      if (p) p.hidden = false;
      if (btn) btn.setAttribute("aria-pressed", "true");
    },
    data: function () { return data; },
    counts: function () {
      return {
        jam: vehicles.filter(function (v) { return v.kind === "jam"; }).length,
        free: vehicles.filter(function (v) { return v.kind === "free"; }).length,
        zoom: map ? map.getZoom() : null,
        before: map && map.getLayer("footprints-walls") ? "footprints-walls" : null,
        cars3d: !!(traf3d),
        vis3d: traf3d && traf3d.stats ? traf3d.stats.visible : 0
      };
    }
  };

  ready(start);
})();

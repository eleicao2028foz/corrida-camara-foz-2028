/* Illustrated civic buildings: sprites load only when the viewport and zoom need them. */
(function (root) {
  "use strict";

  const BEFORE_BUS = ["sim-bus-icons", "sim-bus-labels"];
  let cfg = null;
  let map = null;
  let timer = 0;
  let loading = new Set();
  let loaded = new Set();
  let lastSig = "";
  const stats = { loaded: 0, visible: 0, bytes: 0 };

  function beforeId() {
    for (const id of BEFORE_BUS) if (map.getLayer(id)) return id;
    if (map.getLayer("street-labels")) return "street-labels";
    return undefined;
  }

  function circleRing(lon, lat, r, n) {
    const east = 111320 * Math.cos((lat * Math.PI) / 180);
    const north = 110540;
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n;
      ring.push([lon + (r * Math.cos(a)) / east, lat + (r * Math.sin(a)) / north]);
    }
    ring.push(ring[0]);
    return ring;
  }

  function exclusionPolygons() {
    const polys = [];
    const campusDone = new Set();
    for (const b of cfg.buildings) {
      if (b.campus && cfg.campuses && cfg.campuses[b.campus]) {
        if (!campusDone.has(b.campus)) {
          campusDone.add(b.campus);
          polys.push(cfg.campuses[b.campus].footprint);
        }
        continue;
      }
      polys.push([circleRing(b.lon, b.lat, b.footprint_m, 16)]);
    }
    return polys;
  }

  function applyExclusion() {
    const polys = exclusionPolygons();
    const exclusion = ["!", ["within", { type: "MultiPolygon", coordinates: polys }]];
    for (const id of [
      "footprints-flat",
      "footprints-walls",
      "footprints-roofs",
      "retro-architecture",
      "veg-trees",
      "veg-bushes",
    ]) {
      if (!map.getLayer(id)) continue;
      const prior = map.getFilter(id);
      if (prior && Array.isArray(prior) && prior[0] === "all" && JSON.stringify(prior).includes("predios-ex")) continue;
      // Tag so we don't stack the same filter twice
      const tagged = ["all", exclusion];
      if (prior) tagged.push(prior);
      map.setFilter(id, tagged);
    }
  }

  function inView(b, bounds, pad) {
    return (
      b.lon >= bounds.getWest() - pad &&
      b.lon <= bounds.getEast() + pad &&
      b.lat >= bounds.getSouth() - pad &&
      b.lat <= bounds.getNorth() + pad
    );
  }

  function ensureLayers() {
    if (!map.getSource("predios")) {
      map.addSource("predios", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    const ref = cfg.refZoom || 17.48;
    const sizeAtRef = cfg.iconSizeAtRef || 1;
    const iconSize = [
      "interpolate",
      ["exponential", 2],
      ["zoom"],
      15,
      sizeAtRef * Math.pow(2, 15 - ref),
      ref,
      sizeAtRef,
      20,
      sizeAtRef * Math.pow(2, 20 - ref),
    ];
    const before = beforeId();
    if (!map.getLayer("predios-civic")) {
      map.addLayer(
        {
          id: "predios-civic",
          type: "symbol",
          source: "predios",
          minzoom: cfg.minzoom || 15,
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": iconSize,
            "icon-anchor": "center",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-padding": 0,
            "icon-pitch-alignment": "viewport",
            "icon-rotation-alignment": "viewport",
            "symbol-sort-key": ["get", "sort"],
            visibility: "visible",
          },
          paint: {
            "icon-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0.85, 15.6, 1],
          },
        },
        before
      );
    }
    if (!map.getLayer("predios-labels")) {
      map.addLayer(
        {
          id: "predios-labels",
          type: "symbol",
          source: "predios",
          minzoom: 16.4,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 16.4, 11, 18, 13],
            "text-anchor": "bottom",
            "text-offset": [0, -2.4],
            "text-allow-overlap": false,
            "text-padding": 6,
            "text-max-width": 10,
          },
          paint: {
            "text-color": "#3d3a32",
            "text-halo-color": "#fff9e9",
            "text-halo-width": 1.8,
          },
        },
        before
      );
    }
  }

  async function loadIcon(b) {
    if (loaded.has(b.id) || loading.has(b.id)) return;
    loading.add(b.id);
    try {
      const url = "data/predios/" + b.file;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Falha ao carregar " + url + " (" + r.status + ")");
      const blob = await r.blob();
      stats.bytes += blob.size;
      const bmp = await createImageBitmap(blob);
      if (!map.hasImage(b.id)) {
        map.addImage(b.id, bmp, { pixelRatio: cfg.pixelRatio || 2, sdf: false });
      }
      loaded.add(b.id);
      stats.loaded = loaded.size;
    } finally {
      loading.delete(b.id);
    }
  }

  async function update() {
    if (!cfg || !map) return;
    const z = map.getZoom();
    const minz = cfg.minzoom || 15;
    if (z < minz - 0.15) {
      if (map.getLayer("predios-civic")) {
        map.setLayoutProperty("predios-civic", "visibility", "none");
        map.setLayoutProperty("predios-labels", "visibility", "none");
      }
      lastSig = "hidden";
      stats.visible = 0;
      return;
    }
    const bounds = map.getBounds();
    const pad = Math.max(bounds.getEast() - bounds.getWest(), bounds.getNorth() - bounds.getSouth()) * 0.25;
    const needed = cfg.buildings.filter((b) => inView(b, bounds, pad));
    const sig = needed.map((b) => b.id).sort().join("|") + "@" + z.toFixed(2);
    // Always try to load missing icons even if the set is the same
    const missing = needed.filter((b) => !loaded.has(b.id) && !loading.has(b.id));
    if (missing.length) {
      await Promise.all(missing.map(loadIcon));
    }
    const visible = needed.filter((b) => loaded.has(b.id));
    stats.visible = visible.length;
    const features = visible.map((b) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [b.lon, b.lat] },
      properties: { icon: b.id, label: b.label, sort: -b.lat },
    }));
    ensureLayers();
    map.getSource("predios").setData({ type: "FeatureCollection", features });
    map.setLayoutProperty("predios-civic", "visibility", "visible");
    map.setLayoutProperty("predios-labels", "visibility", "visible");
    lastSig = sig;
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      update().catch((e) => console.error("Prédios:", e));
    }, 120);
  }

  function focusHall() {
    // Same opening frame as the previous civic 3D focus, so first load stays at the Paço.
    const origin = [-54.58821460604668, -25.5468809996802];
    const angle = (14.5 * Math.PI) / 180;
    const east = 111320 * Math.cos((origin[1] * Math.PI) / 180);
    const north = 110540;
    const x = -40,
      y = 3;
    const center = [
      origin[0] + (x * Math.cos(angle) - y * Math.sin(angle)) / east,
      origin[1] + (x * Math.sin(angle) + y * Math.cos(angle)) / north,
    ];
    const el = map.getContainer();
    const h = el.clientHeight;
    const w = el.clientWidth;
    const zoom = 17.8 + Math.log2(Math.min(h / 1000, w / 950));
    map.jumpTo({
      center,
      zoom,
      pitch: 50,
      bearing: -14.5,
      padding: { top: h * 0.22, bottom: h * 0.04, left: 20, right: 20 },
    });
    schedule();
  }

  async function install(m) {
    map = m;
    if (!cfg) {
      const r = await fetch("data/predios/predios.json");
      if (!r.ok) throw new Error("Não foi possível carregar a lista de prédios");
      cfg = await r.json();
    }
    applyExclusion();
    map.on("moveend", schedule);
    map.on("zoomend", schedule);
    await update();
    return { cfg, stats, focus: focusHall, update };
  }

  root.FozPredios = { install, focusHall, stats };
})(typeof window !== "undefined" ? window : globalThis);
